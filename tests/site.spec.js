// @ts-check
const { test, expect } = require('@playwright/test');

async function waitForGsap(page) {
  await page.waitForFunction(() => typeof window.gsap !== 'undefined');
  await page.waitForLoadState('networkidle');
}

async function gsapTweenCount(page) {
  return page.evaluate(() => {
    if (typeof window.gsap === 'undefined') return 0;
    return window.gsap.globalTimeline.getChildren(true, true, true).length;
  });
}

async function heroSettled(page) {
  await page.waitForTimeout(1800);
  return page.evaluate(() => {
    const el = document.querySelector('.hero-heading');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const opacity = parseFloat(style.opacity);
    return opacity > 0.95 && style.visibility !== 'hidden';
  });
}

test.describe('Ayati Group homepage', () => {
  test('loads with core content and metadata', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ayati Group/i);
    await expect(page.locator('.hero-heading')).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /independent-floor homes/i
    );
  });

  test('mobile menu opens and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only interaction');
    await page.goto('/');
    const toggle = page.locator('#menu-toggle');
    const menu = page.locator('#mobile-menu');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(menu).toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(menu).not.toHaveClass(/is-open/);
  });

  test('desktop nav is visible; mobile uses hamburger', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize()?.width ?? 1280;
    const isDesktopNav = width >= 1024;
    if (!isDesktopNav) {
      await expect(page.locator('#menu-toggle')).toBeVisible();
      await expect(page.locator('header nav[aria-label="Primary navigation"]')).toBeHidden();
    } else {
      await expect(page.locator('header nav[aria-label="Primary navigation"]')).toBeVisible();
      await expect(page.locator('#menu-toggle')).toBeHidden();
    }
  });

  test('no horizontal overflow on key breakpoints', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test('sections are reachable via in-page anchors', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize()?.width ?? 1280;
    const sections = ['about', 'properties', 'schedule', 'contact'];
    if (width >= 1024) sections.splice(2, 0, 'why-us');
    for (const id of sections) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });
});

test.describe('GSAP motion', () => {
  test('registers tweens on mobile after matchMedia fix', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Validates mobile GSAP context');
    await page.goto('/');
    await waitForGsap(page);
    const count = await gsapTweenCount(page);
    expect(count).toBeGreaterThan(5);
    const settled = await heroSettled(page);
    expect(settled).toBe(true);
  });

  test('registers tweens on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only');
    await page.goto('/');
    await waitForGsap(page);
    const count = await gsapTweenCount(page);
    expect(count).toBeGreaterThan(5);
    const settled = await heroSettled(page);
    expect(settled).toBe(true);
  });

  test('scroll reveals fire for about section', async ({ page }) => {
    await page.goto('/');
    await waitForGsap(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const titleY = await page.locator('#about-heading').evaluate((el) => {
      const t = window.getComputedStyle(el).transform;
      if (t === 'none') return 0;
      const match = t.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
      return match ? Math.abs(parseFloat(match[1])) : 0;
    });
    expect(titleY).toBeLessThan(4);
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForGsap(page);
    await page.waitForTimeout(500);
    const scrollTriggers = await page.evaluate(() => {
      if (typeof window.ScrollTrigger === 'undefined') return 0;
      return window.ScrollTrigger.getAll().filter((st) => {
        const trigger = st.vars?.trigger;
        if (typeof trigger === 'string') return trigger.startsWith('#');
        return trigger?.id;
      }).length;
    });
    expect(scrollTriggers).toBe(0);
  });
});

test.describe('About carousel', () => {
  test('advances on next click', async ({ page }) => {
    await page.goto('/');
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(page.locator('.about-carousel__slide')).toHaveCount(5);
    const label = page.locator('[data-carousel-label]');
    const initial = await label.textContent();
    await page.locator('[data-carousel-next]').click();
    await expect(label).not.toHaveText(initial ?? '');
  });

  test('uses uniform gallery frames for consistent carousel presentation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#about').scrollIntoViewIfNeeded();
    const img = page.locator('.about-carousel__slide.is-active img');
    const src = await img.getAttribute('src');
    expect(src).toContain('/uniform/');
    const objectFit = await img.evaluate((el) => getComputedStyle(el).objectFit);
    expect(objectFit).toBe('cover');
  });

  test('opens 3D model viewer for Ayati Greens 1', async ({ page }) => {
    await page.goto('/');
    await page.locator('#properties').scrollIntoViewIfNeeded();
    await page.locator('[data-floor-plan-open="ayati-green-1"]').click();
    const modal = page.locator('#floor-plan-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#floor-plan-modal-title')).toHaveText(/Ayati Greens 1/);
  });

  test('opens 3D views gallery for Ayati Greens 1', async ({ page }) => {
    await page.goto('/');
    await page.locator('#properties').scrollIntoViewIfNeeded();
    await page.locator('[data-views-gallery-open="ayati-greens-1"]').click();
    const modal = page.locator('#project-views-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('[data-views-gallery-image]')).toHaveAttribute('src', /ayati-green/);
  });
});

