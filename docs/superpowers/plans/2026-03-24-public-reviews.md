# Public Reviews Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public homepage reviews section where anyone can submit a review, with optional purchase verification via Shopify Admin API and admin email approval before reviews go live.

**Architecture:** A new `ReviewsSection` client component renders a review grid and submission form at the bottom of the homepage. Submissions go to a new `POST /api/reviews/public` endpoint that verifies purchases against Shopify, inserts with `approved: false`, and emails the owner signed approve/reject links. Two admin routes handle approval/rejection via HMAC-signed URLs.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (Postgres), Resend (email), Shopify Admin REST API, Tailwind CSS, crypto (built-in Node.js)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/20260324000000_reviews_add_email_ip_hash.sql` | Add `email` and `ip_hash` columns to `reviews` |
| Modify | `lib/supabase.ts` | Add `email?` and `ip_hash?` to `Review` type |
| Create | `app/api/reviews/public/route.ts` | Open submission: validate, rate-limit, verify, insert, notify |
| Create | `app/api/admin/reviews/approve/route.ts` | HMAC-gated approve action |
| Create | `app/api/admin/reviews/reject/route.ts` | HMAC-gated reject action |
| Create | `app/admin/reviews/done/page.tsx` | Post-action confirmation page |
| Create | `components/home/ReviewsSection.tsx` | Review grid + submission form (client component) |
| Modify | `app/page.tsx` | Import and render `ReviewsSection`, pass reviews |

---

## Environment Variables to Add

Before starting, add these to your `.env.local` and Vercel project settings:

```
ADMIN_TOKEN_SECRET=<random 32+ char string>
SHOPIFY_ADMIN_ACCESS_TOKEN=<from Shopify Admin > Apps > Private apps or custom apps>
# OWNER_EMAIL already exists — used for review notification emails
```

`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` already exists and will be reused.

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260324000000_reviews_add_email_ip_hash.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260324000000_reviews_add_email_ip_hash.sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ip_hash text;
```

- [ ] **Step 2: Apply migration**

If using Supabase CLI locally:
```bash
npx supabase db push
```

If applying directly in Supabase dashboard: paste the SQL into the SQL editor and run it. Verify both columns appear in the `reviews` table schema.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260324000000_reviews_add_email_ip_hash.sql
git commit -m "feat: add email and ip_hash columns to reviews table"
```

---

## Task 2: Update Review Type

**Files:**
- Modify: `lib/supabase.ts`

- [ ] **Step 1: Add new fields to the `Review` type**

In `lib/supabase.ts`, update the `Review` type:

```ts
export type Review = {
  id: string
  product_handle: string
  product_title: string
  reviewer_name: string
  rating: number
  body: string
  verified: boolean
  approved: boolean
  created_at: string
  email?: string    // admin-only, not exposed publicly
  ip_hash?: string  // rate limiting only
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit
```

Expected: no errors related to `Review`.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add email and ip_hash to Review type"
```

---

## Task 3: Public Submission API Endpoint

**Files:**
- Create: `app/api/reviews/public/route.ts`

This is the core server-side logic. It handles validation, rate limiting, Shopify verification, DB insert, and owner notification.

- [ ] **Step 1: Create the route file**

```ts
// app/api/reviews/public/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'tommy@tommyboydesigns.com'

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

async function hasShopifyOrder(email: string): Promise<boolean> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!
  try {
    const res = await fetch(
      `https://${domain}/admin/api/2024-01/orders.json?email=${encodeURIComponent(email)}&status=any&limit=1&fields=id`,
      { headers: { 'X-Shopify-Access-Token': token } }
    )
    if (!res.ok) return false
    const data = await res.json()
    return (data.orders?.length ?? 0) > 0
  } catch {
    return false
  }
}

