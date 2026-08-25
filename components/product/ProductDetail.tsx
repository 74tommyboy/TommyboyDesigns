'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ShopifyProduct, ShopifyVariant, formatMoney, isCustomProduct } from '@/lib/shopify'
import AddToCart from './AddToCart'
import BatchAddToCart from './BatchAddToCart'
import ArtworkUpload from './ArtworkUpload'

interface Props {
  product: ShopifyProduct
}

export default function ProductDetail({ product }: Props) {
  const images = product.images.edges.map((e) => e.node)
  const variants = product.variants.edges.map((e) => e.node)
  const isCustom = isCustomProduct(product)
  const isBarware = product.collections.edges.some((e) => e.node.handle === 'barware-accessories-1')

  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ShopifyVariant | null>(
    variants.find((v) => v.availableForSale) ?? variants[0] ?? null
  )
  const [artworkUrl, setArtworkUrl] = useState('')
  const [note, setNote] = useState('')

  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice
  const compareAt = selectedVariant?.compareAtPrice
  const hasDiscount = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)

  const prevImage = () => setActiveImage((i) => (i - 1 + images.length) % images.length)
  const nextImage = () => setActiveImage((i) => (i + 1) % images.length)

  // Group options
  const optionMap: Record<string, string[]> = {}
  variants.forEach((v) => {
    v.selectedOptions.forEach((o) => {
      if (!optionMap[o.name]) optionMap[o.name] = []
      if (!optionMap[o.name].includes(o.value)) optionMap[o.name].push(o.value)
    })
  })

  // Use batch grid UI when any single option has 4+ values (e.g. Batch #)
  // That option becomes the grid axis; other options keep standard selectors
  const batchOptionEntry = Object.entries(optionMap)
    .filter(([, values]) => values.length >= 4)
    .sort((a, b) => b[1].length - a[1].length)[0]
  const batchOptionName = batchOptionEntry?.[0] ?? null
  const isBatchMode = batchOptionName !== null

  const handleOptionChange = (optionName: string, value: string) => {
    const currentOptions = selectedVariant?.selectedOptions ?? []
    const newOptions = currentOptions.map((o) =>
      o.name === optionName ? { ...o, value } : o
    )
    const match = variants.find((v) =>
      v.selectedOptions.every((o) =>
        newOptions.find((no) => no.name === o.name && no.value === o.value)
      )
    )
    if (match) {
      setSelectedVariant(match)
      if (match.image) {
        const idx = images.findIndex((img) => img.url === match.image!.url)
        if (idx !== -1) setActiveImage(idx)
      }
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      {/* Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square glass-card overflow-hidden">
          {images.length > 0 ? (
            <>
              <Image
                src={images[activeImage].url}
                alt={images[activeImage].altText ?? product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 glass-card flex items-center justify-center hover:border-amber-bourbon/50 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 glass-card flex items-center justify-center hover:border-amber-bourbon/50 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-display text-amber-bourbon/20 text-8xl">TBD</div>
            </div>
          )}
          {/* Top accent */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                  i === activeImage ? 'border-amber-bourbon' : 'border-transparent opacity-50 hover:opacity-75'
                }`}
              >
                <Image src={img.url} alt={img.altText ?? `View ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-6">
        {/* Collections breadcrumb */}
        {product.collections.edges.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {product.collections.edges.map((e) => (
              <span key={e.node.handle} className="section-label text-xs">
                {e.node.title}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-display text-white text-4xl lg:text-5xl tracking-wider leading-none">
          {product.title.toUpperCase()}
        </h1>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="font-display text-amber-bourbon text-3xl tracking-wider">
            {formatMoney(price.amount, price.currencyCode)}
          </span>
          {hasDiscount && compareAt && (
            <span className="text-steel line-through text-lg">
              {formatMoney(compareAt.amount, compareAt.currencyCode)}
            </span>
          )}
        </div>

        {/* Variant selectors — standard pill buttons (skip the batch axis option) */}
        {Object.entries(optionMap).map(([optionName, values]) =>
          values.length > 1 && optionName !== batchOptionName ? (
            <div key={optionName} className="space-y-2">
              <label className="text-sm font-medium text-steel-light block">
                {optionName}: <span className="text-white">{selectedVariant?.selectedOptions.find((o) => o.name === optionName)?.value}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const isActive = selectedVariant?.selectedOptions.some(
                    (o) => o.name === optionName && o.value === value
                  )
                  const currentOptions = selectedVariant?.selectedOptions ?? []
                  const hypotheticalOptions = currentOptions.map((o) =>
                    o.name === optionName ? { ...o, value } : o
                  )
                  const matchingVariant = variants.find((v) =>
                    v.selectedOptions.every((o) =>
                      hypotheticalOptions.some((ho) => ho.name === o.name && ho.value === o.value)
                    )
                  )
                  const available = matchingVariant?.availableForSale ?? false

                  return (
                    <button
                      key={value}
                      onClick={() => handleOptionChange(optionName, value)}
                      disabled={!available}
                      className={`px-4 py-2 text-sm rounded border transition-all ${
                        isActive
                          ? 'border-amber-bourbon bg-amber-bourbon/10 text-amber-bourbon'
                          : available
                          ? 'border-steel/30 text-steel hover:border-amber-bourbon/50 hover:text-white'
                          : 'border-steel/10 text-steel/30 cursor-not-allowed line-through'
                      }`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null
        )}

        {/* Description */}
        {product.description && (
          <div className="tactical-divider pt-6">
            <p className="text-steel leading-relaxed text-sm">{product.description}</p>
          </div>
        )}

        {/* Customer note — batch-mode products collect a per-tag note in BatchAddToCart instead */}
        {!isBatchMode && (
          <div className="space-y-2">
            <label htmlFor="customer-note" className="block text-sm font-medium text-steel-light">
              Order Note <span className="text-steel/40">(optional)</span>
            </label>
            <textarea
              id="customer-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Color preferences, text to include, special requests…"
              className="w-full bg-navy-700/50 border border-steel/20 rounded-lg px-4 py-3 text-sm text-white placeholder-steel/40 focus:outline-none focus:border-amber-bourbon/60 resize-none transition-colors"
            />
          </div>
        )}

        {/* Artwork upload — not shown for 3rd-party barware products */}
        {!isBarware && (
          <div className="tactical-divider pt-6">
            <ArtworkUpload onUpload={setArtworkUrl} />
          </div>
        )}

        {/* Add to cart */}
        {isBatchMode && batchOptionName ? (
          <BatchAddToCart
            product={product}
            variants={variants}
            optionName={batchOptionName}
            selectedVariant={selectedVariant}
            artworkUrl={artworkUrl}
          />
        ) : (
          <AddToCart
            product={product}
            selectedVariant={selectedVariant}
            artworkUrl={artworkUrl}
            customerNote={note}
          />
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 tactical-divider">
            {product.tags.map((tag) => (
              <span key={tag} className="text-xs text-steel/60 border border-steel/20 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
