import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { getProducts, formatMoney } from '@/lib/shopify'

export const metadata: Metadata = {
  title: 'Shop Bourbon Neck Tags | BTAC, Pappy Van Winkle & Custom Designs',
  description: 'Browse all 3D-printed bourbon bottle neck tags. BTAC collection, Pappy Van Winkle series, custom orders, and barware accessories. Starting at $7.49. Veteran-owned.',
  openGraph: {
    title: 'Shop Bourbon Collector Neck Tags | TommyboyDesigns',
    description: 'All 3D-printed bourbon bottle neck tags — BTAC, Pappy Van Winkle, custom designs and barware.',
    images: [{ url: '/hero.png', width: 640, height: 420, alt: 'TommyboyDesigns bourbon neck tags collection' }],
  },
}
export const dynamic = 'force-dynamic'

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
          {products.map((product) => {
            const image = product.images.edges[0]?.node
            const price = product.priceRange.minVariantPrice
            const compareAt = product.compareAtPriceRange?.minVariantPrice
            const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)

            const numericId = product.id.split('/').pop()
            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}?id=${numericId}`}
                className="group glass-card overflow-hidden hover:border-amber-bourbon/30 transition-all duration-300 hover:shadow-amber-glow"
              >
                <div className="relative aspect-square overflow-hidden bg-navy-700">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="font-display text-amber-bourbon/30 text-4xl">TBD</div>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {hasDiscount && (
                      <span className="bg-amber-bourbon text-navy-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Sale</span>
                    )}
                    {product.tags.includes('custom') && (
                      <span className="bg-olive-tactical text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Custom</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-white text-sm font-medium group-hover:text-amber-bourbon transition-colors line-clamp-2 mb-2">
                    {product.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-bourbon font-semibold text-sm">
                      {formatMoney(price.amount, price.currencyCode)}
                    </span>
                    {hasDiscount && (
                      <span className="text-steel/50 text-xs line-through">
                        {formatMoney(compareAt.amount, compareAt.currencyCode)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
