import type { Metadata } from 'next'
import { Shield, Crosshair, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About TommyboyDesigns | Veteran-Owned Bourbon Neck Tags',
  description: 'TommyboyDesigns is a veteran-owned small business crafting precision 3D-printed bourbon bottle neck tags. Founded by a U.S. Army veteran — 2nd, 1st, and 3rd Infantry Divisions.',
  alternates: {
    canonical: 'https://www.tommyboydesigns.com/about',
  },
}

const PILLARS = [
  {
    icon: Shield,
    title: 'Veteran Owned',
    body: 'Founded by a U.S. Army veteran — 2nd, 1st, and 3rd Infantry Divisions, Signal Corps. Service and precision run deep.',
  },
  {
    icon: Crosshair,
    title: 'Precision Crafted',
    body: 'Every tag is 3D-printed to exacting standards. Sharp edges, clean lettering, and consistent finish every time.',
  },
  {
    icon: Award,
    title: 'Collector Grade',
    body: 'Designed for the serious bourbon collector. BTAC, Pappy, and fully custom designs to display your collection with pride.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-amber-bourbon/20" />
          <div className="font-display text-amber-bourbon tracking-[0.4em] text-xs uppercase">
            About TommyboyDesigns
          </div>
          <div className="flex-1 h-px bg-amber-bourbon/20" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          {/* Text */}
          <div>
            <div className="section-label mb-3">Our Story</div>
            <h1 className="section-title text-[clamp(2rem,5vw,3.5rem)] mb-6">
              BUILT WITH <span className="text-amber-bourbon">MISSION</span> PRECISION
            </h1>
            <p className="text-steel-light leading-relaxed mb-6">
              TommyboyDesigns was born from two passions: military discipline and bourbon collecting.
              After years of service across three Infantry Divisions, the same attention to detail
              demanded in the field carries into every product we craft.
            </p>
            <p className="text-steel leading-relaxed mb-6">
              Our 3D-printed bourbon bottle neck tags are more than accessories — they're a statement
              about how you display your collection. Whether you're organizing a BTAC lineup,
              showcasing Pappy, or marking a custom acquisition, our tags deliver clarity and character.
            </p>
            <p className="text-steel leading-relaxed">
              Every order is handled personally. We're not a warehouse operation — we're a small,
              veteran-owned business that takes pride in every tag that leaves our shop.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid gap-6">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="flex gap-5 glass-card p-5">
                <div className="flex-shrink-0 w-10 h-10 border border-amber-bourbon/40 rounded flex items-center justify-center">
                  <pillar.icon className="w-5 h-5 text-amber-bourbon" />
                </div>
                <div>
                  <h2 className="font-display text-white tracking-wider text-base mb-1">{pillar.title.toUpperCase()}</h2>
                  <p className="text-steel text-sm leading-relaxed">{pillar.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
