'use client'

import { cn } from '@/lib/utils'
import { COASTER_SHAPES, COASTER_SHAPE_SVG_PATHS, CoasterShapeId } from '@/lib/coaster-inquiry-types'

interface ShapeStepProps {
  selected: CoasterShapeId | null
  otherDescription: string
  onChange: (id: CoasterShapeId) => void
  onOtherDescription: (desc: string) => void
}

export default function ShapeStep({ selected, otherDescription, onChange, onOtherDescription }: ShapeStepProps) {
  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">CHOOSE YOUR SHAPE</h2>
      <p className="text-steel/60 text-sm mb-6">Select the shape for your custom coaster.</p>
      <div className="grid grid-cols-3 gap-4">
        {COASTER_SHAPES.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={() => onChange(shape.id)}
            className={cn(
              'glass-card p-4 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer',
              'hover:border-amber-bourbon/40',
              selected === shape.id && 'border-amber-bourbon shadow-amber-glow'
            )}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-16 h-16 text-amber-bourbon"
              fill="currentColor"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: COASTER_SHAPE_SVG_PATHS[shape.id] }}
            />
            <p className="text-white text-sm font-medium">{shape.label}</p>
          </button>
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
            placeholder="e.g. Hexagon, octagon, custom outline…"
            rows={3}
            className="w-full bg-navy-900/60 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50 resize-none"
          />
        </div>
      )}
    </div>
  )
}
