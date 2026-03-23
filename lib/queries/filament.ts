import { supabase } from '@/lib/supabase'

export type AvailableColor = {
  id: string
  color_name: string
  color_hex: string
  material: string
}

export async function getAvailableFilamentColors(): Promise<AvailableColor[]> {
  // Fetch threshold from shared settings table
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'low_stock_threshold_g')
    .single()

  const threshold = setting ? (Number(setting.value) || 50) : 50

  const { data, error } = await supabase
    .from('filament_spools')
    .select('id, color_name, color_hex, material')
    .gt('weight_remaining_g', threshold)
    .neq('status', 'retired')
    .order('color_name')

  if (error) throw error
  return data ?? []
}
