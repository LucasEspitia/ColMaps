import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const configurations = [
  {
    source: 'assets-source/hero-cocora.jpg',
    output: 'public/images/hero',
    name: 'cocora',
    widths: [640, 1280, 1920],
  },
  ...['culture', 'nature', 'cities', 'hidden'].map((name) => ({
    source: `assets-source/discover-${name}.jpg`,
    output: 'public/images/discover',
    name,
    widths: [320, 640, 960],
    aspectRatio: 4 / 5,
  })),
];

for (const config of configurations) {
  await mkdir(config.output, { recursive: true });

  for (const width of config.widths) {
    const destination = join(config.output, `${config.name}-${width}.webp`);

    const height = config.aspectRatio ? Math.round(width / config.aspectRatio) : undefined;

    const info = await sharp(config.source)
      .rotate()
      .resize({
        width,
        height,
        fit: 'cover',
        position: 'attention',
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 6 })
      .toFile(destination);

    console.log(
      `${destination}: ${info.width}x${info.height} - ${Math.round(info.size / 1024)} KB`,
    );
  }
}
