// app/api/generate-shopping-list/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { target_date } = await req.json();
    const d = target_date || new Date().toISOString().slice(0, 10);

    const supabase = getSupabaseAdmin();
    // Cambia el nombre si tu función es distinta (p.ej. generate_shopping_list_for_date)
    const { error } = await supabase.rpc('generate_shopping_list_for_date', { p_date: d });
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
