'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  text: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export default function AnnouncementPopup({ text, ctaLabel, ctaUrl }: Props) {
  const [visible, setVisible] = useState(false)
  // Key on content so a new announcement re-shows even if the user dismissed a previous one
  const storageKey = `announcement-${btoa(encodeURIComponent(text)).slice(0, 20)}`

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setVisible(true)
    }
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div className="w-full max-w-md glass-card p-6 space-y-4 relative">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 text-steel hover:text-white transition-colors"
          aria-label="Close announcement"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-white pr-6 leading-relaxed">{text}</p>
        <div className="flex items-center gap-3">
          {ctaLabel && ctaUrl && (
            <a href={ctaUrl} className="btn-primary" onClick={dismiss}>
              {ctaLabel}
            </a>
          )}
          <button onClick={dismiss} className="btn-outline text-sm">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
