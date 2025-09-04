// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  // Usa los NOMBRES que sí existen en Vercel
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // Cliente admin (sin sesión persistente)
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
