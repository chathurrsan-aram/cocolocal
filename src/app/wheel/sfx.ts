// UI sounds for the wheel (synthesised by scripts/make-wheel-sfx.py). Off by default; the
// visitor turns them on with the speaker button. Web Audio keeps the peg clacks tight.

export type Sfx = "clack" | "ratchet" | "launch" | "win" | "lose" | "pop";
const NAMES: Sfx[] = ["clack", "ratchet", "launch", "win", "lose", "pop"];
const KEY = "coco-wheel-sound";

let ctx: AudioContext | null = null;
const buffers = new Map<Sfx, AudioBuffer>();
let enabled = false;
let lastClack = 0;

export function soundPreference() {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
}

/** Must be called from a tap/click (browsers only allow audio after a user gesture). */
export async function setSound(on: boolean) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* ignore */ }
  if (!on) return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  await Promise.all(NAMES.filter(n => !buffers.has(n)).map(async n => {
    try {
      const data = await (await fetch(`/wheel/sfx/${n}.mp3`)).arrayBuffer();
      buffers.set(n, await ctx!.decodeAudioData(data));
    } catch { /* a missing sound never breaks the wheel */ }
  }));
}

export function play(name: Sfx, gain = 1) {
  if (!enabled || !ctx || ctx.state !== "running") return;
  const buffer = buffers.get(name);
  if (!buffer) return;
  if (name === "clack") {
    const now = performance.now();
    if (now - lastClack < 28) return; // at full speed the pegs blur into a purr, not a buzz
    lastClack = now;
  }
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = gain;
  src.buffer = buffer;
  src.playbackRate.value = name === "clack" ? 0.94 + Math.random() * 0.12 : 1;
  src.connect(g).connect(ctx.destination);
  src.start();
}
