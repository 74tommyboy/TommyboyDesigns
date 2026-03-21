# Custom Tag Builder — Design Spec
**Date:** 2026-03-21
**Status:** Approved by user

---

## Overview

Two related changes:
1. **Nav fix** — Update the "Custom" header link from `/collections/sip-drip-collection-custom-neck-tags` to `/custom`
2. **Custom Tag Builder** — A multi-step inquiry wizard where customers configure a custom neck tag and submit a quote request

The submission triggers a Resend email to the store owner and saves a structured record to Supabase for future reference/dashboard use.

---

## Routes

| Route | Type | Purpose |
|---|---|---|
| `/custom` | Server component | Landing page + entry point |
| `/custom/build` | Client component | Multi-step wizard shell |
| `/custom/build/confirmation` | Server component | Success page after submission |
| `POST /api/custom-inquiry` | API route | Save to Supabase + send Resend email |

---

## `/custom` Landing Page

- Hero section with headline ("Design Your Tag") and brand copy
- 2×3 grid of the 6 available shapes as SVG silhouette previews with name and dimensions
- "Start Building" CTA → `/custom/build`
- Below the fold: existing custom product grid (products filtered by `custom` tag, reusing the same card pattern as `/collections/[handle]`)

---

## Wizard — `/custom/build`

State managed in a single `useState` object in the wizard shell. No URL changes between steps. 5 steps total with a persistent step indicator at the top.

### Step 1 — Shape

Fixed list of 6 shapes, rendered as selectable cards (2×3 grid on desktop, 2 columns on mobile):

| Shape | Dimensions |
|---|---|
| Square | 50mm × 50mm |
| Circle | 50mm diameter |
| Rounded Square | 50mm × 50mm |
| Shield | 50mm × 50mm |
| Rounded Rectangle | 30mm × 60mm |
| Oblong | 40mm × 62mm |

Each card shows an accurate SVG silhouette + name + dimensions. Selected card gets amber border glow (`shadow-amber-glow` — a custom Tailwind class defined in `tailwind.config.ts`). One shape required to proceed.

### Step 2 — Colors

Up to 4 color slots. Slot 1 always visible; slots 2–4 unlock progressively as the user adds colors. Each slot has:
- Native HTML color picker (no extra dependency)
- Optional text label (e.g. "background," "text," "border")
- Remove button (returns slot to inactive)

### Step 3 — Tag Details

| Field | Type | Required |
|---|---|---|
| Distillery | Text input | Yes |
| Year | Text input | No |
| Batch / Store Pick | Toggle + text input | No |
| Additional text lines | Up to 3 repeatable text inputs | No |

**Note:** All tags are made from the same material — material is NOT a customer choice.

### Step 4 — Reference Uploads

- Drag-and-drop zone with "browse files" fallback
- Accepted: PNG, JPG, PDF, SVG, AI
- Max 10MB per file, up to 5 files
- Files upload client-side directly to Supabase Storage on drop (with per-file progress indicator) using the anon key — see Storage RLS section below
- Email includes clickable links only — no inline file previews regardless of file type
- User can remove files before proceeding
- Step is entirely optional — clearly labeled

### Step 5 — Order Info & Submit

| Field | Type | Required |
|---|---|---|
| Attachment | Radio toggle: Hemp Twine / Bead Chain | Yes |
| Quantity | Number input (min 1) | Yes |
| Name | Text input | Yes |
| Email | Email input | Yes |
| Phone | Tel input | No |
| Additional Notes | Textarea | No |

Attachment is presented first as a simple two-option toggle — it's the last meaningful choice before submitting.

Submit button shows spinner during API call. On success → redirect to `/custom/build/confirmation?shape=<shape>&qty=<quantity>&distillery=<distillery>` (key summary fields passed as query params so the confirmation page can display them without client state).

---

## Confirmation Page — `/custom/build/confirmation`

Server component. Reads `shape`, `qty`, and `distillery` from URL search params to display a brief summary.

- "We've got your request" heading
- Brief summary: shape, distillery, quantity
- Note: "We'll be in touch within 2 business days" (**TBD — confirm this copy before ship**)
- CTA link back to `/shop`

---

## API Route — `POST /api/custom-inquiry`

Receives the complete wizard state. Validates required fields (shape, quantity, name, email) and returns 400 if any are missing. Then performs two actions in parallel:

1. **Supabase insert** — saves structured inquiry record using a service-role client (see Supabase Client section)
2. **Resend email** — sends formatted summary to store owner

### Supabase Schema — `custom_inquiries` table

