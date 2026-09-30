"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ClipboardPaste, ImagePlus, PenLine, Settings2, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHARPS, type ScoreLine, type ScoreSection } from "@/lib/music";
import { parseSong } from "@/lib/song-parser";
import { createSongModel } from "@/lib/music-analyzer";
import { newId, type Song } from "@/lib/repertoire";

export type ComposerMode = "choose" | "text" | "photo" | "manual" | "edit";
type SourceKind = "text" | "photo" | "manual";
type ReadingMode = "normal" | "visual" | "marcus" | "tempo";

const PARTS = ["Intro", "Verso", "Pré-Refrão", "Refrão", "Ponte", "Solo", "Final", "Observação"];
const emptySection = (name = "Intro"): ScoreSection => ({ name, tone: toneFor(name), lines: [{ text: "", kind: "chords" }] });

function toneFor(name: string): ScoreSection["tone"] {
  const lower = name.toLocaleLowerCase("pt-BR");
  if (/intro/.test(lower)) return "intro";
  if (/refr/.test(lower)) return "chorus";
  if (/ponte|pré/.test(lower)) return "bridge";
  if (/solo|final/.test(lower)) return "final";
  return "verse";
}

function sectionsToText(sections: ScoreSection[]): string {
  return sections.map(section => "[" + section.name + "]\n" + section.lines.map(line => line.text).join("\n")).join("\n\n");
}

async function photoPreview(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1500 / bitmap.width, 1800 / bitmap.height);
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.76;
  let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > 600_000 && quality > 0.35) {
    quality -= 0.1;
    data = canvas.toDataURL("image/jpeg", quality);
  }
  if (data.length > 750_000) throw new Error("A imagem ficou grande demais para salvar. Escolha uma foto menor.");
  return data;
}

function composerStart(mode: ComposerMode, initialSong?: Song | null) {
  const draftKey = initialSong ? "mr-song-draft-" + initialSong.id : "mr-song-draft-new";
  const base = {
    step: mode,
    sourceKind: (initialSong?.sourceKind || (mode === "photo" ? "photo" : mode === "text" ? "text" : "manual")) as SourceKind,
    title: initialSong?.title || "",
    titleTouched: Boolean(initialSong?.title),
    artist: initialSong?.artist === "Artista não informado" ? "" : initialSong?.artist || "",
    key: initialSong?.key || "C",
    keyTouched: false,
    preferredMode: (initialSong?.preferredMode || "visual") as ReadingMode,
    tags: initialSong?.tags?.join(", ") || "",
    raw: initialSong?.sourceText || initialSong?.originalContent || (initialSong ? sectionsToText(initialSong.sections) : ""),
    rawChanged: false,
    advancedTouched: false,
    photoData: initialSong?.photoData || "",
    sections: initialSong?.sections.map(section => ({ ...section, lines: section.lines.map(line => ({ ...line })) })) || [emptySection()],
    restored: false,
  };
  if (typeof window === "undefined") return base;
  try {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      const draft = JSON.parse(saved);
      return { ...base, ...draft, step: mode, rawChanged: draft.rawChanged ?? draft.raw !== base.raw, restored: true } as typeof base;
    }
  } catch { /* The saved song remains available if its draft is damaged. */ }
  return base;
}

