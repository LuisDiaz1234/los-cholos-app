// GET lista de usuarios (lee tabla profiles) — sólo server
import { NextResponse } from 'next/server';
import getSupabaseAdmin from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('uid, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ users: data || [] }, { status:200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
