import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'

const BASE_URL = 'https://www.tommyboydesigns.com'
const COUNTRY = 'US'

function numericId(gid: string): string {
  return gid.split('/').pop() ?? ''
}

export const revalidate = 3600

export async function GET() {
  const products = await getProducts(100)

  const rows: string[] = ['id\tlink']

  for (const product of products) {
    const productId = numericId(product.id)
    const link = `${BASE_URL}/products/${product.handle}`

    for (const { node: variant } of product.variants.edges) {
      const variantId = numericId(variant.id)
      rows.push(`shopify_${COUNTRY}_${productId}_${variantId}\t${link}`)
    }
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
