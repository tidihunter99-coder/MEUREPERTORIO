import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase-rest";

type SongInput = {
  slug?: string;
  title?: string;
  artist?: string;
  musical_key?: string;
  bpm?: number;
  time_signature?: string;
  favorite?: boolean;
  sections?: unknown[];
};

export async function GET() {
  try {
    const songs = await supabaseRequest("songs?select=*&order=updated_at.desc");
    return NextResponse.json({ songs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar as músicas.";
    return NextResponse.json({ songs: [], error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as SongInput;
    if (!input.title?.trim() || !input.artist?.trim()) {
      return NextResponse.json({ error: "Título e artista são obrigatórios." }, { status: 400 });
    }

    const slug = input.slug || `${input.title}-${input.artist}`
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const [saved] = await supabaseRequest("songs?on_conflict=slug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{
        slug,
        title: input.title.trim(),
        artist: input.artist.trim(),
        musical_key: input.musical_key || "C",
        bpm: input.bpm || 90,
        time_signature: input.time_signature || "4/4",
        favorite: Boolean(input.favorite),
        sections: input.sections || [],
        updated_at: new Date().toISOString(),
      }]),
    }) as Array<Record<string, unknown>>;

    return NextResponse.json({ song: saved }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar a música.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
