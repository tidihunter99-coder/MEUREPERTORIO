export const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
export const NOTE_NAMES = ["Dó", "Dó sustenido", "Ré", "Ré sustenido", "Mi", "Fá", "Fá sustenido", "Sol", "Sol sustenido", "Lá", "Lá sustenido", "Si"] as const;
export const FLAT_NAMES = ["Dó", "Ré bemol", "Ré", "Mi bemol", "Mi", "Fá", "Sol bemol", "Sol", "Lá bemol", "Lá", "Si bemol", "Si"] as const;

const NOTE_INDEX: Record<string, number> = Object.fromEntries(
  [...SHARPS, ...FLATS, "E#", "B#", "Cb", "Fb"].map((note) => [note, note === "E#" ? 5 : note === "B#" ? 0 : note === "Cb" ? 11 : note === "Fb" ? 4 : Math.max(SHARPS.indexOf(note as typeof SHARPS[number]), FLATS.indexOf(note as typeof FLATS[number]))]),
);

// A chord is only parsed in a chord context. Ordinary lyric lines are never passed here.
const CHORD = /^([A-G](?:#|b)?)(?:(m|M|maj|min|dim|aug|sus|add|ø|°|\+|−|-)?([0-9Mmajminsusadddimaug#b()°ø+\-]*))?(?:\/([A-G](?:#|b)?))?$/;
const CHORD_TOKEN = /(^|[\s|:,;\[\]{}_~])([A-G](?:#|b)?(?:m|M|maj|min|dim|aug|sus|add|ø|°|\+|−|-)?[0-9Mmajminsusadddimaug#b()°ø+\-]*(?:\/[A-G](?:#|b)?)?)(?=$|[\s|:,;\[\]{}_~])/g;

export function noteIndex(note: string): number {
  return NOTE_INDEX[note] ?? -1;
}

export function transposeNote(note: string, semitones: number, accidental: "sharp" | "flat" = "sharp"): string {
  const index = noteIndex(note);
  if (index < 0) return note;
  const output = accidental === "flat" ? FLATS : SHARPS;
  return output[((index + semitones) % 12 + 12) % 12];
}

export function transposeChord(chord: string, semitones: number, accidental: "sharp" | "flat" = "sharp"): string {
  const match = CHORD.exec(chord);
  if (!match) return chord;
  const [, root, quality = "", extension = "", bass] = match;
  return `${transposeNote(root, semitones, accidental)}${quality}${extension}${bass ? `/${transposeNote(bass, semitones, accidental)}` : ""}`;
}

export function isChordToken(token: string): boolean {
  return CHORD.test(token);
}

export function isChordLine(line: string): boolean {
  const stripped = line.replace(/\|\|:|:\|\||[|_~]/g, " ").trim();
  if (!stripped) return false;
  const tokens = stripped.split(/\s+/).filter(Boolean);
  // A standalone A–G token is ambiguous and is kept as lyric unless it has
  // chord spacing/companions or explicit harmonic syntax.
  if (tokens.every(token => /^[A-G]$/.test(token)) && !/(?:\s{2,}|\||:)/.test(line)) return false;
  return tokens.every((token) => isChordToken(token.replace(/[,:;]$/, "")));
}

export function transposeChordLine(line: string, semitones: number, accidental: "sharp" | "flat" = "sharp"): string {
  return line.replace(CHORD_TOKEN, (whole, prefix: string, token: string) =>
    isChordToken(token) ? `${prefix}${transposeChord(token, semitones, accidental)}` : whole,
  );
}

export type ScoreLine = { text: string; kind: "chords" | "lyrics" | "note"; fast?: boolean };
export type ScoreSection = { name: string; tone: "intro" | "verse" | "chorus" | "bridge" | "final"; lines: ScoreLine[] };
export type ParsedSong = { title: string; artist: string; key: string; sections: ScoreSection[] };

function sectionTone(name: string): ScoreSection["tone"] {
  const value = name.toLocaleLowerCase("pt-BR");
  if (/intro|introdu/.test(value)) return "intro";
  if (/refr|chorus/.test(value)) return "chorus";
  if (/ponte|bridge|pré|pre-/.test(value)) return "bridge";
  if (/final|outro|fim|solo/.test(value)) return "final";
  return "verse";
}

export function parseSong(raw: string): ParsedSong {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  let title = "Nova música";
  let artist = "Artista não informado";
  let key = "C";
  let bodyStarted = false;
  const sections: ScoreSection[] = [];
  let current: ScoreSection = { name: "Cifra", tone: "verse", lines: [] };
  const pushCurrent = () => { if (current.lines.length) sections.push(current); };
  for (const original of lines) {
    const trimmed = original.trim();
    if (!bodyStarted && /^(?:t[ií]tulo|m[uú]sica)\s*:/i.test(trimmed)) { title = trimmed.replace(/^[^:]+:\s*/, "") || title; continue; }
    if (!bodyStarted && /^(?:artista|banda|autor)\s*:/i.test(trimmed)) { artist = trimmed.replace(/^[^:]+:\s*/, "") || artist; continue; }
    if (!bodyStarted && /^tom\s*:/i.test(trimmed)) { const candidate = trimmed.replace(/^[^:]+:\s*/, "").split(/\s/)[0]; if (noteIndex(candidate) >= 0) key = candidate; continue; }
    const heading = /^\[([^\]]+)\]\s*$/.exec(trimmed) || /^(intro(?:dução)?|verso(?:\s+\d+)?|pré-refrão|refrão|ponte|solo|final|outro)\s*:?$/i.exec(trimmed);
    if (heading) { pushCurrent(); current = { name: heading[1], tone: sectionTone(heading[1]), lines: [] }; bodyStarted = true; continue; }
    if (!trimmed && !bodyStarted) continue;
    if (!bodyStarted && !isChordLine(original) && title === "Nova música") { title = trimmed; continue; }
    bodyStarted = true;
    const fast = /__|~~|⚡|passagem r[aá]pida/i.test(original);
    current.lines.push({ text: original, kind: !trimmed ? "note" : isChordLine(original) ? "chords" : "lyrics", fast });
  }
  pushCurrent();
  if (!sections.length) sections.push({ name: "Cifra", tone: "verse", lines: [] });
  return { title, artist, key, sections };
}
