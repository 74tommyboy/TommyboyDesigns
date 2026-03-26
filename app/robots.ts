import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/merchant-feed'],
        disallow: ['/cart', '/checkout', '/api/'],
      },
    ],
    sitemap: 'https://www.tommyboydesigns.com/sitemap.xml',
  }
}
