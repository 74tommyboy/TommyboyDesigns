import { getSiteSettings } from '@/lib/site-settings'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen bg-navy-950 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-amber-bourbon text-3xl tracking-widest">SITE SETTINGS</h1>
          <p className="text-steel text-sm mt-1 tracking-wider">TOMMYBOYDESIGNS ADMIN</p>
        </div>
        <SettingsForm initial={settings} />
      </div>
    </div>
  )
}
