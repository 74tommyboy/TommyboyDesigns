import { supabase } from '@/lib/supabase'

export type AvailableColor = {
  id: string
  color_name: string
  color_hex: string
  material: string
}

const LOW_STOCK_THRESHOLD_G = 50

export async function getAvailableFilamentColors(): Promise<AvailableColor[]> {
  const { data, error } = await supabase
    .from('filament_colors')
    .select('id, color_name, color_hex, material')
    .eq('archived', false)
    .gt('remaining_weight', LOW_STOCK_THRESHOLD_G)
    .order('color_name')

  if (error) throw error
  return (data ?? []).map((row) => ({ ...row, id: String(row.id) }))
}
