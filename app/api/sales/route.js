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

    const supabase = getSupabaseAdmin();

    // Ajusta los nombres de parámetros al de tu función SQL
    // Si tu función es create_sale(p_items jsonb, p_method text, p_shift uuid)
    const { data, error } = await supabase.rpc('create_sale', {
      p_items: items.map(i => ({
        product_id: i.product_id,
        qty: i.quantity,          // ojo: tu SQL usa qty
        unit_price: i.unit_price
      })),
      p_method: payment_method,
      p_shift: shift_id
    });

    if (error) throw error;

    // Asegúrate de que tu función retorne el id de la venta:
    // RETURN v_sale_id;  -- uuid
    const sale_id = data?.sale_id || data || null;
    if (!sale_id) {
      return NextResponse.json({ error: 'No sale_id returned' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sale_id }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
