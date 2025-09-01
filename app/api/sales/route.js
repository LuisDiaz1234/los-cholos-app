import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib-server/supabaseAdmin';

export async function POST(req) {
  try {
    const { items, payment_method } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Sin items' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin.rpc('create_sale', {
      items: items,
      payment_method: payment_method || 'cash'
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ sale_id: data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
