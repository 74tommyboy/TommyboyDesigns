'use client'

import { cn } from '@/lib/utils'

const DEFAULT_LABELS = ['Shape', 'Colors', 'Details', 'Uploads', 'Order']

interface StepIndicatorProps {
  currentStep: number  // 1-based
  labels?: string[]
}

export default function StepIndicator({ currentStep, labels = DEFAULT_LABELS }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full mb-10">
      {labels.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < currentStep
        const active = stepNum === currentStep
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done && 'bg-amber-bourbon text-navy-900',
                  active && 'bg-amber-bourbon/20 border border-amber-bourbon text-amber-bourbon',
                  !done && !active && 'bg-navy-800 border border-white/10 text-steel/40'
                )}
              >
                {done ? '✓' : stepNum}
              </div>
              <span className={cn(
                'text-[10px] uppercase tracking-wider hidden sm:block',
                active ? 'text-amber-bourbon' : 'text-steel/40'
              )}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn(
                'h-px flex-1 mx-2 transition-all',
                done ? 'bg-amber-bourbon' : 'bg-white/10'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
