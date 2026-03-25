'use client'

import { useState } from 'react'
import { Star, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Review } from '@/lib/supabase'

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [claimedPurchaser, setClaimedPurchaser] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!body.trim()) { setError('Please write a short review.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/reviews/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer_name: name.trim(),
        rating,
        body: body.trim(),
        claimed_purchaser: claimedPurchaser,
        email: claimedPurchaser ? email.trim() : undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  return (
    <section id="reviews" className="bg-navy-950 py-20 px-4 border-t border-amber-bourbon/20">
      <div className="max-w-6xl mx-auto">
        <div className="section-label text-center mb-12">Customer Reviews</div>

        {/* Review grid */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {reviews.slice(0, 12).map((review) => (
              <div key={review.id} className="glass-card p-6 border border-amber-bourbon/10">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'w-4 h-4',
                        s <= review.rating
                          ? 'text-amber-bourbon fill-amber-bourbon'
                          : 'text-steel/20'
                      )}
                    />
                  ))}
                </div>
                <p className="text-steel text-sm leading-relaxed mb-4 line-clamp-4">
                  &ldquo;{review.body}&rdquo;
                </p>
                <p className="text-white text-sm font-medium">{review.reviewer_name}</p>
                {review.verified && (
                  <div className="inline-flex items-center gap-1.5 mt-2">
                    <Shield className="w-3 h-3 text-amber-bourbon" />
                    <span className="text-amber-bourbon/70 text-xs font-display tracking-wider uppercase">
                      Verified Purchase
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submission form */}
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-white text-2xl tracking-wider text-center mb-8">
            LEAVE A REVIEW
          </h2>

          {submitted ? (
            <div className="glass-card p-8 text-center border border-amber-bourbon/10">
              <p className="text-amber-bourbon font-display tracking-widest uppercase mb-2">
                Thank You
              </p>
              <p className="text-steel text-sm leading-relaxed">
                Your review has been submitted and will appear after approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 border border-amber-bourbon/10">

              {/* Star rating */}
              <div>
                <label className="block text-xs font-display tracking-widest text-steel uppercase mb-3">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          (hovered || rating) >= star
                            ? 'text-amber-bourbon fill-amber-bourbon'
                            : 'text-steel/30'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-display tracking-widest text-steel uppercase mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John D."
                  maxLength={100}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors"
                />
              </div>

              {/* Review body */}
              <div>
                <label className="block text-xs font-display tracking-widest text-steel uppercase mb-2">
                  Your Review
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell other collectors what you think..."
                  rows={5}
                  maxLength={2000}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors resize-none"
                />
              </div>

              {/* Purchase toggle */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'mt-0.5 w-4 h-4 flex-shrink-0 rounded border transition-colors',
                      claimedPurchaser
                        ? 'bg-amber-bourbon border-amber-bourbon'
                        : 'border-white/20 bg-navy-900'
                    )}
                    onClick={() => setClaimedPurchaser(!claimedPurchaser)}
                  >
                    {claimedPurchaser && (
                      <svg viewBox="0 0 12 12" className="w-full h-full p-0.5 text-navy-950" fill="currentColor">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={claimedPurchaser}
                    onChange={(e) => setClaimedPurchaser(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-steel text-sm leading-relaxed">
                    I&rsquo;ve made a purchase from TommyboyDesigns
                  </span>
                </label>

                {claimedPurchaser && (
                  <div className="mt-4">
                    <label className="block text-xs font-display tracking-widest text-steel uppercase mb-2">
                      Order Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email used for your order"
                      className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors"
                    />
                    <p className="text-steel/50 text-xs mt-2">
                      Used only to verify your purchase. Not shown publicly.
                    </p>
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
