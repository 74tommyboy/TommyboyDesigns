'use client'

import { X, ShoppingBag, Trash2, Loader2, Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatMoney } from '@/lib/shopify'

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, removeItem, updateItem, loading, vacationMode, vacationMessage } = useCart()

  const lines = cart?.lines.edges.map((e) => e.node) ?? []
  const total = cart?.cost.totalAmount

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-navy-800 border-l border-amber-bourbon/20 z-50 flex flex-col shadow-glass transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-amber-bourbon" />
            <span className="font-display text-white text-xl tracking-wider">YOUR ORDER</span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-steel hover:text-amber-bourbon transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="w-16 h-16 text-steel/30" />
              <p className="text-steel font-display text-xl tracking-wider">YOUR CART IS EMPTY</p>
              <p className="text-steel/60 text-sm">Add something to get started.</p>
              <button onClick={closeCart} className="btn-outline mt-2">
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4 p-4 glass-card">
                  {line.merchandise.image && (
                    <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={line.merchandise.image.url}
                        alt={line.merchandise.image.altText ?? line.merchandise.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${line.merchandise.product.handle}`}
                      className="text-white text-sm font-medium hover:text-amber-bourbon transition-colors line-clamp-2"
                      onClick={closeCart}
                    >
                      {line.merchandise.product.title}
                    </Link>
                    {line.merchandise.title !== 'Default Title' && (
                      <p className="text-steel text-xs mt-0.5">{line.merchandise.title}</p>
                    )}
                    {line.attributes.map((attr) => (
                      <p key={attr.key} className="text-steel/70 text-xs mt-0.5">
                        {attr.key}: {attr.value}
                      </p>
                    ))}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-amber-bourbon text-sm font-semibold">
                        {formatMoney(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-white/10 rounded bg-navy-700/50">
                          <button
                            onClick={() => line.quantity === 1 ? removeItem(line.id) : updateItem(line.id, line.quantity - 1)}
                            disabled={loading}
                            className="px-2 py-1 text-steel hover:text-white disabled:opacity-30 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            {line.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          </button>
                          <span className="w-6 text-center text-white text-xs font-medium">{line.quantity}</span>
                          <button
                            onClick={() => updateItem(line.id, line.quantity + 1)}
                            disabled={loading}
                            className="px-2 py-1 text-steel hover:text-white disabled:opacity-30 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && total && (
          <div className="p-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-steel font-medium">Total</span>
              <span className="font-display text-white text-xl tracking-wider">
                {formatMoney(total.amount, total.currencyCode)}
              </span>
            </div>
            {vacationMode ? (
              <div className="rounded border border-amber-bourbon/30 bg-amber-bourbon/10 p-4 text-center space-y-1">
                <p className="font-display text-amber-bourbon tracking-wider text-sm">ON VACATION</p>
                <p className="text-steel text-xs leading-relaxed">
                  {vacationMessage ?? 'Checkout is temporarily unavailable. Please check back soon!'}
                </p>
              </div>
            ) : (
              <a
                href={cart?.checkoutUrl}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Proceed to Checkout'
                )}
              </a>
            )}
            <p className="text-center text-steel/50 text-xs">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}
