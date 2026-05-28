import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { verifySessionToken, COOKIE_NAME } from '@/lib/admin-session'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  return !!token && (await verifySessionToken(token))
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Prevent id from being overwritten
  delete body.id

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ id: 1, ...body, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('site-settings')
  return NextResponse.json({ ok: true })
}
