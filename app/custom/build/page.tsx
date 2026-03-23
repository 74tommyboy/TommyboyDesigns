import { getCollection } from '@/lib/shopify'
import { getAvailableFilamentColors, AvailableColor } from '@/lib/queries/filament'
import BuildWizard from './BuildWizard'

export const dynamic = 'force-dynamic'

const NECK_TAG_COLLECTION = 'sip-drip-collection-custom-neck-tags'

export default async function BuildPage() {
  const [collection, availableColors] = await Promise.all([
    getCollection(NECK_TAG_COLLECTION),
    getAvailableFilamentColors().catch(() => [] as AvailableColor[]),
  ])
  const distilleries = (collection?.products.edges.map(e => e.node.title) ?? [])
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .sort()
  return <BuildWizard distilleries={distilleries} availableColors={availableColors} />
}
