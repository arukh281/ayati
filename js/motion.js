(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power2.out', duration: 0.6 });

  const mm = gsap.matchMedia();

  mm.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 1024px)',
      mobile: '(max-width: 1023px)',
    },
    (context) => {
      const { reduceMotion, desktop } = context.conditions;

      if (reduceMotion) return;

      /* ── Header (load only) ────────────────────────────────────── */
      gsap.from('header .brand-logo', { y: -8, duration: 0.5, delay: 0.05 });
      gsap.from('header .nav-link', { y: -6, duration: 0.4, stagger: 0.05, delay: 0.15 });
      gsap.from('header a[href="#schedule"], header a[href*="schedule"]', {
        scale: 0.96, duration: 0.45, delay: 0.35, clearProps: 'transform',
      });

      /* ── Hero (load only) ──────────────────────────────────────── */
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-section__blueprint', { autoAlpha: 0, duration: 1 })
        .from('.hero-accent', { scaleX: 0, transformOrigin: 'left center', duration: 0.45 }, '-=0.55')
        .from('.hero-eyebrow', { y: 12, autoAlpha: 0, duration: 0.5 }, '-=0.3')
        .from('.hero-heading', { y: 20, autoAlpha: 0, duration: 0.65 }, '-=0.35')
        .from('.hero-subtext', { y: 16, autoAlpha: 0, duration: 0.5 }, '-=0.45')
        .from('.hero-cta', { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.08 }, '-=0.4')
        .from('.hero-trust-item', { y: 10, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, '-=0.3');

      if (desktop) {
        gsap.to('.hero-section__blueprint img', {
          yPercent: 4, ease: 'none',
          scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 0.5 },
        });
      }

      /* ── Scroll reveals: transform only — content stays visible ── */
      const scrollTl = (trigger, tweens) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger, start: 'top 92%', once: true },
          defaults: { ease: 'power2.out' },
        });
        tweens.forEach(([sel, vars, pos]) => tl.from(sel, vars, pos ?? undefined));
        return tl;
      };

      scrollTl('#about', [
        ['#about .about-section__gallery', { y: desktop ? 0 : 20, x: desktop ? -28 : 0, duration: 0.65 }],
        ['#about .about-section__intro', { y: 20, duration: 0.55 }, '-=0.45'],
        ['#about .about-section__story-content p', { y: 16, stagger: 0.08, duration: 0.45 }, '-=0.35'],
        ['#about .about-section__principle-copy', { y: 12, stagger: 0.08, duration: 0.4 }, '-=0.3'],
        ['#about .about-section__cta', { y: 10, duration: 0.4 }, '-=0.25'],
        ['#why-us .why-item__title', { y: 16, stagger: 0.1, duration: 0.45 }, '-=0.15'],
        ['#why-us .why-item__text', { y: 12, stagger: 0.1, duration: 0.4 }, '-=0.45'],
      ]);

      scrollTl('#properties', [
        ['#properties .section-head__rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.45 }],
        ['#properties .section-head__title', { y: 18 }, '-=0.15'],
        ['#properties .section-head__lede', { y: 12, duration: 0.45 }, '-=0.35'],
        ['#properties .project-card', { y: 36, duration: 0.6, stagger: 0.14 }, '-=0.2'],
        ['#properties .project-card__media img',
          { scale: 1.06, duration: 0.75, stagger: 0.14, transformOrigin: 'center center' }, '-=0.5'],
      ]);

      scrollTl('#insights', [
        ['#insights .section-head__rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.45 }],
        ['#insights .section-head__title', { y: 18 }, '-=0.15'],
        ['#insights .section-head__lede', { y: 12, duration: 0.45 }, '-=0.35'],
        ['#insights .blog-preview-card', { y: 24, stagger: 0.1, duration: 0.55 }, '-=0.2'],
      ]);

      scrollTl('#finance', [
        ['#finance .section-head__rule', { scaleX: 0, transformOrigin: 'center center', duration: 0.45 }],
        ['#finance .section-head__title', { y: 14 }, '-=0.15'],
        ['#finance .section-head__lede', { y: 10, duration: 0.45 }, '-=0.35'],
        ['#finance .partner-marquee', { y: 16, duration: 0.5 }, '-=0.2'],
      ]);

      scrollTl('#schedule', [
        ['#schedule-heading', { y: 20, duration: 0.55 }],
        ['#schedule .schedule-intro p', { y: 14, stagger: 0.08, duration: 0.45 }, '-=0.35'],
        ['#schedule .schedule-card', { y: 28, stagger: 0.12, duration: 0.55 }, '-=0.25'],
      ]);

      scrollTl('#contact', [
        ['#contact .brand-logo', { y: 16, duration: 0.5 }],
        ['#contact > div > div', { y: 20, stagger: 0.1, duration: 0.5 }, '-=0.35'],
      ]);

      return () => {};
    }
  );

  /* ── Scrolled-nav: slide header away, reveal fixed star (desktop only) ─ */
  (function initScrolledNav() {
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    const btn    = document.getElementById('nav-star-btn');
    const header = document.querySelector('header');
    const logo   = header?.querySelector('.brand-logo');

    if (!btn || !header) return;

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hideY = () => -(header.offsetHeight);

    gsap.set([header, logo], { opacity: 1, visibility: 'visible' });

    const navTl = gsap.timeline({ paused: true })
      .to(header, {
        y: hideY,
        opacity: 1,
        duration: rm ? 0 : 0.32,
        ease: 'power2.in',
      }, 0)
      .fromTo(btn,
        { autoAlpha: 0, scale: 0.65 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: rm ? 0 : 0.28,
          ease: 'power3.out',
          onStart() { btn.style.pointerEvents = 'auto'; },
        },
        rm ? 0 : 0.18
      );

    navTl.eventCallback('onReverseComplete', () => {
      gsap.set(header, { clearProps: 'transform' });
      btn.style.pointerEvents = 'none';
      if (window.__closeNavOverlay) window.__closeNavOverlay(true);
    });

    ScrollTrigger.create({
      trigger: document.documentElement,
      start:   'top -80px',
      end:     99999,
      onEnter:     () => navTl.play(),
      onLeaveBack: () => navTl.reverse(),
    });

    window.__navTl = navTl;
  }());
})();
