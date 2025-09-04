// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  }
  // Admin: sin sesión persistida ni auto refresh
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
