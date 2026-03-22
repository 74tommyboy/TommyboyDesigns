# Review Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a scrolling review ticker on the homepage and a floating one-time review popup site-wide.

**Architecture:** Update the reviews API to support an all-reviews query, pre-fetch reviews server-side on the homepage for the ticker, and fetch client-side in the layout for the popup. Both components reuse existing Tailwind design tokens and animation patterns.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Supabase, TypeScript

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `app/api/reviews/route.ts` | Make `product_handle` optional, add `limit(20)` + sort |
| Modify | `tailwind.config.ts` | Add `slide-up` animation for popup |
| Create | `components/home/ReviewTicker.tsx` | Infinite scrolling marquee strip |
| Modify | `app/page.tsx` | Fetch all reviews server-side, pass to ReviewTicker |
| Create | `components/ui/ReviewPopup.tsx` | Floating one-time review popup |
| Modify | `app/layout.tsx` | Mount ReviewPopup site-wide |

---

### Task 1: Update reviews API to support all-reviews query

**Files:**
- Modify: `app/api/reviews/route.ts`

- [ ] **Step 1: Replace the 400 guard with a conditional filter**

In `app/api/reviews/route.ts`, replace the existing GET handler body with:

```ts
export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get('product_handle')

  const supabase = getSupabase()
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (handle) {
    query = query.eq('product_handle', handle)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data })
}
```

- [ ] **Step 2: Verify existing product page reviews still work**

Navigate to any product page in the browser (e.g. `/products/btac-eagle-rare-neck-tag`). The Customer Reviews section should load as before. No 400 errors in the console.

- [ ] **Step 3: Verify all-reviews query works**

In the browser visit `/api/reviews`. Should return a JSON array of up to 20 approved reviews (not a 400 error).

- [ ] **Step 4: Commit**

```bash
git add app/api/reviews/route.ts
git commit -m "feat: make product_handle optional in reviews API, add limit+sort"
```

---

### Task 2: Add slide-up animation to Tailwind config

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add slideUp keyframe and animation**

In `tailwind.config.ts`, add to the `animation` object:

```ts
'slide-up': 'slideUp 0.4s ease-out forwards',
```

Add to the `keyframes` object:

```ts
slideUp: {
  '0%': { opacity: '0', transform: 'translateY(16px)' },
  '100%': { opacity: '1', transform: 'translateY(0)' },
},
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add slide-up animation for review popup"
```

---

### Task 3: Create ReviewTicker component

**Files:**
- Create: `components/home/ReviewTicker.tsx`

The ticker reuses the existing `animate-march` animation (already defined — Footer uses same pattern). Duplicates the reviews array for a seamless infinite loop. Pauses on CSS `:hover`. No `'use client'` needed.

- [ ] **Step 1: Create the component**

