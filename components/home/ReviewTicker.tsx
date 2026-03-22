import { Star } from 'lucide-react'
import { Review } from '@/lib/supabase'

export default function ReviewTicker({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null

  const items = [...reviews, ...reviews]

  return (
    <section className="border-t border-amber-bourbon/20 bg-navy-950 py-8 overflow-hidden">
      <div className="section-label text-center mb-6">What Collectors Are Saying</div>
      <div className="relative">
        <div
          className="flex animate-march gap-6 w-max [animation-duration:40s] hover:[animation-play-state:paused]"
        >
          {items.map((review, i) => (
            <div
              key={i}
              className="flex-shrink-0 glass-card px-6 py-5 w-72 border border-amber-bourbon/10"
            >
              <div className="flex gap-0.5 mb-3">
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
              <p className="text-steel text-sm leading-relaxed line-clamp-2 mb-3">
                &ldquo;{review.body}&rdquo;
              </p>
              <p className="text-white text-xs font-medium">{review.reviewer_name}</p>
              {review.verified && (
                <p className="text-amber-bourbon/60 text-xs font-display tracking-wider uppercase mt-0.5">
                  Verified
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
