// @ts-check
const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg, bg) {
  const l1 = luminance(...fg) + 0.05;
  const l2 = luminance(...bg) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

function parseRgb(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

test.describe('Critique audit evidence', () => {
  for (const vp of VIEWPORTS) {
    test(`collects UX signals at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const audit = await page.evaluate(() => {
        const px = (el) => {
          const r = el.getBoundingClientRect();
          return { w: r.width, h: r.height, top: r.top };
        };

        const headings = [...document.querySelectorAll('h1, h2, h3')].map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 80),
          overflow: el.scrollWidth > el.clientWidth + 2,
          fontSize: getComputedStyle(el).fontSize,
        }));

        const eyebrows = [...document.querySelectorAll('.hero-eyebrow, .section-head__rule, .font-label-caps')]
          .filter((el) => el.textContent && el.textContent.length < 60)
          .slice(0, 12)
          .map((el) => el.textContent?.trim());

        const touchables = [...document.querySelectorAll('a, button')].map((el) => {
          const { w, h } = px(el);
          return { tag: el.tagName, small: w < 44 || h < 44, w, h, label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40) };
        });

        const smallTargets = touchables.filter((t) => t.small);

        const heroHeading = document.querySelector('.hero-heading');
        const heroOverflow = heroHeading ? heroHeading.scrollWidth > heroHeading.clientWidth + 2 : false;

        const sectionCount = document.querySelectorAll('main > section').length;
        const cardCount = document.querySelectorAll('.project-card, .blog-preview-card, .schedule-card').length;

        const mutedSamples = [
          '.hero-eyebrow',
          '.font-label-sm',
          '.text-muted-text',
          '.text-on-surface-variant',
        ].map((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = getComputedStyle(el);
          return { sel, color: cs.color, bg: getComputedStyle(el.parentElement || document.body).backgroundColor };
        }).filter(Boolean);

        const emDashCount = (document.body.innerText.match(/—|--/g) || []).length;

        const fonts = new Set();
        document.querySelectorAll('h1,h2,h3,p,a,button,span').forEach((el) => {
          fonts.add(getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim());
        });

        return {
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          headings,
          heroOverflow,
          eyebrows,
          smallTargetCount: smallTargets.length,
          smallTargets: smallTargets.slice(0, 8),
          sectionCount,
          cardCount,
          mutedSamples,
          emDashCount,
          fonts: [...fonts],
          hasSkipLink: !!document.querySelector('.skip-link'),
          h1Count: document.querySelectorAll('h1').length,
          navItemCount: document.querySelectorAll('header a.nav-link, #mobile-menu a').length,
        };
      });

      const contrastChecks = [];
      for (const sample of audit.mutedSamples) {
        const fg = parseRgb(sample.color);
        const bg = parseRgb(sample.bg);
        if (fg && bg) {
          contrastChecks.push({ sel: sample.sel, ratio: Math.round(contrastRatio(fg, bg) * 100) / 100 });
        }
      }

      // eslint-disable-next-line no-console
      console.log(`\n=== CRITIQUE AUDIT (${vp.name}: ${audit.viewport}) ===`);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ ...audit, contrastChecks }, null, 2));

      expect(audit.h1Count).toBe(1);
      expect(audit.hasSkipLink).toBe(true);

      if (vp.name === 'mobile') {
        expect(audit.heroOverflow).toBe(false);
      }
    });
  }
});
