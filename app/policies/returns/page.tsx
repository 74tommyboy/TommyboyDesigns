import Link from 'next/link'
import { Shield, RefreshCw, Package, Mail } from 'lucide-react'

export const metadata = {
  title: 'Return & Replacement Policy | TommyboyDesigns',
  description: 'Our hassle-free replacement guarantee. No returns needed — we make it right.',
}

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-navy-950 pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-amber-bourbon/40 bg-amber-bourbon/10 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-3.5 h-3.5 text-amber-bourbon" />
            <span className="text-amber-bourbon text-xs font-display tracking-widest uppercase">
              Veteran Owned &amp; Operated
            </span>
          </div>
          <h1 className="font-display text-white text-[clamp(2.5rem,6vw,4rem)] tracking-wider leading-none mb-4">
            RETURN &amp; REPLACEMENT<br />
            <span className="text-amber-bourbon">POLICY</span>
          </h1>
          <p className="text-steel text-base leading-relaxed max-w-xl mx-auto">
            We stand behind every tag we ship. If something goes wrong, we make it right — no hassle, no questions.
          </p>
        </div>

        {/* Policy cards */}
        <div className="space-y-6 mb-14">

          <div className="glass-card p-6 border-amber-bourbon/20">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-amber-bourbon" />
              </div>
              <div>
                <h2 className="font-display text-white tracking-wider text-lg mb-2">NO RETURNS ACCEPTED</h2>
                <p className="text-steel text-sm leading-relaxed">
                  Due to the custom and precision-crafted nature of our products, we do not accept returns or exchanges.
                  All sales are final. Please review your order carefully before completing checkout.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-amber-bourbon/30">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-bourbon" />
              </div>
              <div>
                <h2 className="font-display text-white tracking-wider text-lg mb-2">FREE REPLACEMENT GUARANTEE</h2>
                <p className="text-steel text-sm leading-relaxed mb-3">
                  We do offer a <span className="text-white font-medium">free replacement</span> in either of the following situations:
                </p>
                <ul className="space-y-2">
                  {[
                    'Your order was never received / lost in transit',
                    'Your tag arrived damaged or defective',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-steel text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-bourbon flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-steel/60 text-xs mt-3 leading-relaxed">
                  Replacements are shipped at no cost to you. We just ask that you reach out within 30 days of your expected delivery date.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-amber-bourbon/20">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-bourbon" />
              </div>
              <div>
                <h2 className="font-display text-white tracking-wider text-lg mb-2">HOW TO REQUEST A REPLACEMENT</h2>
                <p className="text-steel text-sm leading-relaxed mb-3">
                  Simply reach out to us directly and we'll get a replacement out to you as quickly as possible.
                  When contacting us, please have the following ready:
                </p>
                <ul className="space-y-2">
                  {[
                    'Your order number',
                    'A brief description of the issue (damaged, not received, etc.)',
                    'A photo of the damage, if applicable',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-steel text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-bourbon flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="tactical-divider mb-14" />

        {/* Bottom note */}
        <div className="text-center">
          <p className="text-steel/60 text-xs leading-relaxed max-w-md mx-auto mb-6">
            TommyboyDesigns is a veteran-owned small business. We take pride in every tag we make and are committed
            to making sure every collector gets exactly what they ordered.
          </p>
          <Link href="/shop" className="btn-primary">
            Shop All Tags
          </Link>
        </div>

      </div>
    </main>
  )
}
