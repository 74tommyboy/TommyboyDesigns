'use client'

import { Loader2 } from 'lucide-react'

interface WizardNavProps {
  step: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  canNext: boolean
  submitting?: boolean
}

export default function WizardNav({ step, totalSteps, onBack, onNext, canNext, submitting }: WizardNavProps) {
  const isLast = step === totalSteps

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="px-6 py-2.5 text-sm text-steel-light border border-white/10 rounded hover:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || submitting}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLast ? (submitting ? 'Submitting…' : 'Submit Request') : 'Next'}
      </button>
    </div>
  )
}