export function SongComposer({ open, mode, initialSong, close, save }: {
  open: boolean;
  mode: ComposerMode;
  initialSong?: Song | null;
  close: () => void;
  save: (song: Song) => void;
}) {
  const [start] = useState(() => composerStart(mode, initialSong));
  const [step, setStep] = useState<ComposerMode>(start.step);
  const [sourceKind, setSourceKind] = useState<SourceKind>(start.sourceKind);
  const [title, setTitle] = useState(start.title);
  const [titleTouched, setTitleTouched] = useState(start.titleTouched);
  const [artist, setArtist] = useState(start.artist);
  const [key, setKey] = useState(start.key);
  const [keyTouched, setKeyTouched] = useState(start.keyTouched);
  const [preferredMode, setPreferredMode] = useState<ReadingMode>(start.preferredMode);
  const [tags, setTags] = useState(start.tags);
  const [raw, setRaw] = useState(start.raw);
  const [rawChanged, setRawChanged] = useState(start.rawChanged);
  const [photoData, setPhotoData] = useState(start.photoData);
  const [sections, setSections] = useState<ScoreSection[]>(start.sections);
  const [advancedTouched, setAdvancedTouched] = useState(start.advancedTouched);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(start.restored ? "Rascunho recuperado automaticamente." : "");
  const draftKey = initialSong ? "mr-song-draft-" + initialSong.id : "mr-song-draft-new";
  const parsed = useMemo(() => parseSong(raw, { inferTitle: sourceKind !== "manual" && !titleTouched }), [raw, sourceKind, titleTouched]);
  const previewSections = advancedTouched || (!rawChanged && initialSong) ? sections : parsed.sections;
  const hasText = previewSections.some(section => section.lines.some(line => line.text.trim()));
  const hasContent = Boolean(raw.trim() || photoData || hasText);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          step, sourceKind, title, titleTouched, artist, key, keyTouched, preferredMode, tags,
          raw, rawChanged, photoData, sections, advancedTouched,
        }));
      } catch {
        setMessage("O rascunho não coube neste dispositivo. Salve a música para não perder as alterações.");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [open, draftKey, step, sourceKind, title, titleTouched, artist, key, keyTouched, preferredMode, tags, raw, rawChanged, photoData, sections, advancedTouched]);

  function fillDetectedFields(text: string, kind: SourceKind) {
    const detected = parseSong(text, { inferTitle: kind !== "manual" && !titleTouched });
    if (!titleTouched && !title.trim() && detected.title !== "Nova música") setTitle(detected.title);
    if (!artist.trim() && detected.artist !== "Artista não informado") setArtist(detected.artist);
    if (!keyTouched && detected.key !== "C") setKey(detected.key);
  }

  function changeRaw(value: string) {
    setRaw(value);
    setRawChanged(true);
    setAdvancedTouched(false);
    fillDetectedFields(value, sourceKind);
  }

  function chooseMethod(kind: SourceKind) {
    setSourceKind(kind);
    setStep(kind);
    setMessage("");
  }

  function editSections(change: (current: ScoreSection[]) => ScoreSection[]) {
    setSections(change(previewSections));
    setAdvancedTouched(true);
  }

  function changeSection(index: number, patch: Partial<ScoreSection>) {
    editSections(current => current.map((section, i) => i === index ? { ...section, ...patch } : section));
  }

  function changeLine(sectionIndex: number, lineIndex: number, patch: Partial<ScoreLine>) {
    editSections(current => current.map((section, i) => i === sectionIndex ? {
      ...section,
      lines: section.lines.map((line, j) => j === lineIndex ? { ...line, ...patch } : line),
    } : section));
  }

  async function handlePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Escolha uma imagem da câmera ou galeria."); return; }
    if (file.size > 12_000_000) { setMessage("Escolha uma imagem de até 12 MB."); return; }
    setBusy(true);
    setSourceKind("photo");
    setStep("photo");
    setMessage("Preparando a foto...");
    try {
      setPhotoData(await photoPreview(file));
      setMessage("Lendo a foto. A primeira leitura pode demorar alguns instantes...");
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("por");
      try {
        const result = await worker.recognize(file);
        const detected = result.data.text.trim();
        if (detected) {
          setRaw(detected);
          setRawChanged(true);
          setAdvancedTouched(false);
          fillDetectedFields(detected, "photo");
          setMessage("Foto lida. Confira a pré-visualização e corrija o texto se precisar.");
        } else {
          setMessage("Não foi possível ler texto da foto. A imagem foi mantida; você pode escrever o conteúdo abaixo.");
        }
      } finally { await worker.terminate(); }
    } catch (error) {
      setMessage(error instanceof Error && error.message.includes("grande") ? error.message : "A leitura automática não terminou. A foto foi mantida; você pode escrever o conteúdo abaixo.");
    } finally { setBusy(false); }
  }

  async function handleTextFile(file?: File) {
    if (!file) return;
    if (file.size > 1_000_000) { setMessage("Escolha um arquivo de texto de até 1 MB."); return; }
    try { setSourceKind("text"); setStep("text"); changeRaw(await file.text()); setMessage("Texto importado. Confira os acordes antes de salvar."); }
    catch { setMessage("Não foi possível ler o arquivo de texto."); }
  }

  function saveSong() {
    if (!title.trim() || !hasContent || busy) return;
    const normalized = previewSections
      .map(section => ({ ...section, name: section.name.trim() || "Parte", tone: toneFor(section.name), lines: section.lines.map(line => ({ ...line })) }))
      .filter(section => section.lines.some(line => line.text.trim()));
    const originalContent = initialSong?.originalContent ?? raw;
    save({
      id: initialSong?.id || newId(),
      title: title.trim(),
      artist: artist.trim() || "Artista não informado",
      key,
      bpm: initialSong?.bpm,
      time: initialSong?.time,
      favorite: initialSong?.favorite || false,
      sections: normalized,
      sourceText: raw || undefined,
      originalContent,
      musicModel: createSongModel(originalContent, normalized, { roles: initialSong?.musicModel?.blocks.flatMap(block => block.chords).reduce<Record<string, "normal" | "sustained" | "passage">>((roles, event) => { if (event.roleConfidence === 1) roles[event.id] = event.role; return roles; }, {}) }),
      preferredMode,
      tags: [...new Set(tags.split(",").map(tag => tag.trim()).filter(Boolean))],
      photoData: photoData || undefined,
      sourceKind,
      lastOpenedAt: initialSong?.lastOpenedAt,
      createdAt: initialSong?.createdAt || new Date().toISOString(),
      playCount: initialSong?.playCount || 0,
      preferredKey: initialSong?.preferredKey,
      updatedAt: new Date().toISOString(),
    });
    try { localStorage.removeItem(draftKey); } catch { /* The song has already been saved. */ }
  }

  return <Dialog open={open} onOpenChange={value => !value && close()}>
    <DialogContent className="app-dialog composer-dialog composer-simple-dialog" showCloseButton={false}>
      <DialogHeader>
        <div className="composer-heading">
          <div><DialogTitle>{initialSong ? "Editar música" : "Adicionar música"}</DialogTitle><DialogDescription>Cadastre uma vez e encontre em Minhas Músicas quando precisar.</DialogDescription></div>
          <button className="icon-btn" onClick={close} aria-label="Fechar"><X size={18}/></button>
        </div>
      </DialogHeader>

      <div className="composer-simple-fields">
        <label>Título da música<input autoFocus value={title} onChange={event => { setTitle(event.target.value); setTitleTouched(true); }} placeholder="Ex.: Coração Partido"/></label>
        <label>Artista/Banda<input value={artist} onChange={event => setArtist(event.target.value)} placeholder="Opcional"/></label>
        <label>Tom original<select value={key} onChange={event => { setKey(event.target.value); setKeyTouched(true); }}>{SHARPS.map(note => <option key={note}>{note}</option>)}</select></label>
      </div>

      <section className="composer-main-area" aria-label="Adicione sua música">
        <div className="composer-main-heading"><span className="composer-music-symbol" aria-hidden="true">♫</span><div><h2>Adicione sua música</h2><p>Cole tudo de uma vez, envie uma foto ou escreva livremente.</p></div></div>
        <div className="composer-methods">
          <button className={step !== "choose" && sourceKind === "text" ? "active" : ""} onClick={() => chooseMethod("text")} aria-pressed={step !== "choose" && sourceKind === "text"}><ClipboardPaste size={22}/><strong>Colar cifra ou letra</strong><small>De site, WhatsApp ou notas</small></button>
          <button className={step !== "choose" && sourceKind === "photo" ? "active" : ""} onClick={() => chooseMethod("photo")} aria-pressed={step !== "choose" && sourceKind === "photo"}><Camera size={22}/><strong>Importar foto</strong><small>Foto ou print da música</small></button>
          <button className={step !== "choose" && sourceKind === "manual" ? "active" : ""} onClick={() => chooseMethod("manual")} aria-pressed={step !== "choose" && sourceKind === "manual"}><PenLine size={22}/><strong>Escrever manualmente</strong><small>Como em um bloco de notas</small></button>
        </div>
        {step !== "choose" && <div className="composer-input">
          {sourceKind === "text" && <label className="composer-text-file">Importar arquivo .txt<input type="file" accept=".txt,text/plain" onChange={event => void handleTextFile(event.target.files?.[0])}/></label>}
          {sourceKind === "photo" && <div className="composer-photo">
            <div className="photo-actions"><label><Camera size={17}/> Tirar foto<input type="file" accept="image/*" capture="environment" onChange={event => void handlePhoto(event.target.files?.[0])}/></label><label><ImagePlus size={17}/> Escolher imagem<input type="file" accept="image/*" onChange={event => void handlePhoto(event.target.files?.[0])}/></label></div>
            {photoData && <img src={photoData} alt="Foto original da anotação"/>}
            <small>A foto original fica junto da música.</small>
          </div>}
          <label className="composer-raw-label">{sourceKind === "text" ? "Cole a cifra ou letra completa" : sourceKind === "photo" ? "Texto da foto — corrija se precisar" : "Escreva sua música"}
            <textarea value={raw} onChange={event => changeRaw(event.target.value)} placeholder={sourceKind === "manual" ? "Escreva aqui do seu jeito. Pode usar acordes, letra, espaços e observações." : "Cole aqui a música inteira. Acordes, letra, refrão e espaços serão organizados automaticamente."}/>
          </label>
        </div>}
      </section>

      {message && <p className="composer-message" role="status">{message}</p>}

      {hasContent && <section className="composer-preview" aria-label="Pré-visualização da música">
        <div className="composer-preview-heading"><div><h2>Pré-visualização da música</h2><p>O formato é criado automaticamente. Revise antes de salvar.</p></div><div className="composer-mode-switch" role="group" aria-label="Modo de visualização"><button className={preferredMode === "visual" ? "active" : ""} onClick={() => setPreferredMode("visual")}>Visual Estruturado</button><button className={preferredMode === "marcus" ? "active" : ""} onClick={() => setPreferredMode("marcus")}>Marcos • Tecladista</button></div></div>
        <div className={"composer-preview-body " + (preferredMode === "marcus" ? "compact" : "")}>
          {photoData && <img src={photoData} alt="Prévia da foto original"/>}
          {previewSections.filter(section => section.lines.some(line => line.text.trim())).map((section, index) => <div className="composer-preview-section" key={index}><h3>{section.name}</h3>{section.lines.filter(line => preferredMode === "visual" || line.kind !== "lyrics").map((line, lineIndex) => <div className={"composer-preview-line " + line.kind + (line.fast ? " fast" : "")} key={lineIndex}>{line.text || "\u00a0"}</div>)}</div>)}
          {!hasText && photoData && <p className="composer-preview-empty">Foto preservada. Você pode salvar agora ou escrever o conteúdo para criar uma versão editável.</p>}
        </div>
      </section>}

      <button className="composer-advanced-toggle" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(value => !value)}><Settings2 size={17}/> Edição avançada <span>{advancedOpen ? "Ocultar" : "Abrir"}</span></button>
      {advancedOpen && <div className="composer-advanced">
        <p>Opcional: ajuste partes, tipos de linha e passagens rápidas.</p>
        <label className="composer-tags">Tags ou categorias<input value={tags} onChange={event => setTags(event.target.value)} placeholder="Samba, show, ensaio"/></label>
        {previewSections.map((section, sectionIndex) => <div className="composer-section" key={sectionIndex}>
          <div className="composer-section-title"><input aria-label={"Nome da parte " + (sectionIndex + 1)} value={section.name} onChange={event => changeSection(sectionIndex, { name: event.target.value, tone: toneFor(event.target.value) })}/><button aria-label={"Remover parte " + section.name} disabled={previewSections.length === 1} onClick={() => editSections(current => current.filter((_, i) => i !== sectionIndex))}><Trash2 size={16}/></button></div>
          {section.lines.map((line, lineIndex) => <div className="composer-line" key={lineIndex}>
            <select aria-label="Tipo da linha" value={line.kind} onChange={event => changeLine(sectionIndex, lineIndex, { kind: event.target.value as ScoreLine["kind"] })}><option value="chords">Acordes</option><option value="lyrics">Letra</option><option value="note">Observação</option></select>
            <textarea aria-label={"Linha " + (lineIndex + 1) + " de " + section.name} rows={1} value={line.text} onChange={event => changeLine(sectionIndex, lineIndex, { text: event.target.value })} placeholder={line.kind === "chords" ? "G  D/F#  Em" : line.kind === "lyrics" ? "Escreva a letra" : "Sua anotação"}/>
            <button aria-label="Excluir linha" onClick={() => changeSection(sectionIndex, { lines: section.lines.filter((_, i) => i !== lineIndex) })}><X size={16}/></button>
            {line.kind === "chords" && <label className="fast-line"><input type="checkbox" checked={Boolean(line.fast)} onChange={event => changeLine(sectionIndex, lineIndex, { fast: event.target.checked })}/> Passagem rápida</label>}
          </div>)}
          <div className="composer-add-lines"><button onClick={() => changeSection(sectionIndex, { lines: [...section.lines, { text: "", kind: "chords" }] })}>+ Acordes</button><button onClick={() => changeSection(sectionIndex, { lines: [...section.lines, { text: "", kind: "lyrics" }] })}>+ Letra</button><button onClick={() => changeSection(sectionIndex, { lines: [...section.lines, { text: "", kind: "note" }] })}>+ Observação</button></div>
        </div>)}
        <div className="composer-parts">{PARTS.map(part => <button key={part} onClick={() => editSections(current => [...current, emptySection(part)])}>+ {part}</button>)}<button onClick={() => editSections(current => [...current, emptySection("Minha parte")])}>+ Bloco personalizado</button></div>
      </div>}

      <div className="composer-simple-footer"><button onClick={close}>Cancelar</button><button className="primary" disabled={!title.trim() || !hasContent || busy} onClick={saveSong}>{busy ? "Lendo foto..." : "Salvar música"}</button></div>
    </DialogContent>
  </Dialog>;
}
