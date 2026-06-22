const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const root = path.join(__dirname, '..');
const input = path.join(root, 'images/logos/STAR.png');
const outIco = path.join(root, 'favicon.ico');
const outPng = path.join(root, 'favicon.png');

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  if (!fs.existsSync(input)) {
    console.error('Missing', input);
    process.exit(1);
  }

  const sizes = [16, 32, 48];
  const bufs = await Promise.all(
    sizes.map((s) =>
      sharp(input)
        .resize(s, s, { fit: 'contain', background: transparent })
        .ensureAlpha()
        .png()
        .toBuffer()
    )
  );
  const ico = await toIco(bufs, { resize: false });
  fs.writeFileSync(outIco, ico);

  await sharp(input)
    .resize(128, 128, { fit: 'contain', background: transparent })
    .ensureAlpha()
    .png()
    .toFile(outPng);

  console.log('Wrote', path.relative(root, outIco), path.relative(root, outPng));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
