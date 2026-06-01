'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2, Check, Minus, Plus } from 'lucide-react'
import { ShopifyVariant, isCustomProduct, ShopifyProduct } from '@/lib/shopify'
import { useCart } from '@/components/layout/CartProvider'

interface Props {
  product: ShopifyProduct
  variants: ShopifyVariant[]
  optionName: string
  artworkUrl: string
  customerNote: string
}

export default function BatchAddToCart({ product, variants, optionName, artworkUrl, customerNote }: Props) {
  const { addItems } = useCart()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const isCustom = isCustomProduct(product)

  const setQty = (variantId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[variantId] ?? 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [variantId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [variantId]: next }
    })
  }

  const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0)

  const handleAdd = async () => {
    if (totalSelected === 0) return

    const lines = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, quantity]) => {
        const attributes: Array<{ key: string; value: string }> = []
        if (isCustom && artworkUrl) {
          attributes.push({ key: 'Artwork URL', value: artworkUrl })
        }
        if (customerNote.trim()) {
          attributes.push({ key: 'Customer Note', value: customerNote.trim() })
        }
        return { variantId, quantity, attributes }
      })

    setStatus('loading')
    try {
      await addItems(lines)
      setStatus('success')
      setQuantities({})
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {variants.map(variant => {
          const label = variant.selectedOptions.find(o => o.name === optionName)?.value ?? variant.title
          const qty = quantities[variant.id] ?? 0
          const unavailable = !variant.availableForSale

          return (
            <div
              key={variant.id}
              className={`flex items-center justify-between px-4 py-2.5 rounded border transition-colors ${
                qty > 0
                  ? 'border-amber-bourbon/50 bg-amber-bourbon/5'
                  : 'border-white/10 bg-navy-800/30'
              } ${unavailable ? 'opacity-40' : ''}`}
            >
              <span className={`text-sm font-medium ${qty > 0 ? 'text-amber-bourbon' : 'text-steel-light'}`}>
                {label}
              </span>
              <div className="flex items-center border border-white/10 rounded bg-navy-800/50">
                <button
                  onClick={() => setQty(variant.id, -1)}
                  disabled={qty === 0 || unavailable}
                  className="px-2.5 py-1.5 text-steel hover:text-white disabled:opacity-30 transition-colors"
                  aria-label={`Decrease ${label}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-7 text-center text-white text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty(variant.id, 1)}
                  disabled={unavailable}
                  className="px-2.5 py-1.5 text-steel hover:text-white disabled:opacity-30 transition-colors"
                  aria-label={`Increase ${label}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleAdd}
        disabled={totalSelected === 0 || status === 'loading'}
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-bourbon disabled:hover:shadow-none"
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
        ) : totalSelected > 0 ? (
          <>
            <ShoppingCart className="w-4 h-4" />
            Add {totalSelected} {totalSelected === 1 ? 'Tag' : 'Tags'} to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            Select Batches Above
          </>
        )}
      </button>
    </div>
  )
}
