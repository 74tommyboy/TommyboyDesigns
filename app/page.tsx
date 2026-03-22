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
