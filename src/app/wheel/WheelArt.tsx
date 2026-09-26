// The Coco Wheel as SVG with real text, rebuilt from Introducing-wheel-poster.png:
// 12 slices clockwise from the pointer, silver rim with bulbs, navy hub (the Spin button sits on top).
import { outcomes, segments, sliceColours } from "@/data/wheel";

const C = 200, R_SLICE = 172, R_RIM = 196, R_INNER = 180;
const size = 360 / segments.length;

function point(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function slicePath(i: number) {
  const [x1, y1] = point(R_SLICE, i * size), [x2, y2] = point(R_SLICE, (i + 1) * size);
  return `M${C},${C} L${x1.toFixed(2)},${y1.toFixed(2)} A${R_SLICE},${R_SLICE} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

export function WheelFace() {
  return (
    <svg viewBox="0 0 400 400" className="wheel-face" role="img" aria-labelledby="wheel-title">
      <title id="wheel-title">{`Coco Wheel prizes: ${segments.map(s => outcomes.find(o => o.id === s)!.label).join(", ")}`}</title>
      <defs>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f4f8" />
          <stop offset=".45" stopColor="#a9afbd" />
          <stop offset=".7" stopColor="#e2e5ec" />
          <stop offset="1" stopColor="#7d8496" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={R_RIM} fill="url(#rim)" />
      <circle cx={C} cy={C} r={R_INNER} fill="#3b2a22" />
      {segments.map((id, i) => {
        const colour = sliceColours[id];
        const lines = outcomes.find(o => o.id === id)!.wheel;
        const mid = i * size + size / 2;
        // Radial text, turned so it never reads upside down relative to the wheel.
        const flip = mid > 180;
        const rot = flip ? mid + 90 : mid - 90;
        const x = flip ? C - 112 : C + 112;
        const fontSize = lines.some(l => l.length > 7) ? 13 : 15.5;
        const lh = fontSize * 1.05;
        return (
          <g key={i}>
            <path d={slicePath(i)} fill={colour.fill} stroke="#0d0d43" strokeOpacity=".35" strokeWidth="1" />
            <text transform={`rotate(${rot} ${C} ${C})`} x={x} y={C - ((lines.length - 1) * lh) / 2} fill={colour.text}
              fontSize={fontSize} fontWeight={800} textAnchor="middle" dominantBaseline="central" letterSpacing=".02em">
              {lines.map((line, n) => <tspan key={n} x={x} dy={n === 0 ? 0 : lh}>{line}</tspan>)}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 24 }, (_, i) => {
        const [x, y] = point((R_RIM + R_INNER) / 2, i * 15 + 7.5);
        return <circle key={i} cx={x} cy={y} r="3.1" fill="#fff4cf" stroke="#c9a85a" strokeWidth=".8" />;
      })}
      <circle cx={C} cy={C} r="52" fill="url(#rim)" />
    </svg>
  );
}

export function WheelPointer() {
  return (
    <svg viewBox="0 0 44 52" className="wheel-pointer-art" aria-hidden="true">
      <defs>
        <linearGradient id="ptr" x1="0" x2="1">
          <stop offset="0" stopColor="#f5f6f9" /><stop offset=".55" stopColor="#b9bfcb" /><stop offset="1" stopColor="#8a91a1" />
        </linearGradient>
      </defs>
      <path d="M4 4 Q22 -2 40 4 L24 48 Q22 52 20 48 Z" fill="url(#ptr)" stroke="#5d6475" strokeWidth="1.2" />
    </svg>
  );
}