```typescript
{
  id: uuid (primary key, default gen_random_uuid()),
  created_at: timestamptz (default now()),
  status: text ('new' | 'in_progress' | 'quoted' | 'completed') default 'new',
  shape: text,  // 'square' | 'circle' | 'rounded_square' | 'shield' | 'rounded_rectangle' | 'oblong'
  colors: jsonb,  // Array<{ slot: number; hex: string; label: string }>
  details: jsonb, // { distillery, year, batch, additional_text: string[], attachment: 'hemp_twine' | 'bead_chain' }
  uploads: text[], // Supabase Storage paths (e.g. 'custom-inquiry-uploads/abc123/logo.pdf')
  quantity: integer,
  contact: jsonb, // { name, email, phone? }
  notes: text
}
```

**Note:** `uploads` stores raw storage paths, not URLs. Signed URLs are generated on-demand (e.g. in a future dashboard) and short-lived signed URLs are generated at submission time for inclusion in the Resend email only.

### Resend Email Content

Structured HTML email containing:
- Shape name + dimensions
- Color swatches (hex values rendered as inline colored squares)
- Tag details (distillery, year, batch, additional text)
- Clickable short-lived signed URLs for all uploads (no inline previews)
- Quantity, contact info (name, email, phone), and notes

---

## File Uploads

### Storage

- Supabase Storage bucket: `custom-inquiry-uploads`
- Bucket visibility: **private**
- Files are uploaded client-side using the anon key (requires Storage RLS — see below)
- Raw storage paths (not URLs) are stored in `custom_inquiries.uploads`
- Signed URLs (1-hour expiry) are generated server-side in the API route solely for the Resend email. **Known trade-off:** links expire after 1 hour — if the owner doesn't open the email in time, raw paths in the DB allow re-generation from a future dashboard
- Future dashboard generates signed URLs on-demand from stored paths

### Storage RLS Policy

The `custom-inquiry-uploads` bucket requires an RLS policy to allow anonymous uploads:

```sql
-- Allow anonymous uploads to custom-inquiry-uploads bucket
-- No anon reads or deletes permitted
-- Path must have a non-empty folder prefix (prevents root-level uploads)
CREATE POLICY "anon_upload_custom_inquiries"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'custom-inquiry-uploads'
  AND (storage.foldername(name))[1] IS NOT NULL
);
```

### Supabase Client Setup

Two Supabase clients are needed:

- **`lib/supabase.ts`** — existing anon-key client, used client-side for file uploads
- **`lib/supabase-admin.ts`** — new service-role client, used server-side only in `app/api/custom-inquiry/route.ts` for inserting inquiry records

```typescript
// lib/supabase-admin.ts
import 'server-only'  // prevents accidental client-side bundling of the service-role key
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## Database Migration

A SQL migration file should be created at `supabase/migrations/20260321000000_create_custom_inquiries.sql` containing the `custom_inquiries` table definition and the Storage RLS policy above.

---

## Component File Structure

```
app/
├── custom/
│   ├── page.tsx                        — Landing page (server)
│   └── build/
│       ├── page.tsx                    — Wizard shell (client)
│       ├── steps/
│       │   ├── ShapeStep.tsx
│       │   ├── ColorsStep.tsx
│       │   ├── DetailsStep.tsx
│       │   ├── UploadsStep.tsx
│       │   └── OrderStep.tsx
│       └── confirmation/
│           └── page.tsx                — Success page (server, reads search params)
components/
└── custom/
    ├── ShapeCard.tsx                   — SVG shape preview card
    ├── ColorSlot.tsx                   — Single color picker + label
    ├── StepIndicator.tsx               — Progress bar / step dots
    └── WizardNav.tsx                   — Back / Next / Submit buttons
app/
└── api/
    └── custom-inquiry/
        └── route.ts                    — POST handler (uses supabaseAdmin)
lib/
└── supabase-admin.ts                   — Service-role Supabase client (server only)
supabase/
└── migrations/
    └── 20260321000000_create_custom_inquiries.sql
```

---

## Nav Fix

**File:** `components/layout/Header.tsx`

```diff
- { label: 'Custom', href: '/collections/sip-drip-collection-custom-neck-tags' }
+ { label: 'Custom', href: '/custom' }
```

---

## External Dependencies

| Service | Purpose | Notes |
|---|---|---|
| Supabase | Inquiry database + file storage | Free tier sufficient to start |
| Resend | Owner notification email | Already configured in project |

New env vars needed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never exposed to client)

---

## Out of Scope

- Live visual tag preview (future)
- Customer-facing inquiry status tracking (future)
- Admin dashboard for managing inquiries (future — Supabase Studio covers this for now)
- Automated pricing / cart integration (future)
