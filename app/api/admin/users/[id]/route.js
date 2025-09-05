// PATCH: cambiar rol del usuario
import { NextResponse } from 'next/server';
import getSupabaseAdmin from '../../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const { role } = await req.json();
    if (!['admin','staff'].includes(role)) {
      return NextResponse.json({ error:'Rol inválido' }, { status:400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('uid', id);
    if (error) throw error;
    return NextResponse.json({ ok:true }, { status:200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
