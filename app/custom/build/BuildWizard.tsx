'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepIndicator from '@/components/custom/StepIndicator'
import WizardNav from '@/components/custom/WizardNav'
import ShapeStep from './steps/ShapeStep'
import ColorsStep from './steps/ColorsStep'
import DetailsStep from './steps/DetailsStep'
import UploadsStep from './steps/UploadsStep'
import OrderStep from './steps/OrderStep'
import { INITIAL_WIZARD_STATE, WizardState } from '@/lib/custom-inquiry-types'
import { AvailableColor } from '@/lib/queries/filament'

const TOTAL_STEPS = 5

interface BuildWizardProps {
  distilleries: string[]
  availableColors: AvailableColor[]
}

export default function BuildWizard({ distilleries, availableColors }: BuildWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }))

  const canNext: boolean = (() => {
    if (step === 1) return state.shape !== null && (state.shape !== 'other' || state.otherShapeDescription.trim().length > 0)
    if (step === 2) return state.colors.length > 0
    if (step === 3) return state.details.distillery.trim().length > 0
    if (step === 4) return true  // uploads are optional
    if (step === 5) return (
      state.order.quantity >= 1 &&
      state.order.name.trim().length > 0 &&
      state.order.email.trim().length > 0
    )
    return false
  })()

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/custom-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }
      const params = new URLSearchParams({
        shape: state.shape ?? '',
        qty: String(state.order.quantity),
        distillery: state.details.distillery,
      })
      router.push(`/custom/build/confirmation?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="section-label mb-2">Custom Tag Builder</div>
          <h1 className="font-display text-white text-3xl tracking-wider">DESIGN YOUR TAG</h1>
        </div>

        <StepIndicator currentStep={step} />

        <div className="glass-card p-8">
          {step === 1 && <ShapeStep selected={state.shape} otherDescription={state.otherShapeDescription} onChange={(shape) => update({ shape })} onOtherDescription={(otherShapeDescription) => update({ otherShapeDescription })} />}
          {step === 2 && <ColorsStep colors={state.colors} onChange={(colors) => update({ colors })} availableColors={availableColors} />}
          {step === 3 && <DetailsStep details={state.details} onChange={(details) => update({ details })} distilleries={distilleries} />}
          {step === 4 && <UploadsStep uploads={state.uploads} onChange={(uploads) => update({ uploads })} />}
          {step === 5 && <OrderStep order={state.order} onChange={(order) => update({ order })} />}

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <WizardNav
            step={step}
            totalSteps={TOTAL_STEPS}
            onBack={() => setStep(s => Math.max(1, s - 1))}
            onNext={handleNext}
            canNext={canNext}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
