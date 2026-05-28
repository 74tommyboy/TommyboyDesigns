import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CartProvider } from '@/components/layout/CartProvider'
import ReviewPopup from '@/components/ui/ReviewPopup'
import ChatWidget from '@/components/ui/ChatWidget'
import AnnouncementPopup from '@/components/layout/AnnouncementPopup'
import { getSiteSettings } from '@/lib/site-settings'

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
    images: ['/hero-og.webp'],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const inVacationWindow =
    !!settings.vacation_from &&
    !!settings.vacation_to &&
    today >= settings.vacation_from &&
    today <= settings.vacation_to
  const isVacationMode = settings.vacation_mode || inVacationWindow

  const announcementActive =
    settings.announcement_enabled &&
    !!settings.announcement_text &&
    (!settings.announcement_expires_at || new Date(settings.announcement_expires_at) > new Date())

  return (
    <html lang="en">
      <body>
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <CartProvider
          vacationMode={isVacationMode}
          vacationMessage={settings.vacation_message}
        >
          <Header />
          <main className="min-h-dvh">{children}</main>
          <Footer />
          <ReviewPopup />
          <ChatWidget />
          {announcementActive && (
            <AnnouncementPopup
              text={settings.announcement_text!}
              ctaLabel={settings.announcement_cta_label}
              ctaUrl={settings.announcement_cta_url}
            />
          )}
        </CartProvider>
      </body>
    </html>
  )
}
