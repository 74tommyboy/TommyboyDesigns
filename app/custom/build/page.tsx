import { getProducts } from '@/lib/shopify'
import BuildWizard from './BuildWizard'

export const dynamic = 'force-dynamic'

export default async function BuildPage() {
  const products = await getProducts(250)
  // Use product titles as distillery options, sorted alphabetically
  const distilleries = Array.from(new Set(products.map(p => p.title))).sort()
  return <BuildWizard distilleries={distilleries} />
}
