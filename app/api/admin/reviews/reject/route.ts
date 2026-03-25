// app/api/admin/reviews/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function verifyAdminSig(id: string, action: 'approve' | 'reject', sig: string): boolean {
  const expected = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET!)
    .update(`${id}:${action}`)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const sig = req.nextUrl.searchParams.get('sig') ?? ''

  if (!id || !sig || !verifyAdminSig(id, 'reject', sig)) {
    return NextResponse.json({ error: 'Invalid or missing signature' }, { status: 403 })
  }

  // Silently succeeds if already deleted
  await supabaseAdmin.from('reviews').delete().eq('id', id)

  return NextResponse.redirect(new URL('/admin/reviews/done?action=rejected', req.url))
}
