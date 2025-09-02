import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    const { items, payment_method } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items' }), { status: 400 });
    }
    const { data, error } = await supabaseAdmin.rpc('create_sale', {
      items: items,
      payment_method: payment_method || 'cash'
    });
    if (error) throw error;
    return new Response(JSON.stringify({ sale_id: data }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