```tsx
import { Star } from 'lucide-react'
import { Review } from '@/lib/supabase'

export default function ReviewTicker({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null

  const items = [...reviews, ...reviews]

  return (
    <section className="border-t border-amber-bourbon/20 bg-navy-950 py-8 overflow-hidden">
      <div className="section-label text-center mb-6">What Collectors Are Saying</div>
      <div className="relative">
        <div
          className="flex animate-march gap-6 w-max [animation-duration:40s] hover:[animation-play-state:paused]"
        >
          {items.map((review, i) => (
            <div
              key={i}
              className="flex-shrink-0 glass-card px-6 py-5 w-72 border border-amber-bourbon/10"
            >
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= review.rating
                        ? 'text-amber-bourbon fill-amber-bourbon'
                        : 'text-steel/20'
                    }`}
                  />
                ))}
              </div>
              <p className="text-steel text-sm leading-relaxed line-clamp-2 mb-3">
                &ldquo;{review.body}&rdquo;
              </p>
              <p className="text-white text-xs font-medium">{review.reviewer_name}</p>
              {review.verified && (
                <p className="text-amber-bourbon/60 text-xs font-display tracking-wider uppercase mt-0.5">
                  Verified
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/ReviewTicker.tsx
git commit -m "feat: add ReviewTicker infinite scrolling marquee component"
```

---

### Task 4: Fetch reviews in homepage and wire up ReviewTicker

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add reviews fetch and ReviewTicker to the homepage**

Replace the contents of `app/page.tsx` with:

```tsx
import type { Metadata } from 'next'
import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import CollectionGrid from '@/components/home/CollectionGrid'
import AboutStrip from '@/components/home/AboutStrip'
import ReviewTicker from '@/components/home/ReviewTicker'
import { getProducts, getCollections } from '@/lib/shopify'
import { Review } from '@/lib/supabase'

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
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/reviews`, { cache: 'no-store' })
    const data = await res.json()
    return data.reviews ?? []
  } catch {
    return []
  }
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
    </>
  )
}
```

- [ ] **Step 2: Add NEXT_PUBLIC_SITE_URL to .env.local if not present**

Check `.env.local`. If `NEXT_PUBLIC_SITE_URL` is missing, add:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production (Vercel), add `NEXT_PUBLIC_SITE_URL=https://www.tommyboydesigns.com` in the Vercel environment variables dashboard.

- [ ] **Step 3: Verify ticker renders on homepage**

Run `npm run dev` and visit `http://localhost:3000`. The ReviewTicker section should appear below AboutStrip with scrolling review cards. If there are no reviews, the section is hidden.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: fetch reviews server-side on homepage, render ReviewTicker"
```

---

### Task 5: Create ReviewPopup component

**Files:**
- Create: `components/ui/ReviewPopup.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import { Review } from '@/lib/supabase'

const SESSION_KEY = 'tbd_review_popup_shown'

export default function ReviewPopup() {
  const [review, setReview] = useState<Review | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // sessionStorage is only available client-side — safe inside useEffect
    if (sessionStorage.getItem(SESSION_KEY)) return

    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        const reviews: Review[] = data.reviews ?? []
        if (reviews.length === 0) return
        const pick = reviews[Math.floor(Math.random() * reviews.length)]
        setReview(pick)
        const timer = setTimeout(() => setVisible(true), 3000)
        return () => clearTimeout(timer)
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  if (!review || !visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 glass-card p-5 shadow-glass border border-amber-bourbon/20 animate-slide-up">
      <button
        onClick={dismiss}
        aria-label="Dismiss review"
        className="absolute top-3 right-3 text-steel/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-amber-bourbon text-xs font-display tracking-widest uppercase mb-3">
        Customer Review
      </p>
      <div className="flex gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= review.rating
                ? 'text-amber-bourbon fill-amber-bourbon'
                : 'text-steel/20'
            }`}
          />
        ))}
      </div>
      <p className="text-steel text-sm leading-relaxed line-clamp-3 mb-3">
        &ldquo;{review.body}&rdquo;
      </p>
      <p className="text-white text-xs font-medium">{review.reviewer_name}</p>
      {review.verified && (
        <p className="text-amber-bourbon/60 text-xs font-display tracking-wider uppercase mt-0.5">
          Verified Purchase
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/ReviewPopup.tsx
git commit -m "feat: add ReviewPopup floating one-time review card"
```

---

### Task 6: Mount ReviewPopup in layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Import and add ReviewPopup inside CartProvider**

Add import at the top of `app/layout.tsx`:

```ts
import ReviewPopup from '@/components/ui/ReviewPopup'
```

Inside the `CartProvider` block, add `<ReviewPopup />` after `<Footer />`:

```tsx
<CartProvider>
  <Header />
  <main className="min-h-dvh">{children}</main>
  <Footer />
  <ReviewPopup />
</CartProvider>
```

- [ ] **Step 2: Verify popup appears after 3 seconds**

Run `npm run dev`, open `http://localhost:3000` in an incognito window (fresh sessionStorage). After 3 seconds a review card should slide up from the bottom-right. Click × to dismiss. Reload — popup should not reappear (sessionStorage guard active).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: mount ReviewPopup site-wide in root layout"
```

---

### Task 7: Final verification and cleanup

- [ ] **Step 1: Test full flow in incognito**

1. Open `http://localhost:3000` in incognito
2. Popup appears after 3s ✓
3. Dismiss with × ✓
4. Reload — popup does not reappear ✓
5. ReviewTicker scrolls below AboutStrip ✓
6. Hover over ticker — scrolling pauses ✓
7. Visit any product page — reviews still load correctly ✓

- [ ] **Step 2: Set NEXT_PUBLIC_SITE_URL in Vercel**

In Vercel dashboard → Project Settings → Environment Variables, add:
```
NEXT_PUBLIC_SITE_URL=https://www.tommyboydesigns.com
```

Redeploy after adding the variable.
