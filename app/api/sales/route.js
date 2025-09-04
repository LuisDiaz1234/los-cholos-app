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
    const shift_id = body.shift_id ?? null;

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Ajusta al contrato de tu función SQL `create_sale`
    const { data, error } = await supabase.rpc('create_sale', {
      p_items_jsonb: items.map(i => ({
        product_id: i.product_id,
        qty: i.quantity,         // <-- tu RPC espera "qty"
        unit_price: i.unit_price // opcional si tu RPC lo usa
      })),
      p_method: payment_method,
      p_shift: shift_id
    });

    if (error) throw error;

    // Asegúrate de devolver el id para abrir el recibo
    return NextResponse.json({ ok: true, sale_id: data?.sale_id ?? data?.id ?? null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
