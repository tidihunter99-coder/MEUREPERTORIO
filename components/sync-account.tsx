"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SyncAccount({ onAuthChange }: { onAuthChange: (userId: string | null) => void }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auth") === "error") {
      window.history.replaceState(null, "", window.location.pathname);
      queueMicrotask(() => {
        setOpen(true);
        setMessage("O link expirou ou é inválido. Peça um novo link de acesso.");
      });
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.user?.email || null);
      onAuthChange(data.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserEmail(session?.user.email || null);
      onAuthChange(session?.user.id || null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase, onAuthChange]);

  if (!supabase) return null;

  async function sendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMessage(error ? "Não foi possível enviar o link. Confira o e-mail e tente novamente." : "Link enviado. Abra o e-mail neste dispositivo para entrar.");
    setBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) setMessage("Não foi possível sair. Tente novamente.");
    else { setOpen(false); setMessage(""); }
    setBusy(false);
  }

  return <>
    <button className="sync-account-button" onClick={() => { setMessage(""); setOpen(true); }} title={userEmail || undefined}>
      {userEmail ? "Minha conta" : "Entrar para sincronizar"}
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="app-dialog sync-account-dialog">
        <DialogHeader>
          <DialogTitle>{userEmail ? "Minha conta" : "Sincronizar repertório"}</DialogTitle>
          <DialogDescription>{userEmail ? "Seu repertório é sincronizado com esta conta quando há conexão." : "Entre por e-mail para acessar seu repertório em outros dispositivos."}</DialogDescription>
        </DialogHeader>
        {userEmail ? <div className="sync-account-form"><p>{userEmail}</p><button type="button" onClick={signOut} disabled={busy}>Sair da conta</button></div> :
          <form className="sync-account-form" onSubmit={sendLink}>
            <label htmlFor="sync-email">Seu e-mail</label>
            <input id="sync-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
            <button className="primary" type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar link de acesso"}</button>
          </form>}
        {message && <p className="sync-account-message" role="status">{message}</p>}
      </DialogContent>
    </Dialog>
  </>;
}
