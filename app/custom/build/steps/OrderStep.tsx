'use client'

import { OrderInfo } from '@/lib/custom-inquiry-types'

interface OrderStepProps {
  order: OrderInfo
  onChange: (order: OrderInfo) => void
}

const inputCls = 'w-full bg-navy-800/50 border border-white/10 rounded px-3 py-2.5 text-sm text-white placeholder:text-steel/40 focus:outline-none focus:border-amber-bourbon/50'
const labelCls = 'block text-xs uppercase tracking-wider text-steel/60 mb-1.5'

export default function OrderStep({ order, onChange }: OrderStepProps) {
  const set = (patch: Partial<OrderInfo>) => onChange({ ...order, ...patch })

  return (
    <div>
      <h2 className="font-display text-white text-xl tracking-wider mb-2">ORDER DETAILS</h2>
      <p className="text-steel/60 text-sm mb-6">Almost done — choose your attachment and let us know how to reach you.</p>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Attachment <span className="text-amber-bourbon">*</span></label>
          <div className="flex gap-4 mt-1">
            {(['hemp_twine', 'bead_chain'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer glass-card px-4 py-3 flex-1 justify-center">
                <input type="radio" name="attachment" value={type} checked={order.attachment === type} onChange={() => set({ attachment: type })} className="accent-amber-bourbon" />
                <span className="text-sm text-steel-light">{type === 'hemp_twine' ? 'Hemp Twine' : 'Bead Chain'}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Quantity <span className="text-amber-bourbon">*</span></label>
          <input type="number" min={1} value={order.quantity} onChange={(e) => set({ quantity: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Your Name <span className="text-amber-bourbon">*</span></label>
          <input type="text" value={order.name} onChange={(e) => set({ name: e.target.value })} placeholder="Full name" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-amber-bourbon">*</span></label>
          <input type="email" value={order.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Phone</label>
          <input type="tel" value={order.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Optional" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Additional Notes</label>
          <textarea value={order.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Any other details, special requests, or questions…" rows={4} className={`${inputCls} resize-none`} />
        </div>
      </div>
    </div>
  )
}
