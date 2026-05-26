import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { WizardState, SHAPES, ShapeId } from '@/lib/custom-inquiry-types'
import { buildEmailHtml } from '@/lib/custom-inquiry-email'
import { CoasterWizardState, CoasterShapeId } from '@/lib/coaster-inquiry-types'
import { buildCoasterEmailHtml } from '@/lib/coaster-inquiry-email'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return hash === hmac
}

export async function POST(req: NextRequest) {
  if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
    console.error('SHOPIFY_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const body = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256') ?? ''

  if (!verifyShopifyWebhook(body, hmac)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = JSON.parse(body)

  // Find a line item that carries a custom inquiry ID
  const customLineItem = (order.line_items ?? []).find((item: { properties?: { name: string; value: string }[] }) =>
    (item.properties ?? []).some(p => p.name === '_custom_inquiry_id')
  )

  if (!customLineItem) {
    // Not a custom inquiry order — ignore silently
    return NextResponse.json({ ok: true })
  }

  const inquiryId = customLineItem.properties.find(
    (p: { name: string; value: string }) => p.name === '_custom_inquiry_id'
  )?.value

  if (!inquiryId) {
    return NextResponse.json({ ok: true })
  }

  const { data: inquiry, error } = await supabaseAdmin
    .from('custom_inquiries')
    .select('*')
    .eq('id', inquiryId)
    .single()

  if (error || !inquiry) {
    console.error('Inquiry lookup failed:', error)
    // Return 500 so Shopify retries
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 500 })
  }

  // Generate signed URLs for any uploaded files (7-day expiry)
  const signedUrls: string[] = []
  for (const path of inquiry.uploads ?? []) {
    const { data } = await supabaseAdmin.storage
      .from('custom-inquiry-uploads')
      .createSignedUrl(path, 604800)
    if (data?.signedUrl) signedUrls.push(data.signedUrl)
  }

  let emailHtml: string
  let subject: string

  if (inquiry.product_type === 'coaster') {
    const coasterState: CoasterWizardState = {
      shape: (inquiry.shape as CoasterShapeId) ?? null,
      otherShapeDescription: inquiry.details?.otherShapeDescription ?? '',
      colors: inquiry.colors ?? [],
      uploads: (inquiry.uploads ?? []).map((path: string) => ({
        path,
        name: path.split('/').pop() ?? '',
      })),
      order: {
        quantity: inquiry.quantity ?? 1,
        name: inquiry.contact?.name ?? '',
        email: inquiry.contact?.email ?? '',
        phone: inquiry.contact?.phone ?? '',
        notes: inquiry.notes ?? '',
      },
    }
    emailHtml = buildCoasterEmailHtml(coasterState, signedUrls)
    subject = `New Coaster Inquiry — ${inquiry.contact?.name ?? ''}`
  } else {
    const tagState: WizardState = {
      shape: inquiry.shape,
      otherShapeDescription: inquiry.details?.otherShapeDescription ?? '',
      colors: inquiry.colors ?? [],
      details: {
        distillery: inquiry.details?.distillery ?? '',
        year: inquiry.details?.year ?? '',
        batchType: inquiry.details?.batchType ?? 'batch',
        batchValue: inquiry.details?.batchValue ?? '',
        additionalLines: inquiry.details?.additionalLines ?? [],
      },
      uploads: (inquiry.uploads ?? []).map((path: string) => ({
        path,
        name: path.split('/').pop() ?? '',
      })),
      order: {
        attachment: inquiry.attachment ?? 'hemp_twine',
        quantity: inquiry.quantity ?? 1,
        name: inquiry.contact?.name ?? '',
        email: inquiry.contact?.email ?? '',
        phone: inquiry.contact?.phone ?? '',
        notes: inquiry.notes ?? '',
      },
    }
    const shapeData = SHAPES.find(s => s.id === (inquiry.shape as ShapeId))
    emailHtml = buildEmailHtml(tagState, shapeData, signedUrls)
    subject = `New Custom Tag Inquiry — ${inquiry.details?.distillery ?? 'Unknown'} (${inquiry.contact?.name ?? ''})`
  }

  const emailResult = await resend.emails.send({
    from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
    to: OWNER_EMAIL,
    subject,
    html: emailHtml,
  })

  if (emailResult.error) {
    console.error('Resend failed:', emailResult.error)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
