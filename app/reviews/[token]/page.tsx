'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Star, Shield, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/ui/Logo'

export default function ReviewPage({ params }: { params: { token: string } }) {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order') ?? ''
  const email = searchParams.get('email') ?? ''

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
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

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_handle: 'general',
        product_title: 'TommyboyDesigns Product',
        reviewer_name: name,
        rating,
        body,
        token: params.token,
        order_id: orderId,
        email,
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

  if (submitted) {
    return (
      <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-amber-bourbon mx-auto mb-6" />
          <h1 className="font-display text-white text-4xl tracking-wider mb-4">THANK YOU</h1>
          <p className="text-steel leading-relaxed">
            Your review means everything to us. It helps other serious collectors find exactly what they're looking for.
          </p>
          <p className="text-steel/60 text-sm mt-6">— Thomas, TommyboyDesigns</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo linkWrapper={false} />
          </div>
          <div className="inline-flex items-center gap-2 border border-amber-bourbon/40 bg-amber-bourbon/10 rounded-full px-4 py-1.5 mb-4">
            <Shield className="w-3.5 h-3.5 text-amber-bourbon" />
            <span className="text-amber-bourbon text-xs font-display tracking-widest uppercase">
              Verified Purchase
            </span>
          </div>
          <h1 className="font-display text-white text-3xl tracking-wider mb-2">LEAVE A REVIEW</h1>
          <p className="text-steel text-sm leading-relaxed">
            How's your TommyboyDesigns neck tag holding up?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">

          {/* Star Rating */}
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
              className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

        <p className="text-center text-steel/40 text-xs mt-6">
          Questions about your order? Reply to your review request email and we'll make it right.
        </p>

      </div>
    </main>
  )
}
