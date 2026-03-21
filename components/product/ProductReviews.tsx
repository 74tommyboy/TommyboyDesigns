'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Review } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating ? 'text-amber-bourbon fill-amber-bourbon' : 'text-steel/20'
          )}
        />
      ))}
    </div>
  )
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="flex gap-8 items-center mb-10 p-6 glass-card">
      <div className="text-center">
        <div className="font-display text-5xl text-amber-bourbon tracking-wider">
          {avg.toFixed(1)}
        </div>
        <StarRating rating={Math.round(avg)} />
        <div className="text-steel text-xs mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="flex-1 space-y-1.5">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-steel text-xs w-4">{star}</span>
            <Star className="w-3 h-3 text-amber-bourbon fill-amber-bourbon" />
            <div className="flex-1 bg-navy-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-bourbon h-full rounded-full transition-all"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-steel/60 text-xs w-4">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductReviews({ productHandle }: { productHandle: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reviews?product_handle=${productHandle}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [productHandle])

  if (loading) {
    return (
      <div className="mt-16">
        <div className="h-6 w-32 bg-navy-800 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="h-4 w-24 bg-navy-800 rounded animate-pulse" />
              <div className="h-3 w-full bg-navy-800 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-navy-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16">
      <div className="tactical-divider mb-10" />
      <h2 className="font-display text-white text-2xl tracking-wider mb-8">
        CUSTOMER REVIEWS
      </h2>

      {reviews.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-steel text-sm">No reviews yet — be the first to share your experience.</p>
        </div>
      ) : (
        <>
          <RatingSummary reviews={reviews} />
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{review.reviewer_name}</span>
                      {review.verified && (
                        <span className="text-amber-bourbon/70 text-xs font-display tracking-wider uppercase">
                          · Verified
                        </span>
                      )}
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-steel/40 text-xs">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-steel text-sm leading-relaxed">{review.body}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
