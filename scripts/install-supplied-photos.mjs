import { readdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const downloads = 'C:/Users/mifis/Downloads';
const files = await readdir(downloads);
for (const [prefix, output] of [
  ['Luxury Fine Dining Steak Photography', 'hero-steak.webp'],
  ['Got into the kitchen with Matt at @peartreeatgreenlandplace', 'story-steak.webp'],
]) {
  const filename = files.find(name => name.startsWith(prefix) && name.endsWith('.jpg'));
  if (!filename) throw new Error(`Missing supplied photo: ${prefix}`);
  const input = await readFile(`${downloads}/${filename}`);
  // Preserve the complete photograph and its native resolution.
  await sharp(input).rotate().webp({ quality: 95 }).toFile(`public/images/${output}`);
  console.log(output, await sharp(input).metadata().then(({width,height}) => ({width,height})));
}
