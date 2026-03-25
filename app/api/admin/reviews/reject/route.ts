// app/api/admin/reviews/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSig } from '@/lib/admin-sig'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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
