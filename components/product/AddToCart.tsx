'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2, Check, Minus, Plus } from 'lucide-react'
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
  const [quantity, setQuantity] = useState(1)
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
      await addItem(selectedVariant.id, quantity, attributes)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }

  const unavailable = !selectedVariant || !selectedVariant.availableForSale
  const requiresArtwork = false

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-white/10 rounded bg-navy-800/50">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            disabled={quantity <= 1 || unavailable}
            className="px-3 py-2 text-steel hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-white text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(q => q + 1)}
            disabled={unavailable}
            className="px-3 py-2 text-steel hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={handleAdd}
          disabled={unavailable || status === 'loading' || requiresArtwork}
          className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-bourbon disabled:hover:shadow-none"
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
      </div>

      {requiresArtwork && (
        <p className="text-amber-bourbon/70 text-xs text-center">
          Please upload your artwork before adding to cart.
        </p>
      )}
    </div>
  )
}
