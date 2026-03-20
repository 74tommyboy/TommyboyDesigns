import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { getCollection, formatMoney } from '@/lib/shopify'

interface Props {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCollection(params.handle)
  if (!collection) return { title: 'Collection Not Found' }
  return { title: collection.title, description: collection.description }
}

export const dynamic = 'force-dynamic'

export default async function CollectionPage({ params }: Props) {
  const collection = await getCollection(params.handle)
  if (!collection) notFound()

  const products = collection.products.edges.map((e) => e.node)

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-steel/60 mb-8">
          <Link href="/" className="hover:text-amber-bourbon transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-amber-bourbon transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-steel">{collection.title}</span>
        </nav>

        {/* Hero */}
        <div className="relative glass-card overflow-hidden mb-12 p-8 lg:p-12">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
          {collection.image && (
            <div className="absolute inset-0 opacity-10">
              <Image
                src={collection.image.url}
                alt={collection.image.altText ?? collection.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="relative">
            <div className="section-label mb-3">Collection</div>
            <h1 className="section-title text-[clamp(2.5rem,6vw,5rem)] mb-4">{collection.title.toUpperCase()}</h1>
            {collection.description && (
              <p className="text-steel-light max-w-2xl leading-relaxed">{collection.description}</p>
            )}
            <p className="text-steel/60 text-sm mt-4">{products.length} products</p>
          </div>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-white text-2xl tracking-wider mb-3">NO PRODUCTS YET</p>
            <p className="text-steel mb-6">Check back soon — new tags are always in production.</p>
            <Link href="/shop" className="btn-primary">Shop All Tags</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const image = product.images.edges[0]?.node
              const price = product.priceRange.minVariantPrice
              const compareAt = product.compareAtPriceRange?.minVariantPrice
              const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
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
        )}
      </div>
    </div>
  )
}
