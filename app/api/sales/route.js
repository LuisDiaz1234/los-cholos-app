// app/api/sales/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const payment_method = body.payment_method || 'cash';
    // shift_id es opcional – envíalo si ya manejas turnos:
    const shift_id = body.shift_id ?? null;

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // el RPC que creaste arriba
    const { data, error } = await supabase.rpc('create_sale', {
      p_items_jsonb: items,
      p_method: payment_method,
      p_shift: shift_id,
    });

    if (error) {
      console.error('create_sale error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sale_id: data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
