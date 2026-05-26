// app/api/coaster-inquiry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CoasterWizardState } from '@/lib/coaster-inquiry-types'
import { buildCoasterEmailHtml } from '@/lib/coaster-inquiry-email'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  let body: CoasterWizardState
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { shape, otherShapeDescription, colors, uploads, order } = body

  if (!shape || !order?.quantity || !order?.name?.trim() || !order?.email?.trim()) {
    return NextResponse.json(
      { error: 'Missing required fields: shape, quantity, name, email' },
      { status: 400 }
    )
  }

  const VALID_SHAPES = ['round', 'square', 'other'] as const
  type ValidShape = typeof VALID_SHAPES[number]
  if (!VALID_SHAPES.includes(shape as ValidShape)) {
    return NextResponse.json({ error: 'Invalid shape' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(order.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const { data: inserted, error: dbError } = await supabaseAdmin
    .from('custom_inquiries')
    .insert({
      product_type: 'coaster',
      shape,
      colors: colors ?? [],
      details: { otherShapeDescription: otherShapeDescription ?? '' },
      uploads: (uploads ?? []).map(u => u.path),
      quantity: order.quantity,
      attachment: null,
      contact: { name: order.name, email: order.email, phone: order.phone },
      notes: order.notes ?? '',
    })
    .select('id')
    .single()

  if (dbError || !inserted) {
    console.error('Supabase insert failed:', dbError)
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 })
  }

  // Generate signed URLs for any uploaded files
  const signedUrls: string[] = []
  for (const upload of uploads ?? []) {
    const { data } = await supabaseAdmin.storage
      .from('custom-inquiry-uploads')
      .createSignedUrl(upload.path, 60 * 60 * 24 * 7) // 7 days
    if (data?.signedUrl) signedUrls.push(data.signedUrl)
  }

  const html = buildCoasterEmailHtml(body, signedUrls)

  const { error: emailError } = await resend.emails.send({
    from: 'orders@tommyboydesigns.com',
    to: process.env.OWNER_EMAIL!,
    subject: `New Coaster Inquiry — ${order.name}`,
    html,
  })
  if (emailError) {
    console.error('Resend email failed:', emailError)
  }

  return NextResponse.json({ ok: true, inquiryId: inserted.id })
}
