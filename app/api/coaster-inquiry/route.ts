import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CoasterWizardState } from '@/lib/coaster-inquiry-types'

export const dynamic = 'force-dynamic'

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
      shape,
      colors: colors ?? [],
      details: { otherShapeDescription: otherShapeDescription ?? '' },
      uploads: (uploads ?? []).map(u => u.path),
      quantity: order.quantity,
      attachment: 'hemp_twine',
      contact: { name: order.name, email: order.email, phone: order.phone },
      notes: order.notes ?? '',
    })
    .select('id')
    .single()

  if (dbError || !inserted) {
    console.error('Supabase insert failed:', dbError)
    return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inquiryId: inserted.id })
}
