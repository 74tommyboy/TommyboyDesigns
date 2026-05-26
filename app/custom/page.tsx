// app/custom/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Custom Build | TommyboyDesigns',
  description: 'Design a fully custom 3D-printed neck tag or coaster. Veteran owned & operated.',
}

export default function CustomPage() {
  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="section-label mb-4">Custom Build</div>
          <h1 className="section-title text-[clamp(2.5rem,6vw,5rem)] mb-4">BUILD SOMETHING CUSTOM</h1>
          <p className="text-steel-light max-w-xl mx-auto leading-relaxed">
            Fully custom 3D-printed products handcrafted by a veteran-owned small business. Choose what you&apos;re building to get started.
          </p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Neck Tag card */}
          <div className="glass-card p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
            <div className="w-20 h-20 rounded-full bg-amber-bourbon/10 border border-amber-bourbon/20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-amber-bourbon" fill="currentColor" aria-hidden="true">
                <path d="M50 8 L88 24 L88 60 Q88 84 50 96 Q12 84 12 60 L12 24 Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-white text-2xl tracking-wider mb-2">NECK TAG</h2>
              <p className="text-steel/60 text-sm leading-relaxed">
                Custom bourbon neck tags — choose your shape, colors, distillery details, and attachment style.
              </p>
            </div>
            <Link href="/custom/build" className="btn-primary w-full text-center">
              Build a Tag
            </Link>
          </div>

          {/* Coaster card */}
          <div className="glass-card p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-bourbon to-transparent" />
            <div className="w-20 h-20 rounded-full bg-amber-bourbon/10 border border-amber-bourbon/20 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-amber-bourbon" fill="currentColor" aria-hidden="true">
                <circle cx="50" cy="50" r="40" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-white text-2xl tracking-wider mb-2">COASTER</h2>
              <p className="text-steel/60 text-sm leading-relaxed">
                Custom 3D-printed coasters — choose your shape, colors, and upload your artwork or logo.
              </p>
            </div>
            <Link href="/coasters/build" className="btn-primary w-full text-center">
              Build a Coaster
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
