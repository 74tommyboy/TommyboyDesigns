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
      return `- ${p.title} — $${parseFloat(price.amount).toFixed(2)} — ${p.description}`
    })
    .join('\n')

  return `You are Tommy's Assistant, the friendly AI helper for TommyboyDesigns — a veteran-owned small business that makes precision-crafted 3D-printed bourbon bottle neck tags for collectors.

PRODUCTS WE SELL:
${productList}

POLICIES:
- Shipping: Orders typically ship within 3-5 business days via USPS First Class. See /policies/shipping for full details.
- Returns: We accept returns within 30 days for unused items. See /policies/returns for full details.

BEHAVIOR RULES:
1. Answer questions about our products, pricing, shipping, and returns helpfully and concisely.
2. If the customer asks about a CUSTOM ORDER (custom designs, bulk orders, personalization, custom artwork, unique requests, or anything not in our standard product list), respond warmly and let them know you will notify the owner directly. Begin your response with exactly "[CUSTOM_ORDER]" (no space after the bracket), then write your normal reply on the same line.
3. If asked to talk to a human or contact the owner directly, direct them to /contact.
4. If asked about anything unrelated to TommyboyDesigns, politely decline and redirect to what you can help with.
5. Keep responses short and friendly — 1-3 sentences is ideal.`
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
  const MARKER = '[CUSTOM_ORDER]'
  let buffer = ''
  let markerChecked = false
  let isCustomOrder = false

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (!text) continue

          if (!markerChecked) {
            buffer += text
            if (buffer.length >= MARKER.length) {
              markerChecked = true
              if (buffer.startsWith(MARKER)) {
                isCustomOrder = true
                const cleaned = buffer.slice(MARKER.length).trimStart()
                if (cleaned) controller.enqueue(encoder.encode(cleaned))
              } else {
                controller.enqueue(encoder.encode(buffer))
              }
              buffer = ''
            }
          } else {
            controller.enqueue(encoder.encode(text))
          }
        }

        // Flush buffer if response was shorter than MARKER.length
        if (buffer) {
          const cleaned = buffer.startsWith(MARKER)
            ? buffer.slice(MARKER.length).trimStart()
            : buffer
          if (cleaned) controller.enqueue(encoder.encode(cleaned))
        }

        if (isCustomOrder) {
          const transcript = safeMessages
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n')
          await resend.emails.send({
            from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
            to: OWNER_EMAIL,
            subject: 'Chat inquiry: potential custom order',
            text: `A customer expressed interest in a custom order via the chat widget.\n\nCONVERSATION TRANSCRIPT:\n\n${transcript}`,
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
