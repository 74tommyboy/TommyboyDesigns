import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import CollectionGrid from '@/components/home/CollectionGrid'
import AboutStrip from '@/components/home/AboutStrip'
import { getProducts, getCollections } from '@/lib/shopify'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [products, collections] = await Promise.all([
    getProducts(8),
    getCollections(),
  ])

  return (
    <>
      <Hero />
      <FeaturedProducts products={products} />
      <CollectionGrid collections={collections} />
      <AboutStrip />
    </>
  )
}
