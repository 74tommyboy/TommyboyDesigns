# Public Reviews Section — Design Spec
**Date:** 2026-03-24
**Status:** Approved

---

## Overview

Add a public-facing reviews section to the bottom of the homepage where anyone can submit a review. Customers who have made a purchase can optionally verify themselves via email lookup against the Shopify Admin API, earning a "Verified Purchase" badge. All submissions require admin approval before going live.

The existing token-based review flow (post-purchase email → `/reviews/[token]`) remains completely unchanged.

---

## 1. Homepage Section (`ReviewsSection` component)

A new `ReviewsSection` component added to the bottom of `app/page.tsx`, below the existing `ReviewTicker`, anchored with `id="reviews"`.

**Two parts:**

**Review grid (top):** Displays the most recent 6–12 approved reviews in a card grid. Each card shows star rating, review body, reviewer name, and a "Verified Purchase" badge if `verified: true`. Scrollable on mobile.

**Submission form (bottom):** Fields:
- Display name (text input, required)
- Star rating (1–5, required)
- Review body (textarea, required)
- Toggle: "I've made a purchase from TommyboyDesigns" (boolean)
  - When toggled on: reveals an email input (optional but recommended for verification)

On submit, posts to `POST /api/reviews/public`. Shows a success message inline on completion. Shows inline error on failure.

---

## 2. API — `POST /api/reviews/public`

**Request body:**
```ts
{
  reviewer_name: string       // required
  rating: number              // required, 1–5
  body: string                // required
  claimed_purchaser: boolean  // required
  email?: string              // optional, only relevant if claimed_purchaser: true
}
```

**Verification logic:**
- If `claimed_purchaser: true` and `email` is provided, query Shopify Admin API:
  `GET /admin/api/2024-01/orders.json?email=<email>&status=any`
- If any order is returned → `verified: true`
- Otherwise → `verified: false`
- If `claimed_purchaser: false` or no email → `verified: false`, no Shopify call

**Supabase client:** Use the anon client for the insert (consistent with existing `POST /api/reviews`). If RLS on the `reviews` table does not allow anon inserts, use `supabaseAdmin` instead — but do not relax RLS.

**On success:**
1. Insert into `reviews` table with `approved: false`, `verified: <result>`, `email: <if provided>`, `ip_hash: <hashed ip>`, `product_handle: 'general'`, `product_title: 'TommyboyDesigns'`
2. Fire admin notification email via Resend
3. Return `{ ok: true }` to client

**Input validation (server-enforced):**
- `reviewer_name`: max 100 characters
- `body`: max 2000 characters
- `rating`: integer 1–5

**Rate limiting:** One submission per IP per hour, enforced via Supabase. On each submission, query `reviews` for a row with the same `ip_hash` created within the last hour. If found, return 429. The real IP is read from the `X-Forwarded-For` header (Vercel proxy) and SHA-256 hashed before storage for privacy. Do not use in-memory rate limiting — serverless functions on Vercel have no persistent memory across invocations.

---

## 3. Admin Notification & Approval Flow

**Notification email** sent to the site owner via Resend immediately after a public review is submitted.

Email contents:
- Reviewer name, star rating, review body
- Verified status ("Verified Purchase" or "Unverified")
- Submitter email (if provided)
- **Approve** button → `/api/admin/reviews/approve?id=X&sig=Y`
- **Reject** button → `/api/admin/reviews/reject?id=X&sig=Y`

**Signature (`sig`):** HMAC-SHA256 of `"id:action"` using `ADMIN_TOKEN_SECRET` env var. Prevents link forgery and cross-action reuse (an approve sig cannot be used to reject).

**Supabase client:** Both approve and reject routes must use `supabaseAdmin` (from `lib/supabase-admin.ts`) — these are privileged mutations that must never go through the anon key.

**`/api/admin/reviews/approve`:**
- Validates sig
- Checks that the review row exists and has `approved: false` (idempotency guard — replaying the link is a no-op)
- Sets `approved: true`
- Redirects to `/admin/reviews/done?action=approved`

**`/api/admin/reviews/reject`:**
- Validates sig
- Deletes the review row (if already deleted, silently succeeds)
- Redirects to `/admin/reviews/done?action=rejected`

**Replay safety:** Review IDs are UUIDs (the existing `Review` type defines `id: string` and Supabase defaults to UUID primary keys). There is no integer ID reuse risk. The idempotency guard on the approve route handles the edge case of a replayed approve click.

**`/admin/reviews/done` page:** Simple confirmation page ("Review approved / rejected") — no auth required since access is gated by the HMAC sig on the action routes.

---

## 4. Database Changes

**Migration:** Add `email` and `ip_hash` columns to the `reviews` table.

```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ip_hash text;
```

New migration file: `supabase/migrations/20260324000000_reviews_add_email_ip_hash.sql`

Both fields are nullable. `email` is not exposed in any public API response and is used only for admin notification context. `ip_hash` is used for rate limiting lookups only.

The existing `POST /api/reviews` (token-based) insert path does not populate these columns and does not need to be updated — the columns are nullable and that flow is unaffected.

**Updated `Review` type in `lib/supabase.ts`:** Add `email?: string` and `ip_hash?: string` (optional, omitted from public-facing components).

---

## 5. New Files

| File | Purpose |
|------|---------|
| `components/home/ReviewsSection.tsx` | Homepage section with grid + submission form |
| `app/api/reviews/public/route.ts` | Open submission endpoint |
| `app/api/admin/reviews/approve/route.ts` | HMAC-gated approve action |
| `app/api/admin/reviews/reject/route.ts` | HMAC-gated reject action |
| `app/admin/reviews/done/page.tsx` | Confirmation page after approve/reject |
| `supabase/migrations/20260324000000_reviews_add_email_ip_hash.sql` | DB migration |

---

## 6. Environment Variables

| Variable | Purpose |
|----------|---------|
| `ADMIN_TOKEN_SECRET` | HMAC secret for approve/reject link signatures |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify Admin API token for order lookup |
| `SHOPIFY_STORE_DOMAIN` | e.g. `your-store.myshopify.com` |
| `ADMIN_EMAIL` | Email address to send review notifications to (codebase also has `OWNER_EMAIL` for custom inquiry notifications — reuse or consolidate at implementation time) |

`RESEND_API_KEY` and `NEXT_PUBLIC_SITE_URL` are already present.

---

## 7. Out of Scope

- Per-product review filtering (all public submissions tagged `product_handle: 'general'`)
- Pagination on the review grid (static 12-review cap for now)
- Edit/update of submitted reviews
- Any changes to the existing token-based review email flow
