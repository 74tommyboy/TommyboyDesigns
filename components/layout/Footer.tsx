import Link from 'next/link'
import Logo from '@/components/ui/Logo'

const COLLECTIONS = [
  { label: 'Neck Tags', href: '/collections/sip-drip-collection-custom-neck-tags' },
  { label: 'BTAC Collection', href: '/collections/buffalo-trace-antique-collection-btac' },
  { label: 'Pappy Van Winkle', href: '/collections/pappy-van-winkle-family' },
  { label: 'Barware & Accessories', href: '/collections/barware-accessories-1' },
]

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-amber-bourbon/20 mt-24">
      {/* Top strip */}
      <div className="bg-amber-bourbon/10 border-b border-amber-bourbon/20 py-3 overflow-hidden">
        <div className="flex animate-march whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-amber-bourbon/60 font-display tracking-[0.3em] text-xs uppercase mx-8">
              TOMMYBOY DESIGNS &nbsp;·&nbsp; PRECISION CRAFTED &nbsp;·&nbsp; BOURBON COLLECTOR SERIES
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-steel text-sm leading-relaxed max-w-xs">
              Precision-crafted 3D-printed bourbon bottle neck tags for the serious collector.
              Veteran-owned. Mission-driven. Built to impress.
            </p>
            <p className="text-olive-light/60 text-xs mt-4 font-display tracking-widest uppercase">
              Veteran Owned &amp; Operated
            </p>
          </div>

          {/* Collections */}
          <div>
            <h3 className="font-display text-white tracking-widest text-sm uppercase mb-4">Collections</h3>
            <ul className="space-y-2">
              {COLLECTIONS.map((col) => (
                <li key={col.href}>
                  <Link
                    href={col.href}
                    className="text-steel text-sm hover:text-amber-bourbon transition-colors"
                  >
                    {col.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-display text-white tracking-widest text-sm uppercase mb-4">Info</h3>
            <ul className="space-y-2">
              {[
                { label: 'About', href: '/#about' },
                { label: 'Custom Orders', href: '/collections/sip-drip-collection-custom-neck-tags' },
                { label: 'Shop All', href: '/shop' },
                { label: 'Contact', href: '/contact' },
                { label: 'Shipping Policy', href: '/policies/shipping' },
                { label: 'Return Policy', href: '/policies/returns' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-steel text-sm hover:text-amber-bourbon transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="tactical-divider mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-steel/40 text-xs">
            © {new Date().getFullYear()} TommyboyDesigns. All rights reserved.
          </p>
          <p className="text-steel/40 text-xs">
            Powered by Shopify
          </p>
        </div>
      </div>
    </footer>
  )
}
