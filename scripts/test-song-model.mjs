import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeChord } from "../lib/music.ts";
import { parseSong } from "../lib/song-parser.ts";
import { createSongModel } from "../lib/music-analyzer.ts";
import { transposeSongModel } from "../lib/transposition-engine.ts";

const section = (name, ...lines) => ({ name, tone: name === "Intro" ? "intro" : "verse", lines: lines.map(text => ({ text, kind: "chords" })) });
const analyze = (...sections) => createSongModel(sections.map(item => item.lines.map(line => line.text).join("\n")).join("\n"), sections);

test("A: repeated progression is exact", () => {
  const model = analyze(section("Parte A", "C#m7 F#7 B7+ B6", "C#m7 F#7 B7+ B6"));
  assert.equal(model.analysis.repeatedPatterns[1].decision, "EXACT_REPEAT");
  assert.equal(model.analysis.repeatedPatterns[1].compact, true);
});

test("B: changed final chord is an ending variation", () => {
  const model = analyze(section("Parte A", "C#m7 F#7 B7+ B6", "C#m7 F#7 B7+ E7M"));
  assert.equal(model.analysis.repeatedPatterns[1].decision, "REPEAT_WITH_ENDING");
  assert.equal(model.analysis.repeatedPatterns[1].changedEnding, "E7M");
});

test("C: short connector remains a passage", () => {
  const model = analyze(section("Verso", "C#m7 F#7 B7+ B6", "G#m D#m", "E7M A7 D7 G7"));
  assert.equal(model.blocks[1].role, "passage");
  assert.equal(model.analysis.repeatedPatterns[1].compact, false);
});

test("D: a single recurring chord is insufficient", () => {
  const model = analyze(section("Verso", "C#m7", "F#7 B7+ B6", "C#m7"));
  assert.equal(model.analysis.repeatedPatterns[2].decision, "NEW_STRUCTURE");
});

test("E: intro keeps its semantic section despite recurring harmony", () => {
  const model = analyze(section("Intro", "B7+ D#m7 C#m7 F#7"), section("Verso", "B7+ D#m7 C#m7 F#7"));
  assert.equal(model.sections[0].name, "Intro");
  assert.equal(model.analysis.repeatedPatterns[1].decision, "EXACT_REPEAT");
});

test("F: unknown duration never creates sustain", () => {
  const model = analyze(section("Verso", "B7+ D#m7 C#m7 F#7"));
  assert.equal(model.analysis.sustainedChords.length, 0);
});

test("an explicit sustain note can mark one chord without guessing beats", () => {
  const source = "[Final]\nB7+\nsegura";
  const model = createSongModel(source, parseSong(source).sections);
  assert.equal(model.blocks[0].chords[0].role, "sustained");
});

test("enharmonic roots compare but retain entered spelling", () => {
  assert.equal(normalizeChord("Dbm7")?.identity, normalizeChord("C#m7")?.identity);
  assert.equal(normalizeChord("Dbm7")?.spelling, "Dbm7");
  assert.equal(normalizeChord("B7+")?.identity, normalizeChord("Bmaj7")?.identity);
  for (const chord of ["C", "Cm", "C7", "C7+", "Cmaj7", "Cm7", "C#m7", "C#m7(9)", "F#7(9)", "F#/A#", "B6", "Bb", "Eb/G"]) assert.ok(normalizeChord(chord), chord);
});

test("the source text and chord-to-lyric columns survive parsing", () => {
  const original = "[Verso]\n  C#m7     F#7\nEu me envolvi sem perceber";
  const model = createSongModel(original, parseSong(original).sections);
  assert.equal(model.originalContent, original);
  assert.equal(model.blocks[0].chords[0].column, 2);
  assert.equal(model.blocks[0].chords[0].lyricLine, 1);
});

test("one derived model transposes every chord while preserving the source", () => {
  const model = analyze(section("Intro", "B7+ D#m7 C#m7 F#7"), section("Verso", "B7+ D#m7 C#m7 F#7"));
  const shifted = transposeSongModel(model, 1, "flat");
  assert.equal(shifted.sections[0].lines[0].text, "C7+ Em7 Dm7 G7");
  assert.equal(shifted.blocks[1].chords[0].chord.spelling, "C7+");
  assert.equal(shifted.analysis.repeatedPatterns[1].decision, "EXACT_REPEAT");
  assert.equal(model.sections[0].lines[0].text, "B7+ D#m7 C#m7 F#7");
});
