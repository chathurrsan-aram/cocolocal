"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";

function bytes(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}
export default function WheelGate() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1000);
  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "coco-wheel-size") return;
      const next = Number(event.data.height);
      if (Number.isFinite(next) && next >= 400 && next <= 2400) setHeight(next + 10);
    };
    window.addEventListener("message", resize);
    return () => window.removeEventListener("message", resize);
  }, []);
  const [password, setPassword] = useState("");
  const [html, setHtml] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/wheel-preview.enc.json", { cache: "no-store" });
      if (!response.ok) throw new Error("download");
      const data = await response.json();
      const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: bytes(data.salt), iterations: data.iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(data.iv) }, key, bytes(data.ciphertext));
      const content = new TextDecoder().decode(plaintext);
      if (!content.startsWith("<!doctype html>")) throw new Error("format");
      setHtml(content); setPassword("");
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "download" ? "The preview could not load. Please try again." : "That password didn’t unlock the preview. Please try again.");
    } finally { setBusy(false); }
  }
  if (html) return <section className="wheel-unlocked"><div className="wrap wheel-toolbar"><span>Private wheel demo · results are not redeemable</span><button onClick={() => setHtml(null)}><LockKeyhole size={15}/> Lock preview</button></div><iframe ref={frame} style={{height}} title="Coco Local daily spin demo" srcDoc={html} sandbox="allow-scripts allow-same-origin" className="wheel-frame"/></section>;
  return <section className="wrap wheel-gate"><div className="wheel-gate-art" aria-hidden="true"><div className="mini-wheel"><Sparkles size={48}/></div></div><div className="wheel-gate-copy"><p className="eyebrow">A LITTLE LOCAL LUCK</p><h1>A daily spin.<br/><span>A little treat.</span></h1><p className="intro">We’re trying something new. Enter the preview password to test Coco Local’s daily prize wheel.</p><form onSubmit={unlock}><label htmlFor="wheel-password">Preview password</label><input id="wheel-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} aria-describedby={error ? "wheel-error" : undefined}/><button className="button" disabled={busy}>{busy ? "Unlocking…" : "Unlock the wheel →"}</button>{error && <p id="wheel-error" role="alert">{error}</p>}</form><p className="wheel-gate-note"><LockKeyhole size={15}/> Private demo. No prizes can be claimed yet.</p></div></section>;
}
