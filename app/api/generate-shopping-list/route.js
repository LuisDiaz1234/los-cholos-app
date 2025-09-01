import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib-server/supabaseAdmin';

export async function POST(req) {
  try {
    const { target_date } = await req.json();
    const args = {};
    if (target_date) args.target_date = target_date;

    const { error } = await supabaseAdmin.rpc('generate_shopping_list_for_date', args);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const { error } = await supabaseAdmin.rpc('generate_shopping_list_for_date', {});
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
