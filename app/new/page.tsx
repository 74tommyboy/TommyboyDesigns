import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getProductsByTag, NEW_ARRIVALS_TAG } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'

export const metadata: Metadata = {
  title: 'New Arrivals | Engraved Flasks, Slate Coasters & HH Heritage Tags',
  description: 'The newest additions to TommyboyDesigns: engraved flasks, slate coasters, HH Heritage Collection neck tags and more. Veteran-owned.',
  alternates: {
    canonical: 'https://www.tommyboydesigns.com/new',
  },
  openGraph: {
    title: 'New Arrivals | TommyboyDesigns',
    description: 'The newest additions to TommyboyDesigns: engraved flasks, slate coasters, HH Heritage Collection neck tags and more.',
    images: [{ url: '/hero-og.webp', width: 1200, height: 630, alt: 'New arrivals from TommyboyDesigns' }],
  },
}
export const revalidate = 60

export default async function NewArrivalsPage() {
  const products = await getProductsByTag(NEW_ARRIVALS_TAG)

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-steel/60 mb-8">
          <Link href="/" className="hover:text-amber-bourbon transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-steel">New Arrivals</span>
        </nav>

        <div className="mb-10">
          <div className="section-label mb-2">Just Added</div>
          <h1 className="section-title text-5xl">NEW ARRIVALS</h1>
          {products.length > 0 && (
            <p className="text-steel mt-3">{products.length} new {products.length === 1 ? 'product' : 'products'}</p>
          )}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-10 text-center">
            <p className="text-white mb-2">New products are on the way. Check back soon.</p>
            <Link href="/shop" className="btn-primary inline-block mt-4">Shop All Tags</Link>
          </div>
        )}
      </div>
    </div>
  )
}
