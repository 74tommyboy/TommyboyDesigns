import { createHmac, timingSafeEqual } from 'crypto'

export function verifyAdminSig(id: string, action: 'approve' | 'reject', sig: string): boolean {
  const expected = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!)
    .update(`${id}:${action}`)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function makeAdminSig(id: string, action: 'approve' | 'reject'): string {
  return createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!)
    .update(`${id}:${action}`)
    .digest('hex')
}
