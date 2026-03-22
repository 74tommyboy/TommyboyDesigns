import { getCollection } from '@/lib/shopify'
import BuildWizard from './BuildWizard'

export const dynamic = 'force-dynamic'

const NECK_TAG_COLLECTION = 'sip-drip-collection-custom-neck-tags'

export default async function BuildPage() {
  const collection = await getCollection(NECK_TAG_COLLECTION)
  const distilleries = (collection?.products.edges.map(e => e.node.title) ?? [])
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .sort()
  return <BuildWizard distilleries={distilleries} />
}
