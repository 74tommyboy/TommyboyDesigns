import { Metadata } from 'next'
import { Package, Truck, Clock, Scale, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Shipping Policy | TommyboyDesigns',
  description: 'Shipping information for TommyboyDesigns orders — processing times, carriers, and delivery estimates.',
}

const SHIPPING_METHODS = [
  {
    name: 'USPS First Class',
    estimate: '3–7 business days',
    best: 'Small orders (1–4 tags)',
    notes: 'Most economical option for lightweight shipments.',
  },
  {
    name: 'USPS Priority Mail',
    estimate: '1–3 business days',
    best: 'Any order size',
    notes: 'Faster delivery with USPS tracking included.',
  },
  {
    name: 'UPS Ground',
    estimate: '1–5 business days',
    best: 'Larger orders',
    notes: 'Reliable ground shipping for heavier or larger quantities.',
  },
]

export default function ShippingPolicyPage() {
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
            SHIPPING <span className="text-amber-bourbon">POLICY</span>
          </h1>
          <p className="text-steel text-base leading-relaxed max-w-xl mx-auto">
            Most orders are carefully packed and shipped from Ambridge, PA. Select partner products may ship directly from our trusted suppliers. Here's what to expect after you place your order.
          </p>
        </div>

        {/* Processing time */}
        <div className="glass-card p-6 border-amber-bourbon/30 mb-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-bourbon" />
            </div>
            <div>
              <h2 className="font-display text-white tracking-wider text-lg mb-2">PROCESSING &amp; HANDLING</h2>
              <p className="text-steel text-sm leading-relaxed">
                All orders are processed and prepared for shipment within{' '}
                <span className="text-white font-medium">3–5 business days</span> of purchase.
                Custom orders may require additional time depending on design complexity.
              </p>
              <p className="text-steel/60 text-xs mt-3">
                Orders placed on weekends or holidays will begin processing the next business day.
              </p>
            </div>
          </div>
        </div>

        {/* Weight info */}
        <div className="glass-card p-6 border-amber-bourbon/20 mb-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-amber-bourbon" />
            </div>
            <div>
              <h2 className="font-display text-white tracking-wider text-lg mb-2">SHIPPING RATES</h2>
              <p className="text-steel text-sm leading-relaxed">
                Shipping costs are calculated at checkout based on the{' '}
                <span className="text-white font-medium">quantity and total weight</span> of your order.
                Each neck tag weighs approximately <span className="text-white font-medium">1 oz</span>, so
                shipping costs scale proportionally with the number of tags ordered.
              </p>
            </div>
          </div>
        </div>

        {/* Shipping methods */}
        <div className="glass-card p-6 border-amber-bourbon/20 mb-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-bourbon" />
            </div>
            <div className="w-full">
              <h2 className="font-display text-white tracking-wider text-lg mb-4">SHIPPING METHODS</h2>
              <div className="space-y-4">
                {SHIPPING_METHODS.map((method) => (
                  <div key={method.name} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <span className="text-white text-sm font-medium">{method.name}</span>
                      <span className="text-amber-bourbon text-xs font-display tracking-wider whitespace-nowrap">
                        {method.estimate}
                      </span>
                    </div>
                    <p className="text-steel/60 text-xs">{method.notes}</p>
                  </div>
                ))}
              </div>
              <p className="text-steel/50 text-xs mt-4">
                Delivery estimates begin after the processing period. Total delivery time = processing (3–5 days) + shipping time.
              </p>
            </div>
          </div>
        </div>

        {/* Tracking */}
        <div className="glass-card p-6 border-amber-bourbon/20 mb-12">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-bourbon" />
            </div>
            <div>
              <h2 className="font-display text-white tracking-wider text-lg mb-2">ORDER TRACKING</h2>
              <p className="text-steel text-sm leading-relaxed">
                Once your order ships, you will receive a tracking number via email. You can use this number
                to track your package directly on the{' '}
                <a href="https://tools.usps.com/go/TrackConfirmAction_input" target="_blank" rel="noopener noreferrer" className="text-amber-bourbon hover:text-amber-light transition-colors">
                  USPS
                </a>
                {' '}or{' '}
                <a href="https://www.ups.com/track" target="_blank" rel="noopener noreferrer" className="text-amber-bourbon hover:text-amber-light transition-colors">
                  UPS
                </a>
                {' '}website.
              </p>
              <p className="text-steel/60 text-xs mt-3">
                If your tracking number shows no movement after 5 business days, please contact us and we will look into it.
              </p>
            </div>
          </div>
        </div>

        {/* Partner products note */}
        <div className="glass-card p-6 border-amber-bourbon/20 mb-12">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-bourbon" />
            </div>
            <div>
              <h2 className="font-display text-white tracking-wider text-lg mb-2">PARTNER &amp; MARKETPLACE PRODUCTS</h2>
              <p className="text-steel text-sm leading-relaxed">
                Some products in our store are sourced from trusted partner brands through the Shopify Collective network.
                These items ship directly from the supplier and may have different processing times, carriers, or delivery windows
                than TommyboyDesigns-made products. Shipping details for partner products will be displayed on the product page
                and confirmed at checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="tactical-divider mb-12" />

        {/* Bottom note */}
        <div className="text-center">
          <p className="text-steel/60 text-xs leading-relaxed max-w-md mx-auto mb-6">
            Package not received? We make it right — every time.
            Check our{' '}
            <Link href="/policies/returns" className="text-amber-bourbon hover:text-amber-light transition-colors">
              Return &amp; Replacement Policy
            </Link>
            {' '}or{' '}
            <Link href="/contact" className="text-amber-bourbon hover:text-amber-light transition-colors">
              contact us
            </Link>
            {' '}directly.
          </p>
          <Link href="/shop" className="btn-primary">
            Shop All Tags
          </Link>
        </div>

      </div>
    </main>
  )
}
