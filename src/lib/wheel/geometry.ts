// Client-safe wheel maths (no Node APIs), shared by the server and the wheel component.
import { segments } from '../../data/wheel.ts';

/** Final wheel rotation (0–360°) that puts `landing` (0–1 across the slice) under the top pointer. */
export function segmentAngle(index: number, landing: number, count = segments.length) {
  const size = 360 / count;
  return (360 - (index * size + size * landing)) % 360;
}
