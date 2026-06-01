'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ShopifyCart, createCart, addToCart, addMultipleToCart, removeFromCart, updateCartLine } from '@/lib/shopify'

interface CartContextType {
  cart: ShopifyCart | null
  cartOpen: boolean
  loading: boolean
  vacationMode: boolean
  vacationMessage: string | null
  openCart: () => void
  closeCart: () => void
  addItem: (variantId: string, quantity: number, attributes?: Array<{ key: string; value: string }>) => Promise<void>
  addItems: (items: Array<{ variantId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({
  children,
  vacationMode = false,
  vacationMessage = null,
}: {
  children: ReactNode
  vacationMode?: boolean
  vacationMessage?: string | null
}) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const getOrCreateCart = useCallback(async (): Promise<string> => {
    if (cart) return cart.id
    const newCart = await createCart()
    setCart(newCart)
    return newCart.id
  }, [cart])

  const addItem = useCallback(async (
    variantId: string,
    quantity: number,
    attributes: Array<{ key: string; value: string }> = []
  ) => {
    setLoading(true)
    try {
      const cartId = await getOrCreateCart()
      const updated = await addToCart(cartId, variantId, quantity, attributes)
      setCart(updated)
      setCartOpen(true)
    } finally {
      setLoading(false)
    }
  }, [getOrCreateCart])

  const addItems = useCallback(async (
    items: Array<{ variantId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
  ) => {
    setLoading(true)
    try {
      const cartId = await getOrCreateCart()
      const updated = await addMultipleToCart(cartId, items)
      setCart(updated)
      setCartOpen(true)
    } finally {
      setLoading(false)
    }
  }, [getOrCreateCart])

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return
    setLoading(true)
    try {
      const updated = await removeFromCart(cart.id, lineId)
      setCart(updated)
    } finally {
      setLoading(false)
    }
  }, [cart])

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return
    setLoading(true)
    try {
      const updated = await updateCartLine(cart.id, lineId, quantity)
      setCart(updated)
    } finally {
      setLoading(false)
    }
  }, [cart])

  return (
    <CartContext.Provider value={{
      cart,
      cartOpen,
      loading,
      vacationMode,
      vacationMessage,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addItem,
      addItems,
      removeItem,
      updateItem,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
