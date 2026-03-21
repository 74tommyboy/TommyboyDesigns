'use client'

import { cn } from '@/lib/utils'
import { SHAPES, ShapeId, SHAPE_SVG_PATHS } from '@/lib/custom-inquiry-types'

interface ShapeCardProps {
  shape: typeof SHAPES[number]
  selected: boolean
  onClick: () => void
}

export default function ShapeCard({ shape, selected, onClick }: ShapeCardProps) {
  const dims = shape.isCircle
    ? `${shape.width}mm`
    : `${shape.width}mm × ${shape.height}mm`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'glass-card p-4 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer',
        'hover:border-amber-bourbon/40',
        selected && 'border-amber-bourbon shadow-amber-glow'
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 text-amber-bourbon"
        fill="currentColor"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: SHAPE_SVG_PATHS[shape.id as ShapeId] }}
      />
      <div className="text-center">
        <p className="text-white text-sm font-medium">{shape.label}</p>
        <p className="text-steel/60 text-xs mt-0.5">{dims}</p>
      </div>
    </button>
  )
}
