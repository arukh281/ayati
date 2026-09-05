(function () {
  'use strict';

  // ── Mobile nav ────────────────────────────────────────────────────
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');

  function setMenuOpen(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function syncHeaderHeight() {
    const header = document.querySelector('header');
    if (!header) return;
    document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
  }

  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight, { passive: true });

  // ── Project WhatsApp links ─────────────────────────────────────────
  const WHATSAPP_NUMBER = '919953533766';

  function buildPropertyWhatsAppUrl(property, location, intent) {
    const isInterest = intent === 'interest';
    const lines = isInterest
      ? [
          'Hi Ayati Group,',
          '',
          `I'd like to register my interest in ${property}.`,
        ]
      : [
          'Hi Ayati Group,',
          '',
          `I'd like to schedule a site visit for ${property}.`,
        ];
    if (location) lines.push('', `Location: ${location}`);
    lines.push(
      '',
      isInterest
        ? 'Please notify me when floor plans and pricing are announced.'
        : 'Please share available slots, pricing, and floor plan options.',
      '',
      'Thank you.'
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  document.querySelectorAll('[data-property-whatsapp]').forEach((link) => {
    const property = link.dataset.propertyWhatsapp?.trim();
    if (!property) return;
    link.href = buildPropertyWhatsAppUrl(
      property,
      link.dataset.propertyLocation?.trim() || '',
      link.dataset.whatsappIntent?.trim() || 'visit'
    );
  });

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  mobileLinks?.forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenuOpen(false);
  });

  // ── Active nav on scroll ──────────────────────────────────────────
  const sections = document.querySelectorAll('main > section[id], header');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          link.classList.toggle('nav-link--active', Boolean(href && href.endsWith(`#${id}`)));
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((s) => sectionObserver.observe(s));

  // ── Header shadow on scroll ───────────────────────────────────────
  const header = document.querySelector('header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('header--scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Visit / callback form ─────────────────────────────────────────
  const form = document.getElementById('visit-form');
  const formMsg = document.getElementById('form-message');

  function showMsg(text, type) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = `form-message is-visible form-message--${type}`;
  }

  function validatePhone(value) {
    return /^[\+]?[0-9\s\-]{10,15}$/.test(value.trim());
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameEl      = form.querySelector('#visit-name');
    const phoneEl     = form.querySelector('#visit-phone');
    const emailEl     = form.querySelector('#visit-email');
    const msgEl       = form.querySelector('#visit-message');
    const projectEl   = form.querySelector('#visit-project');
    const stageEl     = form.querySelector('#visit-stage');
    const submitBtn   = form.querySelector('[type="submit"]');

    const name    = nameEl?.value.trim() ?? '';
    const phone   = phoneEl?.value.trim() ?? '';
    const email   = emailEl?.value.trim() ?? '';
    const message = msgEl?.value.trim() ?? '';
    const project = projectEl?.value.trim() ?? '';
    const stage   = stageEl?.value.trim() ?? '';

    if (!name) {
      showMsg('Please enter your name.', 'error');
      nameEl?.focus();
      return;
    }

    if (!phone || !validatePhone(phone)) {
      showMsg('Please enter a valid 10-digit phone number.', 'error');
      phoneEl?.focus();
      return;
    }

    if (email && !validateEmail(email)) {
      showMsg('Please enter a valid email address.', 'error');
      emailEl?.focus();
      return;
    }

    let waText = `Hi Ayati Group,\n\nI'd like to request a callback for a site visit.\n\nName: ${name}\nPhone: ${phone}`;
    if (email)   waText += `\nEmail: ${email}`;
    if (project) waText += `\nInterested in: ${project}`;
    if (stage)   waText += `\nSearch stage: ${stage}`;
    if (message) waText += `\n\nRequirements: ${message}`;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    try {
      await window.AyatiLeads?.sendToGoogleSheet({
        type: 'visit',
        name,
        phone,
        email,
        project,
        stage,
        msg: message,
      });
    } catch {
      showMsg(
        'We could not save your details right now. Please call +91 99535 33766 or message us on WhatsApp.',
        'error'
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
      return;
    }

    window.open(`https://wa.me/919953533766?text=${encodeURIComponent(waText)}`, '_blank', 'noopener,noreferrer');

    showMsg(
      'Opening WhatsApp — we\'ll confirm your visit time shortly. If it doesn\'t open, call us at +91 99535 33766.',
      'success'
    );

    form.reset();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
  });

  // ── Brochure lead-capture modal ─────────────────────────────────────
  const BROCHURE_PATH_RE = /^docs\/brochures\/[a-z0-9-]+\.pdf$/i;

  function sanitizeBrochureSrc(src) {
    if (!src || typeof src !== 'string') return '';
    const trimmed = src.trim();
    if (trimmed.includes('..') || trimmed.includes('//') || trimmed.includes('://')) return '';
    return BROCHURE_PATH_RE.test(trimmed) ? trimmed : '';
  }

  const brochureModal = document.getElementById('brochure-modal');
  const brochureForm = document.getElementById('brochure-form');
  const brochureMsg = document.getElementById('brochure-form-message');
  const brochurePropertyInput = document.getElementById('brochure-property-name');
  const brochureSrcInput = document.getElementById('brochure-brochure-src');
  const brochureNameInput = document.getElementById('brochure-name');
  const brochurePhoneInput = document.getElementById('brochure-phone');
  const brochureEmailInput = document.getElementById('brochure-email');
  let brochureOpen = false;
  let _brochureTriggerEl = null;

  function showBrochureMsg(text, type) {
    if (!brochureMsg) return;
    brochureMsg.textContent = text;
    brochureMsg.className = `form-message is-visible form-message--${type}`;
  }

  function clearBrochureMsg() {
    if (!brochureMsg) return;
    brochureMsg.textContent = '';
    brochureMsg.className = 'form-message';
  }

  function openBrochureModal(src, property, triggerEl) {
    if (!brochureModal || !brochureForm) return;
    const safeSrc = sanitizeBrochureSrc(src);
    if (brochurePropertyInput) brochurePropertyInput.value = property || '';
    if (brochureSrcInput) brochureSrcInput.value = safeSrc;
    brochureForm.dataset.brochureSrc = safeSrc;
    brochureForm.dataset.property = property || '';
    clearBrochureMsg();
    brochureModal.hidden = false;
    brochureModal.setAttribute('aria-hidden', 'false');
    brochureOpen = true;
    _brochureTriggerEl = triggerEl || null;
    document.body.style.overflow = 'hidden';
    trapFocus(brochureModal);
    brochureNameInput?.focus();
  }

  function closeBrochureModal() {
    if (!brochureModal) return;
    brochureModal.hidden = true;
    brochureModal.setAttribute('aria-hidden', 'true');
    brochureOpen = false;
    document.body.style.overflow = '';
    clearBrochureMsg();
    brochureForm?.reset();
    releaseFocus();
    _brochureTriggerEl?.focus();
    _brochureTriggerEl = null;
  }

  function downloadBrochure(src) {
    const safeSrc = sanitizeBrochureSrc(src);
    if (!safeSrc) {
      showBrochureMsg('Brochure not found. Please try again or contact us.', 'error');
      return false;
    }
    const a = document.createElement('a');
    a.href = safeSrc;
    a.download = '';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }

  document.querySelectorAll('.brochure-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openBrochureModal(btn.dataset.brochureSrc || '', btn.dataset.property || '', btn);
    });
  });

  brochureModal?.querySelectorAll('[data-brochure-close]').forEach((el) => {
    el.addEventListener('click', closeBrochureModal);
  });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && brochureOpen) {
        closeBrochureModal();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  brochureForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearBrochureMsg();

    const name = brochureNameInput?.value.trim() ?? '';
    const phone = brochurePhoneInput?.value.trim() ?? '';
    const email = brochureEmailInput?.value.trim() ?? '';
    const propertyName =
      brochurePropertyInput?.value.trim() ||
      brochureForm.dataset.property ||
      '';
    const src = sanitizeBrochureSrc(
      brochureSrcInput?.value || brochureForm.dataset.brochureSrc || ''
    );
    const submitBtn = brochureForm.querySelector('[type="submit"]');

    if (!name) {
      showBrochureMsg('Please enter your name.', 'error');
      brochureNameInput?.focus();
      return;
    }

    if (!phone && !email) {
      showBrochureMsg('Please enter a phone number or email address.', 'error');
      brochurePhoneInput?.focus();
      return;
    }

    if (phone && !validatePhone(phone)) {
      showBrochureMsg('Please enter a valid phone number.', 'error');
      brochurePhoneInput?.focus();
      return;
    }

    if (email && !validateEmail(email)) {
      showBrochureMsg('Please enter a valid email address.', 'error');
      brochureEmailInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    try {
      await window.AyatiLeads?.sendToGoogleSheet({
        type: 'brochure',
        name,
        no: phone,
        email,
        msg: propertyName,
      });
    } catch {
      showBrochureMsg(
        'We could not save your details right now. Call +91 99535 33766 and we will email the brochure.',
        'error'
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
      return;
    }

    if (!downloadBrochure(src)) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
      return;
    }

    showBrochureMsg('Download started — thank you for your interest.', 'success');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
    setTimeout(() => {
      closeBrochureModal();
    }, 1500);
  });

  // ── Shared focus-trap helper ───────────────────────────────────────
  // Exported as window.AyatiA11y so gallery and 3D floor-plan scripts
  // (which load before main.js) can call it on user interaction.
  const _FOCUSABLE_SEL =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let _ftHandler = null;
  let _ftContainer = null;

  function trapFocus(container) {
    releaseFocus();
    _ftContainer = container;
    _ftHandler = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(container.querySelectorAll(_FOCUSABLE_SEL)).filter(
        (el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      // Focus escaped (or never entered) the dialog — pull it back in.
      if (!container.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else if (document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    // Document-level (capture) so Tab is contained even when focus sits
    // outside the container — a container listener can never recover that.
    document.addEventListener('keydown', _ftHandler, true);
  }

  function releaseFocus() {
    if (_ftHandler) {
      document.removeEventListener('keydown', _ftHandler, true);
    }
    _ftHandler = null;
    _ftContainer = null;
  }

  window.AyatiA11y = { trapFocus, releaseFocus };

  // ── Scrolled-nav star: open / close overlay ──────────────────────────
  const navStarBtn  = document.getElementById('nav-star-btn');
  const navOverlay  = document.getElementById('nav-overlay');
  let   navOvOpen   = false;

  function openNavOverlay() {
    if (!navOverlay || navOvOpen) return;
    navOvOpen = true;
    navOverlay.setAttribute('aria-hidden', 'false');
    navOverlay.style.visibility  = 'visible';
    navOverlay.style.pointerEvents = 'auto';
    navStarBtn?.setAttribute('aria-expanded', 'true');

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(navOverlay,
        { y: '-100%' },
        { y: '0%', duration: 0.42, ease: 'power3.out', overwrite: true }
      );
      const links = navOverlay.querySelectorAll('.nav-overlay__link, .nav-overlay__cta');
      gsap.from(links, {
        y: 18, opacity: 0, stagger: 0.07, duration: 0.38,
        delay: 0.14, ease: 'power2.out', overwrite: true,
      });
      gsap.to('#nav-star-btn img', {
        rotation: 45, duration: 0.35, ease: 'power3.out', overwrite: true,
      });
    }
    trapFocus(navOverlay);
    navOverlay.querySelector(_FOCUSABLE_SEL)?.focus();
  }

  function closeNavOverlay(instant) {
    if (!navOverlay || !navOvOpen) return;
    navOvOpen = false;
    navOverlay.setAttribute('aria-hidden', 'true');
    navStarBtn?.setAttribute('aria-expanded', 'false');
    releaseFocus();
    navStarBtn?.focus();

    if (typeof gsap !== 'undefined' && !instant) {
      gsap.to(navOverlay, {
        y: '-100%', duration: 0.32, ease: 'power3.in', overwrite: true,
        onComplete() {
          navOverlay.style.visibility   = 'hidden';
          navOverlay.style.pointerEvents = 'none';
        },
      });
      gsap.to('#nav-star-btn img', {
        rotation: 0, duration: 0.28, ease: 'power2.inOut', overwrite: true,
      });
    } else {
      gsap.set(navOverlay, { y: '-100%' });
      gsap.set('#nav-star-btn img', { rotation: 0 });
      navOverlay.style.visibility   = 'hidden';
      navOverlay.style.pointerEvents = 'none';
    }
  }

  /* expose for motion.js onLeaveBack to close overlay when scrolling back to top */
  window.__closeNavOverlay = closeNavOverlay;

  navStarBtn?.addEventListener('click', () => {
    navOvOpen ? closeNavOverlay(false) : openNavOverlay();
  });

  navOverlay?.querySelectorAll('.nav-overlay__link, .nav-overlay__cta').forEach((link) => {
    link.addEventListener('click', () => closeNavOverlay(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOvOpen) closeNavOverlay(false);
  });

  function getHeaderOffset() {
    const hdr = document.querySelector('header');
    return hdr ? hdr.offsetHeight : 72;
  }

  // ── Smooth nav scroll offset + skip-link focus ────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || !/^#[\w-]+$/.test(href)) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const offset = getHeaderOffset();
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      // Move keyboard focus so skip-link actually works and in-page anchor
      // navigation lands focus correctly for screen-reader and keyboard users.
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  });

  // ── Persistent mobile CTA bar ─────────────────────────────────────
  // Visible only on ≤899px, after hero scrolls out of view, hidden when
  // #schedule is in view, and hidden when any modal or the mobile menu is open.
  const mobileCTABar = document.getElementById('mobile-cta-bar');

  if (mobileCTABar) {
    let _ctaHeroOut  = false;  // true once the hero exits the viewport
    let _ctaSchedIn  = false;  // true while #schedule is in the viewport

    function _updateCTABar() {
      const menuIsOpen  = menuToggle?.getAttribute('aria-expanded') === 'true';
      const modalIsOpen = document.body.style.overflow === 'hidden';
      const show = _ctaHeroOut && !_ctaSchedIn && !menuIsOpen && !modalIsOpen;
      mobileCTABar.classList.toggle('is-visible', show);
      mobileCTABar.setAttribute('aria-hidden', String(!show));
    }

    if ('IntersectionObserver' in window) {
      // Observe hero: show bar once hero fully exits view
      const heroEl = document.querySelector('.hero-section');
      if (heroEl) {
        new IntersectionObserver(
          (entries) => { _ctaHeroOut = !entries[0].isIntersecting; _updateCTABar(); },
          { threshold: 0 }
        ).observe(heroEl);
      } else {
        // No hero element found — show bar immediately
        _ctaHeroOut = true;
        _updateCTABar();
      }

      // Observe #schedule: hide bar when it is visible (redundant CTA)
      const schedEl = document.getElementById('schedule');
      if (schedEl) {
        new IntersectionObserver(
          (entries) => { _ctaSchedIn = entries[0].isIntersecting; _updateCTABar(); },
          { threshold: 0 }
        ).observe(schedEl);
      }
    } else {
      // IntersectionObserver not supported: show bar as safe visible default
      _ctaHeroOut = true;
      _updateCTABar();
    }

    // React to menu open/close and modal open/close via body style mutation
    new MutationObserver(() => _updateCTABar()).observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }

})();
