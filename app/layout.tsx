import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CartProvider } from '@/components/layout/CartProvider'
import ReviewPopup from '@/components/ui/ReviewPopup'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tommyboydesigns.com'),
  title: {
    default: 'TommyboyDesigns | Bourbon Bottle Neck Tags',
    template: '%s | TommyboyDesigns',
  },
  description: 'Precision-crafted 3D-printed bourbon bottle neck tags for serious collectors. BTAC, Pappy Van Winkle, and fully custom designs. Veteran-owned & operated.',
  keywords: [
    'bourbon bottle neck tags',
    '3D printed bottle tags',
    'BTAC collection labels',
    'Pappy Van Winkle tags',
    'bourbon collector supplies',
    'whiskey bottle organization',
    'custom bourbon labels',
    'bourbon collection display',
    'veteran owned bourbon',
  ],
  openGraph: {
    siteName: 'TommyboyDesigns',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TommyboyDesigns | Bourbon Bottle Neck Tags',
    description: 'Precision-crafted 3D-printed bourbon bottle neck tags for serious collectors.',
    images: ['/hero.png'],
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TommyboyDesigns',
  url: 'https://www.tommyboydesigns.com',
  logo: 'https://www.tommyboydesigns.com/tbd-logo.png',
  description: 'Precision-crafted 3D-printed bourbon bottle neck tags for collectors. Veteran-owned & operated.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    telephone: '+13125059450',
    email: 'tommyboydesigns.74@gmail.com',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '12 Main St.',
    addressLocality: 'Ambridge',
    addressRegion: 'PA',
    postalCode: '15003',
    addressCountry: 'US',
  },
  founder: {
    '@type': 'Person',
    name: 'Thomas Casillas',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <CartProvider>
          <Header />
          <main className="min-h-dvh">{children}</main>
          <Footer />
          <ReviewPopup />
        </CartProvider>
      </body>
    </html>
  )
}
