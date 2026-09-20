import Link from 'next/link'
import Image from 'next/image'
import { formatMoney, productPath, type ShopifyProduct } from '@/lib/shopify'

export default function ProductCard({ product }: { product: ShopifyProduct }) {
  const image = product.images.edges[0]?.node
  const price = product.priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.minVariantPrice
  const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)

  return (
    <Link
      href={productPath(product.handle)}
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
}
