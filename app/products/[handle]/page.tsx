import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { getProduct, getProducts, formatMoney, productPath, metaDescription } from '@/lib/shopify'
import { getProductRating, getProductReviews } from '@/lib/supabase'
import ProductDetail from '@/components/product/ProductDetail'
import ProductReviews from '@/components/product/ProductReviews'
import JsonLd from '@/components/seo/JsonLd'

interface Props {
  params: { handle: string }
}

// Next passes dynamic params percent-encoded; handles with characters like "™" must be decoded before the Shopify lookup.
function decodeHandle(handle: string): string {
  try {
    return decodeURIComponent(handle)
  } catch {
    return handle
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(decodeHandle(params.handle))
  if (!product) return { title: 'Product Not Found' }

  const url = `https://www.tommyboydesigns.com${productPath(product.handle)}`
  const pageTitle = product.seo.title?.trim() || product.title
  // Long titles would be truncated in results with the " | TommyboyDesigns" suffix appended, so drop it.
  const title = pageTitle.length > 45 ? { absolute: pageTitle } : pageTitle

  // Prefer the description set in Shopify. Otherwise lead with the product title (many products share
  // near-identical descriptions) and trim to a snippet-friendly length.
  const plain = product.description.replace(/\s+/g, ' ').trim()
  // (An SEO description under 50 characters is treated as unset, e.g. a stray "#bourbon" hashtag.)
  const seoDescription = product.seo.description?.trim() ?? ''
  const description = seoDescription.length >= 50
    ? metaDescription(seoDescription)
    : metaDescription(
        !plain ? product.title : plain.toLowerCase().startsWith(product.title.toLowerCase()) ? plain : `${product.title}. ${plain}`
      )

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: pageTitle,
      description,
      url,
      images: [product.images.edges[0]?.node.url].filter(Boolean) as string[],
    },
  }
}

export const revalidate = 60

// Pre-render known products so pages are cached (ISR) instead of rendered per request.
// New products not listed here are still rendered on demand and cached afterwards.
export async function generateStaticParams() {
  const products = await getProducts(100)
  return products.map((p) => ({ handle: p.handle }))
}

export default async function ProductPage({ params }: Props) {
  const handle = decodeHandle(params.handle)
  const [product, relatedProducts, rating, reviews] = await Promise.all([
    getProduct(handle),
    getProducts(5),
    getProductRating(handle),
    getProductReviews(handle),
  ])

  if (!product) notFound()

  const related = relatedProducts.filter((p) => p.handle !== handle).slice(0, 4)
  const collectionHandle = product.collections.edges[0]?.node.handle
  const collectionTitle = product.collections.edges[0]?.node.title
  const productImages = product.images.edges.map((e) => e.node.url)
  const productUrl = `https://www.tommyboydesigns.com${productPath(product.handle)}`
  const minPrice = product.priceRange.minVariantPrice
  const isBarware = product.collections.edges.some((e) => e.node.handle === 'barware-accessories-1')

  // Describe the variant the page shows by default (first in-stock, same as ProductDetail's initial
  // selection) so the structured-data price/availability matches what a crawler sees on the page.
  const variants = product.variants.edges.map((e) => e.node)
  const defaultVariant = variants.find((v) => v.availableForSale) ?? variants[0]
  const offerPrice = defaultVariant?.price ?? minPrice
  const isAvailable = !!defaultVariant?.availableForSale
  const sku = defaultVariant?.sku?.trim() || undefined
  const barcode = defaultVariant?.barcode?.trim() || ''
  const gtin = /^(\d{8}|\d{12,14})$/.test(barcode) ? barcode : undefined

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    ...(productImages.length > 0 && { image: productImages }),
    // Partner products keep their supplier's brand; our own vendor spellings map to the site's brand name.
    brand: { '@type': 'Brand', name: !product.vendor || /tommyboy/i.test(product.vendor) ? 'TommyboyDesigns' : product.vendor },
    ...(sku && { sku }),
    ...(gtin ? { gtin } : sku ? { mpn: sku } : {}),
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.average,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(reviews.length > 0 && {
      review: reviews.map(r => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
        },
        author: { '@type': 'Person', name: r.reviewer_name },
        reviewBody: r.body,
        datePublished: r.created_at.split('T')[0],
      })),
    }),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: offerPrice.currencyCode,
      price: offerPrice.amount,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'TommyboyDesigns' },
      // Shipping rates are calculated at checkout, so no shippingDetails is declared here (Merchant
      // Center shipping settings apply). Returns match /policies/returns: none accepted on our own
      // products. Partner (barware) products follow their supplier's terms, so we make no claim.
      ...(!isBarware && {
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'US',
          returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        },
      }),
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tommyboydesigns.com' },
      ...(collectionHandle ? [{ '@type': 'ListItem', position: 2, name: collectionTitle, item: `https://www.tommyboydesigns.com/collections/${collectionHandle}` }] : [{ '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.tommyboydesigns.com/shop' }]),
      { '@type': 'ListItem', position: 3, name: product.title, item: productUrl },
    ],
  }

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
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
                    href={productPath(p.handle)}
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
