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

export type NormalizedChord = { spelling: string; root: number; quality: string; bass: number | null; identity: string };

export function normalizeChord(token: string): NormalizedChord | null {
  const match = CHORD.exec(token);
  if (!match) return null;
  const root = noteIndex(match[1]);
  const bass = match[4] ? noteIndex(match[4]) : null;
  if (root < 0 || (bass !== null && bass < 0)) return null;
  let quality = `${match[2] || ""}${match[3] || ""}`.replace(/−/g, "-").toLowerCase();
  // Common Brazilian and international spellings are comparable without
  // changing the text that the musician originally entered.
  quality = quality.replace(/^min/, "m").replace(/^maj/, "maj").replace(/^m7\+$/, "mmaj7");
  if (/^(7m|7\+|maj7)$/.test(quality)) quality = "maj7";
  if (quality === "m7m" || quality === "m7+") quality = "mmaj7";
  return { spelling: token, root, quality, bass, identity: `${root}:${quality}:${bass ?? ""}` };
}

export function isChordLine(line: string): boolean {
  const stripped = line.replace(/\|\|:|:\|\||[|_~]/g, " ").replace(/\s+[–—-]\s+/g, " ").trim();
  if (!stripped) return false;
  const tokens = stripped.split(/\s+/).filter(Boolean);
  // A standalone A–G token is ambiguous and is kept as lyric unless it has
  // chord spacing/companions or explicit harmonic syntax.
  if (tokens.every(token => /^[A-G]$/.test(token)) && !/(?:\s{2,}|\||:)/.test(line)) return false;
  return tokens.every((token) => isChordToken(token.replace(/[%,:;]$/, "")));
}

export function transposeChordLine(line: string, semitones: number, accidental: "sharp" | "flat" = "sharp"): string {
  return line.replace(CHORD_TOKEN, (whole, prefix: string, token: string) =>
    isChordToken(token) ? `${prefix}${transposeChord(token, semitones, accidental)}` : whole,
  );
}

export type ScoreLine = { text: string; kind: "chords" | "lyrics" | "note"; fast?: boolean };
export type ScoreSection = { name: string; tone: "intro" | "verse" | "chorus" | "bridge" | "final"; lines: ScoreLine[] };
