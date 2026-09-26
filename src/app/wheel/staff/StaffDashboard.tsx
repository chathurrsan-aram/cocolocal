"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { outcomes, wheelConfig } from "@/data/wheel";

type Summary = {
  week: string; spins: number; free: number; bonus: number; respin: number; spinAgain: number; notThisTime: number;
  wins: Record<string, number>; redeemed: Record<string, number>; bonusIssued: number; bonusUsed: number; optIns: number; demo?: boolean;
};
type Lookup = { status: string; prize?: { code: string; label: string; firstName: string; issuedAt: string; expiresAt: string }; redeemedAt?: string };

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: wheelConfig.timeZone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const prizes = outcomes.filter(o => o.kind === "prize");

export default function StaffDashboard({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [week, setWeek] = useState("");
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [count, setCount] = useState(30);
  const [sheet, setSheet] = useState<{ codes: string[]; createdAt: string } | null>(null);
  const [msg, setMsg] = useState("");

  const call = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
    if (res.status === 401) { router.refresh(); throw new Error("signed out"); }
    return res.json();
  }, [router]);

  const loadSummary = useCallback(async (w = "") => setSummary(await call(`/api/wheel/staff/summary${w ? `?week=${w}` : ""}`)), [call]);
  useEffect(() => { loadSummary().catch(() => {}); }, [loadSummary]);

  async function find(e: FormEvent) {
    e.preventDefault(); setMsg("");
    setLookup(await call(`/api/wheel/staff/prize?code=${encodeURIComponent(code)}`));
  }
  async function redeem() {
    const r = await call("/api/wheel/staff/prize", { method: "POST", body: JSON.stringify({ code }) });
    setLookup({ ...r, status: r.status === "redeemed-now" ? "redeemed-now" : r.status });
    loadSummary(week).catch(() => {});
  }
  async function makeCodes(e: FormEvent) {
    e.preventDefault(); setMsg("");
    const r = await call("/api/wheel/staff/bonus", { method: "POST", body: JSON.stringify({ count }) });
    if (!r.ok) return setMsg(r.error);
    setSheet({ codes: r.codes, createdAt: r.createdAt });
    loadSummary(week).catch(() => {});
  }
  async function signOut() { await fetch("/api/wheel/staff/logout", { method: "POST" }); router.refresh(); }

  const status: Record<string, [string, string]> = {
    valid: ["good", "Valid. Give the prize, then press Redeem."],
    "redeemed-now": ["good", "Redeemed. Give the prize now."],
    redeemed: ["bad", "Already used"],
    "already-redeemed": ["bad", "Already used"],
    expired: ["bad", "Expired. Don’t give the prize."],
    "not-found": ["bad", "No prize with that code."],
  };
  // Printed as a date only, one day early, so a code never stops working before the printed day ends.
  const validUntil = sheet && new Date(new Date(sheet.createdAt).getTime() + (wheelConfig.bonusValidDays - 1) * 864e5)
    .toLocaleDateString("en-GB", { timeZone: wheelConfig.timeZone, weekday: "short", day: "numeric", month: "short" });

  return (
    <>
      <div className="staff-row" style={{ marginTop: 14 }}>
        {demo && <span className="wheel-demo" style={{ marginTop: 0 }}>Preview demo: nothing here is saved.</span>}
        <button className="button secondary small" onClick={signOut}>Sign out</button>
      </div>
      <div className="staff-grid">
        <form className="staff-card" onSubmit={find}>
          <h2 style={{ fontSize: "1.3rem" }}>Check a prize code</h2>
          <input aria-label="Prize code" placeholder="COCO-7K2P" value={code} onChange={e => { setCode(e.target.value); setLookup(null); }} autoCapitalize="characters" required />
          <div className="staff-row"><button className="button">Look up</button>
            {lookup?.status === "valid" && <button type="button" className="button secondary" onClick={redeem}>Redeem</button>}</div>
          {lookup && (
            <div className={`staff-result ${status[lookup.status]?.[0] ?? "bad"}`} role="status">
              <strong>{status[lookup.status]?.[1] ?? lookup.status}</strong>
              {lookup.prize && <p>{lookup.prize.label} for {lookup.prize.firstName}<br />Won {when(lookup.prize.issuedAt)} · use by {when(lookup.prize.expiresAt)}{lookup.redeemedAt && <><br />Used {when(lookup.redeemedAt)}</>}</p>}
            </div>
          )}
        </form>

        <form className="staff-card" onSubmit={makeCodes}>
          <h2 style={{ fontSize: "1.3rem" }}>Bonus codes for £10+ spends</h2>
          <p className="wheel-small" style={{ marginTop: 0 }}>Print a sheet, cut it up and hand one code to each customer who spends over {wheelConfig.bonusMinimumSpend}. Each code gives one extra spin and lasts {wheelConfig.bonusValidDays} days.</p>
          <label className="staff-row">How many <input type="number" min={1} max={500} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: 100 }} /></label>
          <div className="staff-row"><button className="button">Make codes</button>
            {sheet && <button type="button" className="button secondary" onClick={() => window.print()}>Print sheet</button>}</div>
          {msg && <p className="wheel-error">{msg}</p>}
          {sheet && <p className="wheel-small">{sheet.codes.length} codes ready: {sheet.codes.slice(0, 3).join(", ")}{sheet.codes.length > 3 ? "…" : ""}</p>}
        </form>

        <div className="staff-card">
          <h2 style={{ fontSize: "1.3rem" }}>Weekly summary</h2>
          <div className="staff-row">
            <input aria-label="Week (e.g. 2026-W39)" placeholder="This week" value={week} onChange={e => setWeek(e.target.value)} style={{ width: 150 }} />
            <button className="button secondary small" onClick={() => loadSummary(week)}>Show</button>
          </div>
          {summary && (
            <table>
              <tbody>
                <tr><th>Week</th><td>{summary.week}</td></tr>
                <tr><th>Spins (free / bonus / re-spin)</th><td>{summary.spins} ({summary.free} / {summary.bonus} / {summary.respin})</td></tr>
                {prizes.map(p => <tr key={p.id}><th>{p.label}: won / redeemed</th><td>{summary.wins[p.id] ?? 0} / {summary.redeemed[p.id] ?? 0}</td></tr>)}
                <tr><th>Spin again / not this time</th><td>{summary.spinAgain} / {summary.notThisTime}</td></tr>
                <tr><th>Bonus codes made / used</th><td>{summary.bonusIssued} / {summary.bonusUsed}</td></tr>
                <tr><th>New marketing opt-ins</th><td>{summary.optIns}</td></tr>
              </tbody>
            </table>
          )}
          <a className="button secondary small" href="/api/wheel/staff/wins">Download wins (CSV)</a>
          <p className="wheel-small" style={{ marginTop: 0 }}>Codes, prizes and dates only. No customer details.</p>
        </div>
      </div>

      {sheet && (
        <div className="print-sheet" aria-hidden="true">
          {sheet.codes.map(c => (
            <div className="ticket" key={c}>
              <b>COCO WHEEL · BONUS SPIN</b>
              <code>{c}</code>
              <small>Enter at cocolocal.co.uk/wheel for one extra spin.<br />Single use. Valid until {validUntil}. Given with a spend over {wheelConfig.bonusMinimumSpend}. {wheelConfig.minimumAge}+. Terms apply.</small>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
