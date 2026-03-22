# Review Display — Design Spec
**Date:** 2026-03-22

## Goal
Surface customer reviews on the homepage and site-wide to build social proof without disrupting the shopping experience.

## Components

### 1. ReviewTicker (homepage)
- Full-width infinite scrolling marquee strip above the footer on `app/page.tsx`
- Each card: star rating, reviewer name, truncated quote
- Pure CSS animation — duplicates review list for seamless loop, no JS interaction needed
- Pauses on hover via CSS `animation-play-state: paused` on `:hover` (no `'use client'` required)
- Reviews passed as a **server-side prop** from `app/page.tsx` (avoids client waterfall, matches existing fetch pattern in that file)
- If zero approved reviews exist, the strip is hidden entirely (no empty state rendered)

### 2. ReviewPopup (site-wide)
- Fixed bottom-right floating card in `app/layout.tsx`
- `'use client'` directive required — uses `useEffect`, `useState`, and `sessionStorage`
- Appears 3 seconds after page load via `useEffect` timer
- Randomly selected review picked client-side from fetched list
- Dismiss (×) button sets local state to hide
- `sessionStorage` read/write must be inside `useEffect` (SSR safety — `sessionStorage` is not available during server render)
- `sessionStorage` key: `tbd_review_popup_shown` — if `'1'`, skip showing
- Fetches reviews client-side from `/api/reviews` (no product_handle) — acceptable since it's in the layout and cannot receive a server prop from individual pages

## API Change — `GET /api/reviews`
Make `product_handle` optional. Logic:

```
if product_handle provided → apply .eq('product_handle', handle) filter (existing behavior, unchanged)
if product_handle omitted  → return all approved reviews, no product filter
```

Remove the current 400 guard (`if (!handle) return 400`) and replace with a conditional filter branch. The `.eq` filter is only applied when `handle` is present. Limit all-reviews query to **20 most recent** (`limit(20)`) to cap payload size.

## Data Flow
```
Supabase reviews table (approved=true)
  → GET /api/reviews (no product_handle, limit 20)
      ├── ReviewTicker: pre-fetched server-side in app/page.tsx, passed as prop
      └── ReviewPopup: client-side fetch in layout (separate request, acceptable trade-off)
```

## Files Affected
- `app/api/reviews/route.ts` — make product_handle optional with conditional filter, add limit(20)
- `components/home/ReviewTicker.tsx` — new Server-compatible component (no 'use client')
- `components/ui/ReviewPopup.tsx` — new Client Component ('use client')
- `app/page.tsx` — fetch reviews server-side, pass to ReviewTicker
- `app/layout.tsx` — add ReviewPopup (self-contained client component)
