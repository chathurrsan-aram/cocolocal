'use client';

import { FormEvent, useState } from 'react';

function bytes(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

export default function PropertyGuide() {
  const [password, setPassword] = useState('');
  const [guide, setGuide] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/property-guide.enc.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('download');
      const payload = await response.json();
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: bytes(payload.salt), iterations: payload.iterations, hash: 'SHA-256' },
        material, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
      );
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(payload.iv) }, key, bytes(payload.ciphertext));
      const html = new TextDecoder().decode(plaintext);
      if (!html.startsWith('<!doctype html>')) throw new Error('format');
      setGuide(html);
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'download'
        ? 'The guide could not be loaded. Please check your connection and try again.'
        : 'That password did not unlock the guide. Please check it and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#f4f5ef', overflow: 'auto', color: '#203b32' }}>
      {guide ? <>
        <iframe title="Coco Local property photo guide" srcDoc={guide} sandbox="allow-scripts allow-popups allow-downloads" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        <button onClick={() => setGuide(null)} aria-label="Lock the property guide" style={{ position: 'absolute', top: 7, right: 9, zIndex: 2, background: '#193e33', color: '#fff', border: '1px solid #849e8a', borderRadius: 6, padding: '3px 8px', fontSize: 11 }}>Lock</button>
      </> : <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ maxWidth: 440, width: '100%', padding: '38px 32px', background: '#fff', border: '1px solid #dce3d7', borderRadius: 18, boxShadow: '0 15px 60px #183e3310' }}>
          <p style={{ letterSpacing: '.16em', fontSize: 11, color: '#52745f', margin: '0 0 18px' }}>COCO LOCAL · PRIVATE PROPERTY GUIDE</p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 35, lineHeight: 1.12, margin: '0 0 12px' }}>Explore the property</h1>
          <p style={{ color: '#68796d', fontSize: 15, marginBottom: 28 }}>Enter the password provided with your invitation to view the ground-floor plan and photographs.</p>
          <form onSubmit={unlock}>
            <label htmlFor="guide-password" style={{ display: 'block', marginBottom: 7, fontWeight: 600 }}>Password</label>
            <input id="guide-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} aria-describedby={error ? 'guide-error' : undefined} style={{ display: 'block', width: '100%', padding: '12px 14px', fontSize: 17, border: '1px solid #9aad9b', borderRadius: 7, color: '#203b32', background: '#fff' }} />
            {error && <p id="guide-error" role="alert" style={{ color: '#9a3d32', fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button type="submit" disabled={busy} style={{ width: '100%', padding: 13, background: '#245c4e', color: '#fff', border: 0, borderRadius: 7, fontSize: 16, marginTop: 16, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Opening guide…' : 'Open property guide →'}</button>
          </form>
          <p style={{ fontSize: 12, color: '#7b897f', margin: '24px 0 0' }}>210–212 High Road, South Benfleet</p>
        </section>
      </div>}
    </div>
  );
}
