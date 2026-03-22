'use client'

import { X } from 'lucide-react'
import { ColorSlot as ColorSlotType } from '@/lib/custom-inquiry-types'

interface ColorSlotProps {
  slot: ColorSlotType
  onHexChange: (hex: string) => void
  onNameChange: (name: string) => void
  onLabelChange: (label: string) => void
  onRemove: () => void
  removable: boolean
}

export default function ColorSlot({ slot, onHexChange, onNameChange, onLabelChange, onRemove, removable }: ColorSlotProps) {
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
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Color name (e.g. Black, Gold, Navy Blue)"
        className="w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50"
      />

      <input
        type="text"
        value={slot.label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="Usage (e.g. Base, Trim, Text)"
        className="w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50"
      />

      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 rounded overflow-hidden border border-white/10 flex-shrink-0">
          <input
            type="color"
            value={slot.hex}
            onChange={(e) => onHexChange(e.target.value)}
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