test.describe('Site quality scorecard', () => {
  test('rates homepage across accessibility, motion, and layout', async ({ page, isMobile }) => {
    await page.goto('/');
    await waitForGsap(page);
    await page.waitForTimeout(1800);

    const report = await page.evaluate(async () => {
      const scores = {};
      const weight = (key, pts, max, note) => {
        scores[key] = { pts, max, note };
      };

      weight('title', document.title.length > 10 ? 5 : 0, 5, 'Document title present');
      weight(
        'meta',
        document.querySelector('meta[name="description"]')?.content ? 5 : 0,
        5,
        'Meta description'
      );
      weight('skip', document.querySelector('.skip-link') ? 5 : 0, 5, 'Skip link');
      weight('h1', document.querySelectorAll('h1').length === 1 ? 5 : 0, 5, 'Single H1');
      weight('lang', document.documentElement.lang ? 5 : 0, 5, 'HTML lang attribute');
      weight('viewport', document.querySelector('meta[name="viewport"]') ? 5 : 0, 5, 'Viewport meta');

      const imgs = [...document.querySelectorAll('img')];
      const imgAlt = imgs.filter((i) => i.getAttribute('alt') !== null).length;
      weight('imgAlt', Math.round((imgAlt / Math.max(imgs.length, 1)) * 10), 10, 'Images with alt');

      const overflow = document.documentElement.scrollWidth <= window.innerWidth + 1;
      weight('noOverflow', overflow ? 10 : 0, 10, 'No horizontal scroll');

      const gsapOk = typeof window.gsap !== 'undefined'
        && window.gsap.globalTimeline.getChildren(true, true, true).length > 0;
      weight('gsap', gsapOk ? 15 : 0, 15, 'GSAP motion active');

      const hero = document.querySelector('.hero-heading');
      const heroStyle = hero ? window.getComputedStyle(hero) : null;
      const heroVisible = heroStyle
        && parseFloat(heroStyle.opacity) > 0.9
        && heroStyle.visibility !== 'hidden';
      weight('heroVisible', heroVisible ? 10 : 0, 10, 'Hero readable after load');

      const touchTargets = [...document.querySelectorAll('button, a')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width >= 40 && r.height >= 40;
      }).length;
      const interactive = document.querySelectorAll('button, a[href]').length;
      weight(
        'touch',
        Math.round((touchTargets / Math.max(interactive, 1)) * 10),
        10,
        'Adequate touch targets'
      );

      const total = Object.values(scores).reduce((s, v) => s + v.pts, 0);
      const max = Object.values(scores).reduce((s, v) => s + v.max, 0);
      const pct = Math.round((total / max) * 100);

      return { scores, total, max, pct, viewport: `${window.innerWidth}x${window.innerHeight}` };
    });

    // eslint-disable-next-line no-console
    console.log(`\n── Quality score (${isMobile ? 'mobile' : 'desktop'}: ${report.viewport}) ──`);
    // eslint-disable-next-line no-console
    console.log(`Overall: ${report.total}/${report.max} (${report.pct}%)`);
    for (const [key, val] of Object.entries(report.scores)) {
      // eslint-disable-next-line no-console
      console.log(`  ${key}: ${val.pts}/${val.max} — ${val.note}`);
    }

    expect(report.pct).toBeGreaterThanOrEqual(75);
    expect(report.scores.gsap.pts).toBeGreaterThan(0);
    expect(report.scores.heroVisible.pts).toBeGreaterThan(0);
    expect(report.scores.noOverflow.pts).toBeGreaterThan(0);
  });
});
