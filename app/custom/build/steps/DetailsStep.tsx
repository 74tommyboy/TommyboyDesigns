'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { TagDetails } from '@/lib/custom-inquiry-types'

interface DetailsStepProps {
  details: TagDetails
  onChange: (details: TagDetails) => void
  distilleries: string[]
}

const inputCls = 'w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50'
const labelCls = 'block text-xs uppercase tracking-wider text-steel/60 mb-1.5'

export default function DetailsStep({ details, onChange, distilleries }: DetailsStepProps) {
  const set = (patch: Partial<TagDetails>) => onChange({ ...details, ...patch })

  const [isOther, setIsOther] = useState(
    details.distillery !== '' && !distilleries.includes(details.distillery)
  )

  const addLine = () => {
    if (details.additionalLines.length >= 3) return
    set({ additionalLines: [...details.additionalLines, ''] })
  }

  const updateLine = (i: number, value: string) => {
    set({ additionalLines: details.additionalLines.map((l, idx) => idx === i ? value : l) })
  }

  const removeLine = (i: number) => {
    set({ additionalLines: details.additionalLines.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">TAG DETAILS</h2>
      <p className="text-steel/60 text-sm mb-6">Tell us what text goes on your tag. Only Distillery is required.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Distillery <span className="text-amber-bourbon">*</span></label>
          <select
            value={isOther ? '__other__' : (details.distillery || '')}
            onChange={(e) => {
              if (e.target.value === '__other__') {
                setIsOther(true)
                set({ distillery: '' })
              } else {
                setIsOther(false)
                set({ distillery: e.target.value })
              }
            }}
            className={inputCls}
          >
            <option value="" disabled>Select a distillery / product…</option>
            {distilleries.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            <option value="__other__">Other / Not Listed</option>
          </select>

          {isOther && (
            <input
              type="text"
              value={details.distillery}
              onChange={(e) => set({ distillery: e.target.value })}
              placeholder="Enter distillery or product name"
              className={`${inputCls} mt-2`}
              autoFocus
            />
          )}
        </div>

        <div>
          <label className={labelCls}>Year</label>
          <input type="text" value={details.year} onChange={(e) => set({ year: e.target.value })} placeholder="e.g. 2023" className={inputCls} />
        </div>

        <div>
          <div className="flex items-center gap-4 mb-2">
            {(['batch', 'store_pick'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="batchType" value={type} checked={details.batchType === type} onChange={() => set({ batchType: type })} className="accent-amber-bourbon" />
                <span className="text-sm text-steel-light">{type === 'batch' ? 'Batch' : 'Store Pick'}</span>
              </label>
            ))}
          </div>
          <input type="text" value={details.batchValue} onChange={(e) => set({ batchValue: e.target.value })} placeholder={details.batchType === 'batch' ? 'e.g. Batch 1' : 'e.g. Total Beverage'} className={inputCls} />
        </div>

        {details.additionalLines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>Additional Line {i + 1}</label>
              <input type="text" value={line} onChange={(e) => updateLine(i, e.target.value)} placeholder="Any other text for the tag" className={inputCls} />
            </div>
            <button type="button" onClick={() => removeLine(i)} className="mt-5 text-steel/40 hover:text-red-400 transition-colors self-start cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {details.additionalLines.length < 3 && (
          <button type="button" onClick={addLine} className="flex items-center gap-2 text-sm text-amber-bourbon/70 hover:text-amber-bourbon transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            Add a text line
          </button>
        )}
      </div>
    </div>
  )
}
