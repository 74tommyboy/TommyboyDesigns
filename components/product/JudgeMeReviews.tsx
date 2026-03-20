'use client'

import { useEffect } from 'react'

interface Props {
  productId: string
  productHandle: string
}

const SHOP_DOMAIN = 'keua9p-hd.myshopify.com'

export default function JudgeMeReviews({ productId, productHandle }: Props) {
  useEffect(() => {
    // Remove any previously loaded Judge.me script to avoid duplicates
    const existing = document.getElementById('judgeme-widget-script')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = 'judgeme-widget-script'
    script.src = 'https://cdn.judge.me/assets/widget.js'
    script.async = true
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).JudgemeWidgets) {
        ;(window as any).JudgemeWidgets.init(SHOP_DOMAIN, 'shopify', {
          widgets: ['ReviewWidget'],
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      const s = document.getElementById('judgeme-widget-script')
      if (s) s.remove()
    }
  }, [productHandle])

  // Extract numeric ID from Shopify GID (gid://shopify/Product/123456)
  const numericId = productId.split('/').pop()

  return (
    <div className="mt-16 pt-12 tactical-divider">
      <div className="section-label mb-3">Customer Reviews</div>
      <h2 className="section-title text-3xl mb-8">WHAT COLLECTORS SAY</h2>
      <div
        id="judgeme_product_reviews"
        className="jdgm-widget jdgm-review-widget"
        data-id={numericId}
        data-handle={productHandle}
      />
    </div>
  )
}
