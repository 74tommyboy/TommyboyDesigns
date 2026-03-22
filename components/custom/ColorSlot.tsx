'use client'

import { X } from 'lucide-react'
import { ColorSlot as ColorSlotType } from '@/lib/custom-inquiry-types'

interface ColorSlotProps {
  slot: ColorSlotType
  onUpdate: (patch: Partial<ColorSlotType>) => void
  onRemove: () => void
  removable: boolean
}

function colorNameToHex(name: string): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#123456'
    ctx.fillStyle = name.trim()
    if (ctx.fillStyle === '#123456') return null
    return ctx.fillStyle
  } catch {
    return null
  }
}

export default function ColorSlot({ slot, onUpdate, onRemove, removable }: ColorSlotProps) {
  const handleNameChange = (name: string) => {
    const hex = colorNameToHex(name)
    // Single patch — name and hex arrive together, no stale-closure overwrite
    onUpdate(hex ? { name, hex } : { name })
  }

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-steel/60 text-xs uppercase tracking-wider">Color {slot.slot}</span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-steel/40 hover:text-red-400 transition-colors cursor-pointer"
            aria-label="Remove color"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        type="text"
        value={slot.name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Color name (e.g. Black, Gold, Navy Blue)"
        className="w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50"
      />

      <input
        type="text"
        value={slot.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        placeholder="Usage (e.g. Base, Trim, Text)"
        className="w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50"
      />

      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded overflow-hidden border border-white/10 flex-shrink-0">
          <input
            type="color"
            value={slot.hex}
            onChange={(e) => onUpdate({ hex: e.target.value })}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            aria-label={`Pick color ${slot.slot}`}
          />
          <div className="w-full h-full" style={{ backgroundColor: slot.hex }} />
        </div>
        <span className="text-steel/50 text-xs">Optional: pick an exact shade</span>
      </div>
    </div>
  )
}
