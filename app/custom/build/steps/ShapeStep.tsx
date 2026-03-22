'use client'

import ShapeCard from '@/components/custom/ShapeCard'
import { SHAPES, ShapeId } from '@/lib/custom-inquiry-types'

interface ShapeStepProps {
  selected: ShapeId | null
  onChange: (id: ShapeId) => void
}

export default function ShapeStep({ selected, onChange }: ShapeStepProps) {
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
    </div>
  )
}
