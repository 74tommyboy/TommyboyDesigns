import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabase } from '@/lib/supabase'

// GET /api/reviews?product_handle=xxx
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('product_handle')
  if (!handle) return NextResponse.json({ error: 'Missing product_handle' }, { status: 400 })

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_handle', handle)
    .eq('approved', true)
    .order('created_at', { ascending: false })

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
  return NextResponse.json({ ok: true })
}
