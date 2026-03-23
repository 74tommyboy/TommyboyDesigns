'use client'

import ShapeCard from '@/components/custom/ShapeCard'
import { SHAPES, ShapeId } from '@/lib/custom-inquiry-types'

interface ShapeStepProps {
  selected: ShapeId | null
  otherDescription: string
  onChange: (id: ShapeId) => void
  onOtherDescription: (desc: string) => void
}

export default function ShapeStep({ selected, otherDescription, onChange, onOtherDescription }: ShapeStepProps) {
  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">CHOOSE YOUR SHAPE</h2>
      <p className="text-steel/60 text-sm mb-6">Select the shape for your custom neck tag.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {SHAPES.map((shape) => (
          <ShapeCard
            key={shape.id}
            shape={shape}
            selected={selected === shape.id}
            onClick={() => onChange(shape.id)}
          />
        ))}
      </div>

      {selected === 'other' && (
        <div className="mt-6">
          <label className="block text-white text-sm font-medium mb-2">
            Describe your desired shape <span className="text-amber-bourbon">*</span>
          </label>
          <textarea
            value={otherDescription}
            onChange={e => onOtherDescription(e.target.value)}
            placeholder="e.g. Hexagon, star, bottle silhouette, custom outline…"
            rows={3}
            className="w-full bg-navy-900/60 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 resize-none"
          />
        </div>
      )}
    </div>
  )
}
