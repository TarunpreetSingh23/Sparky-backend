/**
 * generate-icons.js
 * Resizes the Sparky icon into all required PWA sizes
 * and copies them to each frontend app's public/icons/ folder.
 *
 * Run from: c:\Client4-(SParky)
 *   node generate-icons.js
 *
 * Requires: npm install sharp  (in the root workspace)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = process.argv[2]; // Pass absolute path as first arg

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const TARGETS = [
  'frontend/customer/public/icons',
  'frontend/worker/public/icons',
  'frontend/admin/public/icons'
];

const ROOT = path.join(__dirname);

(async () => {
  if (!SOURCE_IMAGE || !fs.existsSync(SOURCE_IMAGE)) {
    console.error('ERROR: Pass the source image path as an argument.');
    console.error('Usage: node generate-icons.js <absolute-path-to-image>');
    process.exit(1);
  }

  for (const target of TARGETS) {
    const dir = path.join(ROOT, target);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`\n📁 ${dir}`);

    for (const size of SIZES) {
      const outFile = path.join(dir, `icon-${size}x${size}.png`);
      await sharp(SOURCE_IMAGE)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png()
        .toFile(outFile);
      console.log(`  ✓ icon-${size}x${size}.png`);
    }
  }

  console.log('\n✅ All icons generated successfully!');
})();
