// Uses Web Crypto API so it works in both Edge (middleware) and Node.js (API routes)

export const COOKIE_NAME = 'admin_session'
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

const encoder = new TextEncoder()

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString()
  const sig = await hmac(timestamp, process.env.ADMIN_TOKEN_SECRET!)
  return `${timestamp}.${sig}`
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const timestamp = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const age = Date.now() - parseInt(timestamp, 10)
  if (isNaN(age) || age > SESSION_DURATION_MS || age < 0) return false

  const expected = await hmac(timestamp, process.env.ADMIN_TOKEN_SECRET!)
  if (expected.length !== sig.length) return false

  // Constant-time comparison
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  return diff === 0
}
