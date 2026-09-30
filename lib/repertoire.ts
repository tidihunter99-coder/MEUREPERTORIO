import type { ScoreSection } from "@/lib/music";

export type Song = {
  id: string; title: string; artist: string; key: string; bpm: number; time: string;
  favorite: boolean; sections: ScoreSection[]; sourceText?: string; preferredMode?: "visual" | "marcus"; updatedAt: string;
};
export type Band = { id: string; name: string; image?: string; description: string; instrument: string; notes: string };
export type SetlistEntry = { id: string; songId: string; blockId: string; key?: string };
export type ShowBlock = { id: string; name: string };
export type Setlist = {
  id: string; bandId: string; name: string; date: string; time: string; venue: string;
  eventType: string; notes: string; blocks: ShowBlock[]; entries: SetlistEntry[];
};
export type Workspace = { songs: Song[]; bands: Band[]; setlists: Setlist[]; updatedAt: string };

const now = new Date().toISOString();
export const demoSong: Song = {
  id: "demo-ta-escrito", title: "Tá Escrito", artist: "Grupo Revelação", key: "G", bpm: 92,
  time: "4/4", favorite: true, updatedAt: now,
  sections: [
    { name: "Intro", tone: "intro", lines: [{ text: "G7M   B7   Em7   A7", kind: "chords" }, { text: "||: G7M   B7   Em7   A7 :||", kind: "chords" }] },
    { name: "Verso 1", tone: "verse", lines: [{ text: "G7M   B7   Em7   A7", kind: "chords" }, { text: "E o vento levou tudo que eu sonhei", kind: "lyrics" }, { text: "Am7   D7   G7M   D7", kind: "chords" }, { text: "Mas deixou o amor que eu jamais esqueci", kind: "lyrics" }] },
    { name: "Refrão", tone: "chorus", lines: [{ text: "G7M   B7   Em7   A7", kind: "chords" }, { text: "Tá escrito nas estrelas", kind: "lyrics" }, { text: "Am7   D7   G7M   D7", kind: "chords" }, { text: "Que o nosso amor não vai morrer jamais", kind: "lyrics" }] },
    { name: "Ponte", tone: "bridge", lines: [{ text: "Bm7   E7   Am7   D7", kind: "chords", fast: true }, { text: "Vai, e oração, não nega", kind: "lyrics" }] },
    { name: "Final", tone: "final", lines: [{ text: "G7M   B7   Em7   A7   G7M", kind: "chords" }] },
  ],
};

export const coracaoPartido: Song = {
  id: "demo-coracao-partido", title: "Coração Partido", artist: "Artista não informado", key: "F#", bpm: 90,
  time: "4/4", favorite: false, preferredMode: "marcus", updatedAt: now,
  sections: [{ name: "Cifra", tone: "verse", lines: [
    { text: "F#7M  F#6  G#m7  C#7(9) :||", kind: "chords" },
    { text: "F#  F#+  F#6  Cm7(5-)  Fm7(5-)  A#m7  G#m7  C#7(9) :||", kind: "chords" },
    { text: "C#7  C#/B  A#m7  E7  D#7", kind: "chords", fast: true },
    { text: "G#m7  C#7(9)  A#m7  D#7 :||", kind: "chords" },
  ] }],
};

export const initialWorkspace: Workspace = { songs: [demoSong, coracaoPartido], bands: [], setlists: [], updatedAt: now };

export function withBuiltInSongs(workspace: Workspace): Workspace {
  const exists = workspace.songs.some(song => song.id === coracaoPartido.id || song.title.toLocaleLowerCase("pt-BR") === "coração partido");
  return exists ? workspace : { ...workspace, songs: [...workspace.songs, coracaoPartido] };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadWorkspace(): Workspace {
  try {
    const saved = localStorage.getItem("mr-workspace-v2");
    if (!saved) return initialWorkspace;
    const value = JSON.parse(saved) as Workspace;
    if (Array.isArray(value.songs) && Array.isArray(value.bands) && Array.isArray(value.setlists)) return withBuiltInSongs(value);
  } catch { /* Ignore damaged local data and keep the built-in example. */ }
  return initialWorkspace;
}
