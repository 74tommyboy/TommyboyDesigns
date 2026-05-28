'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteSettings } from '@/lib/site-settings'

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-bourbon/50 ${
          checked ? 'bg-amber-bourbon' : 'bg-navy-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-white text-sm">{label}</span>
    </label>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-steel text-xs uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-navy-900 border border-white/10 rounded px-4 py-2.5 text-white placeholder-steel/40 focus:outline-none focus:border-amber-bourbon/50 transition-colors text-sm'

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    if (res.ok) {
      setSaved(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Vacation Mode */}
      <section className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-white text-lg tracking-wider">VACATION MODE</h2>
            <p className="text-steel text-xs mt-0.5">Disables checkout and shows a message to visitors</p>
          </div>
          <Toggle
            checked={settings.vacation_mode}
            onChange={(v) => set('vacation_mode', v)}
            label="Enable vacation mode"
          />
        </div>

        {settings.vacation_mode && (
          <Field label="Vacation Message">
            <textarea
              value={settings.vacation_message ?? ''}
              onChange={(e) => set('vacation_message', e.target.value || null)}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="e.g. We're on vacation and will be back July 15th. Check back soon!"
            />
          </Field>
        )}
      </section>

      {/* Announcement Popup */}
      <section className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-white text-lg tracking-wider">ANNOUNCEMENT POPUP</h2>
            <p className="text-steel text-xs mt-0.5">Shows a dismissible popup to first-time visitors</p>
          </div>
          <Toggle
            checked={settings.announcement_enabled}
            onChange={(v) => set('announcement_enabled', v)}
            label="Enable announcement"
          />
        </div>

        {settings.announcement_enabled && (
          <div className="space-y-4">
            <Field label="Announcement Text">
              <textarea
                value={settings.announcement_text ?? ''}
                onChange={(e) => set('announcement_text', e.target.value || null)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="e.g. Free shipping on all orders over $50 through the end of the month!"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CTA Button Label (optional)">
                <input
                  type="text"
                  value={settings.announcement_cta_label ?? ''}
                  onChange={(e) => set('announcement_cta_label', e.target.value || null)}
                  className={inputCls}
                  placeholder="e.g. Shop Now"
                />
              </Field>
              <Field label="CTA URL (optional)">
                <input
                  type="url"
                  value={settings.announcement_cta_url ?? ''}
                  onChange={(e) => set('announcement_cta_url', e.target.value || null)}
                  className={inputCls}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <Field label="Expires At (optional — leave blank to show indefinitely)">
              <input
                type="datetime-local"
                value={
                  settings.announcement_expires_at
                    ? settings.announcement_expires_at.slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  set(
                    'announcement_expires_at',
                    e.target.value ? new Date(e.target.value).toISOString() : null
                  )
                }
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleLogout}
          className="btn-outline text-sm"
        >
          Sign Out
        </button>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-400 text-sm">Saved!</span>}
          {error && <span className="text-red-400 text-sm">{error}</span>}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
