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
├── docs/brochures/         PDF brochures (lead-gated download)
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

## Deploy

Push to `main` on GitHub. Site deploys to **ayatigroup.com** via Vercel/Netlify.

After changing Tailwind classes, run `npm run build:css` before committing.
