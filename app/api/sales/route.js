import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req){
  try{
    const supabaseAdmin = getSupabaseAdmin();
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    let cashier_id = null;
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      cashier_id = data?.user?.id || null;
    }

    const { items, payment_method } = await req.json();
    if (!items || !Array.isArray(items) || items.length===0) {
      return new Response(JSON.stringify({ error:'items vacíos' }), { status:400 });
    }

    // Llama a tu función de BD que ya descuenta stock/ingredientes y crea venta
    // Ajusta el nombre si tu RPC se llama distinto:
    const { data: sale_id, error } = await supabaseAdmin
      .rpc('create_sale_with_inventory', { items, payment_method });

    if (error) throw error;

    if (cashier_id && sale_id) {
      await supabaseAdmin.from('sales').update({ cashier_id }).eq('id', sale_id);
    }

    return new Response(JSON.stringify({ sale_id }), { status:200 });
  }catch(e){
    return new Response(JSON.stringify({ error: e.message }), { status:500 });
  }
}
