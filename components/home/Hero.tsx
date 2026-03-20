'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Star } from 'lucide-react'

const STATS = [
  { value: '500+', label: 'Tags Shipped' },
  { value: '4', label: 'Collections' },
  { value: '100%', label: 'Veteran Owned' },
]

export default function Hero() {
  return (
    <section className="relative min-h-dvh flex items-center overflow-hidden bg-navy-gradient">
      {/* Tactical grid */}
      <div className="absolute inset-0 bg-tactical-grid bg-grid-40 opacity-100" />

      {/* Amber glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-amber-glow pointer-events-none" />

      {/* Corner decorations */}
      <div className="absolute top-24 left-8 w-16 h-16 border-l-2 border-t-2 border-amber-bourbon/30" />
      <div className="absolute top-24 right-8 w-16 h-16 border-r-2 border-t-2 border-amber-bourbon/30" />
      <div className="absolute bottom-16 left-8 w-16 h-16 border-l-2 border-b-2 border-amber-bourbon/30" />
      <div className="absolute bottom-16 right-8 w-16 h-16 border-r-2 border-b-2 border-amber-bourbon/30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="animate-fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-amber-bourbon/40 bg-amber-bourbon/10 rounded-full px-4 py-1.5 mb-8">
              <Shield className="w-3.5 h-3.5 text-amber-bourbon" />
              <span className="text-amber-bourbon text-xs font-display tracking-widest uppercase">
                Veteran Owned &amp; Operated
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-white leading-none mb-6">
              <span className="block text-[clamp(3rem,8vw,6rem)] tracking-wider">BOURBON</span>
              <span className="block text-[clamp(3rem,8vw,6rem)] tracking-wider text-amber-bourbon">COLLECTOR</span>
              <span className="block text-[clamp(3rem,8vw,6rem)] tracking-wider">NECK TAGS</span>
            </h1>

            <p className="text-steel-light text-lg leading-relaxed mb-10 max-w-lg">
              Precision-crafted 3D-printed bottle neck tags for the serious bourbon collector.
              BTAC, Pappy Van Winkle, and fully custom designs.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/shop" className="btn-primary">
                Shop All Tags
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections/sip-drip-collection-custom-neck-tags" className="btn-outline">
                Custom Order
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t border-amber-bourbon/20">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-3xl text-amber-bourbon tracking-wider">{stat.value}</div>
                  <div className="text-steel text-xs uppercase tracking-widest mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual panel */}
          <div className="hidden lg:flex items-center justify-center animate-fade-in">
            <div className="relative w-full max-w-md">
              {/* Main card */}
              <div className="glass-card p-8 relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />

                <div className="flex items-center justify-between mb-6">
                  <span className="section-label text-xs">Featured Collection</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-bourbon text-amber-bourbon" />
                    ))}
                  </div>
                </div>

                {/* Decorative product mockup */}
                <div className="relative h-48 flex items-center justify-center">
                  <div className="relative">
                    {/* Bottle shape */}
                    <div className="w-20 h-44 bg-gradient-to-b from-navy-700 to-navy-900 rounded-t-full border border-amber-bourbon/30 mx-auto relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-10 bg-navy-700 border border-amber-bourbon/30 rounded-sm" />
                      {/* Neck tag */}
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-14 h-8 bg-amber-bourbon/90 rounded-sm flex items-center justify-center shadow-amber-glow">
                        <span className="font-display text-navy-900 text-xs tracking-wider">BTAC</span>
                      </div>
                    </div>
                    {/* Glow */}
                    <div className="absolute inset-0 bg-amber-glow pointer-events-none" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <div className="font-display text-white tracking-wider">BTAC Series</div>
                    <div className="text-steel text-sm">Buffalo Trace Antique Collection</div>
                  </div>
                  <Link href="/collections/buffalo-trace-antique-collection-btac" className="btn-primary text-xs px-4 py-2">
                    View
                  </Link>
                </div>
              </div>

              {/* Floating accent cards */}
              <div className="absolute -top-4 -right-4 glass-card px-3 py-2 border-amber-bourbon/40">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-bourbon animate-pulse-amber" />
                  <span className="text-xs text-white font-medium">Custom Orders Open</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 glass-card px-3 py-2 border-amber-bourbon/40">
                <div className="text-xs text-steel">Starting at</div>
                <div className="font-display text-amber-bourbon text-lg tracking-wider">$12.99</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-steel/40 text-xs tracking-widest uppercase font-display">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-amber-bourbon/40 to-transparent" />
      </div>
    </section>
  )
}
