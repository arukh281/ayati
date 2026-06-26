(function () {
  const modal = document.getElementById('apply-modal');
  if (!modal) return;

  const titleEl = document.getElementById('apply-modal-title');
  const emailLink = document.getElementById('apply-modal-email');
  const whatsappLink = document.getElementById('apply-modal-whatsapp');
  let lastTrigger = null;

  const EMAIL = 'ayatidevelopers@gmail.com';
  const WHATSAPP = '919953533766';

  function buildMailto(role) {
    const subject = encodeURIComponent(`Application: ${role} — Ayati Group`);
    const body = encodeURIComponent(
      `Hi,\n\nI would like to apply for the ${role} position at Ayati Group.\n\nPlease find my resume and work samples attached.\n\nThank you.`
    );
    return `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  function buildWhatsApp(role) {
    const text = encodeURIComponent(
      `Hi, I would like to apply for the ${role} internship at Ayati Group. I'm sharing my resume and work samples.`
    );
    return `https://wa.me/${WHATSAPP}?text=${text}`;
  }

  function openModal(role) {
    const roleLabel = role || 'Internship';
    if (titleEl) titleEl.textContent = `Apply — ${roleLabel}`;
    if (emailLink) emailLink.href = buildMailto(roleLabel);
    if (whatsappLink) whatsappLink.href = buildWhatsApp(roleLabel);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    emailLink?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastTrigger?.focus();
  }

  document.querySelectorAll('[data-apply-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      lastTrigger = btn;
      openModal(btn.dataset.role || '');
    });
  });

  modal.querySelectorAll('[data-apply-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
