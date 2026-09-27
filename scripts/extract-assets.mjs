import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const [desktop,mobile]=process.argv.slice(2);
if(!desktop||!mobile) throw new Error('Pass the desktop reference and second reference paths.');
await mkdir('public/images',{recursive:true});
// Only text-free photographic regions from the supplied references are extracted.
const crops=[
 [desktop,'hero',{left:600,top:80,width:424,height:512}],
 [desktop,'story',{left:55,top:658,width:426,height:385}],
 [mobile,'hero-mobile',{left:660,top:76,width:610,height:450}],
 [mobile,'lamb',{left:432,top:600,width:215,height:187}],
 [mobile,'kingklip',{left:672,top:600,width:215,height:187}],
 [mobile,'chocolate',{left:912,top:600,width:214,height:187}],
 [mobile,'interior',{left:315,top:875,width:730,height:180}],
];
await Promise.all(crops.map(([source,name,rect])=>sharp(source).extract(rect).webp({quality:92}).toFile(`public/images/${name}.webp`)));
console.log('Extracted seven clean photographic assets.');
