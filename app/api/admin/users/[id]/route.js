import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';


async function assertAdmin(req, supabaseAdmin) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data: userData } = await supabaseAdmin.auth.getUser(token);
  const uid = userData?.user?.id;
  if (!uid) return null;
  const { data: prof } = await supabaseAdmin.from('profiles').select('role').eq('id', uid).maybeSingle();
  if (!prof || prof.role !== 'admin') return null;
  return uid;
}

export async function PATCH(req, { params }) {
  const supabaseAdmin = getSupabaseAdmin();
  const uid = await assertAdmin(req, supabaseAdmin);
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { role } = await req.json();
  const id = params.id;
  if (!role || !['admin','cashier'].includes(role)) return NextResponse.json({ error:'rol inválido' }, { status:400 });

  await supabaseAdmin.from('profiles').update({ role }).eq('id', id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const supabaseAdmin = getSupabaseAdmin();
  const uid = await assertAdmin(req, supabaseAdmin);
  if (!uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = params.id;
  // desactivar usuario (elimínalo si prefieres)
  await supabaseAdmin.auth.admin.deleteUser(id);
  return NextResponse.json({ ok: true });
}
