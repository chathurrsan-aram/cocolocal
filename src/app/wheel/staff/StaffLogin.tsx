"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLogin({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/wheel/staff/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setBusy(false);
    if (data?.ok) return router.refresh();
    setError(data?.error === "locked" ? "Too many wrong tries. Wait 15 minutes and try again." : data?.error === "no-pin-set" ? "No staff PIN is set for this site yet (WHEEL_STAFF_PIN)." : "That PIN isn’t right.");
  }
  return (
    <form className="staff-card" style={{ maxWidth: 380, marginTop: 28 }} onSubmit={submit}>
      <label htmlFor="staff-pin"><strong>Staff PIN</strong></label>
      <input id="staff-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={e => setPin(e.target.value)} required />
      <button className="button" disabled={busy}>Sign in</button>
      {error && <p className="wheel-error" role="alert">{error}</p>}
      {demo && <p className="wheel-small">Preview demo mode: the PIN is 2468 unless WHEEL_STAFF_PIN is set.</p>}
    </form>
  );
}
