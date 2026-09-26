// The Coco Wheel as layered SVG with real text, styled after the Higgsfield artwork
// (Introducing-wheel-poster.png): chrome rim with bulbs, 12 slices clockwise from the pointer,
// pegs between slices, a chrome pointer and a wooden stand.
//
// Layers (so lighting stays put while the disc turns, which is what makes it read as 3D):
//   <WheelRim/>   static: chrome ring, bulbs + glow (animated by CSS: idle / chase / win / dim)
//   <WheelDisc/>  rotates: slices, labels (motion-blurred when fast), pegs, win highlight
//   <WheelShade/> static: vignette + specular highlight over the disc
import { motion, type MotionValue } from "framer-motion";
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
        <filter id="bulb-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4.5" /></filter>
      </defs>
      <circle cx={C} cy={C} r={R_RIM_OUT} fill="#2a2d3a" />
      <circle cx={C} cy={C} r={R_RIM_OUT - 2.5} fill="url(#chrome)" />
      <circle cx={C} cy={C} r={R_RIM_IN + 3} fill="none" stroke="#5b6172" strokeWidth="1.5" opacity=".7" />
      <circle cx={C} cy={C} r={R_RIM_IN} fill="#3a2a21" />
      <g className="bulb-glows" filter="url(#bulb-glow)">
        {Array.from({ length: BULBS }, (_, i) => {
          const [x, y] = point((R_RIM_OUT + R_RIM_IN) / 2 + 1, i * (360 / BULBS) + 7.5);
          return <circle key={i} className="bulb-glow" style={{ ["--i" as string]: i }} cx={x} cy={y} r="8" fill="#ffd66b" />;
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

export function WheelDisc({ blur, highlight }: { blur: MotionValue<string>; highlight: number | null }) {
  return (
    <svg viewBox="0 0 400 400" className="wheel-face" role="img" aria-labelledby="wheel-title">
      <title id="wheel-title">{`Coco Wheel prizes: ${segments.map(s => outcomes.find(o => o.id === s)!.label).join(", ")}`}</title>
      {segments.map((id, i) => (
        <path key={i} d={slicePath(i)} fill={sliceColours[id].fill} stroke="#0d0d43" strokeOpacity=".4" strokeWidth="1.2" />
      ))}
      {highlight !== null && <path className="slice-highlight" d={slicePath(highlight)} />}
      <motion.g style={{ filter: blur }}>
        {segments.map((id, i) => {
          const lines = outcomes.find(o => o.id === id)!.wheel;
          const mid = i * SIZE + SIZE / 2;
          const flip = mid > 180; // radial text, never upside down relative to the wheel
          const x = flip ? C - 108 : C + 108;
          const fontSize = lines.some(l => l.length > 7) ? 13 : 15.5;
          const lh = fontSize * 1.05;
          return (
            <text key={i} transform={`rotate(${flip ? mid + 90 : mid - 90} ${C} ${C})`} x={x} y={C - ((lines.length - 1) * lh) / 2}
              fill={sliceColours[id].text} fontSize={fontSize} fontWeight={900} textAnchor="middle" dominantBaseline="central" letterSpacing=".02em"
              style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.12)", strokeWidth: 1.2 }}>
              {lines.map((line, n) => <tspan key={n} x={x} dy={n === 0 ? 0 : lh}>{line}</tspan>)}
            </text>
          );
        })}
      </motion.g>
      {segments.map((_, i) => {
        const [x, y] = point(R_DISC - 6, i * SIZE);
        return <circle key={i} cx={x} cy={y} r="3.4" fill="url(#chrome)" stroke="#4b5060" strokeWidth=".8" />;
      })}
    </svg>
  );
}

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
