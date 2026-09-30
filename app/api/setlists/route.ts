import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const setlists = await supabaseRequest("setlists?select=*,setlist_songs(position,song_id,songs(*))&order=updated_at.desc");
    return NextResponse.json({ setlists });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar os setlists.";
    return NextResponse.json({ setlists: [], error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { slug?: string; name?: string; venue?: string; show_date?: string };
    if (!body.name?.trim()) return NextResponse.json({ error: "Nome do setlist é obrigatório." }, { status: 400 });
    const slug = body.slug || body.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [saved] = await supabaseRequest("setlists?on_conflict=slug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{ slug, name: body.name.trim(), venue: body.venue || null, show_date: body.show_date || null, updated_at: new Date().toISOString() }]),
    }) as Array<Record<string, unknown>>;
    return NextResponse.json({ setlist: saved }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o setlist.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
