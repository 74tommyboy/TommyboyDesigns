import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'

export const metadata: Metadata = {
  title: 'Shop Bourbon Neck Tags | BTAC, Pappy Van Winkle & Custom Designs',
  description: 'Browse all 3D-printed bourbon bottle neck tags. BTAC collection, Pappy Van Winkle series, custom orders, and barware accessories. Starting at $7.49. Veteran-owned.',
  alternates: {
    canonical: 'https://www.tommyboydesigns.com/shop',
  },
  openGraph: {
    title: 'Shop Bourbon Collector Neck Tags | TommyboyDesigns',
    description: 'All 3D-printed bourbon bottle neck tags — BTAC, Pappy Van Winkle, custom designs and barware.',
    images: [{ url: '/hero-og.webp', width: 1200, height: 630, alt: 'TommyboyDesigns bourbon neck tags collection' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Bourbon Collector Neck Tags | TommyboyDesigns',
    description: 'All 3D-printed bourbon bottle neck tags — BTAC, Pappy Van Winkle, custom designs and barware. Starting at $7.49.',
    images: ['/hero-og.webp'],
  },
}
export const revalidate = 60

export default async function ShopPage() {
  const products = await getProducts(50)

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-steel/60 mb-8">
          <Link href="/" className="hover:text-amber-bourbon transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-steel">Shop All</span>
        </nav>

        <div className="mb-10">
          <div className="section-label mb-2">All Products</div>
          <h1 className="section-title text-5xl">SHOP ALL TAGS</h1>
          <p className="text-steel mt-3">{products.length} products</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
