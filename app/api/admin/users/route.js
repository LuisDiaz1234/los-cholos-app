import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

async function assertAdmin(req, supabaseAdmin) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  const uid = userData?.user?.id;
  if (!uid) return null;
  // verifica rol desde profiles
  const { data: prof } = await supabaseAdmin.from('profiles').select('role').eq('id', uid).maybeSingle();
  if (!prof || prof.role !== 'admin') return null;
  return uid;
}

export async function GET(req) {
  const supabaseAdmin = getSupabaseAdmin();
  const uid = await assertAdmin(req, supabaseAdmin);
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('id,email,role')
    .order('created_at',{ascending:false});

  return NextResponse.json({ users: users || [] });
}

export async function POST(req) {
  const supabaseAdmin = getSupabaseAdmin();
  const uid = await assertAdmin(req, supabaseAdmin);
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, password, role } = await req.json();
  if (!email || !password) return NextResponse.json({ error:'email y password son requeridos' }, { status:400 });

  // 1) crear usuario en auth (confirmado)
  const { data: created, error: e1 } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true
  });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  // 2) setear rol en profiles
  const id = created.user.id;
  await supabaseAdmin.from('profiles').upsert({ id, email, role: role || 'cashier' });

  return NextResponse.json({ ok: true, id });
}
