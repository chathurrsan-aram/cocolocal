// Odds check: runs the real prize engine with the real crypto RNG and compares observed
// frequencies with src/data/wheel.ts.   node scripts/wheel-odds-sim.mjs [spins]
import { randomInt } from 'node:crypto';
import { outcomes } from '../src/data/wheel.ts';
import { pickOutcome, validateOdds } from '../src/lib/wheel/core.ts';

validateOdds();
const turns = Number(process.argv[2] ?? 1_000_000);
const first = Object.fromEntries(outcomes.map(o => [o.id, 0]));
const final = Object.fromEntries(outcomes.map(o => [o.id, 0]));
for (let i = 0; i < turns; i++) {
  const a = pickOutcome(randomInt);
  first[a]++;
  final[a === 'spin-again' ? pickOutcome(randomInt, { respin: true }) : a]++;
}
const pct = n => (100 * n / turns).toFixed(3).padStart(7) + '%';
const prizeIds = outcomes.filter(o => o.kind === 'prize').map(o => o.id);
console.log(`${turns.toLocaleString('en-GB')} turns (crypto.randomInt)\n`);
console.log('outcome'.padEnd(20), 'config'.padStart(8), 'first spin'.padStart(11), 'per turn*'.padStart(10));
for (const o of outcomes) console.log(o.id.padEnd(20), `${o.percent}%`.padStart(8), pct(first[o.id]).padStart(11), pct(final[o.id]).padStart(10));
const won = ids => ids.reduce((s, id) => s + final[id], 0);
console.log(`\nAny prize, first spin: ${pct(prizeIds.reduce((s, id) => s + first[id], 0))} (config 15%)`);
console.log(`Any prize, whole turn incl. one re-spin: ${pct(won(prizeIds))} (expected ${(15 + 10 * 0.15).toFixed(1)}%)`);
console.log('* per turn = the final result after at most one re-spin (a re-spin cannot land on spin again).');
