import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicIconsDir = path.resolve(rootDir, 'public/icons');
const distIconsDir = path.resolve(distDir, 'icons');

// 1. Copy manifest.json
const manifestSrc = path.join(rootDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('Copied manifest.json to dist/');
}

// 2. Ensure icons are in dist/icons
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true });
}

if (fs.existsSync(publicIconsDir)) {
  const files = fs.readdirSync(publicIconsDir);
  for (const file of files) {
    fs.copyFileSync(path.join(publicIconsDir, file), path.join(distIconsDir, file));
  }
  console.log(`Copied ${files.length} icon files to dist/icons/`);
}

console.log('Extension distribution bundle ready in dist/');
