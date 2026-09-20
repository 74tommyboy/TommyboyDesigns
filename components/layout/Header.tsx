'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'
import { useCart } from './CartProvider'
import CartDrawer from './CartDrawer'
import Logo from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

type NavLink = { label: string; href?: string; children?: { label: string; href: string }[] }

const NAV_LINKS: NavLink[] = [
  { label: 'Shop', href: '/shop' },
  {
    label: 'Collections',
    children: [
      { label: 'Neck Tags', href: '/collections/sip-drip-collection-custom-neck-tags' },
      { label: 'BTAC', href: '/collections/buffalo-trace-antique-collection-btac' },
      { label: 'Pappy Van Winkle', href: '/collections/pappy-van-winkle-family' },
      { label: 'Barware & Accessories', href: '/collections/barware-accessories-1' },
    ],
  },
  { label: 'Custom', href: '/custom' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const NEW_LINK: NavLink = { label: 'New', href: '/new' }

// newArrivalsKey is empty when nothing is tagged "new"; otherwise it changes with the set of new
// products, so a fresh launch re-shows the bar for visitors who dismissed the previous one.
export default function Header({ newArrivalsKey = '' }: { newArrivalsKey?: string }) {
  const { cart, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [barDismissed, setBarDismissed] = useState(true) // true until localStorage is checked, avoids a flash

  const itemCount = cart?.totalQuantity ?? 0
  const hasNew = newArrivalsKey !== ''
  const barVisible = hasNew && !barDismissed
  const navLinks = hasNew ? [NAV_LINKS[0], NEW_LINK, ...NAV_LINKS.slice(1)] : NAV_LINKS
  const barStorageKey = `new-bar-${newArrivalsKey}`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!hasNew) return
    try {
      setBarDismissed(localStorage.getItem(barStorageKey) === '1')
    } catch {
      setBarDismissed(false)
    }
  }, [hasNew, barStorageKey])

  function dismissBar() {
    setBarDismissed(true)
    try {
      localStorage.setItem(barStorageKey, '1')
    } catch {}
  }

  return (
    <>
      {barVisible && (
        <div className="absolute top-0 inset-x-0 h-8 z-50 bg-amber-bourbon text-navy-900 flex items-center justify-center px-10">
          <Link href="/new" className="text-xs sm:text-sm font-semibold tracking-wide truncate hover:underline">
            New arrivals are here — shop what&apos;s new →
          </Link>
          <button
            onClick={dismissBar}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-navy-900/70 hover:text-navy-900"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <header
        className={cn(
          'fixed inset-x-0 z-50 transition-all duration-300',
          barVisible && !scrolled ? 'top-8' : 'top-0',
          scrolled
            ? 'bg-navy-900/95 backdrop-blur-md border-b border-amber-bourbon/20 shadow-navy-card'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Logo />

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) =>
                link.children ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <button className="flex items-center gap-1 text-steel-light hover:text-amber-bourbon transition-colors text-sm font-medium tracking-wide uppercase">
                      {link.label}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-56">
                        <div className="bg-navy-800 border border-amber-bourbon/20 rounded-lg shadow-glass overflow-hidden">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-3 text-sm text-steel-light hover:text-amber-bourbon hover:bg-amber-bourbon/5 transition-colors border-b border-white/5 last:border-0"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href!}
                    className="text-steel-light hover:text-amber-bourbon transition-colors text-sm font-medium tracking-wide uppercase"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={openCart}
                className="relative p-2 text-steel-light hover:text-amber-bourbon transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-bourbon text-navy-900 text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-steel-light hover:text-amber-bourbon transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-navy-800/98 backdrop-blur-md border-t border-amber-bourbon/20">
            <nav className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-1">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label}>
                    <div className="px-3 py-2 text-xs text-amber-bourbon/70 font-display tracking-widest uppercase">
                      {link.label}
                    </div>
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-6 py-2.5 text-steel-light hover:text-amber-bourbon transition-colors text-sm"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href!}
                    className="block px-3 py-2.5 text-steel-light hover:text-amber-bourbon transition-colors text-sm font-medium tracking-wide uppercase"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  )
}
