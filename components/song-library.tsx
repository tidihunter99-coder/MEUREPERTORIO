"use client";

import { useMemo, useState } from "react";
import { Camera, ChevronRight, Copy, Heart, Music2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Setlist, Song } from "@/lib/repertoire";

type Filter = "all" | "favorites" | "recent" | "used";

export function SongLibrary({ songs, setlists, startFilter = "all", openSong, createSong, editSong, duplicateSong, deleteSong, favoriteSong, addSong }: {
  songs: Song[];
  setlists: Setlist[];
  startFilter?: Filter;
  openSong: (id: string) => void;
  createSong: () => void;
  editSong: (song: Song) => void;
  duplicateSong: (song: Song) => void;
  deleteSong: (song: Song) => void;
  favoriteSong: (song: Song) => void;
  addSong: (song: Song) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(startFilter);
  const [artistFilter, setArtistFilter] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const artists = useMemo(() => [...new Set(songs.map(song => song.artist).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")), [songs]);
  const keys = useMemo(() => [...new Set(songs.map(song => song.key))].sort(), [songs]);
  const tags = useMemo(() => [...new Set(songs.flatMap(song => song.tags || []))].sort((a, b) => a.localeCompare(b, "pt-BR")), [songs]);
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    setlists.forEach(list => list.entries.forEach(entry => counts.set(entry.songId, (counts.get(entry.songId) || 0) + 1)));
    return counts;
  }, [setlists]);
  const visible = useMemo(() => songs.filter(song => {
    const match = `${song.title} ${song.artist} ${song.key} ${(song.tags || []).join(" ")} ${song.sections.map(section => `${section.name} ${section.lines.map(line => line.text).join(" ")}`).join(" ")} ${song.sourceText || ""}`.toLocaleLowerCase("pt-BR");
    if (!match.includes(query.trim().toLocaleLowerCase("pt-BR"))) return false;
    if (filter === "favorites" && !song.favorite) return false;
    if (filter === "recent" && !song.lastOpenedAt) return false;
    if (filter === "used" && !usage.has(song.id) && !song.playCount) return false;
    if (artistFilter && song.artist !== artistFilter) return false;
    if (keyFilter && song.key !== keyFilter) return false;
    if (tagFilter && !song.tags?.includes(tagFilter)) return false;
    return true;
  }).sort((a, b) => filter === "recent" ? (b.lastOpenedAt || "").localeCompare(a.lastOpenedAt || "") : filter === "used" ? (b.playCount || 0) - (a.playCount || 0) || (usage.get(b.id) || 0) - (usage.get(a.id) || 0) : a.title.localeCompare(b.title, "pt-BR")), [songs, query, filter, artistFilter, keyFilter, tagFilter, usage]);

  return <main className="content library-view">
    <section className="page-heading"><div><p className="eyebrow">BIBLIOTECA PESSOAL</p><h1>Minhas Músicas</h1><p>Todas as suas músicas, dentro ou fora de repertórios.</p></div><button className="primary" onClick={createSong}><Plus size={18}/> Adicionar música</button></section>
    <div className="library-search"><Search size={20}/><input aria-label="Procurar nas minhas músicas" autoFocus placeholder="Procurar nas minhas músicas..." value={query} onChange={event => setQuery(event.target.value)}/><span>{visible.length} de {songs.length}</span></div>
    <div className="library-filters" aria-label="Filtrar músicas">{([ ["all", "Todas"], ["favorites", "Favoritas"], ["recent", "Recentes"], ["used", "Mais usadas"] ] as const).map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
    <div className="library-selects"><label>Artista<select value={artistFilter} onChange={event => setArtistFilter(event.target.value)}><option value="">Todos</option>{artists.map(artist => <option key={artist}>{artist}</option>)}</select></label><label>Tom<select value={keyFilter} onChange={event => setKeyFilter(event.target.value)}><option value="">Todos</option>{keys.map(key => <option key={key}>{key}</option>)}</select></label><label>Tag<select value={tagFilter} onChange={event => setTagFilter(event.target.value)}><option value="">Todas</option>{tags.map(tag => <option key={tag}>{tag}</option>)}</select></label></div>
    <div className="library-song-list">{visible.map(song => <article className="library-song" key={song.id}>
      <button className="library-song-main" onClick={() => openSong(song.id)}><span className="library-song-icon">{song.sourceKind === "photo" ? <Camera size={22}/> : <Music2 size={22}/>}</span><span className="library-song-copy"><strong>{song.title}</strong><small>{song.artist} · Tom {song.preferredKey || song.key}{usage.has(song.id) ? ` · ${usage.get(song.id)} repertório(s)` : " · Avulsa"}</small>{Boolean(song.tags?.length) && <span className="library-tags">{song.tags?.map(tag => <em key={tag}>{tag}</em>)}</span>}</span><ChevronRight size={18}/></button>
      <div className="library-song-actions"><button title="Favoritar" aria-label={`${song.favorite ? "Remover dos favoritos" : "Favoritar"} ${song.title}`} onClick={() => favoriteSong(song)}><Heart size={17} fill={song.favorite ? "currentColor" : "none"}/></button><button title="Editar" aria-label={`Editar ${song.title}`} onClick={() => editSong(song)}><Pencil size={17}/></button><button title="Adicionar ao repertório" aria-label={`Adicionar ${song.title} ao repertório`} onClick={() => addSong(song)}><Plus size={17}/></button><button title="Duplicar" aria-label={`Duplicar ${song.title}`} onClick={() => duplicateSong(song)}><Copy size={17}/></button><button title="Excluir" aria-label={`Excluir ${song.title}`} onClick={() => deleteSong(song)}><Trash2 size={17}/></button></div>
    </article>)}{!visible.length && <div className="empty-workspace"><Music2 size={30}/><h2>Nenhuma música encontrada</h2><p>{songs.length ? "Tente outra busca ou filtro." : "Adicione sua primeira música por texto, foto ou do zero."}</p><button className="primary" onClick={createSong}>+ Adicionar música</button></div>}</div>
  </main>;
}
