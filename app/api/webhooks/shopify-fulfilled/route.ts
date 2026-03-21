import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const REVIEW_DELAY_DAYS = 12

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

  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'no email' })
  }

  const token = generateReviewToken(orderId, email)
  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reviews/${token}?order=${orderId}&email=${encodeURIComponent(email)}`
  const delayMs = REVIEW_DELAY_DAYS * 24 * 60 * 60 * 1000

  setTimeout(async () => {
    await resend.emails.send({
      from: 'TommyboyDesigns <reviews@tommyboydesigns.com>',
      to: email,
      subject: "How's your TommyboyDesigns neck tag holding up?",
      html: buildEmailHtml(customerName, lineItems, reviewUrl),
    })
  }, delayMs)

  return NextResponse.json({ ok: true })
}

function buildEmailHtml(
  name: string,
  items: Array<{ title: string; variant_title: string | null }>,
  reviewUrl: string
): string {
  const itemList = items
    .map((i) => `<li style="margin-bottom:4px;">${i.title}${i.variant_title ? ` — ${i.variant_title}` : ''}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <p style="margin:0;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">TOMMYBOY DESIGNS</p>
          <p style="margin:4px 0 0;color:#6B7280;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Veteran Owned &amp; Operated</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:40px;">
          <p style="margin:0 0 16px;color:#D97706;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Hey ${name},</p>
          <p style="margin:0 0 20px;color:#D1D5DB;font-size:15px;line-height:1.7;">
            Your order should have arrived by now — and we hope it's exactly what you envisioned for your collection.
          </p>
          <p style="margin:0 0 12px;color:#9CA3AF;font-size:13px;text-transform:uppercase;letter-spacing:2px;">You ordered:</p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#D1D5DB;font-size:14px;line-height:1.8;">
            ${itemList}
          </ul>
          <p style="margin:0 0 32px;color:#D1D5DB;font-size:15px;line-height:1.7;">
            Every tag we ship is precision-crafted by a veteran-owned small business. Your feedback means everything to us — and it helps other serious collectors find what they're looking for.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="${reviewUrl}" style="display:inline-block;background:#D97706;color:#0A0F1E;font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:4px;">
              Leave a Review
            </a>
          </td></tr></table>

          <p style="margin:32px 0 0;color:#6B7280;font-size:13px;line-height:1.7;border-top:1px solid rgba(255,255,255,0.05);padding-top:24px;">
            Whether you're displaying a Pappy, a BTAC, or rocking a fully custom design — thank you for trusting TommyboyDesigns with your collection.
          </p>
          <p style="margin:16px 0 0;color:#6B7280;font-size:13px;">
            Cheers,<br>
            <span style="color:#D1D5DB;">Thomas</span><br>
            TommyboyDesigns
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;color:#4B5563;font-size:11px;line-height:1.6;">
            Questions or issues with your order? We make it right — every time.<br>
            Just reply to this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim()
}
