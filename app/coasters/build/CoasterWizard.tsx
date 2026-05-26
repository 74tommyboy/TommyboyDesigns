'use client'

import { useState } from 'react'
import { addToCart, createCart } from '@/lib/shopify'
import { useCart } from '@/components/layout/CartProvider'
import StepIndicator from '@/components/custom/StepIndicator'
import WizardNav from '@/components/custom/WizardNav'
import ShapeStep from './steps/ShapeStep'
import ColorsStep from '@/app/custom/build/steps/ColorsStep'
import UploadsStep from '@/app/custom/build/steps/UploadsStep'
import OrderStep from './steps/OrderStep'
import { INITIAL_COASTER_STATE, CoasterWizardState } from '@/lib/coaster-inquiry-types'
import { AvailableColor } from '@/lib/queries/filament'

const STEP_LABELS = ['Shape', 'Colors', 'Uploads', 'Order']
const TOTAL_STEPS = 4
const COASTER_VARIANT_ID = 'gid://shopify/ProductVariant/43290011566143'

interface CoasterWizardProps {
  availableColors: AvailableColor[]
}

export default function CoasterWizard({ availableColors }: CoasterWizardProps) {
  const { cart } = useCart()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<CoasterWizardState>(INITIAL_COASTER_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<CoasterWizardState>) => setState(s => ({ ...s, ...patch }))

  const canNext: boolean = (() => {
    if (step === 1) return state.shape !== null && (state.shape !== 'other' || state.otherShapeDescription.trim().length > 0)
    if (step === 2) return state.colors.length > 0
    if (step === 3) return true  // uploads optional
    if (step === 4) return (
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
      const res = await fetch('/api/coaster-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }
      const { inquiryId } = await res.json()

      const cartId = cart?.id ?? (await createCart()).id
      const updatedCart = await addToCart(
        cartId,
        COASTER_VARIANT_ID,
        1,
        [{ key: '_custom_inquiry_id', value: inquiryId }]
      )

      window.location.href = updatedCart.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center">
          <div className="section-label mb-3">Custom Coasters</div>
          <h1 className="font-display text-white text-3xl sm:text-4xl tracking-wider">BUILD YOUR COASTER</h1>
          <p className="text-steel/60 text-sm mt-3">
            Tell us what you want — we&apos;ll bring it to life.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <StepIndicator currentStep={step} labels={STEP_LABELS} />

          {step === 1 && (
            <ShapeStep
              selected={state.shape}
              otherDescription={state.otherShapeDescription}
              onChange={(shape) => update({ shape })}
              onOtherDescription={(otherShapeDescription) => update({ otherShapeDescription })}
            />
          )}
          {step === 2 && (
            <ColorsStep
              colors={state.colors}
              onChange={(colors) => update({ colors })}
              availableColors={availableColors}
            />
          )}
          {step === 3 && (
            <UploadsStep
              uploads={state.uploads}
              onChange={(uploads) => update({ uploads })}
            />
          )}
          {step === 4 && (
            <OrderStep
              order={state.order}
              onChange={(order) => update({ order })}
            />
          )}

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
