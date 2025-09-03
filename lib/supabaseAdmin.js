import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE, // ⚠️ sólo server
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
