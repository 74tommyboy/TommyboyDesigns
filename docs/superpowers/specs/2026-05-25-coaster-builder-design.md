# Coaster Custom Builder — Design Spec
_Date: 2026-05-25_

## Overview

Add a custom coaster builder to the site alongside the existing custom neck tag builder. Customers arrive at a new landing page (`/custom`) that lets them choose between building a custom tag or a custom coaster, each flowing into its own dedicated wizard.

---

## 1. URL Structure & Navigation

| Route | Purpose |
|---|---|
| `/custom` | New landing page — two product cards (Tag, Coaster) |
| `/custom/build` | Tag wizard — unchanged, no files moved |
| `/coasters/build` | New coaster wizard |

**Nav change:** The existing "Custom Build" nav link updates from `/custom/build` → `/custom`. This is the only nav edit required.

---

## 2. Landing Page (`/custom`)

New server component at `app/custom/page.tsx`. Renders two side-by-side product cards styled in the existing military/bourbon Tailwind theme:

- **Neck Tag card** — title, brief description, → BUILD button linking to `/custom/build`
- **Coaster card** — title, brief description, → BUILD button linking to `/coasters/build`

Page heading: "BUILD SOMETHING CUSTOM"

No data fetching required; this is a static page.

---

## 3. Coaster Wizard (`/coasters/build`)

### Steps

4 steps (neck tag has 5 — the distillery Details step is omitted; attachment type is removed from Order):

| Step | Label | Content |
|---|---|---|
| 1 | Shape | Round, Square, Other (Other shows a free-text description input) |
| 2 | Colors | Multi-color slot picker — identical component to tag builder |
| 3 | Uploads | File upload step — identical component to tag builder |
| 4 | Order | Quantity, Name (required), Email (required), Phone, Notes |

### Submit flow

On wizard submit (step 4 Next):
1. POST wizard state to `/api/coaster-inquiry`
2. API saves to Supabase `custom_inquiries` table, returns `inquiryId`
3. API sends email notification to owner via Resend
4. Client adds coaster deposit variant to Shopify cart with `_custom_inquiry_id` attribute
5. Client redirects to `cart.checkoutUrl`

---

## 4. Types (`lib/coaster-inquiry-types.ts`)

New file. Reuses `ColorSlot` and `UploadedFile` imported from `lib/custom-inquiry-types.ts`.

```ts
export const COASTER_SHAPES = [
  { id: 'round',  label: 'Round'  },
  { id: 'square', label: 'Square' },
  { id: 'other',  label: 'Other'  },
] as const

export type CoasterShapeId = typeof COASTER_SHAPES[number]['id']

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
  colors: ColorSlot[]        // imported from custom-inquiry-types
  uploads: UploadedFile[]    // imported from custom-inquiry-types
  order: CoasterOrderInfo
}
```

---

## 5. Data Layer

### Supabase

Reuse the existing `custom_inquiries` table. Add one column:

```sql
ALTER TABLE custom_inquiries
  ADD COLUMN product_type TEXT NOT NULL DEFAULT 'tag';
```

Coaster inquiries insert with `product_type: 'coaster'`. Existing tag inquiries default to `'tag'` and require no backfill.

### API route (`/api/coaster-inquiry`)

New `app/api/coaster-inquiry/route.ts`. POST handler:
- Validates: `shape`, `order.quantity`, `order.name`, `order.email` (same guards as custom-inquiry)
- Inserts to `custom_inquiries` with `product_type: 'coaster'`, `attachment: null`, `details: {}`
- Sends email via Resend (see §6)
- Returns `{ ok: true, inquiryId }`

### Environment variable

Add to `.env.local`:
```
NEXT_PUBLIC_SHOPIFY_COASTER_DEPOSIT_VARIANT_ID=gid://shopify/ProductVariant/43290011566143
```

Used in `CoasterWizard.tsx` for the cart line item. Shopify product: `keua9p-hd.myshopify.com/products/coasters?variant=43290011566143`.

---

## 6. Email Notification (`lib/coaster-inquiry-email.ts`)

New file adapting `lib/custom-inquiry-email.ts`. Removes:
- Distillery / year / batch type / additional lines sections
- Attachment type row

Keeps:
- Shape row
- Color swatches
- File attachments (signed Supabase URLs)
- Contact block (name, email, phone, notes)

Subject line: `New Coaster Inquiry — {name}`
Sent to `OWNER_EMAIL` via Resend, same as the tag builder email pattern.

---

## 7. New & Modified Files

### New
| Path | Purpose |
|---|---|
| `app/custom/page.tsx` | Landing / product selector |
| `app/coasters/build/page.tsx` | Server component — fetches filament colors, renders CoasterWizard |
| `app/coasters/build/CoasterWizard.tsx` | Client wizard shell (4 steps) |
| `app/coasters/build/steps/ShapeStep.tsx` | Round / Square / Other picker |
| `app/coasters/build/steps/ColorsStep.tsx` | Color slots (wraps or copies tag ColorsStep) |
| `app/coasters/build/steps/UploadsStep.tsx` | File uploads (wraps or copies tag UploadsStep) |
| `app/coasters/build/steps/OrderStep.tsx` | Qty + contact (no attachment) |
| `lib/coaster-inquiry-types.ts` | Coaster types |
| `lib/coaster-inquiry-email.ts` | Email HTML builder |
| `app/api/coaster-inquiry/route.ts` | API route |

### Modified
| Path | Change |
|---|---|
| Nav component | Update "Custom Build" href to `/custom` |
| `.env.local` | Add `NEXT_PUBLIC_SHOPIFY_COASTER_DEPOSIT_VARIANT_ID` |
| Supabase | Migration: add `product_type` column to `custom_inquiries` |

---

## 8. Out of Scope

- Confirmation page after checkout (tag builder doesn't have one post-checkout)
- Admin dashboard for viewing coaster inquiries
- Email sent to the customer (owner email only, same as tags)
- Changes to the tag builder wizard itself
