// /lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

let _admin; // cache opcional

export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // NO lanzamos en import; solo cuando la API lo pida
    throw new Error('Faltan variables de entorno de Supabase en el servidor.');
  }

  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
  return _admin;
}
