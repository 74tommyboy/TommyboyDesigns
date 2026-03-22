'use client'

import { Plus } from 'lucide-react'
import ColorSlot from '@/components/custom/ColorSlot'
import { ColorSlot as ColorSlotType } from '@/lib/custom-inquiry-types'

interface ColorsStepProps {
  colors: ColorSlotType[]
  onChange: (colors: ColorSlotType[]) => void
}

const DEFAULT_COLORS = ['#D97706', '#0A0F1E', '#FFFFFF', '#4B5563']

export default function ColorsStep({ colors, onChange }: ColorsStepProps) {
  const addColor = () => {
    if (colors.length >= 4) return
    const next: ColorSlotType = {
      slot: colors.length + 1,
      hex: DEFAULT_COLORS[colors.length] ?? '#000000',
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
      <p className="text-steel/60 text-sm mb-6">Add up to 4 colors. Label each one to help us understand your vision.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {colors.map((slot, i) => (
          <ColorSlot
            key={slot.slot}
            slot={slot}
            onHexChange={(hex) => updateColor(i, { hex })}
            onLabelChange={(label) => updateColor(i, { label })}
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
