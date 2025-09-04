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
    const shift_id = body.shift_id ?? null; // opcional

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    // Llamar RPC con la firma exacta que creamos: (p_items jsonb, p_method text, p_shift uuid)
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('create_sale', {
      p_items: items,
      p_method: payment_method,
      p_shift: shift_id
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sale_id: data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
