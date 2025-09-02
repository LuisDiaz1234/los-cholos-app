import { createClient } from '@supabase/supabase-js';

let _admin;
export function getSupabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Faltan variables de entorno de Supabase.');
  _admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  return _admin;
}
