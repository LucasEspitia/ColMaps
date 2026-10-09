import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const source = 'assets-source/hero-cocora.jpg'; // * Change this to the path of your source image
const output = 'public/images/hero'; // * Change this to the path of your output directory

const widths = [640, 1280, 1920]; // * Change this to the desired widths for your optimized images

await mkdir(output, { recursive: true });

for (const width of widths) {
  const destination = join(output, `cocora-${width}.webp`);

  const info = await sharp(source)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(destination);

  console.log(`${destination}: ${Math.round(info.size / 1024)} KB`);
}
