'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, isValid } from 'date-fns'
import { Calendar, X } from 'lucide-react'

interface Props {
  value: string | null // YYYY-MM-DD
  onChange: (v: string | null) => void
  placeholder?: string
  fromDate?: Date
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select a date',
  fromDate,
}: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const parsed = value ? parseISO(value) : undefined
  const selected = parsed && isValid(parsed) ? parsed : undefined

  // Reposition popover on open
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 6, left: rect.left })
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        !buttonRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleSelect(day: Date | undefined) {
    onChange(day ? format(day, 'yyyy-MM-dd') : null)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 bg-navy-900 border border-white/10 rounded px-4 py-2.5 text-sm text-left focus:outline-none focus:border-amber-bourbon/50 hover:border-white/20 transition-colors"
      >
        <Calendar className="w-4 h-4 text-steel flex-shrink-0" />
        <span className={`flex-1 ${selected ? 'text-white' : 'text-steel/40'}`}>
          {selected ? format(selected, 'MMMM d, yyyy') : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={handleClear}
            aria-label="Clear date"
            className="text-steel hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999 }}
            className="bg-navy-800 border border-white/10 rounded-lg shadow-2xl p-3"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              fromDate={fromDate}
              showOutsideDays
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-3',
                caption: 'flex justify-center relative items-center pb-1',
                caption_label: 'font-display text-white text-sm tracking-wider',
                nav: 'flex items-center',
                nav_button:
                  'absolute p-1.5 rounded text-steel hover:text-white hover:bg-navy-700 transition-colors',
                nav_button_previous: 'left-0',
                nav_button_next: 'right-0',
                table: 'w-full border-collapse',
                head_row: 'flex mb-1',
                head_cell: 'text-steel/60 text-xs font-normal w-9 text-center',
                row: 'flex w-full mt-1',
                cell: 'relative p-0 text-center',
                day: 'h-9 w-9 p-0 text-sm rounded transition-colors text-steel hover:bg-navy-700 hover:text-white',
                day_selected:
                  'bg-amber-bourbon !text-navy-950 hover:bg-amber-bourbon font-semibold',
                day_today: '!text-amber-bourbon font-medium',
                day_outside: 'text-steel/25 hover:text-steel/40',
                day_disabled:
                  'text-steel/20 cursor-not-allowed hover:bg-transparent hover:text-steel/20',
                day_hidden: 'invisible',
              }}
            />
          </div>,
          document.body
        )}
    </>
  )
}
