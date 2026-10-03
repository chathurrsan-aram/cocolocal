// The Coco Wheel as layered SVG with real text, styled after the Higgsfield artwork
// (Introducing-wheel-poster.png): chrome rim with bulbs, 12 slices clockwise from the pointer,
// pegs between slices, a chrome pointer and a wooden stand.
//
// Layers (so lighting stays put while the disc turns, which is what makes it read as 3D):
//   <WheelRim/>   static: chrome ring, bulbs + glow (animated by CSS: idle / chase / win / dim)
//   <WheelDisc/>   rotates: slices, pegs, win highlight
//   <WheelLabels/> rotates with it, on its own layer (plus a pre-blurred copy for motion blur)
//   <WheelShade/> static: vignette + specular highlight over the disc
import { memo } from "react";
import { outcomes, segments, sliceColours } from "@/data/wheel";

const C = 200, R_DISC = 170, R_RIM_OUT = 198, R_RIM_IN = 174;
const SIZE = 360 / segments.length;
const BULBS = 24;

function point(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}
function slicePath(i: number, r = R_DISC) {
  const [x1, y1] = point(r, i * SIZE), [x2, y2] = point(r, (i + 1) * SIZE);
  return `M${C},${C} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

export function WheelRim() {
  return (
    <svg viewBox="0 0 400 400" className="wheel-rim" aria-hidden="true">
      <defs>
        <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbfcff" /><stop offset=".22" stopColor="#c4c9d4" /><stop offset=".45" stopColor="#f2f4f8" />
          <stop offset=".62" stopColor="#8d94a4" /><stop offset=".8" stopColor="#e3e6ed" /><stop offset="1" stopColor="#6d7486" />
        </linearGradient>
        <radialGradient id="bulb" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#fffdf2" /><stop offset=".45" stopColor="#ffe9a8" /><stop offset="1" stopColor="#e3a74a" />
        </radialGradient>
        {/* A soft halo drawn as a gradient (an SVG blur filter repaints every frame the bulbs flash). */}
        <radialGradient id="bulb-halo">
          <stop offset="0" stopColor="#ffd66b" stopOpacity=".9" /><stop offset=".45" stopColor="#ffd66b" stopOpacity=".45" /><stop offset="1" stopColor="#ffd66b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_RIM_OUT} fill="#2a2d3a" />
      <circle cx={C} cy={C} r={R_RIM_OUT - 2.5} fill="url(#chrome)" />
      <circle cx={C} cy={C} r={R_RIM_IN + 3} fill="none" stroke="#5b6172" strokeWidth="1.5" opacity=".7" />
      <circle cx={C} cy={C} r={R_RIM_IN} fill="#3a2a21" />
      <g className="bulb-glows">
        {Array.from({ length: BULBS }, (_, i) => {
          const [x, y] = point((R_RIM_OUT + R_RIM_IN) / 2 + 1, i * (360 / BULBS) + 7.5);
          return <circle key={i} className="bulb-glow" style={{ ["--i" as string]: i }} cx={x} cy={y} r="13" fill="url(#bulb-halo)" />;
        })}
      </g>
      {Array.from({ length: BULBS }, (_, i) => {
        const [x, y] = point((R_RIM_OUT + R_RIM_IN) / 2 + 1, i * (360 / BULBS) + 7.5);
        return (
          <g key={i} className="bulb" style={{ ["--i" as string]: i }}>
            <circle cx={x} cy={y} r="5.2" fill="#6b5a3a" />
            <circle className="bulb-lamp" cx={x} cy={y} r="4.3" fill="url(#bulb)" />
          </g>
        );
      })}
    </svg>
  );
}

// Labels run along the radius between the hub and the pegs. Each label gets the largest size
// that fits that length (and the slice's width at its inner end), so nothing crowds or overlaps.
const LABEL_R = 110;    // centre of the label along the radius
const LABEL_LEN = 92;   // usable radial length, hub ring to pegs
const LABEL_MAX = 16;
const CHAR_W = 0.62;    // average upper-case advance of the display font (em)
const labels = segments.map((id, i) => {
  const lines = outcomes.find(o => o.id === id)!.wheel;
  const longest = Math.max(...lines.map(l => l.length));
  const fontSize = +Math.min(LABEL_MAX, LABEL_LEN / (longest * CHAR_W), lines.length > 1 ? 14.5 : LABEL_MAX).toFixed(2);
  const mid = i * SIZE + SIZE / 2;
  const flip = mid > 180; // radial text, never upside down relative to the wheel
  return { id, lines, fontSize, lh: fontSize * 1.08, mid, flip, x: flip ? C - LABEL_R : C + LABEL_R };
});

/** The turning disc: slices, win highlight and pegs. Memoised, so it never re-renders per frame. */
export const WheelDisc = memo(function WheelDisc({ highlight }: { highlight: number | null }) {
  return (
    <svg viewBox="0 0 400 400" className="wheel-face" role="img" aria-labelledby="wheel-face-title">
      <title id="wheel-face-title">{`Coco Wheel prizes: ${segments.map(s => outcomes.find(o => o.id === s)!.label).join(", ")}`}</title>
      {segments.map((id, i) => (
        <path key={i} d={slicePath(i)} fill={sliceColours[id].fill} stroke="#0d0d43" strokeOpacity=".4" strokeWidth="1.2" />
      ))}
      {highlight !== null && <path className="slice-highlight" d={slicePath(highlight)} />}
      {segments.map((_, i) => {
        const [x, y] = point(R_DISC - 6, i * SIZE);
        return <circle key={i} cx={x} cy={y} r="3.4" fill="url(#chrome)" stroke="#4b5060" strokeWidth=".8" />;
      })}
    </svg>
  );
});

/**
 * The slice labels, on their own layer above the disc. Drawn twice while spinning on a desktop:
 * sharp, and a copy blurred once in CSS; their opacities cross-fade with the speed, which is
 * far cheaper than re-blurring the text every frame.
 */
export const WheelLabels = memo(function WheelLabels({ blurred = false }: { blurred?: boolean }) {
  return (
    <svg viewBox="0 0 400 400" className={`wheel-labels ${blurred ? "is-blurred" : ""}`} aria-hidden="true">
      {labels.map(({ id, lines, fontSize, lh, mid, flip, x }, i) => (
        <text key={i} transform={`rotate(${flip ? mid + 90 : mid - 90} ${C} ${C})`} x={x} y={C - ((lines.length - 1) * lh) / 2}
          fill={sliceColours[id].text} fontSize={fontSize} fontWeight={800} textAnchor="middle" dominantBaseline="central">
          {lines.map((line, n) => <tspan key={n} x={x} dy={n === 0 ? 0 : lh}>{line}</tspan>)}
        </text>
      ))}
    </svg>
  );
});

export function WheelShade() {
  return (
    <svg viewBox="0 0 400 400" className="wheel-shade" aria-hidden="true">
      <defs>
        <radialGradient id="vignette" cx=".5" cy=".5" r=".5">
          <stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".38" />
        </radialGradient>
        <radialGradient id="spec" cx=".32" cy=".22" r=".55">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_DISC} fill="url(#vignette)" />
      <circle cx={C} cy={C} r={R_DISC} fill="url(#spec)" />
    </svg>
  );
}

export function WheelPointer() {
  return (
    <svg viewBox="0 0 48 60" className="wheel-pointer-art" aria-hidden="true">
      <defs>
        <linearGradient id="ptr" x1="0" x2="1">
          <stop offset="0" stopColor="#fdfdff" /><stop offset=".48" stopColor="#c3c8d3" /><stop offset=".52" stopColor="#9aa1b0" /><stop offset="1" stopColor="#6f7687" />
        </linearGradient>
      </defs>
      <path d="M5 6 Q24 -3 43 6 L27 54 Q24 60 21 54 Z" fill="url(#ptr)" stroke="#474d5e" strokeWidth="1.4" />
      <path d="M11 8 Q24 3 30 7 L24 44 Z" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function WheelStand() {
  return (
    <svg viewBox="0 0 400 130" className="wheel-stand" aria-hidden="true">
      <defs>
        <linearGradient id="neck" x1="0" x2="1">
          <stop offset="0" stopColor="#5f6678" /><stop offset=".35" stopColor="#eef0f5" /><stop offset=".6" stopColor="#9aa1b0" /><stop offset="1" stopColor="#4f5566" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a5a36" /><stop offset=".5" stopColor="#6e3b22" /><stop offset="1" stopColor="#3f2113" />
        </linearGradient>
        <linearGradient id="plate" x1="0" x2="1">
          <stop offset="0" stopColor="#7c8394" /><stop offset=".4" stopColor="#f4f5f8" /><stop offset="1" stopColor="#6c7384" />
        </linearGradient>
      </defs>
      <path d="M170 0 L230 0 L262 70 L138 70 Z" fill="url(#neck)" />
      <ellipse cx="200" cy="104" rx="170" ry="22" fill="#000" opacity=".35" />
      <path d="M40 84 Q40 72 200 70 Q360 72 360 84 L360 100 Q200 118 40 100 Z" fill="url(#wood)" />
      <ellipse cx="200" cy="80" rx="150" ry="11" fill="url(#plate)" />
      <path d="M60 92 Q200 104 340 92" stroke="#c98a5c" strokeOpacity=".45" strokeWidth="2" fill="none" />
    </svg>
  );
}
