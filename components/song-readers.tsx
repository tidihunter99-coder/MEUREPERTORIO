"use client";

import { useState } from "react";
import type { ChordRole, MusicLine, SongModel } from "@/lib/song-model";

type Props = { model: SongModel; fontSize: number; display?: "all" | "chords" | "lyrics" };
const blockName = (model: SongModel, id: string) => {
  const index = model.blocks.findIndex(block => block.id === id);
  return index < 0 ? "?" : String.fromCharCode(65 + index % 26);
};

function renderLine(line: MusicLine) { return line.text; }

export function NormalReader({ model, fontSize }: Props) {
  return <div className="normal-reader" style={{ fontSize }} aria-label="Cifra normal">
    {model.sections.map((section, sectionIndex) => <section key={sectionIndex}>
      {section.explicit && <h2>{section.name}</h2>}
      {section.lines.map((line, index) => <div key={index} className={`score-line ${line.kind}`}>{renderLine(line) || "\u00a0"}</div>)}
    </section>)}
  </div>;
}

export function StructuredReader({ model, fontSize, display = "all" }: Props) {
  const patterns = new Map(model.analysis.repeatedPatterns.map(pattern => [pattern.blockId, pattern]));
  return <div className="sections-stack" aria-label="Visual estruturado">{model.sections.map((section, sectionIndex) =>
    <article key={sectionIndex} className={`section-card ${section.tone}`}><div className="section-label"><span>{section.name}</span></div><div className="score-lines" style={{ fontSize }}>
      {section.lines.map((line, lineIndex) => {
        if (display !== "all" && (display === "chords" ? line.kind !== "chords" : line.kind === "chords")) return null;
        const pattern = patterns.get(`${sectionIndex}:${lineIndex}`);
        return <div key={lineIndex} className={`score-line ${line.kind}${line.fast ? " fast" : ""}`}>{line.chords.length > 0 && <small className="visual-block-tag">{blockName(model, `${sectionIndex}:${lineIndex}`)}</small>}{renderLine(line) || "\u00a0"}{pattern?.compact && <small className="pattern-hint">{pattern.decision === "EXACT_REPEAT" ? `↻ ${blockName(model, pattern.referenceId)}` : `↻ ${blockName(model, pattern.referenceId)} · saída alternativa`}</small>}</div>;
      })}
    </div></article>)}
  </div>;
}

export function MarcosReader({ model, fontSize }: Props) {
  const patterns = new Map(model.analysis.repeatedPatterns.map(pattern => [pattern.blockId, pattern]));
  return <div className="marcus-sheet marcus-compact" aria-label="Modo Marcos Tecladista">{model.sections.map((section, sectionIndex) =>
    <div className="marcus-section" key={sectionIndex}><h2>{section.name}</h2>{section.lines.map((line, lineIndex) => {
      if (line.kind === "lyrics") return null;
      if (line.kind === "note") return line.text.trim() && <p className="marcus-note" key={lineIndex}>{line.text}</p>;
      const pattern = patterns.get(`${sectionIndex}:${lineIndex}`);
      return <div className="marcus-entry" key={lineIndex}><span className="marcus-bullet" aria-hidden="true"/><div className={`marcus-entry-chords${line.fast ? " fast" : ""}`} style={{ fontSize }}><small className="block-tag">{blockName(model, `${sectionIndex}:${lineIndex}`)}</small>
        {pattern?.compact ? <span className="repeat-token" title={pattern.reason}>↻ {blockName(model, pattern.referenceId)}{pattern.changedEnding ? ` → ${pattern.changedEnding}` : ""}</span> : <span>{renderLine(line)}</span>}
      </div></div>;
    })}</div>)}
  </div>;
}

export function TimingReader({ model, fontSize, onRoleChange }: Props & { onRoleChange: (id: string, role: ChordRole) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <div className="timing-reader" aria-label="Guia de tempo">{model.sections.map((section, sectionIndex) =>
    <section key={sectionIndex}><h2>{section.name}</h2>{section.lines.map((line, lineIndex) => line.kind === "chords" && line.chords.length ?
      <div className="timing-row" style={{ fontSize }} key={lineIndex}>{line.chords.map(event => <span key={event.id} className={`timing-chord ${event.role}`}>
        <button type="button" aria-label={`${event.chord.spelling}, ${event.role === "sustained" ? "sustentado" : event.role === "passage" ? "passagem" : "normal"}. Alterar interpretação`} onClick={() => setSelected(selected === event.id ? null : event.id)}>{event.chord.spelling}{event.role === "sustained" ? "%" : ""}</button>
        {selected === event.id && <select autoFocus aria-label={`Interpretação de ${event.chord.spelling}`} value={event.role} onChange={change => { onRoleChange(event.id, change.target.value as ChordRole); setSelected(null); }}><option value="normal">Normal / remover %</option><option value="sustained">Sustentado / adicionar %</option><option value="passage">Passagem / agrupar</option></select>}
      </span>)}</div> : null)}</section>)}
  <p className="timing-help">Toque em um acorde para marcar sustentação, passagem ou voltar ao normal. % significa sustentar.</p></div>;
}

export function AnalysisDebug({ model }: { model: SongModel }) {
  return <details className="analysis-debug"><summary>Depuração da análise</summary>{model.blocks.map(block => {
    const pattern = model.analysis.repeatedPatterns.find(item => item.blockId === block.id);
    return <div key={block.id}><b>Bloco {blockName(model, block.id)} · {block.sectionName}</b><code>{block.chords.map(event => event.chord.spelling).join(" → ")}</code><span>{pattern?.decision} · confiança {Math.round((pattern?.confidence || 0) * 100)}%{pattern?.referenceId ? ` · compara com ${blockName(model, pattern.referenceId)}` : ""}</span><small>{pattern?.reason}</small></div>;
  })}</details>;
}