function makeAdminSig(id: string, action: 'approve' | 'reject'): string {
  return createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!)
    .update(`${id}:${action}`)
    .digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { reviewer_name, rating, body: reviewBody, claimed_purchaser, email } = body

  // Input validation
  if (!reviewer_name?.trim() || !rating || !reviewBody?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (typeof reviewer_name !== 'string' || reviewer_name.trim().length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 })
  }
  if (typeof reviewBody !== 'string' || reviewBody.trim().length > 2000) {
    return NextResponse.json({ error: 'Review must be 2000 characters or fewer' }, { status: 400 })
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
  }

  // Rate limiting — 1 submission per IP per hour
  const forwarded = req.headers.get('x-forwarded-for')
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
  const ipHash = hashIp(rawIp)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('reviews')
    .select('id')
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .single()

  if (recent) {
    return NextResponse.json({ error: 'Too many submissions. Please try again in an hour.' }, { status: 429 })
  }

  // Purchase verification
  let verified = false
  if (claimed_purchaser && email?.trim()) {
    verified = await hasShopifyOrder(email.trim())
  }

  // Insert review (approved: false — held for moderation)
  const { data: inserted, error } = await supabase
    .from('reviews')
    .insert({
      product_handle: 'general',
      product_title: 'TommyboyDesigns',
      reviewer_name: reviewer_name.trim(),
      rating,
      body: reviewBody.trim(),
      verified,
      approved: false,
      email: email?.trim() ?? null,
      ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  // Send admin notification email
  const approveSig = makeAdminSig(inserted.id, 'approve')
  const rejectSig = makeAdminSig(inserted.id, 'reject')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const approveUrl = `${siteUrl}/api/admin/reviews/approve?id=${inserted.id}&sig=${approveSig}`
  const rejectUrl = `${siteUrl}/api/admin/reviews/reject?id=${inserted.id}&sig=${rejectSig}`

  await resend.emails.send({
    from: 'TommyboyDesigns <reviews@tommyboydesigns.com>',
    to: OWNER_EMAIL,
    subject: `New review pending approval — ${rating}★ from ${reviewer_name.trim()}`,
    html: buildNotificationEmail({
      reviewerName: reviewer_name.trim(),
      rating,
      body: reviewBody.trim(),
      verified,
      email: email?.trim() ?? null,
      approveUrl,
      rejectUrl,
    }),
  })

  return NextResponse.json({ ok: true })
}

function buildNotificationEmail(opts: {
  reviewerName: string
  rating: number
  body: string
  verified: boolean
  email: string | null
  approveUrl: string
  rejectUrl: string
}): string {
  const stars = '★'.repeat(opts.rating) + '☆'.repeat(5 - opts.rating)
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:40px;">
          <p style="margin:0 0 8px;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">New Review Pending Approval</p>
          <p style="margin:0 0 24px;color:#D1D5DB;font-size:22px;">${stars}</p>
          <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">From</p>
          <p style="margin:0 0 16px;color:#F9FAFB;font-size:16px;font-weight:bold;">${opts.reviewerName}</p>
          ${opts.email ? `<p style="margin:0 0 16px;color:#6B7280;font-size:13px;">Email: ${opts.email}</p>` : ''}
          <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Status</p>
          <p style="margin:0 0 24px;color:${opts.verified ? '#D97706' : '#6B7280'};font-size:13px;font-weight:bold;">
            ${opts.verified ? '✓ Verified Purchase' : 'Unverified'}
          </p>
          <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Review</p>
          <p style="margin:0 0 32px;color:#D1D5DB;font-size:15px;line-height:1.7;border-left:3px solid rgba(217,119,6,0.4);padding-left:16px;">${opts.body}</p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;">
              <a href="${opts.approveUrl}" style="display:inline-block;background:#D97706;color:#0A0F1E;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:4px;">Approve</a>
            </td>
            <td>
              <a href="${opts.rejectUrl}" style="display:inline-block;background:#374151;color:#D1D5DB;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:12px 28px;border-radius:4px;">Reject</a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`npm run dev`) and run:

```bash
curl -X POST http://localhost:3000/api/reviews/public \
  -H "Content-Type: application/json" \
  -d '{"reviewer_name":"Test User","rating":5,"body":"Great product!","claimed_purchaser":false}'
```

Expected: `{"ok":true}` — and a row appears in Supabase `reviews` table with `approved: false`.

> **Note:** If you get a 500 with an RLS error on the insert, swap `supabase` for `supabaseAdmin` (from `@/lib/supabase-admin`) in the insert call. Do not relax RLS — change the client instead.

Test validation rejects:
```bash
curl -X POST http://localhost:3000/api/reviews/public \
  -H "Content-Type: application/json" \
  -d '{"reviewer_name":"","rating":5,"body":"test","claimed_purchaser":false}'
```
Expected: `{"error":"Missing required fields"}` with status 400.

- [ ] **Step 4: Commit**

```bash
git add app/api/reviews/public/route.ts
git commit -m "feat: add public review submission endpoint with verification and owner notification"
```

---

## Task 4: Admin Approve / Reject Routes + Confirmation Page

**Files:**
- Create: `app/api/admin/reviews/approve/route.ts`
- Create: `app/api/admin/reviews/reject/route.ts`
- Create: `app/admin/reviews/done/page.tsx`

- [ ] **Step 1: Create the approve route**

```ts
// app/api/admin/reviews/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function verifyAdminSig(id: string, action: 'approve' | 'reject', sig: string): boolean {
  const expected = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!)
    .update(`${id}:${action}`)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const sig = req.nextUrl.searchParams.get('sig') ?? ''

  if (!id || !sig || !verifyAdminSig(id, 'approve', sig)) {
    return NextResponse.json({ error: 'Invalid or missing signature' }, { status: 403 })
  }

  // Idempotency guard — only approve if currently pending
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('id, approved')
    .eq('id', id)
    .single()

  if (!review) {
    return NextResponse.redirect(new URL('/admin/reviews/done?action=not_found', req.url))
  }

  if (!review.approved) {
    await supabaseAdmin
      .from('reviews')
      .update({ approved: true })
      .eq('id', id)
  }

  return NextResponse.redirect(new URL('/admin/reviews/done?action=approved', req.url))
}
```

- [ ] **Step 2: Create the reject route**

```ts
// app/api/admin/reviews/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function verifyAdminSig(id: string, action: 'approve' | 'reject', sig: string): boolean {
  const expected = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!)
    .update(`${id}:${action}`)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const sig = req.nextUrl.searchParams.get('sig') ?? ''

  if (!id || !sig || !verifyAdminSig(id, 'reject', sig)) {
    return NextResponse.json({ error: 'Invalid or missing signature' }, { status: 403 })
  }

  // Silently succeeds if already deleted
  await supabaseAdmin.from('reviews').delete().eq('id', id)

  return NextResponse.redirect(new URL('/admin/reviews/done?action=rejected', req.url))
}
```

- [ ] **Step 3: Create the confirmation page**

```tsx
// app/admin/reviews/done/page.tsx
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminReviewDonePage({
  searchParams,
}: {
  searchParams: { action?: string }
}) {
  const action = searchParams.action

  if (action === 'approved') {
    return (
      <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-amber-bourbon mx-auto mb-6" />
          <h1 className="font-display text-white text-3xl tracking-wider mb-4">REVIEW APPROVED</h1>
          <p className="text-steel">The review is now live on the site.</p>
        </div>
      </main>
    )
  }

  if (action === 'rejected') {
    return (
      <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-steel/40 mx-auto mb-6" />
          <h1 className="font-display text-white text-3xl tracking-wider mb-4">REVIEW REJECTED</h1>
          <p className="text-steel">The review has been removed.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-white text-3xl tracking-wider mb-4">DONE</h1>
        <p className="text-steel">Action completed.</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify no TS errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Manual smoke test**

Submit a review via the public endpoint (Task 3 smoke test). Copy the `id` from Supabase. Generate a test sig:

```ts
// In a scratch file or Node REPL:
const crypto = require('crypto')
const id = '<paste-uuid-here>'
const secret = process.env.ADMIN_TOKEN_SECRET // or paste the value
const approveSig = crypto.createHmac('sha256', secret).update(`${id}:approve`).digest('hex')
console.log(approveSig)
```

Visit `http://localhost:3000/api/admin/reviews/approve?id=<id>&sig=<sig>` in browser.

Expected: redirects to `/admin/reviews/done?action=approved` and the row in Supabase has `approved: true`.

Test invalid sig returns 403:
Visit `http://localhost:3000/api/admin/reviews/approve?id=<id>&sig=badsig`
Expected: `{"error":"Invalid or missing signature"}` with status 403.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/reviews/approve/route.ts app/api/admin/reviews/reject/route.ts app/admin/reviews/done/page.tsx
git commit -m "feat: add admin approve/reject routes and confirmation page"
```

---

## Task 5: ReviewsSection Component

**Files:**
- Create: `components/home/ReviewsSection.tsx`

This is a `'use client'` component. It receives the list of approved reviews as a prop (for the grid) and manages the submission form state internally.

- [ ] **Step 1: Create the component**

```tsx
// components/home/ReviewsSection.tsx
'use client'

import { useState } from 'react'
import { Star, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Review } from '@/lib/supabase'

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [claimedPurchaser, setClaimedPurchaser] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!body.trim()) { setError('Please write a short review.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/reviews/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer_name: name.trim(),
        rating,
        body: body.trim(),
        claimed_purchaser: claimedPurchaser,
        email: claimedPurchaser ? email.trim() : undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  return (
    <section id="reviews" className="bg-navy-950 py-20 px-4 border-t border-amber-bourbon/20">
      <div className="max-w-6xl mx-auto">
        <div className="section-label text-center mb-12">Customer Reviews</div>

        {/* Review grid */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {reviews.slice(0, 12).map((review) => (
              <div key={review.id} className="glass-card p-6 border border-amber-bourbon/10">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'w-4 h-4',
                        s <= review.rating
                          ? 'text-amber-bourbon fill-amber-bourbon'
                          : 'text-steel/20'
                      )}
                    />
                  ))}
                </div>
                <p className="text-steel text-sm leading-relaxed mb-4 line-clamp-4">
                  &ldquo;{review.body}&rdquo;
                </p>
                <p className="text-white text-sm font-medium">{review.reviewer_name}</p>
                {review.verified && (
                  <div className="inline-flex items-center gap-1.5 mt-2">
                    <Shield className="w-3 h-3 text-amber-bourbon" />
                    <span className="text-amber-bourbon/70 text-xs font-display tracking-wider uppercase">
                      Verified Purchase
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submission form */}
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-white text-2xl tracking-wider text-center mb-8">
            LEAVE A REVIEW
          </h2>

          {submitted ? (
            <div className="glass-card p-8 text-center border border-amber-bourbon/10">
              <p className="text-amber-bourbon font-display tracking-widest uppercase mb-2">
                Thank You
              </p>
              <p className="text-steel text-sm leading-relaxed">
                Your review has been submitted and will appear after approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 border border-amber-bourbon/10">

              {/* Star rating */}
              <div>
                <label className="block text-xs font-display tracking-widest text-steel uppercase mb-3">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          (hovered || rating) >= star
                            ? 'text-amber-bourbon fill-amber-bourbon'
                            : 'text-steel/30'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-display tracking-widest text-steel uppercase mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John D."
                  maxLength={100}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors"
                />
              </div>

              {/* Review body */}
              <div>
                <label className="block text-xs font-display tracking-widest text-steel uppercase mb-2">
                  Your Review
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell other collectors what you think..."
                  rows={5}
                  maxLength={2000}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors resize-none"
                />
              </div>

              {/* Purchase toggle */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'mt-0.5 w-4 h-4 flex-shrink-0 rounded border transition-colors',
                      claimedPurchaser
                        ? 'bg-amber-bourbon border-amber-bourbon'
                        : 'border-white/20 bg-navy-900'
                    )}
                    onClick={() => setClaimedPurchaser(!claimedPurchaser)}
                  >
                    {claimedPurchaser && (
                      <svg viewBox="0 0 12 12" className="w-full h-full p-0.5 text-navy-950" fill="currentColor">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={claimedPurchaser}
                    onChange={(e) => setClaimedPurchaser(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-steel text-sm leading-relaxed">
                    I&rsquo;ve made a purchase from TommyboyDesigns
                  </span>
                </label>

                {claimedPurchaser && (
                  <div className="mt-4">
                    <label className="block text-xs font-display tracking-widest text-steel uppercase mb-2">
                      Order Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email used for your order"
                      className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors"
                    />
                    <p className="text-steel/50 text-xs mt-2">
                      Used only to verify your purchase. Not shown publicly.
                    </p>
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/home/ReviewsSection.tsx
git commit -m "feat: add ReviewsSection component with review grid and submission form"
```

---

## Task 6: Wire ReviewsSection into Homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update page.tsx**

Add the import and render `ReviewsSection` after `ReviewTicker`. The query fetches 20 reviews (for the ticker); `ReviewsSection` slices to 12 for the grid display:

```tsx
// app/page.tsx
import type { Metadata } from 'next'
import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import CollectionGrid from '@/components/home/CollectionGrid'
import AboutStrip from '@/components/home/AboutStrip'
import ReviewTicker from '@/components/home/ReviewTicker'
import ReviewsSection from '@/components/home/ReviewsSection'
import { getProducts, getCollections } from '@/lib/shopify'
import { supabase, Review } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bourbon Collector Neck Tags | 3D-Printed BTAC & Pappy Van Winkle Tags',
  description: 'Shop precision-crafted 3D-printed bourbon bottle neck tags. BTAC, Pappy Van Winkle, and fully custom designs for serious collectors. Starting at $7.49. Veteran-owned.',
  openGraph: {
    title: 'Bourbon Collector Neck Tags | TommyboyDesigns',
    description: 'Precision-crafted 3D-printed bourbon bottle neck tags for serious collectors. BTAC, Pappy Van Winkle, and custom designs.',
    images: [{ url: '/hero.png', width: 640, height: 420, alt: 'Bourbon bottles with custom TommyboyDesigns neck tags' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bourbon Collector Neck Tags | TommyboyDesigns',
    description: 'Precision-crafted 3D-printed bourbon bottle neck tags. Starting at $7.49.',
    images: ['/hero.png'],
  },
}

async function getReviews(): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export default async function HomePage() {
  const [products, collections, reviews] = await Promise.all([
    getProducts(8),
    getCollections(),
    getReviews(),
  ])

  return (
    <>
      <Hero />
      <FeaturedProducts products={products} />
      <CollectionGrid collections={collections} />
      <AboutStrip />
      <ReviewTicker reviews={reviews} />
      <ReviewsSection reviews={reviews} />
    </>
  )
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke test full flow in dev**

```bash
npm run dev
```

1. Open `http://localhost:3000` — scroll to bottom, verify the reviews section appears with the grid and form
2. Submit a review with `claimed_purchaser: false` — verify success message appears
3. Check Supabase — verify row inserted with `approved: false`
4. Check owner email inbox — verify notification email arrived with Approve/Reject buttons
5. Click Approve — verify redirect to `/admin/reviews/done?action=approved` and row flips to `approved: true` in Supabase
6. Reload homepage — verify approved review appears in the grid

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire ReviewsSection into homepage"
```

---

## Done

All six tasks complete. The public reviews feature is live:

- Anyone can submit a review from the homepage `#reviews` section
- Purchasers can self-identify and get verified against Shopify order history
- All submissions require your approval via email before going live
- Existing token-based review email flow is untouched
