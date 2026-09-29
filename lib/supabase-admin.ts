import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Created lazily (on first use inside a request) rather than at module load, so a missing
// env var can't fail Next's build-time page-data collection for every route that imports this.
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver)
    return typeof value === 'function' ? value.bind(getClient()) : value
  },
})
