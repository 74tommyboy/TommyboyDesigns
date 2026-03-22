'use client'

import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import { Review } from '@/lib/supabase'

const SESSION_KEY = 'tbd_review_popup_shown'

export default function ReviewPopup() {
  const [review, setReview] = useState<Review | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // sessionStorage is only available client-side — safe inside useEffect
    if (sessionStorage.getItem(SESSION_KEY)) return

    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        const reviews: Review[] = data.reviews ?? []
        if (reviews.length === 0) return
        const pick = reviews[Math.floor(Math.random() * reviews.length)]
        setReview(pick)
        const timer = setTimeout(() => setVisible(true), 3000)
        return () => clearTimeout(timer)
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  if (!review || !visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 glass-card p-5 shadow-glass border border-amber-bourbon/20 animate-slide-up">
      <button
        onClick={dismiss}
        aria-label="Dismiss review"
        className="absolute top-3 right-3 text-steel/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-amber-bourbon text-xs font-display tracking-widest uppercase mb-3">
        Customer Review
      </p>
      <div className="flex gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= review.rating
                ? 'text-amber-bourbon fill-amber-bourbon'
                : 'text-steel/20'
            }`}
          />
        ))}
      </div>
      <p className="text-steel text-sm leading-relaxed line-clamp-3 mb-3">
        &ldquo;{review.body}&rdquo;
      </p>
      <p className="text-white text-xs font-medium">{review.reviewer_name}</p>
      {review.verified && (
        <p className="text-amber-bourbon/60 text-xs font-display tracking-wider uppercase mt-0.5">
          Verified Purchase
        </p>
      )}
    </div>
  )
}
