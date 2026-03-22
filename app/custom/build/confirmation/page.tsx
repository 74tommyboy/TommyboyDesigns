import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { SHAPES } from '@/lib/custom-inquiry-types'

interface Props {
  searchParams: { shape?: string; qty?: string; distillery?: string }
}

export default function ConfirmationPage({ searchParams }: Props) {
  const shapeData = SHAPES.find(s => s.id === searchParams.shape)
  const qty = searchParams.qty ? parseInt(searchParams.qty) : null
  const distillery = searchParams.distillery ?? ''

  return (
    <div className="pt-28 pb-24 min-h-dvh flex items-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
        <CheckCircle className="w-16 h-16 text-amber-bourbon mx-auto mb-6" />
        <div className="section-label mb-3">Request Received</div>
        <h1 className="font-display text-white text-3xl tracking-wider mb-4">WE&apos;VE GOT YOUR REQUEST</h1>
        <p className="text-steel-light leading-relaxed mb-8">
          We&apos;ll be in touch within 2 business days with a quote and any follow-up questions.
        </p>

        {(shapeData || qty || distillery) && (
          <div className="glass-card p-6 text-left mb-8 space-y-3">
            <p className="text-xs uppercase tracking-wider text-steel/60 mb-4">Your Request Summary</p>
            {shapeData && (
              <div className="flex justify-between text-sm">
                <span className="text-steel/60">Shape</span>
                <span className="text-white">{shapeData.label}</span>
              </div>
            )}
            {distillery && (
              <div className="flex justify-between text-sm">
                <span className="text-steel/60">Distillery</span>
                <span className="text-white">{distillery}</span>
              </div>
            )}
            {qty && (
              <div className="flex justify-between text-sm">
                <span className="text-steel/60">Quantity</span>
                <span className="text-white">{qty}</span>
              </div>
            )}
          </div>
        )}

        <Link href="/shop" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    </div>
  )
}
