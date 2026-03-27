import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getProductReviews(productHandle: string): Promise<Pick<Review, 'reviewer_name' | 'rating' | 'body' | 'created_at'>[]> {
  const { data } = await supabase
    .from('reviews')
    .select('reviewer_name, rating, body, created_at')
    .eq('product_handle', productHandle)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

export async function getProductRating(productHandle: string): Promise<{ average: number; count: number } | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_handle', productHandle)
    .eq('approved', true)

  if (error || !data || data.length === 0) return null

  const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length
  return { average: Math.round(average * 10) / 10, count: data.length }
}

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
