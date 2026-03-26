import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/reviews?product_handle=xxx
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('product_handle')

  const supabase = getSupabase()
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (handle) {
    query = query.eq('product_handle', handle)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data })
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { product_handle, product_title, reviewer_name, rating, body: reviewBody, token, order_id, email } = body

  if (!product_handle || !reviewer_name || !rating || !reviewBody || !token || !order_id || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify token
  const expectedToken = createHmac('sha256', process.env.REVIEW_TOKEN_SECRET!)
    .update(`${order_id}:${email}`)
    .digest('hex')

  if (token !== expectedToken) {
    return NextResponse.json({ error: 'Invalid review token' }, { status: 403 })
  }

  const supabase = getSupabase()
  // Check if this order already submitted a review for this product
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', order_id)
    .eq('product_handle', product_handle)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Review already submitted for this order' }, { status: 409 })
  }

  const { error } = await supabase.from('reviews').insert({
    product_handle,
    product_title,
    reviewer_name,
    rating: Number(rating),
    body: reviewBody,
    order_id,
    verified: true,
    approved: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify owner of new verified review
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const stars = '★'.repeat(Number(rating)) + '☆'.repeat(5 - Number(rating))
    await resend.emails.send({
      from: 'TommyboyDesigns <reviews@tommyboydesigns.com>',
      to: process.env.OWNER_EMAIL ?? '',
      subject: `New verified review — ${rating}★ from ${reviewer_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#0A0F1E;padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:40px;">
            <p style="margin:0 0 8px;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">New Verified Purchase Review</p>
            <p style="margin:0 0 24px;color:#D1D5DB;font-size:22px;">${stars}</p>
            <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">From</p>
            <p style="margin:0 0 4px;color:#F9FAFB;font-size:16px;font-weight:bold;">${reviewer_name}</p>
            <p style="margin:0 0 24px;color:#6B7280;font-size:13px;">Order #${order_id}</p>
            <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Review</p>
            <p style="margin:0 0 0;color:#D1D5DB;font-size:15px;line-height:1.7;border-left:3px solid rgba(217,119,6,0.4);padding-left:16px;">${reviewBody}</p>
          </div>
        </div>
      `.trim(),
    })
  } catch (emailErr) {
    console.error('Failed to send verified review notification:', emailErr)
  }

  return NextResponse.json({ ok: true })
}
