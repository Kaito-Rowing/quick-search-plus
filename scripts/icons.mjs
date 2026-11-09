import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

// Preserve the existing vector artwork; ship raster icons supported by Chrome.
const source = await readFile(new URL('../icons/icon128.svg', import.meta.url));
for (const size of [16, 32, 48, 128]) {
  await writeFile(new URL(`../icons/icon${size}.png`, import.meta.url), await sharp(source).resize(size, size).png().toBuffer());
}
console.log('Generated PNG icons (16, 32, 48, 128).');
