import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getProducts, formatMoney } from '@/lib/shopify'
import { SHAPES, SHAPE_SVG_PATHS, ShapeId } from '@/lib/custom-inquiry-types'

export const metadata: Metadata = {
  title: 'Custom Neck Tags | TommyboyDesigns',
  description: 'Design a fully custom bourbon neck tag — choose your shape, colors, and text. Veteran owned & operated.',
}

export const revalidate = 60

export default async function CustomPage() {
  const allProducts = await getProducts(250)
  const customProducts = allProducts.filter(p => p.tags.includes('custom'))

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="relative glass-card overflow-hidden mb-16 p-8 lg:p-16 text-center">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
          <div className="section-label mb-4">Custom Tags</div>
          <h1 className="section-title text-[clamp(2.5rem,6vw,5rem)] mb-4">DESIGN YOUR TAG</h1>
          <p className="text-steel-light max-w-2xl mx-auto leading-relaxed mb-10">
            Every bottle tells a story. We&apos;ll help you tell yours — fully custom neck tags with your shape, colors, and text, handcrafted by a veteran-owned small business.
          </p>
          <Link href="/custom/build" className="btn-primary text-base px-8 py-3">
            Start Building
          </Link>
        </div>

        {/* Shape preview grid */}
        <div className="mb-16">
          <h2 className="font-display text-white text-2xl tracking-wider text-center mb-2">AVAILABLE SHAPES</h2>
          <p className="text-steel/60 text-sm text-center mb-8">Choose from 6 precision-cut tag shapes.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SHAPES.map(shape => {
              const dims = shape.isCircle ? `${shape.width}mm` : `${shape.width}mm × ${shape.height}mm`
              return (
                <div key={shape.id} className="glass-card p-4 flex flex-col items-center gap-3">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-12 h-12 text-amber-bourbon"
                    fill="currentColor"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: SHAPE_SVG_PATHS[shape.id as ShapeId] }}
                  />
                  <div className="text-center">
                    <p className="text-white text-xs font-medium">{shape.label}</p>
                    <p className="text-steel/50 text-xs">{dims}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Existing custom products */}
        {customProducts.length > 0 && (
          <div>
            <h2 className="font-display text-white text-2xl tracking-wider mb-2">EXISTING CUSTOM DESIGNS</h2>
            <p className="text-steel/60 text-sm mb-8">Browse past custom work for inspiration — or order one as-is.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {customProducts.map(product => {
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
                      {hasDiscount && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-amber-bourbon text-navy-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Sale</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white text-sm font-medium group-hover:text-amber-bourbon transition-colors line-clamp-2 mb-2">
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
          </div>
        )}

      </div>
    </div>
  )
}
