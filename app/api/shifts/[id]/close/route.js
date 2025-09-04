import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export const runtime='nodejs'; export const dynamic='force-dynamic';

export async function POST(req, { params }){
  const admin = getSupabaseAdmin();
  const { cash_counted, notes } = await req.json();
  const { data, error } = await admin.rpc('close_shift', {
    p_shift_id: params.id,
    p_cash_counted: Number(cash_counted||0),
    p_notes: notes || null
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status:400 });
  return new Response(JSON.stringify({ result: data?.[0] || null }), { status:200 });
}
