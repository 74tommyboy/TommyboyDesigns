import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/merchant-feed'],
        // '/reviews/' (trailing slash) blocks the per-order review links but not the public /reviews page
        disallow: ['/cart', '/checkout', '/api/', '/admin', '/reviews/', '/custom/build/confirmation'],
      },
    ],
    sitemap: 'https://www.tommyboydesigns.com/sitemap.xml',
  }
}
