// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', '.impeccable', 'screenshots');

test.describe('Visual review — about + Aadya Homes', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT, { recursive: true });
  });

  for (const vp of [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
  ]) {
    test(`capture and measure at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      const metrics = await page.evaluate(() => {
        const copy = document.querySelector('.about-section__copy');
        const copyP = document.querySelector('.about-section__copy p');
        const aboutTitle = document.querySelector('#about-heading');
        const portraitMedia = document.querySelector('.project-card:first-child .project-card__media');
        const portraitImg = portraitMedia?.querySelector('img');
        const landscapeMedia = document.querySelector('.project-card:nth-child(2) .project-card__media');

        const box = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            w: Math.round(r.width),
            h: Math.round(r.height),
            aspect: r.width ? Math.round((r.width / r.height) * 1000) / 1000 : null,
            objectFit: cs.objectFit,
            objectPosition: cs.objectPosition,
            textAlign: cs.textAlign,
            bg: cs.backgroundColor,
          };
        };

        return {
          aboutCopyAlign: copy ? getComputedStyle(copy).textAlign : null,
          aboutParagraphAlign: copyP ? getComputedStyle(copyP).textAlign : null,
          aboutTitleAlign: aboutTitle ? getComputedStyle(aboutTitle).textAlign : null,
          carouselSlideCount: document.querySelectorAll('.about-carousel__slide').length,
          portraitMedia: box(portraitMedia),
          portraitImg: box(portraitImg),
          landscapeMedia: box(landscapeMedia),
          gridAlign: portraitMedia && landscapeMedia
            ? Math.abs(portraitMedia.getBoundingClientRect().top - landscapeMedia.getBoundingClientRect().top) < 4
            : null,
        };
      });

      // eslint-disable-next-line no-console
      console.log(`\n=== VISUAL METRICS (${vp.name}) ===\n`, JSON.stringify(metrics, null, 2));

      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT, `about-${vp.name}.png`) });

      await page.locator('#properties').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.locator('.project-grid').screenshot({ path: path.join(OUT, `properties-grid-${vp.name}.png`) });

      expect(metrics.aboutParagraphAlign).toBe('justify');
      expect(metrics.aboutTitleAlign).toBe('left');
      expect(metrics.carouselSlideCount).toBe(5);
      expect(metrics.portraitImg?.objectFit).toBe('cover');
      if (vp.name === 'desktop' && metrics.portraitMedia && metrics.landscapeMedia) {
        expect(metrics.portraitMedia.h).toBe(metrics.landscapeMedia.h);
        expect(metrics.portraitImg?.aspect).toBeGreaterThan(1.4);
      }
    });
  }
});
