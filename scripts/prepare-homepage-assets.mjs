// Prepares homepage images and video from the asset audit shortlist and the
// (read-only) Google Drive library. Re-run after changing the lists below:
//   node scripts/prepare-homepage-assets.mjs
// Output: public/images/home/<name>-{800,1200,2400}.webp and public/video/*.
// sharp re-encodes every image, which drops EXIF/GPS/XMP metadata.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SHORTLIST = join(homedir(), 'coco-assets-audit/shortlist');
const DRIVE = join(homedir(), 'Library/CloudStorage/GoogleDrive-chathurrsan@aram.org.uk/My Drive/Coco Local/05 — Marketing & Content/04 — Higgsfield & Canva Library');
const IMG_OUT = 'public/images/home';
const VID_OUT = 'public/video';

// Real photos: shortlist only.
const photos = [
  'hero-shopfront-02', // hero
  'hero-shopfront-01', // walk: at the door
  'chillers-03',       // walk: first look inside
  'aisle-01', 'chillers-02', 'chillers-04', 'groceries-02', 'household-04', 'slushie-01', // walk stops
  'slushie-03',        // slushie section
];

// Decorative graphics (not proof of stock).
const graphics = [
  { src: join(DRIVE, '02 — Spin the Wheel/Introducing-wheel-poster.png'), name: 'wheel-poster', widths: [480, 720] },
  { src: join(DRIVE, '03 — Logo & Outros/Coco Local — Approved transparent logo.png'), name: 'logo-approved', widths: [600, 1200] },
];

const videos = [
  { src: join(DRIVE, '01 — Videos & Posters/Slushie-Feed.mp4'), name: 'slushie-loop', width: 540, posterAt: 5 },
  { src: join(DRIVE, '03 — Logo & Outros/Coco Local — Basket Logo Reveal — 5s Square.mp4'), name: 'logo-reveal', width: 480, posterAt: 4.9 },
];

await mkdir(IMG_OUT, { recursive: true });
await mkdir(VID_OUT, { recursive: true });
const kb = async f => Math.round((await stat(f)).size / 1024);

for (const name of photos) {
  const master = join(SHORTLIST, `${name}.webp`);
  const { width, height } = await sharp(master).metadata();
  const long = Math.max(width, height);
  for (const size of [800, 1200, 2400]) {
    const out = join(IMG_OUT, `${name}-${size}.webp`);
    const target = Math.min(size, long);
    await sharp(master).resize({ width: width >= height ? target : undefined, height: height > width ? target : undefined })
      .webp({ quality: size === 2400 ? 72 : 76, effort: 6 }).toFile(out);
  }
  console.log(`${name}: ${width}x${height}`);
}

for (const g of graphics) {
  for (const w of g.widths) {
    const out = join(IMG_OUT, `${g.name}-${w}.webp`);
    await sharp(g.src).resize({ width: w }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out);
    console.log(`${out}: ${await kb(out)} KB`);
  }
}

const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
for (const v of videos) {
  const scale = `scale=${v.width}:-2,fps=24`;
  const base = join(VID_OUT, v.name);
  ff(['-i', v.src, '-an', '-map_metadata', '-1', '-vf', scale, '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', `${base}.mp4`]);
  ff(['-i', v.src, '-an', '-map_metadata', '-1', '-vf', scale, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', `${base}.webm`]);
  ff(['-ss', String(v.posterAt), '-i', v.src, '-frames:v', '1', '-vf', `scale=${v.width}:-2`, '-map_metadata', '-1', `${base}-poster.png`]);
  await sharp(`${base}-poster.png`).webp({ quality: 78 }).toFile(`${base}-poster.webp`);
  execFileSync('rm', [`${base}-poster.png`]);
  for (const ext of ['mp4', 'webm']) {
    const size = await kb(`${base}.${ext}`);
    if (size > 2048) throw new Error(`${base}.${ext} is ${size} KB — over the 2 MB budget`);
    console.log(`${base}.${ext}: ${size} KB`);
  }
}
