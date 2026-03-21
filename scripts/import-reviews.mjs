/**
 * Import reviews from a Judge.me CSV export into Supabase.
 *
 * Usage:
 *   node scripts/import-reviews.mjs path/to/judgeme-reviews.csv
 *
 * Judge.me CSV columns (typical):
 *   id, title, body, rating, reviewer_name, product_handle, product_title,
 *   created_at, verified, published
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: node scripts/import-reviews.mjs path/to/reviews.csv')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const raw = readFileSync(csvPath, 'utf-8')
const records = parse(raw, { columns: true, skip_empty_lines: true })

console.log(`Importing ${records.length} reviews...`)

const rows = records.map((r) => ({
  product_handle: r.product_handle ?? r.handle ?? 'unknown',
  product_title: r.product_title ?? r.title ?? '',
  reviewer_name: r.reviewer_name ?? r.name ?? 'Anonymous',
  rating: Number(r.rating ?? r.stars ?? 5),
  body: r.body ?? r.review ?? '',
  verified: r.verified === 'true' || r.verified === '1',
  approved: true,
  created_at: r.created_at ?? new Date().toISOString(),
}))

const { error } = await supabase.from('reviews').insert(rows)

if (error) {
  console.error('Import failed:', error.message)
  process.exit(1)
}

console.log(`✓ Successfully imported ${rows.length} reviews`)
