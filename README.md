# Ayati Group — ayatigroup.com

Static marketing site for Ayati Group (Noida residential developer).

## Structure

```
├── index.html          Homepage
├── blog/               Insights articles + blog.css
├── css/
│   ├── input.css       Tailwind source (edit tokens in tailwind.config.js)
│   ├── tailwind.css    Built utility CSS (committed; regenerate after class changes)
│   └── site.css        Custom components, layout, motion hooks
├── js/
│   ├── main.js         Nav, forms, brochure modal, WhatsApp
│   ├── motion.js       GSAP scroll animations (desktop)
│   └── leads.js        Google Sheets lead capture
├── images/
│   ├── logos/          Brand marks
│   ├── partners/       Finance partner logos
│   ├── photos/         Photography & hero assets (production)
│   ├── webp/           Responsive WebP derivatives
│   └── icons.svg       Inline SVG icon sprite
├── docs/brochures/     PDF brochures (lead-gated download)
├── _headers            Security headers (Netlify / compatible hosts)
└── vercel.json         Cache headers for static assets
```

## Develop

```bash
npm install
npm run build:css    # after changing Tailwind classes
npm run dev          # http://127.0.0.1:8765
```

## Deploy

Push to `main` on GitHub. Site deploys to **ayatigroup.com** via Vercel/Netlify.

After changing Tailwind classes, run `npm run build:css` before committing.
