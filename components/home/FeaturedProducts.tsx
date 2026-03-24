import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { ShopifyProduct, formatMoney } from '@/lib/shopify'

interface Props {
  products: ShopifyProduct[]
}

export default function FeaturedProducts({ products }: Props) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="section-label mb-2">Best Sellers</div>
          <h2 className="section-title text-[clamp(2rem,5vw,3.5rem)]">FEATURED TAGS</h2>
        </div>
        <Link href="/shop" className="hidden sm:flex items-center gap-2 text-amber-bourbon hover:text-amber-light transition-colors text-sm font-medium">
          Shop All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map((product) => {
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
              {/* Image */}
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

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {hasDiscount && (
                    <span className="bg-amber-bourbon text-navy-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                      Sale
                    </span>
                  )}
                  {product.tags.includes('custom') && (
                    <span className="bg-olive-tactical text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                      Custom
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white text-sm font-medium leading-tight group-hover:text-amber-bourbon transition-colors line-clamp-2 mb-2">
                  {product.title}
                </h3>
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

      {/* Mobile CTA */}
      <div className="sm:hidden text-center mt-8">
        <Link href="/shop" className="btn-outline">
          Shop All Tags <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
