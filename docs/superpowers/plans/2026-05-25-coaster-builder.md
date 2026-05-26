# Coaster Custom Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-step coaster custom builder at `/coasters/build`, update `/custom` to a product selector landing page, and wire up a new Shopify deposit variant and Resend email notification.

**Architecture:** Independent coaster wizard at `app/coasters/build/` reuses existing `ColorsStep` and `UploadsStep` components by importing them directly from `app/custom/build/steps/`. Types live in `lib/coaster-inquiry-types.ts`. Inquiries save to the existing `custom_inquiries` Supabase table with a new `product_type` column. Submit flow: POST `/api/coaster-inquiry` → save to DB → send email → add Shopify deposit variant to cart → redirect to checkout.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, Supabase (supabase-js), Shopify Storefront API, Resend

---

### Task 1: Add `product_type` column to Supabase

**Files:**
- Create: `supabase/migrations/20260525_add_product_type_to_custom_inquiries.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260525_add_product_type_to_custom_inquiries.sql
ALTER TABLE custom_inquiries
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'tag';
```

- [ ] **Step 2: Run the migration**

Go to the Supabase dashboard → SQL Editor, paste and run the SQL above. Or run via CLI if configured:
```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260525_add_product_type_to_custom_inquiries.sql
git commit -m "chore: add product_type column to custom_inquiries"
```

---

### Task 2: Coaster inquiry types

**Files:**
- Create: `lib/coaster-inquiry-types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// lib/coaster-inquiry-types.ts
import { ColorSlot, UploadedFile } from '@/lib/custom-inquiry-types'

export type { ColorSlot, UploadedFile }

export const COASTER_SHAPES = [
  { id: 'round',  label: 'Round'  },
  { id: 'square', label: 'Square' },
  { id: 'other',  label: 'Other'  },
] as const

export type CoasterShapeId = typeof COASTER_SHAPES[number]['id']

export const COASTER_SHAPE_SVG_PATHS: Record<CoasterShapeId, string> = {
  round:  '<circle cx="50" cy="50" r="40" />',
  square: '<rect x="10" y="10" width="80" height="80" />',
  other:  '<text x="50" y="58" text-anchor="middle" font-size="36" font-family="sans-serif">?</text>',
}

export interface CoasterOrderInfo {
  quantity: number
  name: string
  email: string
  phone: string
  notes: string
}

export interface CoasterWizardState {
  shape: CoasterShapeId | null
  otherShapeDescription: string
  colors: ColorSlot[]
  uploads: UploadedFile[]
  order: CoasterOrderInfo
}

export const INITIAL_COASTER_STATE: CoasterWizardState = {
  shape: null,
  otherShapeDescription: '',
  colors: [{ slot: 1, hex: '#D97706', name: '', label: '' }],
  uploads: [],
  order: {
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    notes: '',
  },
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add lib/coaster-inquiry-types.ts
git commit -m "feat: add coaster inquiry types"
```

---

### Task 3: Update StepIndicator to accept custom labels

The existing `StepIndicator` has hardcoded 5 labels for the tag wizard. The coaster wizard has 4 steps with different labels, so we make `labels` a prop with a backward-compatible default.

**Files:**
- Modify: `components/custom/StepIndicator.tsx`

- [ ] **Step 1: Read the current file**

Current content of `components/custom/StepIndicator.tsx`:
```typescript
'use client'
import { cn } from '@/lib/utils'
const STEP_LABELS = ['Shape', 'Colors', 'Details', 'Uploads', 'Order']
interface StepIndicatorProps {
  currentStep: number  // 1-based
}
export default function StepIndicator({ currentStep }: StepIndicatorProps) { ... }
```

- [ ] **Step 2: Update the component**

Replace the interface and function signature to accept an optional `labels` prop:

