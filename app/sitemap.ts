import { MetadataRoute } from 'next'
import { getProducts, getCollections } from '@/lib/shopify'

const BASE_URL = 'https://www.tommyboydesigns.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getProducts(100),
    getCollections(),
  ])

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/products/${product.handle}`,
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

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/reviews`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/policies/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/policies/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticPages, ...collectionEntries, ...productEntries]
}
