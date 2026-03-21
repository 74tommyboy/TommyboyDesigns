import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return hash === hmac
}

function generateReviewToken(orderId: string, email: string): string {
  const secret = process.env.REVIEW_TOKEN_SECRET!
  return crypto.createHmac('sha256', secret).update(`${orderId}:${email}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256') ?? ''

  if (!verifyShopifyWebhook(body, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = JSON.parse(body)
  const email = order.email
  const orderId = String(order.id)
  const customerName = order.billing_address?.first_name ?? 'Collector'
  const lineItems = order.line_items as Array<{ title: string; variant_title: string | null }>

  // Extract tracking numbers from fulfillments
  const trackingNumbers: string[] = []
  if (order.fulfillments) {
    for (const fulfillment of order.fulfillments) {
      if (fulfillment.tracking_number) {
        trackingNumbers.push(fulfillment.tracking_number)
      }
    }
  }

  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'no email' })
  }

  const token = generateReviewToken(orderId, email)
  const supabase = getSupabase()

  // Store order for delivery tracking — cron will send email when delivered
  await supabase.from('pending_review_emails').insert({
    order_id: orderId,
    email,
    customer_name: customerName,
    line_items: lineItems,
    token,
    tracking_numbers: trackingNumbers,
    delivered: false,
    sent: false,
    send_after: null, // set by cron when delivery is confirmed
  })

  return NextResponse.json({ ok: true })
}
