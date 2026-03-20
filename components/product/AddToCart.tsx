'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2, Check } from 'lucide-react'
import { ShopifyVariant, isCustomProduct, ShopifyProduct } from '@/lib/shopify'
import { useCart } from '@/components/layout/CartProvider'

interface Props {
  product: ShopifyProduct
  selectedVariant: ShopifyVariant | null
  artworkUrl: string
  customerNote: string
}

export default function AddToCart({ product, selectedVariant, artworkUrl, customerNote }: Props) {
  const { addItem } = useCart()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const isCustom = isCustomProduct(product)

  const handleAdd = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return

    const attributes: Array<{ key: string; value: string }> = []
    if (isCustom && artworkUrl) {
      attributes.push({ key: 'Artwork URL', value: artworkUrl })
    }
    if (customerNote.trim()) {
      attributes.push({ key: 'Customer Note', value: customerNote.trim() })
    }

    setStatus('loading')
    try {
      await addItem(selectedVariant.id, 1, attributes)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }

  const unavailable = !selectedVariant || !selectedVariant.availableForSale
  const requiresArtwork = isCustom && !artworkUrl

  return (
    <div className="space-y-3">
      <button
        onClick={handleAdd}
        disabled={unavailable || status === 'loading' || requiresArtwork}
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-bourbon disabled:hover:shadow-none"
        aria-label="Add to cart"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding…
          </>
        ) : status === 'success' ? (
          <>
            <Check className="w-4 h-4" />
            Added to Cart!
          </>
        ) : unavailable ? (
          'Out of Stock'
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </>
        )}
      </button>

      {requiresArtwork && (
        <p className="text-amber-bourbon/70 text-xs text-center">
          Please upload your artwork before adding to cart.
        </p>
      )}
    </div>
  )
}
