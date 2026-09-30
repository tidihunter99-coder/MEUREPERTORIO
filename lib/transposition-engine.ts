import { normalizeChord, transposeChord } from "./music.ts";
import type { SongModel } from "./song-model.ts";

// A derived reading model is transposed once; all four readers receive it.
// The stored source and analysis remain at the song's original pitch.
export function transposeSongModel(model: SongModel, semitones: number, spelling: "sharp" | "flat"): SongModel {
  if (!semitones) return model;
  const sections = model.sections.map(section => ({ ...section, lines: section.lines.map(line => {
    if (!line.chords.length) return line;
    let offset = 0;
    let text = line.text;
    const chords = line.chords.map(event => {
      const written = transposeChord(event.chord.spelling, semitones, spelling);
      const column = event.column + offset;
      text = text.slice(0, column) + written + text.slice(column + event.chord.spelling.length);
      offset += written.length - event.chord.spelling.length;
      return { ...event, column, chord: normalizeChord(written) || event.chord };
    });
    return { ...line, text, chords };
  }) }));
  const blocks = model.blocks.map(block => ({ ...block, chords: sections[block.sectionIndex].lines[block.lineIndex].chords }));
  const repeatedPatterns = model.analysis.repeatedPatterns.map(pattern => ({ ...pattern, changedEnding: pattern.changedEnding ? transposeChord(pattern.changedEnding, semitones, spelling) : undefined }));
  return { ...model, sections, blocks, analysis: { ...model.analysis, repeatedPatterns } };
}
