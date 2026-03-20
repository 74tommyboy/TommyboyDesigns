'use client'

import { X, ShoppingBag, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatMoney } from '@/lib/shopify'

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, removeItem, loading } = useCart()

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
                        {line.quantity > 1 && (
                          <span className="text-steel text-xs ml-1">× {line.quantity}</span>
                        )}
                      </span>
                      <button
                        onClick={() => removeItem(line.id)}
                        className="p-1 text-steel hover:text-red-400 transition-colors"
                        aria-label="Remove item"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            <p className="text-center text-steel/50 text-xs">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}
