# Custom Build — Payment-First Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the custom tag wizard so the customer pays a deposit before the owner receives the inquiry email — design is saved to Supabase, deposit product added to their Shopify cart, customer checks out, then a webhook fires the owner email.

**Architecture:** The wizard POSTs to `/api/custom-inquiry` which saves the design and returns the new row ID. `BuildWizard.tsx` then adds the deposit product to the customer's existing Shopify cart (quantity 1, with `_custom_inquiry_id` as a line item attribute) and redirects to the Shopify checkout URL. When the order is paid, Shopify fires a webhook to `/api/webhooks/shopify/orders-paid`, which looks up the inquiry by ID, generates signed upload URLs, and sends the owner email using the same HTML template as before.

**Tech Stack:** Next.js 14 App Router, Shopify Storefront API, Supabase (service role), Resend, `crypto` (Node built-in)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/custom-inquiry-email.ts` | **Create** | Exported `buildEmailHtml` function (moved from API route) |
| `app/api/custom-inquiry/route.ts` | **Modify** | Save-only: remove email send, add `otherShapeDescription` to details, return `inquiryId` |
| `app/api/webhooks/shopify/orders-paid/route.ts` | **Create** | HMAC verify → lookup inquiry → send email |
| `app/custom/build/BuildWizard.tsx` | **Modify** | After save, add deposit to cart (qty 1) → redirect to `checkoutUrl` |

---

## Task 1: Extract email builder to shared module

The `buildEmailHtml` function currently lives inside the API route. Moving it to `lib/` lets the new webhook route import it without duplication.

**Files:**
- Create: `lib/custom-inquiry-email.ts`
- Modify: `app/api/custom-inquiry/route.ts`

- [ ] **Step 1: Create `lib/custom-inquiry-email.ts`**

Open `app/api/custom-inquiry/route.ts`. Find the `buildEmailHtml` function (starts around line 70, everything after `return NextResponse.json({ ok: true })`). Cut the entire function and paste it into a new file:

```typescript
import { WizardState, SHAPES, ShapeId } from '@/lib/custom-inquiry-types'

export function buildEmailHtml(
  state: WizardState,
  shapeData: typeof SHAPES[number] | undefined,
  signedUrls: string[]
): string {
  // paste the full function body here exactly as it was in the route
}
```

The function body is unchanged — just move it verbatim.

- [ ] **Step 2: Update the import in `app/api/custom-inquiry/route.ts`**

Remove the `buildEmailHtml` function definition (it's now in `lib/`). Add this import at the top of the file:

```typescript
import { buildEmailHtml } from '@/lib/custom-inquiry-email'
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build completes with no type errors. The `/api/custom-inquiry` route should still appear in the output.

- [ ] **Step 4: Commit**

```bash
git add lib/custom-inquiry-email.ts app/api/custom-inquiry/route.ts
git commit -m "refactor: extract buildEmailHtml to lib/custom-inquiry-email"
```

---

## Task 2: Modify `/api/custom-inquiry` to save-only and return `inquiryId`

**Files:**
- Modify: `app/api/custom-inquiry/route.ts`

- [ ] **Step 1: Store `otherShapeDescription` in the Supabase insert**

The webhook needs to reconstruct the full `WizardState` later. `otherShapeDescription` is not currently saved. Store it inside the existing `details` JSONB column.

Find this block in `app/api/custom-inquiry/route.ts`:

```typescript
const { shape, colors, details, uploads, order } = body
```

Replace with:

```typescript
const { shape, otherShapeDescription, colors, details, uploads, order } = body
```

Then find the Supabase insert's `details` field:

```typescript
      details: details ?? {},
```

Replace with:

```typescript
      details: { ...(details ?? {}), otherShapeDescription: otherShapeDescription ?? '' },
```

- [ ] **Step 2: Change the insert to return the row ID**

Find the `Promise.allSettled` block:

