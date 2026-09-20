import { MetadataRoute } from 'next'
import { getProducts, getCollections, productPath } from '@/lib/shopify'

const BASE_URL = 'https://www.tommyboydesigns.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getProducts(100),
    getCollections(),
  ])

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}${productPath(product.handle)}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const collectionEntries: MetadataRoute.Sitemap = collections
    .filter((c) => c.handle !== 'frontpage')
    .map((collection) => ({
      url: `${BASE_URL}/collections/${collection.handle}`,
      lastModified: new Date(collection.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  // Use real dates: the catalog's most recent change for catalog-driven pages, and none for pages
  // with no known change date (an always-"now" lastmod teaches Google to ignore the field).
  const latestProductUpdate = products.reduce<Date | undefined>((latest, p) => {
    const d = new Date(p.updatedAt)
    return !latest || d > latest ? d : latest
  }, undefined)

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: latestProductUpdate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: latestProductUpdate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/new`, lastModified: latestProductUpdate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date('2026-03-26'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/custom`, lastModified: new Date('2026-03-26'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/custom/build`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/coasters/build`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/reviews`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date('2025-01-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/policies/shipping`, lastModified: new Date('2025-01-01'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/policies/returns`, lastModified: new Date('2025-01-01'), changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticPages, ...collectionEntries, ...productEntries]
}
