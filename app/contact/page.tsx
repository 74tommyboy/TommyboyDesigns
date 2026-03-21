import { Metadata } from 'next'
import { Mail, Phone, MapPin, Clock, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | TommyboyDesigns',
  description: 'Get in touch with TommyboyDesigns. Questions about your order, custom requests, or anything else — we\'re here to help.',
}

const CONTACT = [
  {
    icon: Mail,
    label: 'Email',
    value: 'tommyboydesigns.74@gmail.com',
    href: 'mailto:tommyboydesigns.74@gmail.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '(312) 505-9450',
    href: 'tel:+13125059450',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Thomas Casillas\n12 Main St.\nAmbridge, PA 15003',
    href: null,
  },
  {
    icon: Clock,
    label: 'Response Time',
    value: 'We typically respond within 24–48 hours.',
    href: null,
  },
]

export default function ContactPage() {
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
            CONTACT <span className="text-amber-bourbon">US</span>
          </h1>
          <p className="text-steel text-base leading-relaxed max-w-xl mx-auto">
            Questions about your order, custom requests, or anything else — we're here to help and will make it right.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {CONTACT.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="glass-card p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-bourbon/10 border border-amber-bourbon/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-bourbon" />
                </div>
                <div>
                  <p className="text-xs font-display tracking-widest text-steel uppercase mb-1">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="text-white text-sm hover:text-amber-bourbon transition-colors whitespace-pre-line"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-white text-sm leading-relaxed whitespace-pre-line">{value}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="tactical-divider mb-12" />

        {/* Replacement note */}
        <div className="glass-card p-6 border-amber-bourbon/30 text-center">
          <p className="text-steel text-sm leading-relaxed">
            Have an issue with your order?{' '}
            <a href="mailto:tommyboydesigns.74@gmail.com" className="text-amber-bourbon hover:text-amber-light transition-colors">
              Email us directly
            </a>{' '}
            with your order number and we'll make it right — every time.
          </p>
        </div>

      </div>
    </main>
  )
}
