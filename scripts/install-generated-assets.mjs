import sharp from 'sharp';
import {readFile,mkdir} from 'node:fs/promises';
const sources=JSON.parse(await readFile('scripts/generated-assets.json','utf8'));
await mkdir('public/images',{recursive:true});
for(const [name,source] of Object.entries(sources)){
 await sharp(source).webp({quality:94,effort:6}).toFile(`public/images/${name}.webp`);
 const meta=await sharp(source).metadata();console.log(`${name}: ${meta.width} × ${meta.height}`);
}
await sharp(sources.hero).webp({quality:94,effort:6}).toFile('public/images/hero-mobile.webp');
