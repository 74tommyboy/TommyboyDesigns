'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2, Check, Minus, Plus, StickyNote } from 'lucide-react'
import { ShopifyVariant, isCustomProduct, ShopifyProduct } from '@/lib/shopify'
import { useCart } from '@/components/layout/CartProvider'

interface Props {
  product: ShopifyProduct
  variants: ShopifyVariant[]
  optionName: string
  selectedVariant: ShopifyVariant | null
  artworkUrl: string
}

export default function BatchAddToCart({ product, variants, optionName, selectedVariant, artworkUrl }: Props) {
  const { addItems } = useCart()
  // Quantities and notes keyed by batch value string (e.g. "Batch 01") so they survive material changes
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null)
  // One-time nudge (pulse + tooltip) pointing at the note button the first time a row is selected
  const [nudgedRows, setNudgedRows] = useState<Set<string>>(new Set())
  const [activeNudge, setActiveNudge] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const isCustom = isCustomProduct(product)

  // Get unique batch values in their original order
  const batchValues = variants
    .map(v => v.selectedOptions.find(o => o.name === optionName)?.value)
    .filter((v, i, arr): v is string => v !== undefined && arr.indexOf(v) === i)

  // Find the variant that matches a given batch value + all other currently-selected options
  const getVariantForBatch = (batchValue: string): ShopifyVariant | undefined => {
    return variants.find(v =>
      v.selectedOptions.every(o => {
        if (o.name === optionName) return o.value === batchValue
        const currentValue = selectedVariant?.selectedOptions.find(so => so.name === o.name)?.value
        return o.value === currentValue
      })
    )
  }

  const setQty = (batchValue: string, delta: number) => {
    const current = quantities[batchValue] ?? 0
    const next = Math.max(0, current + delta)

    setQuantities(prev => {
      if (next === 0) {
        const { [batchValue]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [batchValue]: next }
    })

    if (next === 0) {
      setNotes(n => {
        const { [batchValue]: __, ...restNotes } = n
        return restNotes
      })
      setOpenNoteFor(open => (open === batchValue ? null : open))
      return
    }

    if (current === 0 && !nudgedRows.has(batchValue)) {
      setNudgedRows(prev => new Set(prev).add(batchValue))
      setActiveNudge(batchValue)
      window.setTimeout(() => {
        setActiveNudge(v => (v === batchValue ? null : v))
      }, 2400)
    }
  }

  const setNoteFor = (batchValue: string, value: string) => {
    setNotes(prev => ({ ...prev, [batchValue]: value }))
  }

  const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0)

  const handleAdd = async () => {
    if (totalSelected === 0) return

    const lines = batchValues
      .filter(batchValue => (quantities[batchValue] ?? 0) > 0)
      .flatMap(batchValue => {
        const quantity = quantities[batchValue]
        const variant = getVariantForBatch(batchValue)
        if (!variant) return []
        const attributes: Array<{ key: string; value: string }> = []
        if (isCustom && artworkUrl) {
          attributes.push({ key: 'Artwork URL', value: artworkUrl })
        }
        const batchNote = notes[batchValue]?.trim()
        if (batchNote) {
          attributes.push({ key: 'Customer Note', value: batchNote })
        }
        return [{ variantId: variant.id, quantity, attributes }]
      })

    if (lines.length === 0) return

    setStatus('loading')
    try {
      await addItems(lines)
      setStatus('success')
      setQuantities({})
      setNotes({})
      setOpenNoteFor(null)
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-steel-light">{optionName}</p>
      <div className="space-y-1">
        {batchValues.map(batchValue => {
          const variant = getVariantForBatch(batchValue)
          const qty = quantities[batchValue] ?? 0
          const unavailable = !variant?.availableForSale
          const noteOpen = openNoteFor === batchValue
          const hasNote = (notes[batchValue] ?? '').trim().length > 0

          return (
            <div key={batchValue}>
              <div
                className={`flex items-center justify-between px-4 py-2.5 rounded border transition-colors ${
                  qty > 0
                    ? 'border-amber-bourbon/50 bg-amber-bourbon/5'
                    : 'border-white/10 bg-navy-800/30'
                } ${unavailable ? 'opacity-40' : ''} ${noteOpen ? 'rounded-b-none' : ''}`}
              >
                <span className={`text-sm font-medium ${qty > 0 ? 'text-amber-bourbon' : 'text-steel-light'}`}>
                  {batchValue}
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setOpenNoteFor(open => (open === batchValue ? null : batchValue))
                        setActiveNudge(v => (v === batchValue ? null : v))
                      }}
                      disabled={qty === 0}
                      className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        hasNote ? 'text-amber-bourbon' : 'text-steel hover:text-white'
                      } ${openNoteFor !== batchValue && activeNudge === batchValue ? 'animate-nudge-pulse text-amber-bourbon' : ''}`}
                      aria-label={`Add note for ${batchValue}`}
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>
                    {openNoteFor !== batchValue && activeNudge === batchValue && (
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-amber-bourbon bg-navy-900 border border-amber-bourbon/40 rounded px-2 py-1 animate-tooltip-flash z-10">
                        Add a note
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border border-white/10 rounded bg-navy-800/50">
                    <button
                      onClick={() => setQty(batchValue, -1)}
                      disabled={qty === 0 || unavailable}
                      className="px-2.5 py-1.5 text-steel hover:text-white disabled:opacity-30 transition-colors"
                      aria-label={`Decrease ${batchValue}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-white text-sm font-medium">{qty}</span>
                    <button
                      onClick={() => setQty(batchValue, 1)}
                      disabled={unavailable}
                      className="px-2.5 py-1.5 text-steel hover:text-white disabled:opacity-30 transition-colors"
                      aria-label={`Increase ${batchValue}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              {noteOpen && (
                <textarea
                  value={notes[batchValue] ?? ''}
                  onChange={(e) => setNoteFor(batchValue, e.target.value)}
                  rows={2}
                  placeholder={`Note for ${batchValue}… (engraving, color, special request)`}
                  className="w-full bg-navy-700/50 border border-t-0 border-amber-bourbon/50 rounded-b-lg px-4 py-2 text-sm text-white placeholder-steel/40 focus:outline-none resize-none transition-colors"
                  autoFocus
                />
              )}
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
