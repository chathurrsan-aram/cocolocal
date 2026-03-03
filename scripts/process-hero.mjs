import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '..', 'public', 'images', 'IMG_3159 2.JPG');
const outPath = path.join(__dirname, '..', 'public', 'images', 'hero.jpg');

async function processHero() {
  const meta = await sharp(srcPath).metadata();
  console.log(`Original: ${meta.width}x${meta.height}, orientation: ${meta.orientation}`);

  // Step 1: Rotate 270° clockwise (90° CCW) to correct orientation
  // After rotation: 2208x1242 (landscape)
  const rotated = sharp(srcPath).rotate(270);
  const rotMeta = await rotated.toBuffer().then(b => sharp(b).metadata());
  console.log(`After rotation: ${rotMeta.width}x${rotMeta.height}`);

  const rW = rotMeta.width;
  const rH = rotMeta.height;

  // Step 2: Crop to ~16:9 hero aspect ratio
  // We want to keep the neon sign (right side) and shopfront (left/center)
  // Target: 16:9 = 1.778:1
  const targetRatio = 16 / 9;
  let cropW, cropH, cropLeft, cropTop;

  if (rW / rH > targetRatio) {
    // Wider than 16:9 — crop width
    cropH = rH;
    cropW = Math.round(cropH * targetRatio);
    // Center horizontally
    cropLeft = Math.round((rW - cropW) / 2);
    cropTop = 0;
  } else {
    // Taller than 16:9 — crop height
    cropW = rW;
    cropH = Math.round(cropW / targetRatio);
    // Center vertically, slight bias upward to keep sign visible
    cropTop = Math.max(0, Math.round((rH - cropH) / 2 - rH * 0.05));
    cropLeft = 0;
  }

  console.log(`Crop to 16:9: left=${cropLeft} top=${cropTop} w=${cropW} h=${cropH}`);

  // Step 3: Process — enhance contrast and neon vibrancy
  await sharp(srcPath)
    .rotate(270)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(1920, 1080, { fit: 'fill' })
    // Boost contrast and saturation to make neon pop
    .modulate({
      brightness: 1.05,
      saturation: 1.25,
    })
    // Slight sharpening for crisp neon edges
    .sharpen({ sigma: 1.2, m1: 0.8, m2: 0.4 })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outPath);

  const finalMeta = await sharp(outPath).metadata();
  console.log(`Final: ${finalMeta.width}x${finalMeta.height}, ${(await sharp(outPath).toBuffer()).length / 1024 | 0}KB`);
  console.log('Done!');
}

processHero().catch(console.error);
