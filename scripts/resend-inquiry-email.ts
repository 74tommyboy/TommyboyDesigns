// One-off: re-send the owner email for a custom/coaster inquiry (mirrors the orders-paid webhook).
//   npx tsx scripts/resend-inquiry-email.ts                  -> list the 10 most recent inquiries
//   npx tsx scripts/resend-inquiry-email.ts <id | email>     -> send the owner email for that inquiry
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { WizardState, SHAPES, ShapeId } from '../lib/custom-inquiry-types'
import { buildEmailHtml } from '../lib/custom-inquiry-email'
import { CoasterWizardState, CoasterShapeId } from '../lib/coaster-inquiry-types'
import { buildCoasterEmailHtml } from '../lib/coaster-inquiry-email'

process.loadEnvFile('.env.local')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'

async function main() {
  const arg = process.argv[2]

  if (!arg) {
    const { data, error } = await supabase
      .from('custom_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    for (const r of data ?? []) {
      console.log(r.id, r.created_at, r.product_type ?? 'tag', r.shape, r.contact?.email)
    }
    return
  }

  const isEmail = arg.includes('@')
  const query = supabase.from('custom_inquiries').select('*')
  const { data: rows, error } = isEmail
    ? await query.eq('contact->>email', arg).order('created_at', { ascending: false }).limit(1)
    : await query.eq('id', arg).limit(1)
  if (error) throw error
  const inquiry = rows?.[0]
  if (!inquiry) throw new Error(`No inquiry found for ${arg}`)

  const signedUrls: string[] = []
  for (const path of inquiry.uploads ?? []) {
    const { data } = await supabase.storage.from('custom-inquiry-uploads').createSignedUrl(path, 604800)
    if (data?.signedUrl) signedUrls.push(data.signedUrl)
  }
  const uploads = (inquiry.uploads ?? []).map((path: string) => ({ path, name: path.split('/').pop() ?? '' }))

  let html: string
  let subject: string
  if (inquiry.product_type === 'coaster') {
    const state: CoasterWizardState = {
      shape: (inquiry.shape as CoasterShapeId) ?? null,
      otherShapeDescription: inquiry.details?.otherShapeDescription ?? '',
      colors: inquiry.colors ?? [],
      uploads,
      order: {
        quantity: inquiry.quantity ?? 1,
        name: inquiry.contact?.name ?? '',
        email: inquiry.contact?.email ?? '',
        phone: inquiry.contact?.phone ?? '',
        notes: inquiry.notes ?? '',
      },
    }
    html = buildCoasterEmailHtml(state, signedUrls)
    subject = `New Coaster Inquiry — ${inquiry.contact?.name ?? ''}`
  } else {
    const state: WizardState = {
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
      uploads,
      order: {
        attachment: inquiry.attachment ?? 'hemp_twine',
        quantity: inquiry.quantity ?? 1,
        name: inquiry.contact?.name ?? '',
        email: inquiry.contact?.email ?? '',
        phone: inquiry.contact?.phone ?? '',
        notes: inquiry.notes ?? '',
      },
    }
    html = buildEmailHtml(state, SHAPES.find(s => s.id === (inquiry.shape as ShapeId)), signedUrls)
    subject = `New Custom Tag Inquiry — ${inquiry.details?.distillery ?? 'Unknown'} (${inquiry.contact?.name ?? ''})`
  }

  const result = await resend.emails.send({
    from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
    to: OWNER_EMAIL,
    subject: `[RESENT] ${subject}`,
    html,
  })
  if (result.error) throw new Error(`Resend failed: ${JSON.stringify(result.error)}`)
  console.log(`Sent ${inquiry.id} to ${OWNER_EMAIL} (Resend id ${result.data?.id})`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
