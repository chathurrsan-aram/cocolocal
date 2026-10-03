/* code-motion-design engine
 * Every value is a pure function of t. No timers, no CSS transitions,
 * no state carried between frames. Build tracks once, evaluate in seek(t).
 *
 *   const E = makeEngine(LOOP_SECONDS);
 *   const w = E.trk([[1.0, 72], [2.0, 260]]);     // periodic spring track
 *   w(t)  -> value at time t
 */
function makeEngine(T) {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;

  /* Spring presets. z < 1 overshoots; keep z >= 0.8 for "tiny overshoot at most". */
  const SP = {
    morph:  { w: 17,  z: 0.82 },  // shape geometry (~1.5% overshoot)
    snap:   { w: 28,  z: 0.86 },  // small UI responses, colour flips
    fast:   { w: 44,  z: 1 },     // presses, big colour flips
    enter:  { w: 22,  z: 1 },     // content fade/blur in
    exit:   { w: 50,  z: 1 },     // content fade/blur out (faster than enter)
    cam:    { w: 9.5, z: 0.92 },  // camera lags the shape a little
    cursor: { w: 13,  z: 0.96 },
    lead:   { w: 30,  z: 0.84 },  // leading edge of a moving knob/indicator
    trail:  { w: 15,  z: 0.9 },   // trailing edge
    soft:   { w: 11,  z: 1 },
    pop:    { w: 26,  z: 0.74 },  // dots, tooltips, badges
    release:{ w: 20,  z: 0.8 },   // rubber-band snap back
    draw:   { w: 8.5, z: 1 },     // line/stroke drawing
  };

  /* Closed-form unit step response of a damped spring. */
  function S(e, sp) {
    if (e <= 0) return 0;
    const { w, z } = sp;
    if (z < 1) {
      const wd = w * Math.sqrt(1 - z * z), ex = Math.exp(-z * w * e);
      return 1 - ex * (Math.cos(wd * e) + (z * w / wd) * Math.sin(wd * e));
    }
    const ex = Math.exp(-w * e);
    return 1 - ex * (1 + w * e);
  }

  /* Periodic track: keys [[t, value, springOverride?], ...] sorted by t, all in [0, T).
   * Value = sum of one spring per change. Changes from the previous two loops are
   * included, so f(0) === f(T) in value AND velocity: the loop is seamless.
   * The value "before" the first key is the LAST key's value (it wraps). */
  function trk(keys, sp = SP.morph) {
    if (T == null) return seq(keys[0][1], keys, sp);   // non-looping piece
    const vEnd = keys[keys.length - 1][1];
    let prev = vEnd;
    const d = keys.map(k => { const r = [k[0], k[1] - prev, k[2] || sp]; prev = k[1]; return r; })
                  .filter(r => r[1] !== 0);
    return t => {
      let v = vEnd;
      for (const [ti, dv, s] of d) v += dv * (S(t - ti, s) + S(t - ti + T, s) + S(t - ti + 2 * T, s));
      return v;
    };
  }

  /* One-shot sequence from a start value. Use after a drag hands off, or for non-loops. */
  function seq(v0, keys, sp = SP.morph) {
    let prev = v0;
    const d = keys.map(k => { const r = [k[0], k[1] - prev, k[2] || sp]; prev = k[1]; return r; });
    return t => { let v = v0; for (const [ti, dv, s] of d) v += dv * S(t - ti, s); return v; };
  }

  /* Log-space track: use for camera zoom so zooming feels even. */
  function ltrk(keys, sp = SP.cam) {
    const f = trk(keys.map(k => [k[0], Math.log(k[1]), k[2]]), sp);
    return t => Math.exp(f(t));
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb = c => `rgb(${c.map(v => Math.round(clamp(v, 0, 255))).join(",")})`;
  const mix = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
  function ctrk(keys, sp = SP.snap) {
    const ch = [0, 1, 2].map(i => trk(keys.map(k => [k[0], hex(k[1])[i], k[2]]), sp));
    return t => ch.map(f => f(t));
  }
  function cseq(c0, keys, sp = SP.snap) {
    const ch = [0, 1, 2].map(i => seq(hex(c0)[i], keys.map(k => [k[0], hex(k[1])[i], k[2]]), sp));
    return t => ch.map(f => f(t));
  }

  /* Visibility for content that swaps inside a morphing container.
   * Exit is fast; enter starts later (tin should be ~0.1s after the previous exit). */
  const vis = (tin, tout) => trk([[tin, 1, SP.enter], [tout, 0, SP.exit]]);
  /* For content visible across the loop seam (e.g. the opening label). */
  const visWrap = (tout, tin) => trk([[tout, 0, SP.exit], [tin, 1, SP.enter]]);

  /* Apply a content layer: opacity + short blur + slight scale. Returns false when hidden. */
  function layer(el, o, x, y, blurPx = 6) {
    if (o < 0.003) { el.style.display = "none"; return false; }
    el.style.display = "block";
    el.style.opacity = o.toFixed(4);
    el.style.filter = o > 0.995 ? "none" : `blur(${((1 - o) * blurPx).toFixed(2)}px)`;
    el.style.transform = `translate(${x}px,${y}px) scale(${(0.97 + 0.03 * o).toFixed(4)})`;
    return true;
  }
  function fade(el, o, blurPx = 4) {
    o = clamp(o, 0, 1);
    el.style.opacity = o.toFixed(4);
    el.style.filter = o > 0.995 ? "none" : `blur(${((1 - o) * blurPx).toFixed(2)}px)`;
  }

  /* Wrap t into [0, T). */
  const wrap = t => T == null ? t : ((t % T) + T) % T;

  return { T, SP, S, trk, seq, ltrk, hex, rgb, mix, ctrk, cseq, vis, visWrap, layer, fade, clamp, lerp, wrap };
}
