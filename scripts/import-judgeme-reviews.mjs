/**
 * One-time import script: Judge.me → Supabase reviews table
 *
 * Usage:
 *   node scripts/import-judgeme-reviews.mjs
 *
 * Reads from .env.local automatically.
 * Safe to re-run — skips reviews already in Supabase (matched by order_id = judgeme review id).
 */

import { readFileSync } from 'fs'
import dns from 'dns'
import { createClient } from '@supabase/supabase-js'

// Force IPv4 — judge.me's IPv6 endpoints reset connections on Windows
dns.setDefaultResultOrder('ipv4first')

// ── Load .env.local ──────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE  = env.SUPABASE_SERVICE_ROLE_KEY
const JUDGEME_TOKEN     = env.JUDGEME_API_TOKEN
const SHOP_DOMAIN       = 'keua9p-hd.myshopify.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE || !JUDGEME_TOKEN) {
  console.error('Missing required env vars. Check .env.local.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

// ── Fetch with retry ─────────────────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      return res
    } catch (err) {
      if (attempt === retries) throw err
      console.log(`  Attempt ${attempt} failed (${err.message}), retrying in ${delayMs}ms...`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

// ── Fetch all reviews from Judge.me (paginated) ──────────────────────────────
async function fetchAllJudgeMeReviews() {
  const reviews = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `https://judge.me/api/v1/reviews?api_token=${JUDGEME_TOKEN}&shop_domain=${SHOP_DOMAIN}&per_page=${perPage}&page=${page}`
    const res = await fetchWithRetry(url)
    const data = await res.json()
    const batch = data.reviews ?? []
    reviews.push(...batch)

    console.log(`  Fetched page ${page}: ${batch.length} reviews (total so far: ${reviews.length})`)

    if (batch.length < perPage) break
    page++
  }

  return reviews
}

// ── Map Judge.me review → Supabase row ───────────────────────────────────────
function mapReview(r) {
  return {
    order_id:       `judgeme_${r.id}`,          // stable unique key for dedup
    product_handle: r.product_handle ?? '',
    product_title:  r.product_title ?? '',
    reviewer_name:  r.reviewer?.name ?? 'Anonymous',
    rating:         r.rating ?? 5,
    body:           (r.body ?? '').trim(),
    verified:       r.verified_buyer ?? false,
    approved:       r.published ?? true,
    created_at:     r.created_at ?? new Date().toISOString(),
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nFetching reviews from Judge.me for ${SHOP_DOMAIN}...`)
  const judgeMeReviews = await fetchAllJudgeMeReviews()
  console.log(`\nTotal fetched: ${judgeMeReviews.length} reviews`)

  if (judgeMeReviews.length === 0) {
    console.log('No reviews found. Exiting.')
    return
  }

  // Filter to only published reviews with a body
  const eligible = judgeMeReviews.filter(r => r.published && r.body?.trim())
  console.log(`Eligible (published + has body): ${eligible.length}`)

  // Fetch existing order_ids from Supabase to skip duplicates
  const { data: existing } = await supabase
    .from('reviews')
    .select('order_id')

  const existingIds = new Set((existing ?? []).map(r => r.order_id))
  const toInsert = eligible
    .map(mapReview)
    .filter(r => !existingIds.has(r.order_id))

  console.log(`Already in Supabase: ${existingIds.size}`)
  console.log(`New reviews to insert: ${toInsert.length}`)

  if (toInsert.length === 0) {
    console.log('Nothing new to import. All done.')
    return
  }

  // Insert in batches of 50
  const batchSize = 50
  let inserted = 0

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { error } = await supabase.from('reviews').insert(batch)

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message)
    } else {
      inserted += batch.length
      console.log(`  Inserted batch ${i / batchSize + 1}: ${batch.length} reviews`)
    }
  }

  console.log(`\n✅ Done. ${inserted} reviews imported into Supabase.`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
