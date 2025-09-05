// server: genera la lista con un RPC
import { NextResponse } from 'next/server';
import getSupabaseAdmin from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { target_date } = await req.json();
    const d = target_date || new Date().toISOString().slice(0,10);
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.rpc('generate_shopping_list_for_date', { p_date: d });
    if (error) throw error;

    return NextResponse.json({ ok:true, date:d }, { status:200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
