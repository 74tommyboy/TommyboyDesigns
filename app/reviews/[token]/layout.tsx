import type { Metadata } from 'next'

// Per-order review links carry a signed token, so they must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ReviewTokenLayout({ children }: { children: React.ReactNode }) {
  return children
}
