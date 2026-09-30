import type { NormalizedChord, ScoreSection } from "./music.ts";

export type ChordRole = "normal" | "sustained" | "passage";
export type PatternDecision = "EXACT_REPEAT" | "REPEAT_WITH_ENDING" | "PARTIAL_REPEAT" | "UNCERTAIN" | "NEW_STRUCTURE";
export type ChordEvent = { id: string; chord: NormalizedChord; column: number; lyricLine?: number; lyricColumn?: number; role: ChordRole; roleConfidence: number };
export type MusicLine = { text: string; kind: "chords" | "lyrics" | "note"; fast?: boolean; chords: ChordEvent[] };
export type MusicSection = { name: string; tone: ScoreSection["tone"]; explicit: boolean; lines: MusicLine[]; confidence: number };
export type HarmonicBlock = { id: string; sectionIndex: number; lineIndex: number; chords: ChordEvent[]; sectionName: string; lyricText?: string; role: "sequence" | "passage"; confidence: number };
export type Pattern = { blockId: string; referenceId: string; decision: PatternDecision; confidence: number; similarity: number; changedEnding?: string; reason: string; compact: boolean };
export type SongModel = { version: 1; originalContent: string; sections: MusicSection[]; blocks: HarmonicBlock[]; analysis: { repeatedPatterns: Pattern[]; transitions: string[]; sustainedChords: string[]; uncertainRegions: string[] } };
export type AnalysisOptions = { autoThreshold?: number; suggestionThreshold?: number; roles?: Record<string, ChordRole> };
