import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');

async function processLogo() {
  const image = sharp(logoPath);
  const metadata = await image.metadata();
  console.log(`Original: ${metadata.width}x${metadata.height}`);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Sample background colour from top-left corner
  let bgR = 0, bgG = 0, bgB = 0, samples = 0;
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const idx = (y * width + x) * channels;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      samples++;
    }
  }
  bgR = Math.round(bgR / samples);
  bgG = Math.round(bgG / samples);
  bgB = Math.round(bgB / samples);
  console.log(`Background: rgb(${bgR}, ${bgG}, ${bgB})`);

  // Luminance-based approach:
  // The logo is white neon glow on dark navy. Instead of trying to detect
  // "background" vs "content" by colour distance, we use the principle that
  // the glow is essentially "white light" over the navy. The brightness of
  // each pixel tells us how much "glow" is present.
  //
  // Strategy: map each pixel to white with alpha proportional to its
  // brightness distance from the background. This gives a clean white
  // neon glow on transparent background.

  const maxDist = Math.sqrt(
    (255 - bgR) ** 2 + (255 - bgG) ** 2 + (255 - bgB) ** 2
  );

  const newData = Buffer.alloc(data.length);
  const deadzone = 0.12; // below this ratio, consider it pure background

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
    );
    const ratio = dist / maxDist;

    if (ratio < deadzone) {
      // Pure background — fully transparent
      newData[i] = 0;
      newData[i + 1] = 0;
      newData[i + 2] = 0;
      newData[i + 3] = 0;
    } else {
      // Remap: the "glow" portion becomes white with proportional alpha
      // Normalise ratio from [deadzone..1] to [0..1]
      const t = Math.min(1, (ratio - deadzone) / (1 - deadzone));
      // Use a slight power curve to make faint glow more visible
      const alpha = Math.round(Math.pow(t, 0.7) * 255);
      // Keep RGB as white (the glow IS white light)
      newData[i] = 255;
      newData[i + 1] = 255;
      newData[i + 2] = 255;
      newData[i + 3] = alpha;
    }
  }

  // Find bounding box of visible pixels
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (newData[idx + 3] > 3) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Add small padding
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log(`Crop: x=${minX} y=${minY} w=${cropW} h=${cropH}`);

  const processed = await sharp(newData, {
    raw: { width, height, channels }
  })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer();

  await sharp(processed).toFile(logoPath);

  const finalMeta = await sharp(logoPath).metadata();
  console.log(`Final: ${finalMeta.width}x${finalMeta.height}`);
  console.log('Done!');
}

processLogo().catch(console.error);
