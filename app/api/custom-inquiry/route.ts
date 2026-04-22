import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { WizardState, SHAPES, ShapeId } from '@/lib/custom-inquiry-types'
import { buildEmailHtml } from '@/lib/custom-inquiry-email'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com' // update via env var

export async function POST(req: NextRequest) {
  let body: WizardState
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { shape, colors, details, uploads, order } = body

  if (!shape || !order?.quantity || !order?.name?.trim() || !order?.email?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: shape, quantity, name, email' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(order.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Generate signed URLs for uploads (1-hour expiry — for email only)
  const signedUrls: string[] = []
  for (const upload of uploads ?? []) {
    const { data } = await supabaseAdmin.storage
      .from('custom-inquiry-uploads')
      .createSignedUrl(upload.path, 604800)
    if (data?.signedUrl) signedUrls.push(data.signedUrl)
  }

  const shapeData = SHAPES.find(s => s.id === (shape as ShapeId))

  const [dbResult, emailResult] = await Promise.allSettled([
    supabaseAdmin.from('custom_inquiries').insert({
      shape,
      colors: colors ?? [],
      details: details ?? {},
      uploads: (uploads ?? []).map(u => u.path),
      quantity: order.quantity,
      attachment: order.attachment,
      contact: { name: order.name, email: order.email, phone: order.phone },
      notes: order.notes ?? '',
    }),
    resend.emails.send({
      from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
      to: OWNER_EMAIL,
      subject: `New Custom Tag Inquiry — ${details?.distillery ?? 'Unknown'} (${order.name})`,
      html: buildEmailHtml(body, shapeData, signedUrls),
    }),
  ])

  if (dbResult.status === 'rejected') {
    console.error('Supabase insert failed:', dbResult.reason)
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 })
  }

  if (emailResult.status === 'rejected') {
    console.error('Resend failed:', emailResult.reason)
    // Non-fatal — inquiry saved in Supabase. Known gap: owner won't know email failed without checking logs.
  }

  return NextResponse.json({ ok: true })
}
