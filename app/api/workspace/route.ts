import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseRequest } from "@/lib/supabase-rest";
import type { Workspace } from "@/lib/repertoire";

export const dynamic = "force-dynamic";

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user?.id || null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Entre para sincronizar." }, { status: 401 });
  try {
    const rows = await supabaseRequest(`workspaces?user_id=eq.${encodeURIComponent(userId)}&select=document&limit=1`) as Array<{ document: Workspace }>;
    return NextResponse.json({ workspace: rows[0]?.document || null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Sincronização indisponível." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Entre para sincronizar." }, { status: 401 });
  try {
    const document = await request.json() as Workspace;
    if (!document || !Array.isArray(document.songs) || !Array.isArray(document.bands) || !Array.isArray(document.setlists) || !document.updatedAt) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    if (JSON.stringify(document).length > 4_000_000) {
      return NextResponse.json({ error: "A biblioteca excedeu o limite de sincronização. As músicas continuam salvas neste dispositivo." }, { status: 413 });
    }
    await supabaseRequest("workspaces?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{ user_id: userId, document, updated_at: document.updatedAt }]),
    });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Sincronização indisponível." }, { status: 503 });
  }
}
