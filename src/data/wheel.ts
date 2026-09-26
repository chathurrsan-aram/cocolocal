// Coco Wheel settings. Edit this file, not the components.
//
// - `percent` is the chance of each outcome on a spin. They must add up to 100.
//   The tests check that real prizes total 15%, so update the tests too if you change that.
// - `segments` is the wheel as printed on the poster, clockwise from the pointer at the top.
//   Every outcome needs at least one slice. Several slices can share one outcome
//   ("Not this time" has four); the chance is for the outcome, not the slice.
// - No alcohol, tobacco, vapes, lottery or other 18+ prizes.

export type OutcomeId =
  | 'pound-off-10' | 'free-slushie' | 'snacks-50p' | 'free-coffee' | 'free-hot-chocolate'
  | 'sweet-treat' | 'free-crisps' | 'spin-again' | 'not-this-time';

export type Outcome = {
  id: OutcomeId;
  kind: 'prize' | 'spin-again' | 'lose';
  /** Sentence-case name used in copy, codes and the staff page. */
  label: string;
  /** Lines printed on the wheel slice (poster style). */
  wheel: string[];
  percent: number;
  /** What the winner gets, in plain words (shown on the result card and in the terms). */
  claim?: string;
  /** Extra conditions for the terms page. */
  conditions?: string;
};

// Prizes first, then spin again, then not this time. pickOutcome relies on this order only
// for readability of the tests; any order works.
export const outcomes: Outcome[] = [
  { id: 'pound-off-10', kind: 'prize', label: '£1 off a £10 spend', wheel: ['£1 OFF', '£10'], percent: 3,
    claim: '£1 off when you spend £10 or more in one transaction.',
    conditions: 'The £10 spend excludes tobacco, vapes, alcohol, lottery, gift cards, top-ups and bill payments.' },
  { id: 'free-slushie', kind: 'prize', label: 'Free slushie', wheel: ['FREE', 'SLUSHIE'], percent: 3,
    claim: 'One free Coco’s slushie.', conditions: '[Size to confirm — e.g. regular.] Flavours subject to availability.' },
  { id: 'snacks-50p', kind: 'prize', label: '50p off snacks', wheel: ['50p OFF', 'SNACKS'], percent: 2,
    claim: '50p off any crisps, chocolate or sweets.', conditions: 'Item must cost 50p or more.' },
  { id: 'free-coffee', kind: 'prize', label: 'Free coffee', wheel: ['FREE', 'COFFEE'], percent: 2,
    claim: 'One free hot coffee.', conditions: '[Size to confirm — e.g. regular.]' },
  { id: 'free-hot-chocolate', kind: 'prize', label: 'Free hot chocolate', wheel: ['FREE HOT', 'CHOCOLATE'], percent: 2,
    claim: 'One free hot chocolate.', conditions: '[Size to confirm — e.g. regular.]' },
  { id: 'sweet-treat', kind: 'prize', label: 'Sweet treat', wheel: ['SWEET', 'TREAT'], percent: 2,
    claim: 'A free sweet treat from our selection.', conditions: '[Selection and maximum value to confirm — e.g. up to £1.]' },
  // On the poster but not in the original odds list; split from 50p off snacks so prizes stay at 15%.
  { id: 'free-crisps', kind: 'prize', label: 'Free crisps', wheel: ['FREE', 'CRISPS'], percent: 1,
    claim: 'One free standard bag of crisps.', conditions: '[Range to confirm — e.g. any standard single bag.]' },
  { id: 'spin-again', kind: 'spin-again', label: 'Spin again', wheel: ['SPIN', 'AGAIN'], percent: 10 },
  { id: 'not-this-time', kind: 'lose', label: 'Not this time', wheel: ['NOT', 'THIS', 'TIME'], percent: 75 },
];

// Clockwise from the pointer, exactly as on Introducing-wheel-poster.png.
export const segments: OutcomeId[] = [
  'not-this-time', 'free-slushie', 'not-this-time', 'free-coffee',
  'sweet-treat', 'not-this-time', 'free-crisps', 'free-hot-chocolate',
  'not-this-time', 'snacks-50p', 'pound-off-10', 'spin-again',
];

// Slice colours from the poster.
export const sliceColours: Record<OutcomeId, { fill: string; text: string }> = {
  'not-this-time': { fill: '#18214a', text: '#f1cfae' },
  'free-slushie': { fill: '#3f6fe0', text: '#ffffff' },
  'free-crisps': { fill: '#3f6fe0', text: '#ffffff' },
  'free-coffee': { fill: '#f5b48a', text: '#1b2145' },
  'snacks-50p': { fill: '#f5b48a', text: '#1b2145' },
  'pound-off-10': { fill: '#f5b48a', text: '#1b2145' },
  'sweet-treat': { fill: '#eee7db', text: '#1b2145' },
  'free-hot-chocolate': { fill: '#eee7db', text: '#1b2145' },
  'spin-again': { fill: '#eee7db', text: '#1b2145' },
};

export const wheelConfig = {
  timeZone: 'Europe/London',
  freeSpinsPerWeek: 1,
  maxRespins: 1,
  prizeValidDays: 7,
  bonusValidDays: 30,
  bonusMinimumSpend: '£10',
  minimumAge: 16,
  retentionMonths: 12,
  /** Keep prize records this long after expiry so staff can see "expired" rather than "not found". */
  prizeRecordGraceDays: 30,
  spinsPerIpPerMinute: 8,
  staffLookupsPerIpPerMinute: 30,
};
