import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin client — pakai service role key, BYPASS RLS.
// HANYA untuk operasi server yang butuh akses penuh (mis. auth.admin).
// Jangan pernah expose ini ke client/browser.
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // no-op: admin client tidak perlu menulis cookie
        },
      },
    }
  )
}
