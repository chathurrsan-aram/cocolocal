# Homepage Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, chosen by the owner's brief). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the cocolocal.co.uk homepage around one signature "Walk through the shop" scroll moment, using only shortlisted real photos, with all offer text in one editable data file.

**Architecture:** Next.js 15 App Router page (`src/app/page.tsx`) composed of small section components in `src/components/home/`. The scroll moment is a client component driven by one `scroll` listener + `requestAnimationFrame` writing CSS custom properties (no new animation library), with separate mobile and `prefers-reduced-motion` compositions done in CSS. Offers move from `Offers.tsx` into `src/data/offers.ts` with a pure `activeOffers(now)` helper tested with `node --test`.

**Tech Stack:** Next 15, React 19, Tailwind base + `globals.css`, `next/image`, `sharp` (image prep), `ffmpeg` (video prep), Lighthouse via `npx`.

**Spec:** Owner brief (chat, 26 Sep 2026) + `~/coco-assets-audit/REPORT.md` + Drive `Coco Local website improvement plan.md`.

## Global Constraints

- Branch `homepage-refresh` from `origin/main`. Vercel **preview** only — never production, never merge.
- Real-photo sections: shortlist WebPs only (`~/coco-assets-audit/shortlist`), 2400px + 1200px as responsive sources. No people photos (no consent confirmed). No generated photoreal assets.
- AI/Canva visuals: decorative only (Slushie-Feed loop, wheel poster, logo reveal), labelled as illustration.
- Offers: only REPORT "live" offers; September offers end 6 Oct 2026 (enforced by date). Standing promos: Tuesdays 10% off over £25 (excl. tobacco), Free Slushie Fridays with £3 spend, free on-site parking.
- "18+ · Please drink responsibly." beside every alcohol mention.
- Instagram stays `@cocolocal_` (owner answer). Coco Wheel: "coming soon" strip, **no link**, hero Spin button removed. H1 "Your local." + subline "Your local in South Benfleet".
- Videos < 2 MB each, H.264 MP4 + WebM, poster frames, muted, no audio track. All images metadata-stripped.
- Lighthouse mobile: performance ≥ 90, accessibility ≥ 95. LCP image preloaded; everything else lazy; CLS ≈ 0.
- Keep every existing route working; delete no images.

## Review Focus

1. Reduced motion → walk-through becomes a static stacked gallery with all six labels readable; no autoplaying video.
2. Visit after 6 Oct 2026 → September cards disappear, standing promos remain, no empty grid/heading gap (test in Task 1).
3. Keyboard user tabbing through the pinned scroll section → no focus trapped/hidden off-screen; focusable content only in normal flow.
4. Narrow phone (360px) → no horizontal scroll; hero actions and hours fit; sticky stage fits `100svh`.
5. Slow network → no layout shift from images/videos (explicit aspect ratios), video never blocks LCP.

---

### Task 1: Offers data file + tested helper
**Files:** Create `src/data/offers.ts`, `src/data/offers.test.ts`; Modify `src/components/Offers.tsx`.
- [ ] Write `offers.test.ts` (node:test): Sept offers active on 2026-09-26, gone on 2026-10-07; standing promos always active; every `alcohol: true` item renders the 18+ line.
- [ ] Run `node --test src/data/offers.test.ts` → FAIL (module missing).
- [ ] Implement `offers.ts`: `export type Offer`, `standingPromos`, `offers`, `activeOffers(now: number): Offer[]`, `ALCOHOL_NOTE`.
- [ ] Re-run → PASS. Point `Offers.tsx` at the data file; show standing promos row; hide section heading if nothing active.
- [ ] Commit.

### Task 2: Asset pipeline
**Files:** Create `scripts/prepare-homepage-assets.mjs`; outputs `public/images/home/*.webp`, `public/video/*.{mp4,webm,jpg}`.
- [ ] Copy chosen shortlist photos (2400 + 1200) re-encoded via sharp (strip metadata); wheel poster + logo from Drive read-only.
- [ ] ffmpeg: Slushie-Feed loop and Basket Logo Reveal → MP4 (H.264, `-an`, faststart) + WebM (VP9) < 2 MB, poster JPG/WebP.
- [ ] Verify sizes (`ls -l`) and `exiftool`/`webpinfo` shows no EXIF. Commit.

Photo map: hero `hero-shopfront-02`; walk intro `hero-shopfront-01` (door) → `chillers-03` (inside view); stops: snacks `aisle-01`, chillers `chillers-02`, wine/beer/spirits `chillers-04`, groceries `groceries-02`, household & pet `household-04`, slushies `slushie-01`; slushie section `slushie-03`.

### Task 3: Hero + Visit + Follow + Wheel strip
**Files:** Create `src/components/home/{Hero,VisitUs,FollowUs,WheelSoon}.tsx`, `src/components/HomeImage.tsx`; Modify `src/app/page.tsx`, `globals.css`.
- [ ] `HomeImage` renders `<picture>`-equivalent via `next/image` with `sizes` and `unoptimized` srcset of our 1200/2400 files (explicit width/height → no CLS). Hero image `priority` (preload).
- [ ] Hero: H1, subline, today's hours (all three rows), Get directions + Call, free parking note.
- [ ] Visit: address, hours, free parking, phone, lazy Google Maps iframe (title attr) — no parking photo (none exists; flagged).
- [ ] Follow: Facebook + Instagram @cocolocal_, logo reveal (lazy, plays once in view, poster otherwise).
- [ ] WheelSoon: poster + "Coming soon", no link.
- [ ] `npm run build` passes (check-site). Commit.

### Task 4: Walk through the shop (signature)
**Files:** Create `src/components/home/ShopWalk.tsx`; styles in `globals.css`.
- [ ] Desktop: tall section (`~(stops+2)×100vh`), sticky stage; progress `p` (0–1) → door zoom/fade, then stops cross-fade with light parallax (foreground photo vs. label plane), label fades in; progress rail.
- [ ] Mobile (<768px): simpler — each stop a full-width card with sticky label chip; no pinning.
- [ ] Reduced motion: static stacked gallery (CSS `@media (prefers-reduced-motion)` + JS no-op).
- [ ] All images lazy except the first stage frame (lazy too — below fold). Alt text describes each shot. Commit.

### Task 5: Slushie section
**Files:** Create `src/components/home/Slushies.tsx`.
- [ ] `slushie-03` photo + Free Slushie Friday (from `offers.ts`) + decorative Slushie-Feed loop (`preload="none"`, plays only in view, hidden under reduced motion, labelled "Illustration"). No price (window poster £1.50 vs site £1.20 conflict — flagged). Commit.

### Task 6: Verification
- [ ] `npm run lint`, `npm run build`, `node --test`.
- [ ] Lighthouse mobile on `next start` → perf ≥ 90, a11y ≥ 95 (iterate if not).
- [ ] Screenshots: before (production) + after, desktop + mobile + reduced-motion.
- [ ] Push branch, Vercel preview URL. Summary < 200 words. Stop.
