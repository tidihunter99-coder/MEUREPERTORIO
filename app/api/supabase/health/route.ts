import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    await supabaseRequest("songs?select=id&limit=1");
    return NextResponse.json({ connected: true, tableReady: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida";
    const tableReady = !message.includes("PGRST205") && !message.includes("404");
    return NextResponse.json({ connected: false, tableReady, message }, { status: 503 });
  }
}
