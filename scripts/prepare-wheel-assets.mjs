// Prepares /wheel assets from the (read-only) Google Drive library into public/wheel/.
//   node scripts/prepare-wheel-assets.mjs            (Drive for desktop on the Mac)
//   WHEEL_ASSETS=/some/folder node scripts/prepare-wheel-assets.mjs
// WHEEL_ASSETS may point at a flat folder holding copies of the files named below.
//
// Hero video: Coco-Wheel-Winner.mp4 (the intro "coming soon" video was not usable here).
//   Trimmed to 0–4.5 s: idle wheel → "Give it a spin" → spin, ending before "YOU WON! FREE COFFEE".
//   Cropped to the top 1120 px to remove the footer "Example win · Coming soon · Offers & rules to be confirmed".
//   No audio track. H.264 + WebM, each < 2 MB. Poster = first frame (also used for the OG image).
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdir, stat, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const LIB = join(homedir(), 'Library/CloudStorage/GoogleDrive-chathurrsan@aram.org.uk/My Drive/Coco Local/05 — Marketing & Content/04 — Higgsfield & Canva Library');
const flat = process.env.WHEEL_ASSETS;
const src = {
  video: flat ? join(flat, 'Coco-Wheel-Winner.mp4') : join(LIB, '02 — Spin the Wheel/Coco-Wheel-Winner.mp4'),
  logo: flat ? join(flat, 'logo.png') : join(LIB, '03 — Logo & Outros/Coco Local — Approved transparent logo.png'),
};
const OUT = 'public/wheel';
const TRIM = ['-ss', '0', '-t', '4.5'];
const CROP = 'crop=720:1120:0:0';
await mkdir(OUT, { recursive: true });
for (const f of Object.values(src)) await access(f);
const kb = async f => Math.round((await stat(f)).size / 1024);
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// Logo: trim transparent padding; white artwork for the navy page.
const logo = await sharp(src.logo).trim().toBuffer();
for (const w of [320, 640]) await sharp(logo).resize({ width: w }).webp({ quality: 90, alphaQuality: 95 }).toFile(join(OUT, `logo-${w}.webp`));
await sharp(logo).resize({ width: 640 }).png({ compressionLevel: 9 }).toFile(join(OUT, 'logo-640.png'));

// Hero video.
ff([...TRIM, '-i', src.video, '-an', '-vf', `${CROP},scale=540:-2,fps=25`, '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', join(OUT, 'hero.mp4')]);
ff([...TRIM, '-i', src.video, '-an', '-vf', `${CROP},scale=540:-2,fps=25`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-deadline', 'good', join(OUT, 'hero.webm')]);
const frame = join(OUT, '.poster.png');
ff(['-ss', '0', '-i', src.video, '-frames:v', '1', '-vf', CROP, frame]);
await sharp(frame).resize({ width: 540 }).webp({ quality: 80 }).toFile(join(OUT, 'hero-poster.webp'));
await sharp(frame).resize({ width: 540 }).jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, 'hero-poster.jpg'));

// Open Graph: 1200×630, navy, logo + line on the left, poster frame on the right.
const posterForOg = await sharp(frame).resize({ height: 850 }).extract({ left: 30, top: 170, width: 486, height: 630 }).toBuffer();
const text = Buffer.from(`<svg width="640" height="300" xmlns="http://www.w3.org/2000/svg">
  <style>.h{font:700 64px 'DejaVu Sans',Arial,sans-serif;fill:#fff;letter-spacing:-2px}.s{font:400 30px 'DejaVu Sans',Arial,sans-serif;fill:#c0c0db}.a{fill:#ffdf77}</style>
  <text x="0" y="80" class="h">Spin the</text><text x="0" y="160" class="h">Coco Wheel</text>
  <text x="0" y="232" class="s">One free spin every week.</text><text x="0" y="276" class="s a">No purchase needed.</text></svg>`);
const seam = Buffer.from(`<svg width="140" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop offset="0" stop-color="#0d0d43"/><stop offset="1" stop-color="#0d0d43" stop-opacity="0"/></linearGradient></defs><rect width="140" height="630" fill="url(#g)"/></svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0d0d43' } })
  .composite([
    { input: posterForOg, left: 714, top: 0 },
    { input: seam, left: 714, top: 0 },
    { input: await sharp(logo).resize({ width: 300 }).toBuffer(), left: 70, top: 90 },
    { input: text, left: 70, top: 200 },
  ])
  .jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, 'og.jpg'));
execFileSync('rm', ['-f', frame]);

for (const f of ['hero.mp4', 'hero.webm', 'hero-poster.webp', 'og.jpg', 'logo-640.webp']) console.log(`${f}: ${await kb(join(OUT, f))} KB`);