```typescript
'use client'

import { cn } from '@/lib/utils'

const DEFAULT_LABELS = ['Shape', 'Colors', 'Details', 'Uploads', 'Order']

interface StepIndicatorProps {
  currentStep: number  // 1-based
  labels?: string[]
}

export default function StepIndicator({ currentStep, labels = DEFAULT_LABELS }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full mb-10">
      {labels.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < currentStep
        const active = stepNum === currentStep
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done && 'bg-amber-bourbon text-navy-900',
                  active && 'bg-amber-bourbon/20 border border-amber-bourbon text-amber-bourbon',
                  !done && !active && 'bg-navy-800 border border-white/10 text-steel/40'
                )}
              >
                {done ? '✓' : stepNum}
              </div>
              <span className={cn(
                'text-[10px] uppercase tracking-wider hidden sm:block',
                active ? 'text-amber-bourbon' : 'text-steel/40'
              )}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn(
                'h-px flex-1 mx-2 transition-all',
                done ? 'bg-amber-bourbon' : 'bg-white/10'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/custom/StepIndicator.tsx
git commit -m "feat: make StepIndicator labels configurable"
```

---

### Task 4: Coaster email builder

**Files:**
- Create: `lib/coaster-inquiry-email.ts`

- [ ] **Step 1: Create the email builder**

```typescript
// lib/coaster-inquiry-email.ts
import { CoasterWizardState, COASTER_SHAPES } from '@/lib/coaster-inquiry-types'

export function buildCoasterEmailHtml(
  state: CoasterWizardState,
  signedUrls: string[]
): string {
  const { shape, otherShapeDescription, colors, uploads, order } = state

  const shapeLabel = COASTER_SHAPES.find(s => s.id === shape)?.label ?? shape ?? 'Unknown'
  const shapeDisplay = shape === 'other' && otherShapeDescription
    ? `Other — ${otherShapeDescription}`
    : shapeLabel

  const colorSwatches = (colors ?? []).map(c => {
    const display = [c.name, c.hex].filter(Boolean).join(' · ')
    const role = c.label ? ` — ${c.label}` : ''
    return `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:12px;">
      <span style="display:inline-block;width:16px;height:16px;background:${c.hex};border-radius:3px;border:1px solid rgba(255,255,255,0.2);"></span>
      <span style="color:#D1D5DB;font-size:13px;">${display}${role}</span>
    </span>`
  }).join('')

  const imageExts = /\.(jpe?g|png|gif|webp|svg)$/i
  const fileLinks = signedUrls.length > 0
    ? signedUrls.map((url, i) => {
        const fileName = (uploads ?? [])[i]?.name ?? `File ${i + 1}`
        const isImage = imageExts.test(fileName)
        return isImage
          ? `<li style="list-style:none;margin-bottom:16px;">
               <img src="${url}" alt="${fileName}" style="max-width:100%;border-radius:6px;border:1px solid rgba(217,119,6,0.2);display:block;margin-bottom:6px;" />
               <a href="${url}" style="color:#D97706;font-size:12px;">${fileName}</a>
             </li>`
          : `<li><a href="${url}" style="color:#D97706;">${fileName}</a></li>`
      }).join('')
    : '<li style="color:#6B7280;">No files attached</li>'

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">TOMMYBOY DESIGNS</p>
          <p style="margin:4px 0 0;color:#6B7280;font-size:10px;">New Custom Coaster Inquiry</p>
        </td></tr>
        <tr><td style="background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:36px;">
          <p style="margin:0 0 20px;color:#D97706;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Inquiry from ${order.name}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;width:140px;">Shape</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${shapeDisplay}</td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Quantity</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${order.quantity}</td>
            </tr>
          </table>

          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Colors</p>
          <div style="margin-bottom:24px;line-height:2;">${colorSwatches || '<span style="color:#6B7280;font-size:13px;">None specified</span>'}</div>

          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Files</p>
          <ul style="padding:0;margin:0 0 24px;color:#D1D5DB;font-size:14px;line-height:2;">${fileLinks}</ul>

          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Contact</p>
          <p style="margin:0 0 4px;color:#D1D5DB;font-size:14px;">${order.name}</p>
          <p style="margin:0 0 4px;"><a href="mailto:${order.email}" style="color:#D97706;">${order.email}</a></p>
          ${order.phone ? `<p style="margin:0 0 4px;color:#D1D5DB;font-size:14px;">${order.phone}</p>` : ''}
          ${order.notes ? `<p style="margin:16px 0 0;color:#9CA3AF;font-size:13px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">${order.notes}</p>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/coaster-inquiry-email.ts
