// /app/api/generate-shopping-list/route.js
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { target_date } = await req.json();
    const d = target_date || new Date().toISOString().slice(0,10);

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.rpc('generate_shopping_list_for_date', { target_date: d });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
