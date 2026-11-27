/* R15 progressive enhancements; the early bootstrap owns all navigation events. */
(() => {
  'use strict';
  const root = document.documentElement;
  const controller = window.DaryaNavigation;
  let menuAnimation = null, menuEpoch = 0;
  if (controller) controller.enhance((nav, open, instant) => {
    const epoch = ++menuEpoch;
    const wasVisible = nav.classList.contains('is-open');
    // Capture current presentation BEFORE cancelling, so rapid reversals retarget.
    const current = wasVisible ? getComputedStyle(nav) : null;
    const start = current ? { opacity: current.opacity, transform: current.transform } :
      { opacity: '.85', transform: 'translateY(-8px) scale(.97)' };
    menuAnimation?.cancel();
    menuAnimation = null;
    if (instant || !nav.animate || (!wasVisible && !open)) {
      nav.classList.toggle('is-open', open);
      return;
    }
    nav.classList.add('is-open');
    nav.style.transformOrigin = 'top right';
    const finish = open ? { opacity: '1', transform: 'translateY(0) scale(1)' } :
      { opacity: '.85', transform: 'translateY(-8px) scale(.97)' };
    const animation = nav.animate([start, finish], {
      duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both'
    });
    menuAnimation = animation;
    animation.finished.then(() => {
      if (epoch !== menuEpoch) return;
      nav.classList.toggle('is-open', open);
      animation.cancel();
      menuAnimation = null;
    }, () => {});
  });
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    controller?.setOpen(false, { instant: true });
    event.preventDefault();
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    if (controller?.keyboard || event.detail === 0 || link.classList.contains('skip') || link.closest('#navigation')) {
      target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
    }
    target.scrollIntoView({ behavior: controller?.canMove() && event.detail !== 0 ? 'smooth' : 'instant', block: 'start' });
  });
  const copyButton = document.querySelector('[data-copy-email]');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const status = document.querySelector('.copy-status');
      if (!status) return;
      try { await navigator.clipboard.writeText('serdtce-raya@mail.ru'); status.textContent = 'Адрес электронной почты скопирован'; }
      catch { status.textContent = 'Выделите адрес и скопируйте его вручную'; }
    });
    root.classList.add('copy-ready');
  }
  if (!('IntersectionObserver' in window)) return;
  const anchors = [...document.querySelectorAll('#navigation a[href^="#"]')];
  const sections = anchors.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
  const visible = new Set();
  const mark = () => {
    const atEnd = innerHeight + scrollY >= root.scrollHeight - 4;
    const current = atEnd ? sections.at(-1) : sections.find(s => visible.has(s));
    anchors.forEach(a => { if (current && a.hash === `#${current.id}`) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)); mark();
  }, { rootMargin: '-90px 0px -35% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
  const footer = document.querySelector('footer');
  if (footer) new IntersectionObserver(mark, { threshold: [0, 1] }).observe(footer);
})();
