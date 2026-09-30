const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!projectUrl || !secretKey) {
  throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local.");
}

async function request(path, init = {}) {
  const response = await fetch(`${projectUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secretKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${body}`);
  }

  return body ? JSON.parse(body) : null;
}

const now = new Date().toISOString();
const [song] = await request("songs?on_conflict=slug", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify([{
    slug: "ta-escrito-grupo-revelacao",
    title: "Tá Escrito",
    artist: "Grupo Revelação",
    musical_key: "G",
    bpm: 92,
    time_signature: "4/4",
    favorite: true,
    sections: [
      { name: "Intro", tone: "intro", chords: ["G7M", "B7", "Em7", "A7"], repeat: true },
      { name: "Verso 1", tone: "verse", chords: ["G7M", "B7", "Em7", "A7", "Am7", "D7", "G7M", "D7"], lyric: "E o vento levou tudo que eu sonhei\nMas deixou o amor que eu jamais esqueci" },
      { name: "Refrão", tone: "chorus", chords: ["G7M", "B7", "Em7", "A7", "Am7", "D7", "G7M", "D7"], lyric: "Tá escrito nas estrelas\nQue o nosso amor não vai morrer jamais" },
      { name: "Ponte", tone: "bridge", chords: ["Bm7", "E7", "Am7", "D7", "G7M", "F#7", "Bm7", "E7"], lyric: "Vai, e oração, não nega\nQue ainda ama, que ainda quer", fast: true },
      { name: "Final", tone: "final", chords: ["G7M", "B7", "Em7", "A7", "G7M"] },
    ],
    updated_at: now,
  }]),
});

const [setlist] = await request("setlists?on_conflict=slug", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify([{
    slug: "show-sabado",
    name: "Show — Sábado",
    venue: "Clube do Samba",
    show_date: null,
    offline_ready: true,
    updated_at: now,
  }]),
});

await request("setlist_songs?on_conflict=setlist_id,song_id", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify([{
    setlist_id: setlist.id,
    song_id: song.id,
    position: 0,
  }]),
});

const savedSongs = await request("songs?select=slug,title,artist,musical_key,bpm,time_signature,favorite&slug=eq.ta-escrito-grupo-revelacao");
const savedSetlists = await request("setlists?select=slug,name,venue,offline_ready,setlist_songs(position,songs(slug,title))&slug=eq.show-sabado");

console.log(JSON.stringify({ songs: savedSongs, setlists: savedSetlists }, null, 2));
