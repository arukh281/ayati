# Ayati Group — ayatigroup.com

Static marketing site for Ayati Group (Noida residential developer).

## Structure

```
├── index.html              Homepage
├── blog/                   Insights articles + blog.css
├── css/
│   ├── input.css           Tailwind source (edit tokens in tailwind.config.js)
│   ├── tailwind.css        Built utility CSS (committed; regenerate after class changes)
│   └── site.css            Custom components, layout, motion hooks
├── js/
│   ├── main.js             Nav, forms, brochure modal, WhatsApp
│   ├── motion.js           GSAP scroll animations (desktop)
│   ├── leads.js            Google Sheets lead capture
│   ├── about-carousel.js   About section image carousel
│   ├── project-views-gallery.js  Ayati Greens render gallery modal
│   ├── floor-plan-3d.js    3D model modal (loads viewer on demand)
│   └── floor-plan-viewer.mjs     Three.js viewer (dynamic import)
├── images/
│   ├── logos/              Brand marks
│   ├── partners/           Finance partner logos
│   ├── photos/             Photography & hero assets
│   │   └── about-carousel/ Numbered carousel + gallery renders
│   ├── webp/               Responsive WebP derivatives
│   ├── models/             GLB 3D models (aadhya-residency, ayati-green)
│   └── icons.svg           Inline SVG icon sprite
├── brochures/              PDF brochures on public direct URLs (WhatsApp links)
├── docs/brochures/         Same PDFs, served behind the lead-gated download
├── tests/                  Playwright specs
├── _headers                Security headers (Netlify / compatible hosts)
└── vercel.json             Cache headers for static assets
```

Drop raw client deliverables into a local folder, then export final assets into `images/` or `docs/` — do not commit source-drop folders.

## Develop

```bash
npm install
npm run build:css    # after changing Tailwind classes
npm run dev          # http://127.0.0.1:8765
```

## Brochures

Every brochure is served twice: `docs/brochures/` backs the lead-gated download
button on the site, and `brochures/` exposes the same PDF on a clean public URL
for sharing as a WhatsApp attachment. Keep both copies in sync when a brochure
is replaced. Vercel serves these as static files with `application/pdf`, and no
rewrite intercepts them.

| Project | Public URL |
| --- | --- |
| Aadya Homes | https://ayatigroup.com/brochures/aadya-homes.pdf |
| Aadya Residency | https://ayatigroup.com/brochures/aadya-residency.pdf |
| Ayati Greens 1 | https://ayatigroup.com/brochures/ayati-greens-1.pdf |
| Ayati Greens 1 floor plans | https://ayatigroup.com/brochures/ayati-greens-1-floor-plans.pdf |

Brochures are large by nature. Before committing one, check where its weight
actually is: photos stored losslessly should be re-encoded as JPEG, and a page
carrying tens of thousands of vector paths is usually cheaper rasterised at
300dpi. Leave pages with QR codes as vectors, and confirm the codes still scan
afterwards.

## Deploy

Push to `main` on GitHub. Site deploys to **ayatigroup.com** via Vercel/Netlify.

After changing Tailwind classes, run `npm run build:css` before committing.
