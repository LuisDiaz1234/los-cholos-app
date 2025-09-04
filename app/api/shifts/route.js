import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';

async function getUid(req, admin){
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data?.user?.id || null;
}

export async function GET(req){
  const admin = getSupabaseAdmin();
  const uid = await getUid(req, admin);
  if (!uid) return new Response('Unauthorized', { status:401 });

  const url = new URL(req.url);
  const all = url.searchParams.get('all')==='1';

  if (all) {
    // sólo admin ve todos
    const { data: prof } = await admin.from('profiles').select('role').eq('id', uid).maybeSingle();
    if (prof?.role !== 'admin') return new Response('Forbidden', { status:403 });
    const { data } = await admin.from('shifts').select('*').order('opened_at',{ascending:false}).limit(200);
    return new Response(JSON.stringify({ shifts: data||[] }), { status:200 });
  } else {
    const { data } = await admin.from('shifts').select('*').eq('cashier_id', uid).order('opened_at',{ascending:false}).limit(50);
    return new Response(JSON.stringify({ shifts: data||[] }), { status:200 });
  }
}

export async function POST(req){
  const admin = getSupabaseAdmin();
  const uid = await getUid(req, admin);
  if (!uid) return new Response('Unauthorized', { status:401 });

  const { opening_float } = await req.json();
  const { data: id, error } = await admin.rpc('open_shift', { p_cashier: uid, p_opening_float: Number(opening_float||0) });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status:400 });
  return new Response(JSON.stringify({ id }), { status:200 });
}
