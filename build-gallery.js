// Usage:  npm install sharp   (once)
//         node build-gallery.js
//
// Reads every image in ./assets (except picture.png, the hero),
// creates optimized copies in ./assets/web (1800px) and ./assets/thumbs (700px),
// and writes ./gallery.js which index.html loads.
// Your original files are never modified.

const fs = require('fs');
const path = require('path');

let sharp = null;
try { sharp = require('sharp'); } catch (e) {
  console.warn('sharp not installed — using original files without resizing (run: npm install sharp)');
}

const ROOT = __dirname;
const SRC = path.join(ROOT, 'assets');
const WEB = path.join(SRC, 'web');
const THUMBS = path.join(SRC, 'thumbs');
const EXT = /\.(jpe?g|png|webp)$/i;
const SKIP = new Set(['picture.png']);

(async () => {
  if (!fs.existsSync(SRC)) { console.error('No ./assets folder found.'); process.exit(1); }
  fs.mkdirSync(WEB, { recursive: true });
  fs.mkdirSync(THUMBS, { recursive: true });

  const files = fs.readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isFile() && EXT.test(d.name) && !SKIP.has(d.name.toLowerCase()))
    .map(d => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const list = [];
  for (const name of files) {
    const input = path.join(SRC, name);
    const base = path.parse(name).name.replace(/[^\w\-]+/g, '_');
    if (sharp) {
      const webName = base + '.jpg';
      try {
        await sharp(input).rotate().resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(WEB, webName));
        await sharp(input).rotate().resize({ width: 700, withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(THUMBS, webName));
        list.push({ thumb: 'assets/thumbs/' + webName, full: 'assets/web/' + webName });
        console.log('ok  ', name);
      } catch (err) {
        console.warn('skip', name, '-', err.message);
      }
    } else {
      const rel = 'assets/' + encodeURIComponent(name);
      list.push({ thumb: rel, full: rel });
    }
  }

  fs.writeFileSync(path.join(ROOT, 'gallery.js'), 'window.GALLERY = ' + JSON.stringify(list, null, 2) + ';\n');
  console.log('\nDone: ' + list.length + ' photos written to gallery.js');
})();
