import type { AnalysisOptions, HarmonicBlock, Pattern, PatternDecision } from "./song-model.ts";

export function compareBlocks(reference: HarmonicBlock, current: HarmonicBlock): { decision: PatternDecision; similarity: number; confidence: number; changedEnding?: string; reason: string } {
  const a = reference.chords.map(event => event.chord.identity);
  const b = current.chords.map(event => event.chord.identity);
  if (a.length < 2 || b.length < 2 || reference.role === "passage" || current.role === "passage")
    return { decision: "NEW_STRUCTURE", similarity: 0, confidence: 1, reason: "Bloco curto ou passagem" };
  const equal = a.reduce((count, value, index) => count + Number(value === b[index]), 0);
  const similarity = equal / Math.max(a.length, b.length);
  if (a.length === b.length && equal === a.length) return { decision: "EXACT_REPEAT", similarity: 1, confidence: a.length >= 4 ? 0.98 : a.length === 3 ? 0.88 : 0.58, reason: "Mesma progressão harmônica na mesma ordem" };
  if (a.length === b.length && a.length >= 4 && a.slice(0, -1).every((value, index) => value === b[index]))
    return { decision: "REPEAT_WITH_ENDING", similarity, confidence: 0.92, changedEnding: current.chords.at(-1)?.chord.spelling, reason: "Progressão principal igual; acorde de saída diferente" };
  if (a.length >= 4 && b.length >= 4 && similarity >= 0.7) return { decision: "PARTIAL_REPEAT", similarity, confidence: 0.68, reason: "Parte da progressão coincide; exibir acordes para segurança" };
  return { decision: "NEW_STRUCTURE", similarity, confidence: 1, reason: "Progressão distinta" };
}

export function detectPatterns(blocks: HarmonicBlock[], options: AnalysisOptions = {}): Pattern[] {
  const auto = options.autoThreshold ?? 0.9;
  const suggest = options.suggestionThreshold ?? 0.7;
  return blocks.map((block, index) => {
    let best: (ReturnType<typeof compareBlocks> & { reference: HarmonicBlock }) | null = null;
    for (let previous = 0; previous < index; previous++) {
      const reference = blocks[previous];
      const comparison = compareBlocks(reference, block);
      if (comparison.decision === "NEW_STRUCTURE") continue;
      const sameLyric = Boolean(reference.lyricText && block.lyricText && reference.lyricText === block.lyricText);
      const sameSection = reference.sectionName.toLocaleLowerCase("pt-BR") === block.sectionName.toLocaleLowerCase("pt-BR");
      const earlierContext = previous > 0 && index > 0 && blocks[previous - 1].chords.at(-1)?.chord.identity === blocks[index - 1].chords.at(-1)?.chord.identity;
      comparison.confidence = Math.max(0, Math.min(0.99, comparison.confidence + (sameLyric ? 0.015 : 0) + (sameSection ? 0.005 : -0.015) + (earlierContext ? 0.005 : 0)));
      if (sameLyric) comparison.reason += "; mesma letra";
      const score = comparison.confidence + comparison.similarity * 0.01 + Math.min(reference.chords.length, 6) * 0.001;
      if (!best || score > best.confidence + best.similarity * 0.01 + Math.min(best.reference.chords.length, 6) * 0.001) best = { ...comparison, reference };
    }
    if (!best) return { blockId: block.id, referenceId: "", decision: "NEW_STRUCTURE", confidence: 1, similarity: 0, reason: "Primeira ocorrência desta estrutura", compact: false };
    const compact = best.confidence >= auto && (best.decision === "EXACT_REPEAT" || best.decision === "REPEAT_WITH_ENDING");
    return { blockId: block.id, referenceId: best.reference.id, decision: best.confidence < suggest ? "UNCERTAIN" : best.decision, confidence: best.confidence, similarity: best.similarity, changedEnding: best.changedEnding, reason: best.reason, compact };
  });
}
