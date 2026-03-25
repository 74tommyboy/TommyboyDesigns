// app/api/reviews/public/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { makeAdminSig } from '@/lib/admin-sig'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

async function hasShopifyOrder(email: string): Promise<boolean> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!
  try {
    const res = await fetch(
      `https://${domain}/admin/api/2024-01/orders.json?email=${encodeURIComponent(email)}&status=any&limit=1&fields=id`,
      { headers: { 'X-Shopify-Access-Token': token } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return (data.orders?.length ?? 0) > 0
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { reviewer_name, rating, body: reviewBody, claimed_purchaser, email } = body

  // Input validation
  if (!reviewer_name?.trim() || !rating || !reviewBody?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (typeof reviewer_name !== 'string' || reviewer_name.trim().length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 })
  }
  if (typeof reviewBody !== 'string' || reviewBody.trim().length > 2000) {
    return NextResponse.json({ error: 'Review must be 2000 characters or fewer' }, { status: 400 })
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
  }

  // Rate limiting — 1 submission per IP per hour
  const forwarded = req.headers.get('x-forwarded-for')
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
  const ipHash = hashIp(rawIp)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recent } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .maybeSingle()

  if (recent) {
    return NextResponse.json({ error: 'Too many submissions. Please try again in an hour.' }, { status: 429 })
  }

  // Purchase verification
  let verified = false
  if (claimed_purchaser && email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    verified = await hasShopifyOrder(email.trim())
  }

  // Insert review (approved: false — held for moderation)
  const { data: inserted, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      product_handle: 'general',
      product_title: 'TommyboyDesigns',
      reviewer_name: reviewer_name.trim(),
      rating,
      body: reviewBody.trim(),
      verified,
      approved: false,
      email: email?.trim() ?? null,
      ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  // Send admin notification email
  const approveSig = makeAdminSig(inserted.id, 'approve')
  const rejectSig = makeAdminSig(inserted.id, 'reject')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const approveUrl = `${siteUrl}/api/admin/reviews/approve?id=${inserted.id}&sig=${approveSig}`
  const rejectUrl = `${siteUrl}/api/admin/reviews/reject?id=${inserted.id}&sig=${rejectSig}`

  try {
    await resend.emails.send({
      from: 'TommyboyDesigns <reviews@tommyboydesigns.com>',
      to: OWNER_EMAIL,
      subject: `New review pending approval — ${rating}★ from ${reviewer_name.trim()}`,
      html: buildNotificationEmail({
        reviewerName: reviewer_name.trim(),
        rating,
        body: reviewBody.trim(),
        verified,
        email: email?.trim() ?? null,
        approveUrl,
        rejectUrl,
      }),
    })
  } catch (emailErr) {
    console.error('Failed to send review notification email:', emailErr)
  }

  return NextResponse.json({ ok: true })
}

function buildNotificationEmail(opts: {
  reviewerName: string
  rating: number
  body: string
  verified: boolean
  email: string | null
  approveUrl: string
  rejectUrl: string
}): string {
  const stars = '★'.repeat(opts.rating) + '☆'.repeat(5 - opts.rating)
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:40px;">
          <p style="margin:0 0 8px;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">New Review Pending Approval</p>
          <p style="margin:0 0 24px;color:#D1D5DB;font-size:22px;">${stars}</p>
          <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">From</p>
          <p style="margin:0 0 16px;color:#F9FAFB;font-size:16px;font-weight:bold;">${escapeHtml(opts.reviewerName)}</p>
          ${opts.email ? `<p style="margin:0 0 16px;color:#6B7280;font-size:13px;">Email: ${escapeHtml(opts.email)}</p>` : ''}
          <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Status</p>
          <p style="margin:0 0 24px;color:${opts.verified ? '#D97706' : '#6B7280'};font-size:13px;font-weight:bold;">
            ${opts.verified ? '✓ Verified Purchase' : 'Unverified'}
          </p>
          <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Review</p>
          <p style="margin:0 0 32px;color:#D1D5DB;font-size:15px;line-height:1.7;border-left:3px solid rgba(217,119,6,0.4);padding-left:16px;">${escapeHtml(opts.body)}</p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;">
              <a href="${opts.approveUrl}" style="display:inline-block;background:#D97706;color:#0A0F1E;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:4px;">Approve</a>
            </td>
            <td>
              <a href="${opts.rejectUrl}" style="display:inline-block;background:#374151;color:#D1D5DB;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:4px;">Reject</a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}