git commit -m "feat: add coaster inquiry email builder"
```

---

### Task 5: API route — `/api/coaster-inquiry`

**Files:**
- Create: `app/api/coaster-inquiry/route.ts`

- [ ] **Step 1: Create the route**

```typescript
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

  await resend.emails.send({
    from: 'orders@tommyboydesigns.com',
    to: process.env.OWNER_EMAIL!,
    subject: `New Coaster Inquiry — ${order.name}`,
    html,
  })

  return NextResponse.json({ ok: true, inquiryId: inserted.id })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/coaster-inquiry/route.ts
git commit -m "feat: add coaster inquiry API route with email notification"
```

---

### Task 6: Coaster wizard steps

**Files:**
- Create: `app/coasters/build/steps/ShapeStep.tsx`
- Create: `app/coasters/build/steps/OrderStep.tsx`

Note: `ColorsStep` and `UploadsStep` are imported directly from the tag builder — no duplication needed.

- [ ] **Step 1: Create directory**

```bash
mkdir -p app/coasters/build/steps
```

- [ ] **Step 2: Create ShapeStep**

```typescript
// app/coasters/build/steps/ShapeStep.tsx
'use client'

import { cn } from '@/lib/utils'
import { COASTER_SHAPES, COASTER_SHAPE_SVG_PATHS, CoasterShapeId } from '@/lib/coaster-inquiry-types'

interface ShapeStepProps {
  selected: CoasterShapeId | null
  otherDescription: string
  onChange: (id: CoasterShapeId) => void
  onOtherDescription: (desc: string) => void
}

