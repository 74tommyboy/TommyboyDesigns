import 'server-only'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from './supabase-admin'

export interface SiteSettings {
  vacation_mode: boolean
  vacation_message: string | null
  announcement_enabled: boolean
  announcement_text: string | null
  announcement_cta_label: string | null
  announcement_cta_url: string | null
  announcement_expires_at: string | null
}

const defaultSettings: SiteSettings = {
  vacation_mode: false,
  vacation_message: null,
  announcement_enabled: false,
  announcement_text: null,
  announcement_cta_label: null,
  announcement_cta_url: null,
  announcement_expires_at: null,
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('vacation_mode,vacation_message,announcement_enabled,announcement_text,announcement_cta_label,announcement_cta_url,announcement_expires_at')
      .eq('id', 1)
      .single()

    if (error || !data) return defaultSettings
    return data as SiteSettings
  },
  ['site-settings'],
  { revalidate: 300, tags: ['site-settings'] }
)
