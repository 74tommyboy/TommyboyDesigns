'use client'

import { Plus } from 'lucide-react'
import ColorSlot from '@/components/custom/ColorSlot'
import { ColorSlot as ColorSlotType } from '@/lib/custom-inquiry-types'
import { AvailableColor } from '@/lib/queries/filament'

interface ColorsStepProps {
  colors: ColorSlotType[]
  onChange: (colors: ColorSlotType[]) => void
  availableColors: AvailableColor[]
}

const DEFAULT_COLORS = ['#D97706', '#0A0F1E', '#FFFFFF', '#4B5563']

export default function ColorsStep({ colors, onChange, availableColors }: ColorsStepProps) {
  const pickColor = (c: AvailableColor) => {
    if (colors.length >= 4) return
    if (colors.some((s) => s.hex === c.color_hex)) return
    const next: ColorSlotType = {
      slot: colors.length + 1,
      hex: c.color_hex,
      name: c.color_name,
      label: '',
    }
    onChange([...colors, next])
  }

  const addColor = () => {
    if (colors.length >= 4) return
    const next: ColorSlotType = {
      slot: colors.length + 1,
      hex: DEFAULT_COLORS[colors.length] ?? '#000000',
      name: '',
      label: '',
    }
    onChange([...colors, next])
  }

  const updateColor = (index: number, patch: Partial<ColorSlotType>) => {
    onChange(colors.map((c, i) => i === index ? { ...c, ...patch } : c))
  }

  const removeColor = (index: number) => {
    const updated = colors
      .filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, slot: i + 1 }))
    onChange(updated)
  }

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">CHOOSE YOUR COLORS</h2>
      <p className="text-steel/60 text-sm mb-6">Add up to 4 colors. Name each color and describe where it should be used (e.g. Base, Trim, Text).</p>

      {availableColors.length > 0 && (
        <div className="mb-6">
          <p className="text-steel/60 text-xs uppercase tracking-wider mb-3">Available filament colors</p>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => {
              const alreadyPicked = colors.some((s) => s.hex === c.color_hex)
              return (
                <button
                  key={c.id}
                  type="button"
                  title={`${c.color_name} (${c.material})`}
                  onClick={() => pickColor(c)}
                  disabled={colors.length >= 4 && !alreadyPicked}
                  className={`w-7 h-7 rounded-full border-2 transition-opacity ${
                    alreadyPicked ? 'border-amber-bourbon cursor-default' : 'border-white/20 hover:border-white/60'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: c.color_hex }}
                  aria-label={`Add ${c.color_name}`}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {colors.map((slot, i) => (
          <ColorSlot
            key={slot.slot}
            slot={slot}
            onUpdate={(patch) => updateColor(i, patch)}
            onRemove={() => removeColor(i)}
            removable={colors.length > 1}
          />
        ))}
      </div>

      {colors.length < 4 && (
        <button
          type="button"
          onClick={addColor}
          className="flex items-center gap-2 text-sm text-amber-bourbon/70 hover:text-amber-bourbon transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add another color
        </button>
      )}
    </div>
  )
}
