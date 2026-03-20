import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CartProvider } from '@/components/layout/CartProvider'

export const metadata: Metadata = {
  title: {
    default: 'TommyboyDesigns | Bourbon Bottle Neck Tags',
    template: '%s | TommyboyDesigns',
  },
  description: 'Precision-crafted 3D-printed bourbon bottle neck tags for collectors. BTAC, Pappy Van Winkle, and custom designs.',
  keywords: ['bourbon', 'bottle neck tags', '3D printed', 'BTAC', 'Pappy Van Winkle', 'custom', 'collector'],
  openGraph: {
    siteName: 'TommyboyDesigns',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main className="min-h-dvh">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
