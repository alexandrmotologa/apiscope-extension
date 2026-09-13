import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Look for resvg in parent scratch node_modules if needed
let Resvg;
try {
  ({ Resvg } = require('@resvg/resvg-js'));
} catch {
  const scratchResvgPath = path.resolve(__dirname, '../../node_modules/@resvg/resvg-js');
  ({ Resvg } = require(scratchResvgPath));
}

const svgPath = path.resolve(__dirname, '../public/icons/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const sizes = [16, 48, 128];
const outputDir = path.resolve(__dirname, '../public/icons');

for (const size of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const outPath = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`Generated icon-${size}.png (${size}x${size})`);
}
console.log('All icons generated successfully.');
