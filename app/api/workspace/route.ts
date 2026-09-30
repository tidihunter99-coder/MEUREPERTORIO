import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { supabaseRequest } from "@/lib/supabase-rest";
import type { Workspace } from "@/lib/repertoire";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Entre para sincronizar." }, { status: 401 });
  try {
    const rows = await supabaseRequest(`workspaces?user_id=eq.${encodeURIComponent(user.userId)}&select=document&limit=1`) as Array<{ document: Workspace }>;
    return NextResponse.json({ workspace: rows[0]?.document || null });
  } catch {
    return NextResponse.json({ error: "Sincronização indisponível." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Entre para sincronizar." }, { status: 401 });
  try {
    const document = await request.json() as Workspace;
    if (!document || !Array.isArray(document.songs) || !Array.isArray(document.bands) || !Array.isArray(document.setlists) || !document.updatedAt || JSON.stringify(document).length > 2_000_000) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    await supabaseRequest("workspaces?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify([{ user_id: user.userId, document, updated_at: document.updatedAt }]),
    });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Sincronização indisponível." }, { status: 503 });
  }
}
