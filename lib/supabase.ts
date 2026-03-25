import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
