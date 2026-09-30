import { isChordLine, noteIndex, type ScoreSection } from "./music.ts";

export type ParsedSong = { title: string; artist: string; key: string; sections: ScoreSection[] };

function sectionTone(name: string): ScoreSection["tone"] {
  const value = name.toLocaleLowerCase("pt-BR");
  if (/intro|introdu/.test(value)) return "intro";
  if (/refr|chorus/.test(value)) return "chorus";
  if (/ponte|bridge|pré|pre-|interl/.test(value)) return "bridge";
  if (/final|outro|fim|solo/.test(value)) return "final";
  return "verse";
}

export function parseSong(raw: string, options: { inferTitle?: boolean } = {}): ParsedSong {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  let title = "Nova música";
  let artist = "Artista não informado";
  let key = "C";
  let bodyStarted = false;
  let hasExplicitSection = false;
  const sections: ScoreSection[] = [];
  let current: ScoreSection = { name: "Cifra", tone: "verse", lines: [] };
  const pushCurrent = () => { if (current.lines.length) sections.push(current); };
  for (const original of lines) {
    const trimmed = original.trim();
    if (!bodyStarted && /^(?:t[ií]tulo|m[uú]sica)\s*:/i.test(trimmed)) { title = trimmed.replace(/^[^:]+:\s*/, "") || title; continue; }
    if (!bodyStarted && /^(?:artista|banda|autor)\s*:/i.test(trimmed)) { artist = trimmed.replace(/^[^:]+:\s*/, "") || artist; continue; }
    if (!bodyStarted && /^tom\s*:/i.test(trimmed)) { const candidate = trimmed.replace(/^[^:]+:\s*/, "").split(/\s/)[0]; if (noteIndex(candidate) >= 0) key = candidate; continue; }
    const heading = /^\[([^\]]+)\]\s*$/.exec(trimmed) || /^(intro(?:dução)?|verso(?:\s+\d+)?|parte(?:\s+[a-z0-9]+)?|pré-refrão|refrão|ponte|solo|interlúdio|final|observação|outro|variação)\s*:?$/i.exec(trimmed);
    if (heading) { pushCurrent(); current = { name: heading[1], tone: sectionTone(heading[1]), lines: [] }; bodyStarted = true; hasExplicitSection = true; continue; }
    if (!trimmed && !bodyStarted) continue;
    if (options.inferTitle !== false && !bodyStarted && !isChordLine(original) && title === "Nova música") { title = trimmed; continue; }
    bodyStarted = true;
    const fast = /__|~~|⚡|passagem r[aá]pida/i.test(original);
    current.lines.push({ text: original, kind: !trimmed || /^(?:segura|segurar|sustenta|sustentar|deixa soar)\s*[.!]?$|^\(.+\)$|^obs(?:ervaç[aã]o)?\s*:/i.test(trimmed) ? "note" : isChordLine(original) || (hasExplicitSection && /^[A-G](?:#|b)?$/.test(trimmed)) ? "chords" : "lyrics", fast });
  }
  pushCurrent();
  if (!sections.length) sections.push({ name: "Cifra", tone: "verse", lines: [] });
  return { title, artist, key, sections };
}