```typescript
  const [dbResult, emailResult] = await Promise.allSettled([
    supabaseAdmin.from('custom_inquiries').insert({
      shape,
      colors: colors ?? [],
      details: { ...(details ?? {}), otherShapeDescription: otherShapeDescription ?? '' },
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
```

Replace the entire block with:

```typescript
  const { data: inserted, error: dbError } = await supabaseAdmin
    .from('custom_inquiries')
    .insert({
      shape,
      colors: colors ?? [],
      details: { ...(details ?? {}), otherShapeDescription: otherShapeDescription ?? '' },
      uploads: (uploads ?? []).map(u => u.path),
      quantity: order.quantity,
      attachment: order.attachment,
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
```

- [ ] **Step 3: Remove now-unused imports and constants**

At the top of `app/api/custom-inquiry/route.ts`, remove:

```typescript
import { Resend } from 'resend'
```

and:

```typescript
const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'
```

Also remove the `signedUrls` generation block and the `shapeData` lookup — they are no longer needed in this route (the webhook handles them). The route should now be much shorter. The final file should look like:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { WizardState } from '@/lib/custom-inquiry-types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: WizardState
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { shape, otherShapeDescription, colors, details, uploads, order } = body

  if (!shape || !order?.quantity || !order?.name?.trim() || !order?.email?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: shape, quantity, name, email' }, { status: 400 })
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
      details: { ...(details ?? {}), otherShapeDescription: otherShapeDescription ?? '' },
      uploads: (uploads ?? []).map(u => u.path),
      quantity: order.quantity,
      attachment: order.attachment,
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
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: clean build, no type errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/custom-inquiry/route.ts
git commit -m "feat: custom-inquiry route saves only, returns inquiryId"
```

---

## Task 3: Create `orders-paid` webhook route

**Files:**
- Create: `app/api/webhooks/shopify/orders-paid/route.ts`

- [ ] **Step 1: Create the webhook route file**

Create `app/api/webhooks/shopify/orders-paid/route.ts` with this full content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { WizardState, SHAPES, ShapeId } from '@/lib/custom-inquiry-types'
import { buildEmailHtml } from '@/lib/custom-inquiry-email'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'

function verifyShopifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return hash === hmac
}

export async function POST(req: NextRequest) {
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

  // Reconstruct WizardState from stored inquiry data
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

  await resend.emails.send({
    from: 'TommyboyDesigns <orders@tommyboydesigns.com>',
    to: OWNER_EMAIL,
    subject: `New Custom Tag Inquiry — ${inquiry.details?.distillery ?? 'Unknown'} (${inquiry.contact?.name ?? ''})`,
    html: buildEmailHtml(state, shapeData, signedUrls),
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build. The new route `/api/webhooks/shopify/orders-paid` should appear in the output.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/shopify/orders-paid/route.ts
git commit -m "feat: add orders-paid webhook to email owner after payment"
```

---

## Task 4: Update `BuildWizard.tsx` to add to cart and redirect

**Files:**
- Modify: `app/custom/build/BuildWizard.tsx`

- [ ] **Step 1: Add Shopify imports and `useCart` to `BuildWizard.tsx`**

At the top of `app/custom/build/BuildWizard.tsx`, add these imports:

```typescript
import { addToCart, createCart } from '@/lib/shopify'
import { useCart } from '@/components/layout/CartProvider'
```

Inside the component, add the cart hook after the existing state declarations:

```typescript
const { cart } = useCart()
```

- [ ] **Step 2: Replace `handleNext` final-step logic**

Find the `handleNext` function. The final-step block currently reads:

```typescript
    const res = await fetch('/api/custom-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Submission failed')
    }
    const params = new URLSearchParams({
      shape: state.shape ?? '',
      qty: String(state.order.quantity),
      distillery: state.details.distillery,
    })
    router.push(`/custom/build/confirmation?${params.toString()}`)
```

Replace it with:

```typescript
    const res = await fetch('/api/custom-inquiry', {
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
      process.env.NEXT_PUBLIC_SHOPIFY_CUSTOM_DEPOSIT_VARIANT_ID!,
      1,
      [{ key: '_custom_inquiry_id', value: inquiryId }]
    )

    window.location.href = updatedCart.checkoutUrl
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: clean build. TypeScript should not complain — `addToCart` and `createCart` are already typed in `lib/shopify.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/custom/build/BuildWizard.tsx
git commit -m "feat: wizard redirects to Shopify checkout after saving inquiry"
```

---

## Task 5: Environment variable and Shopify webhook registration

This task has no code changes — it's configuration that must be done before the feature works in production.

**Files:**
- Modify: `.env.local` (local dev only, not committed)
- Modify: Vercel environment variables (via Vercel dashboard)

- [ ] **Step 1: Get the Shopify variant ID for the deposit product**

1. Go to Shopify Admin → Products
2. Find **"Custom Miscellaneous Bottle Neck Tags"** (handle: `custom-miscellaneous-bottle-neck-tags-77013`)
3. Click into the product → click the single variant
4. The URL will contain the variant ID: `https://admin.shopify.com/store/<store>/products/<product-id>/variants/<variant-id>`
5. Copy `<variant-id>` — it's a numeric ID like `12345678901234`

- [ ] **Step 2: Add to `.env.local`**

Add this line to `.env.local`:

```
NEXT_PUBLIC_SHOPIFY_CUSTOM_DEPOSIT_VARIANT_ID=gid://shopify/ProductVariant/<variant-id>
```

Replace `<variant-id>` with the number from Step 1.

- [ ] **Step 3: Add to Vercel**

In the Vercel dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SHOPIFY_CUSTOM_DEPOSIT_VARIANT_ID = gid://shopify/ProductVariant/<variant-id>
```

- [ ] **Step 4: Register the Shopify webhook**

1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Click **"Create webhook"**
3. Event: **Order payment** (maps to `orders/paid`)
4. Format: **JSON**
5. URL: `https://www.tommyboydesigns.com/api/webhooks/shopify/orders-paid`
6. Webhook API version: **latest stable**
7. Save

The webhook uses the same `SHOPIFY_WEBHOOK_SECRET` already in your environment — no new secret needed.

- [ ] **Step 5: Deploy and smoke-test**

After deploying:
1. Go through the custom build wizard as a customer
2. Complete all 5 steps and click Submit
3. Verify you land on Shopify checkout with the deposit product in the cart and `_custom_inquiry_id` visible in the line item notes
4. Complete a test payment (use Shopify's Bogus Gateway in dev mode)
5. Verify you receive the owner email with all design details

---

## Self-Review Checklist

**Spec coverage:**
- ✅ `/api/custom-inquiry` — save-only, returns `inquiryId` (Task 2)
- ✅ `otherShapeDescription` stored so webhook can reconstruct full state (Task 2, Step 1)
- ✅ Deposit product added with `quantity: 1` regardless of tag quantity (Task 4)
- ✅ Existing cart used if present, new cart created if not (Task 4)
- ✅ Redirect to `checkoutUrl` (Task 4)
- ✅ Webhook: HMAC verification (Task 3)
- ✅ Webhook: finds `_custom_inquiry_id` in `line_items[].properties` (Task 3)
- ✅ Webhook: Supabase lookup → signed URLs → email (Task 3)
- ✅ Webhook: silent no-op if order has no custom inquiry line item (Task 3)
- ✅ Webhook returns 500 on lookup failure so Shopify retries (Task 3)
- ✅ `buildEmailHtml` extracted to shared module (Task 1)
- ✅ Env var documented (Task 5)
- ✅ Shopify webhook registration documented (Task 5)

**Type consistency:**
- `buildEmailHtml(state: WizardState, shapeData: typeof SHAPES[number] | undefined, signedUrls: string[])` — signature consistent across Task 1 (definition) and Task 3 (call site)
- `inquiryId` flows from route response → wizard → cart attribute → webhook property lookup — consistent string throughout
- `addToCart(cartId, variantId, quantity, attributes)` — matches existing signature in `lib/shopify.ts`
