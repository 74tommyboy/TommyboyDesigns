// app/admin/reviews/done/page.tsx
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminReviewDonePage({
  searchParams,
}: {
  searchParams: { action?: string }
}) {
  const action = searchParams.action

  if (action === 'approved') {
    return (
      <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-amber-bourbon mx-auto mb-6" />
          <h1 className="font-display text-white text-3xl tracking-wider mb-4">REVIEW APPROVED</h1>
          <p className="text-steel">The review is now live on the site.</p>
        </div>
      </main>
    )
  }

  if (action === 'rejected') {
    return (
      <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-steel/40 mx-auto mb-6" />
          <h1 className="font-display text-white text-3xl tracking-wider mb-4">REVIEW REJECTED</h1>
          <p className="text-steel">The review has been removed.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-white text-3xl tracking-wider mb-4">DONE</h1>
        <p className="text-steel">Action completed.</p>
      </div>
    </main>
  )
}