export default function ShapeStep({ selected, otherDescription, onChange, onOtherDescription }: ShapeStepProps) {
  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">CHOOSE YOUR SHAPE</h2>
      <p className="text-steel/60 text-sm mb-6">Select the shape for your custom coaster.</p>
      <div className="grid grid-cols-3 gap-4">
        {COASTER_SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={() => onChange(shape.id)}
            className={cn(
              'glass-card p-4 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer',
              'hover:border-amber-bourbon/40',
              selected === shape.id && 'border-amber-bourbon shadow-amber-glow'
            )}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-16 h-16 text-amber-bourbon"
              fill="currentColor"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: COASTER_SHAPE_SVG_PATHS[shape.id] }}
            />
            <p className="text-white text-sm font-medium">{shape.label}</p>
          </button>
        ))}
      </div>

      {selected === 'other' && (
        <div className="mt-6">
          <label className="block text-white text-sm font-medium mb-2">
            Describe your desired shape <span className="text-amber-bourbon">*</span>
          </label>
          <textarea
            value={otherDescription}
            onChange={e => onOtherDescription(e.target.value)}
            placeholder="e.g. Hexagon, octagon, custom outline…"
            rows={3}
            className="w-full bg-navy-900/60 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 resize-none"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create OrderStep**

```typescript
// app/coasters/build/steps/OrderStep.tsx
'use client'

import { CoasterOrderInfo } from '@/lib/coaster-inquiry-types'

interface OrderStepProps {
  order: CoasterOrderInfo
  onChange: (order: CoasterOrderInfo) => void
}

const inputCls = 'w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50'
const labelCls = 'block text-xs uppercase tracking-wider text-steel/60 mb-1.5'

export default function OrderStep({ order, onChange }: OrderStepProps) {
  const set = (patch: Partial<CoasterOrderInfo>) => onChange({ ...order, ...patch })

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">ORDER DETAILS</h2>
      <p className="text-steel/60 text-sm mb-6">Almost done — let us know how many you need and how to reach you.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Quantity <span className="text-amber-bourbon">*</span></label>
          <input
            type="number"
            min={1}
            value={order.quantity}
            onChange={(e) => set({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Your Name <span className="text-amber-bourbon">*</span></label>
          <input
            type="text"
            value={order.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Full name"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-amber-bourbon">*</span></label>
          <input
            type="email"
            value={order.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={order.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="Optional"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Additional Notes</label>
          <textarea
            value={order.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Any special requests, sizing info, or questions…"
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/coasters/build/steps/
git commit -m "feat: add coaster wizard step components"
```

---

### Task 7: CoasterWizard client component

**Files:**
- Create: `app/coasters/build/CoasterWizard.tsx`

- [ ] **Step 1: Create the wizard**

```typescript
// app/coasters/build/CoasterWizard.tsx
'use client'

import { useState } from 'react'
import { addToCart, createCart } from '@/lib/shopify'
import { useCart } from '@/components/layout/CartProvider'
import StepIndicator from '@/components/custom/StepIndicator'
import WizardNav from '@/components/custom/WizardNav'
import ShapeStep from './steps/ShapeStep'
import ColorsStep from '@/app/custom/build/steps/ColorsStep'
import UploadsStep from '@/app/custom/build/steps/UploadsStep'
import OrderStep from './steps/OrderStep'
import { INITIAL_COASTER_STATE, CoasterWizardState } from '@/lib/coaster-inquiry-types'
import { AvailableColor } from '@/lib/queries/filament'

const STEP_LABELS = ['Shape', 'Colors', 'Uploads', 'Order']
const TOTAL_STEPS = 4
const COASTER_VARIANT_ID = process.env.NEXT_PUBLIC_SHOPIFY_COASTER_DEPOSIT_VARIANT_ID!

interface CoasterWizardProps {
  availableColors: AvailableColor[]
}

export default function CoasterWizard({ availableColors }: CoasterWizardProps) {
  const { cart } = useCart()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<CoasterWizardState>(INITIAL_COASTER_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<CoasterWizardState>) => setState(s => ({ ...s, ...patch }))

  const canNext: boolean = (() => {
    if (step === 1) return state.shape !== null && (state.shape !== 'other' || state.otherShapeDescription.trim().length > 0)
    if (step === 2) return state.colors.length > 0
    if (step === 3) return true  // uploads optional
    if (step === 4) return (
      state.order.quantity >= 1 &&
      state.order.name.trim().length > 0 &&
      state.order.email.trim().length > 0
    )
    return false
  })()

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/coaster-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }
      const { inquiryId } = await res.json()

      const cartId = cart?.id ?? (await createCart()).id
      const updatedCart = await addToCart(
        cartId,
        COASTER_VARIANT_ID,
        1,
        [{ key: '_custom_inquiry_id', value: inquiryId }]
      )

      window.location.href = updatedCart.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center">
          <div className="section-label mb-3">Custom Coasters</div>
          <h1 className="font-display text-white text-3xl sm:text-4xl tracking-wider">BUILD YOUR COASTER</h1>
          <p className="text-steel/60 text-sm mt-3">
            Tell us what you want — we&apos;ll bring it to life.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <StepIndicator currentStep={step} labels={STEP_LABELS} />

          {step === 1 && (
            <ShapeStep
              selected={state.shape}
              otherDescription={state.otherShapeDescription}
              onChange={(shape) => update({ shape })}
              onOtherDescription={(otherShapeDescription) => update({ otherShapeDescription })}
            />
          )}
          {step === 2 && (
            <ColorsStep
              colors={state.colors}
              onChange={(colors) => update({ colors })}
              availableColors={availableColors}
            />
          )}
          {step === 3 && (
            <UploadsStep
              uploads={state.uploads}
              onChange={(uploads) => update({ uploads })}
            />
          )}
          {step === 4 && (
            <OrderStep
              order={state.order}
              onChange={(order) => update({ order })}
            />
          )}

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <WizardNav
            step={step}
            totalSteps={TOTAL_STEPS}
            onBack={() => setStep(s => Math.max(1, s - 1))}
            onNext={handleNext}
            canNext={canNext}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/coasters/build/CoasterWizard.tsx
git commit -m "feat: add CoasterWizard client component"
```

---

### Task 8: Coaster build server page + env var

**Files:**
- Create: `app/coasters/build/page.tsx`
- Modify: `.env.local`

- [ ] **Step 1: Add env var to `.env.local`**

Open `.env.local` and add this line:
```
NEXT_PUBLIC_SHOPIFY_COASTER_DEPOSIT_VARIANT_ID=gid://shopify/ProductVariant/43290011566143
```

- [ ] **Step 2: Create the server page**

```typescript
// app/coasters/build/page.tsx
import { Metadata } from 'next'
import { getAvailableFilamentColors, AvailableColor } from '@/lib/queries/filament'
import CoasterWizard from './CoasterWizard'

export const metadata: Metadata = {
  title: 'Custom Coasters | TommyboyDesigns',
  description: 'Design fully custom 3D-printed coasters — choose your shape, colors, and artwork. Veteran owned & operated.',
}

export const revalidate = 60

export default async function CoasterBuildPage() {
  const availableColors = await getAvailableFilamentColors().catch(() => [] as AvailableColor[])
  return <CoasterWizard availableColors={availableColors} />
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/coasters/build/page.tsx
git commit -m "feat: add coaster build server page"
```

---

### Task 9: Update `/custom` to product selector landing page

The existing `app/custom/page.tsx` is a tag-only marketing page. Replace it with a two-card product selector.

**Files:**
- Modify: `app/custom/page.tsx`

- [ ] **Step 1: Replace the page content**

```typescript
// app/custom/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Custom Build | TommyboyDesigns',
  description: 'Design a fully custom 3D-printed neck tag or coaster. Veteran owned & operated.',
}

export default function CustomPage() {
  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="section-label mb-4">Custom Build</div>
          <h1 className="section-title text-[clamp(2.5rem,6vw,5rem)] mb-4">BUILD SOMETHING CUSTOM</h1>
          <p className="text-steel-light max-w-xl mx-auto leading-relaxed">
            Fully custom 3D-printed products handcrafted by a veteran-owned small business. Choose what you&apos;re building to get started.
          </p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Neck Tag card */}
          <div className="glass-card p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
            <div className="w-20 h-20 rounded-full bg-amber-bourbon/10 border border-amber-bourbon/20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-amber-bourbon" fill="currentColor" aria-hidden="true">
                <path d="M50 8 L88 24 L88 60 Q88 84 50 96 Q12 84 12 60 L12 24 Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-white text-2xl tracking-wider mb-2">NECK TAG</h2>
              <p className="text-steel/60 text-sm leading-relaxed">
                Custom bourbon neck tags — choose your shape, colors, distillery details, and attachment style.
              </p>
            </div>
            <Link href="/custom/build" className="btn-primary w-full text-center">
              Build a Tag
            </Link>
          </div>

          {/* Coaster card */}
          <div className="glass-card p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
            <div className="w-20 h-20 rounded-full bg-amber-bourbon/10 border border-amber-bourbon/20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-amber-bourbon" fill="currentColor" aria-hidden="true">
                <circle cx="50" cy="50" r="40" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-white text-2xl tracking-wider mb-2">COASTER</h2>
              <p className="text-steel/60 text-sm leading-relaxed">
                Custom 3D-printed coasters — choose your shape, colors, and upload your artwork or logo.
              </p>
            </div>
            <Link href="/coasters/build" className="btn-primary w-full text-center">
              Build a Coaster
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify both pages load**

```bash
npm run dev
```

- Open `http://localhost:3000/custom` — should show two product cards
- Click "Build a Tag" → should go to `/custom/build` and show the tag wizard
- Click "Build a Coaster" → should go to `/coasters/build` and show the coaster wizard (Shape → Colors → Uploads → Order)
- Walk all 4 steps of the coaster wizard and verify Next/Back work and validation gates step 1 (must pick a shape) and step 4 (name + email required)

- [ ] **Step 4: Commit**

```bash
git add app/custom/page.tsx
git commit -m "feat: update /custom to product selector landing page"
```

---

### Task 10: Final integration test + commit

- [ ] **Step 1: Full flow smoke test**

With dev server running:
1. Go to `http://localhost:3000/custom`
2. Click "Build a Coaster"
3. Select "Round" → Next
4. Add a color → Next
5. Skip uploads → Next
6. Fill in Quantity=1, Name, Email → Submit
7. Verify the browser redirects to a Shopify checkout URL with the coaster product in the cart

- [ ] **Step 2: Verify nav still works**

Go to `http://localhost:3000` and click "Custom" in the header — should land on the product selector, not go directly to the tag wizard.

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: add custom coaster builder with product selector landing page"
```
