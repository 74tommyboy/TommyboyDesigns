import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { Resend } from 'resend'
import { getProducts, ShopifyProduct } from '@/lib/shopify'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'

type Message = { role: 'user' | 'assistant'; content: string }

function buildSystemPrompt(products: ShopifyProduct[]): string {
  const productList = products
    .map(p => {
      const price = p.priceRange.minVariantPrice
      return `- ${p.title} — $${parseFloat(price.amount).toFixed(2)} — ${p.description} — URL: /products/${p.handle}`
    })
    .join('\n')

  return `You are Tommy's Assistant, the friendly AI helper for TommyboyDesigns — a veteran-owned small business that makes precision-crafted 3D-printed bourbon bottle neck tags for collectors.

PRODUCTS WE SELL:
${productList}

POLICIES:
- Shipping: Orders typically ship within 3-5 business days via USPS First Class. See /policies/shipping for full details.
- Returns: We accept returns within 30 days for unused items. See /policies/returns for full details.

BEHAVIOR RULES:
0. When linking to any page on this site, ALWAYS use the relative path only (e.g. /products/some-handle). Never include a domain or http in links.
1. Answer questions about our products, pricing, shipping, and returns helpfully and concisely.
2. If the customer asks about a CUSTOM ORDER (custom designs, bulk orders, personalization, custom artwork, unique requests, or anything not in our standard product list), first direct them to our custom order page at /custom/build/ and encourage them to start there.
3. If the customer has already been directed to /custom/build/ and still has questions or wants personal help, ask for their email address or phone number so Tommy can reach out directly.
4. When the customer provides their email or phone number after a custom order discussion, begin your response with exactly "[CONTACT_INFO:their-value]" (replacing their-value with what they gave you, no space after the bracket), then write your normal confirmation reply on the same line.
5. If asked to talk to a human or contact the owner directly, direct them to /contact.
6. If asked about anything unrelated to TommyboyDesigns, politely decline and redirect to what you can help with.
7. Keep responses short and friendly — 1-3 sentences is ideal.`
}

export async function POST(req: NextRequest) {
  let messages: Message[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages', { status: 400 })
    }
    const isValid = messages.every(
      m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    if (!isValid) return new Response('Invalid message shape', { status: 400 })
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const MAX_MESSAGES = 20
  const MAX_CONTENT_LENGTH = 1000
  const safeMessages = messages.slice(-MAX_MESSAGES).map(m => ({
    ...m,
    content: m.content.slice(0, MAX_CONTENT_LENGTH),
  }))

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const products = await getProducts(50)
  const systemPrompt = buildSystemPrompt(products)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...safeMessages,
    ],
    stream: true,
    max_tokens: 300,
  })

  const encoder = new TextEncoder()
  const MARKER_PREFIX = '[CONTACT_INFO:'
  let buffer = ''
  let markerResolved = false
  let contactInfo: string | null = null

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (!text) continue

          if (!markerResolved) {
            buffer += text
            // Not starting with marker prefix — flush and stop buffering
            if (!MARKER_PREFIX.startsWith(buffer) && !buffer.startsWith(MARKER_PREFIX)) {
              markerResolved = true
              controller.enqueue(encoder.encode(buffer))
              buffer = ''
            } else if (buffer.startsWith(MARKER_PREFIX)) {
              // Have the prefix — wait for closing ]
              const closeIdx = buffer.indexOf(']')
              if (closeIdx !== -1) {
                markerResolved = true
                contactInfo = buffer.slice(MARKER_PREFIX.length, closeIdx)
                const rest = buffer.slice(closeIdx + 1).trimStart()
                if (rest) controller.enqueue(encoder.encode(rest))
                buffer = ''
              }
            }
            // else: buffer is a prefix of MARKER_PREFIX, keep buffering
          } else {
            controller.enqueue(encoder.encode(text))
          }
        }

        // Flush any remaining buffer
        if (buffer) {
          const cleaned = buffer.startsWith(MARKER_PREFIX) ? buffer : buffer
          if (cleaned) controller.enqueue(encoder.encode(cleaned))
        }

        if (contactInfo !== null) {
          const transcript = safeMessages
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n')
          await resend.emails.send({
            from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
            to: OWNER_EMAIL,
            subject: 'Chat inquiry: custom order contact request',
            text: `A customer is interested in a custom order and provided their contact information.\n\nCONTACT INFO: ${contactInfo}\n\nCONVERSATION TRANSCRIPT:\n\n${transcript}`,
          })
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
