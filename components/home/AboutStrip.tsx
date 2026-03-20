import { Shield, Crosshair, Award } from 'lucide-react'

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

export default function AboutStrip() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Divider */}
      <div className="flex items-center gap-4 mb-16">
        <div className="flex-1 h-px bg-amber-bourbon/20" />
        <div className="font-display text-amber-bourbon tracking-[0.4em] text-xs uppercase">
          About TommyboyDesigns
        </div>
        <div className="flex-1 h-px bg-amber-bourbon/20" />
      </div>

      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <div className="section-label mb-3">Our Story</div>
          <h2 className="section-title text-[clamp(2rem,5vw,3.5rem)] mb-6">
            BUILT WITH <span className="text-amber-bourbon">MISSION</span> PRECISION
          </h2>
          <p className="text-steel-light leading-relaxed mb-6">
            TommyboyDesigns was born from two passions: military discipline and bourbon collecting.
            After years of service across three Infantry Divisions, the same attention to detail
            demanded in the field carries into every product we craft.
          </p>
          <p className="text-steel leading-relaxed">
            Our 3D-printed bourbon bottle neck tags are more than accessories — they're a statement
            about how you display your collection. Whether you're organizing a BTAC lineup,
            showcasing Pappy, or marking a custom acquisition, our tags deliver clarity and character.
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
                <h3 className="font-display text-white tracking-wider text-base mb-1">{pillar.title.toUpperCase()}</h3>
                <p className="text-steel text-sm leading-relaxed">{pillar.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
