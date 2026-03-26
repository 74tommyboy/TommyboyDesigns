import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { ShopifyCollection } from '@/lib/shopify'

const LOCAL_BANNERS: Record<string, string> = {
  'barware-accessories-1': '/banner-barware.webp',
  'sip-drip-collection-custom-neck-tags': '/banner-necktags.webp',
}

interface Props {
  collections: ShopifyCollection[]
}

export default function CollectionGrid({ collections }: Props) {
  // Filter out any empty/unnamed collections
  const visible = collections.filter((c) => c.title && c.handle && c.handle !== 'frontpage')

  return (
    <section className="py-24 bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="section-label mb-3">Browse by Series</div>
          <h2 className="section-title text-[clamp(2rem,5vw,3.5rem)]">OUR COLLECTIONS</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visible.map((collection) => {
            const localBanner = LOCAL_BANNERS[collection.handle]
            const previewImage = localBanner ? null : (collection.image ?? collection.products.edges[0]?.node.images.edges[0]?.node)

            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="group relative glass-card overflow-hidden aspect-[3/4] hover:border-amber-bourbon/40 transition-all duration-300"
              >
                {/* Background image */}
                {localBanner ? (
                  <Image
                    src={localBanner}
                    alt={collection.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : previewImage ? (
                  <Image
                    src={previewImage.url}
                    alt={previewImage.altText ?? collection.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-navy-gradient" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <h3 className="font-display text-white text-xl tracking-wider leading-tight mb-1">
                    {collection.title.toUpperCase()}
                  </h3>
                  {collection.description && (
                    <p className="text-steel text-xs line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-amber-bourbon text-xs font-medium group-hover:gap-3 transition-all">
                    Shop Collection <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Top accent */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
