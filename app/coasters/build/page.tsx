// app/coasters/build/page.tsx
import { Metadata } from 'next'
import { getAvailableFilamentColors, AvailableColor } from '@/lib/queries/filament'
import CoasterWizard from './CoasterWizard'

export const metadata: Metadata = {
  title: 'Custom Coasters | TommyboyDesigns',
  description: 'Design fully custom 3D-printed coasters — choose your shape, colors, and artwork. Veteran owned & operated.',
}

export const revalidate = 60

export default async function CoasterBuildPage() {
  const availableColors = await getAvailableFilamentColors().catch(() => [] as AvailableColor[])
  return <CoasterWizard availableColors={availableColors} />
}
