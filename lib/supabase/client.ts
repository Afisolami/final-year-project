import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Anon client — used only in client components for Realtime subscriptions.
// RLS policies control what this client can access.
let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
