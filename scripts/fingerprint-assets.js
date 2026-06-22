'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
}

const fonts = fs.readFileSync(path.join(root, 'css', 'fonts.css'), 'utf8');
const stylesMin = fs.readFileSync(path.join(root, 'css', 'styles.min.css'), 'utf8');
const bundle = `${fonts}\n${stylesMin}`;
const bundleHash = crypto.createHash('sha256').update(bundle).digest('hex').slice(0, 8);
const bundleRel = `css/app.${bundleHash}.min.css`;
fs.writeFileSync(path.join(root, bundleRel), bundle);

const jsHash = hashFile(path.join(root, 'js', 'script.min.js'));
const jsRel = `js/script.${jsHash}.min.js`;
fs.copyFileSync(path.join(root, 'js', 'script.min.js'), path.join(root, jsRel));

const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(
  /<link rel="stylesheet" href="css\/fonts\.[a-f0-9]+\.css">\s*\n\s*<link rel="stylesheet" href="css\/styles\.[a-f0-9]+\.min\.css">/,
  `<link rel="stylesheet" href="${bundleRel}">`
);
html = html.replace(
  /<script defer src="js\/script\.[a-f0-9]+\.min\.js"><\/script>/,
  `<script defer src="${jsRel}"></script>`
);
fs.writeFileSync(indexPath, html);

console.log(bundleRel, jsRel);
