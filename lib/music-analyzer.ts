import { normalizeChord, type ScoreSection } from "./music.ts";
import { detectPatterns } from "./pattern-detector.ts";
import type { AnalysisOptions, ChordEvent, ChordRole, HarmonicBlock, MusicSection, SongModel } from "./song-model.ts";

const TOKEN = /[A-G](?:#|b)?(?:m|M|maj|min|dim|aug|sus|add|ø|°|\+|−|-)?[0-9Mmajminsusadddimaug#b()°ø+\-]*(?:\/[A-G](?:#|b)?)?/g;

function extractChords(text: string, section: number, line: number, roles: Record<string, ChordRole>, fast: boolean, nextLyric?: { index: number; text: string }, sustainCue = false): ChordEvent[] {
  return [...text.matchAll(TOKEN)].flatMap((match, tokenIndex) => {
    const before = text[match.index - 1] || " ";
    const after = text[match.index + match[0].length] || " ";
    if (/\p{L}/u.test(before) || /\p{L}/u.test(after)) return [];
    const chord = normalizeChord(match[0]);
    if (!chord) return [];
    const id = `${section}:${line}:${tokenIndex}`;
    const role = roles[id] || (sustainCue ? "sustained" : fast ? "passage" : "normal");
    return [{ id, chord, column: match.index, lyricLine: nextLyric?.index, lyricColumn: nextLyric ? Math.min(match.index, nextLyric.text.length) : undefined, role, roleConfidence: roles[id] || sustainCue || fast ? 1 : 0.5 }];
  });
}

export function createSongModel(originalContent: string, sections: ScoreSection[], options: AnalysisOptions = {}): SongModel {
  const roles = options.roles || {};
  const modeled: MusicSection[] = sections.map((section, sectionIndex) => ({
    name: section.name, tone: section.tone, explicit: section.name !== "Cifra", confidence: section.name !== "Cifra" ? 1 : 0.4,
    lines: section.lines.map((line, lineIndex) => {
      const next = section.lines[lineIndex + 1];
      const lyric = next?.kind === "lyrics" ? { index: lineIndex + 1, text: next.text } : undefined;
      const sustainCue = next?.kind === "note" && Boolean(normalizeChord(line.text.trim())) && /\b(sustenta|sustentar|segura|segurar|deixa soar)\b/i.test(next.text);
      return { ...line, chords: line.kind === "chords" ? extractChords(line.text, sectionIndex, lineIndex, roles, Boolean(line.fast), lyric, sustainCue) : [] };
    }),
  }));
  const blocks: HarmonicBlock[] = modeled.flatMap((section, sectionIndex) => section.lines.flatMap((line, lineIndex) => {
    if (!line.chords.length) return [];
    const betweenLongerBlocks = line.chords.length <= 2 && lineIndex > 0 && lineIndex < section.lines.length - 1;
    const passage = Boolean(line.fast) || (betweenLongerBlocks && section.lines.some((candidate, index) => index < lineIndex && candidate.chords.length >= 3) && section.lines.some((candidate, index) => index > lineIndex && candidate.chords.length >= 3));
    return [{ id: `${sectionIndex}:${lineIndex}`, sectionIndex, lineIndex, chords: line.chords, sectionName: section.name, lyricText: section.lines[lineIndex + 1]?.kind === "lyrics" ? section.lines[lineIndex + 1].text.trim().toLocaleLowerCase("pt-BR") : undefined, role: passage ? "passage" as const : "sequence" as const, confidence: line.fast ? 1 : passage ? 0.73 : 1 }];
  }));
  const patterns = detectPatterns(blocks, options);
  return { version: 1, originalContent, sections: modeled, blocks, analysis: {
    repeatedPatterns: patterns,
    transitions: blocks.filter(block => block.role === "passage").map(block => block.id),
    sustainedChords: blocks.flatMap(block => block.chords.filter(chord => chord.role === "sustained").map(chord => chord.id)),
    uncertainRegions: patterns.filter(pattern => !pattern.compact && pattern.decision !== "NEW_STRUCTURE").map(pattern => pattern.blockId),
  } };
}
