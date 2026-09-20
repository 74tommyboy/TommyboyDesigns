import type { Metadata } from 'next'
import ReviewsSection from '@/components/home/ReviewsSection'
import { supabase, Review } from '@/lib/supabase'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description: 'See what collectors are saying about TommyboyDesigns precision-crafted bourbon neck tags. Leave your own review.',
  alternates: { canonical: 'https://www.tommyboydesigns.com/reviews' },
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
  return (
    <>
      {/* ReviewsSection is also used on the homepage and only has an h2, so the page's h1 lives here */}
      <h1 className="sr-only">Customer Reviews</h1>
      <ReviewsSection reviews={reviews} />
    </>
  )
}
