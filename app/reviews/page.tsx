import type { Metadata } from 'next'
import ReviewsSection from '@/components/home/ReviewsSection'
import { supabase, Review } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Customer Reviews | TommyboyDesigns',
  description: 'See what collectors are saying about TommyboyDesigns precision-crafted bourbon neck tags. Leave your own review.',
}

async function getReviews(): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, body, verified, approved, created_at, product_handle, product_title')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export default async function ReviewsPage() {
  const reviews = await getReviews()
  return <ReviewsSection reviews={reviews} />
}
