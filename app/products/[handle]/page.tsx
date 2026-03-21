import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { ChevronRight } from 'lucide-react'
import { getProduct, getProducts, formatMoney } from '@/lib/shopify'
import ProductDetail from '@/components/product/ProductDetail'
import ProductReviews from '@/components/product/ProductReviews'

interface Props {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.handle)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      images: [product.images.edges[0]?.node.url].filter(Boolean) as string[],
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: Props) {
  const [product, relatedProducts] = await Promise.all([
    getProduct(params.handle),
    getProducts(5),
  ])

  if (!product) notFound()

  const related = relatedProducts.filter((p) => p.handle !== params.handle).slice(0, 4)
  const collectionHandle = product.collections.edges[0]?.node.handle
  const collectionTitle = product.collections.edges[0]?.node.title
  const productImage = product.images.edges[0]?.node.url
  const minPrice = product.priceRange.minVariantPrice

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: productImage,
    brand: { '@type': 'Brand', name: 'TommyboyDesigns' },
    offers: {
      '@type': 'Offer',
      url: `https://www.tommyboydesigns.com/products/${product.handle}`,
      priceCurrency: minPrice.currencyCode,
      price: minPrice.amount,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'TommyboyDesigns' },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tommyboydesigns.com' },
      ...(collectionHandle ? [{ '@type': 'ListItem', position: 2, name: collectionTitle, item: `https://www.tommyboydesigns.com/collections/${collectionHandle}` }] : [{ '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.tommyboydesigns.com/shop' }]),
      { '@type': 'ListItem', position: 3, name: product.title, item: `https://www.tommyboydesigns.com/products/${product.handle}` },
    ],
  }

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <Script id="product-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-steel/60 mb-10 flex-wrap">
          <Link href="/" className="hover:text-amber-bourbon transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          {collectionHandle ? (
            <>
              <Link href={`/collections/${collectionHandle}`} className="hover:text-amber-bourbon transition-colors">
                {collectionTitle}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <Link href="/shop" className="hover:text-amber-bourbon transition-colors">Shop</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-steel">{product.title}</span>
        </nav>

        {/* Product */}
        <ProductDetail product={product} />

        {/* Reviews */}
        <ProductReviews productHandle={product.handle} />

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-24">
            <div className="tactical-divider mb-12 pt-12">
              <div className="section-label mb-2">You May Also Like</div>
              <h2 className="section-title text-3xl">RELATED TAGS</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => {
                const img = p.images.edges[0]?.node
                const price = p.priceRange.minVariantPrice
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.handle}`}
                    className="group glass-card overflow-hidden hover:border-amber-bourbon/30 transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden bg-navy-700">
                      {img ? (
                        <Image
                          src={img.url}
                          alt={img.altText ?? p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="font-display text-amber-bourbon/20 text-4xl">TBD</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white text-sm font-medium group-hover:text-amber-bourbon transition-colors line-clamp-2 mb-1">
                        {p.title}
                      </h3>
                      <span className="text-amber-bourbon font-semibold text-sm">
                        {formatMoney(price.amount, price.currencyCode)}
                      </span>
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
