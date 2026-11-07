/* Small interaction helpers shared by every app. */
(function () {
  // Skip a render when the markup did not change. Live ticks re-render often, and replacing a button between press and release swallowed the tap.
  window.AC = window.AC || {};
  AC.ui = AC.ui || {};
  /* Frosted glass selection capsule (iOS style) that slides between tabs. Works on every tab bar, segmented control and tab strip.
     Renders replace the DOM, so the last position of each control is remembered and the new capsule animates from there. */
  const GLASS = '.tabbar, .seg, .tabs', memo = {};
  let queued = false;
  function glassSync() {
    queued = false;
    const all = [...document.querySelectorAll(GLASS)];
    all.forEach((c, i) => {
      const on = c.querySelector(':scope > .on'); let ind = c.querySelector(':scope > .glass-ind');
      if (!on) { if (ind) ind.remove(); return; }
      const key = c.className + '#' + i, box = { l: on.offsetLeft, t: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };
      if (!ind) {
        ind = document.createElement('i'); ind.className = 'glass-ind'; ind.setAttribute('aria-hidden', 'true'); c.prepend(ind);
        const m = memo[key] || box; ind.style.cssText = 'left:' + m.l + 'px;top:' + m.t + 'px;width:' + m.w + 'px;height:' + m.h + 'px;transition:none';
        ind.getBoundingClientRect(); ind.style.transition = '';
      }
      ind.style.left = box.l + 'px'; ind.style.top = box.t + 'px'; ind.style.width = box.w + 'px'; ind.style.height = box.h + 'px';
      memo[key] = box;
    });
  }
  const queueGlass = () => { if (!queued) { queued = true; requestAnimationFrame(glassSync); } };
  new MutationObserver(queueGlass).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', queueGlass); addEventListener('load', queueGlass);
  AC.ui.dedupe = function (el) {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'); let last = null;
    Object.defineProperty(el, 'innerHTML', { get() { return d.get.call(this); }, set(v) { if (v === last) return; last = v; d.set.call(this, v); } });
  };
  // Drag to scroll for horizontal strips (carousels, tabs, chips). Mouse users have no horizontal wheel, so these looked stuck.
  let drag = null;
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = e.target.closest('.hscroll, .tabs, .qr'); if (!el || el.scrollWidth <= el.clientWidth) return;
    drag = { el, x: e.clientX, left: el.scrollLeft, moved: false };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { drag.moved = true; drag.el.style.cursor = 'grabbing'; drag.el.style.scrollSnapType = 'none'; }
    if (drag.moved) drag.el.scrollLeft = drag.left - dx;
  });
  const end = () => { if (drag) { const d = drag; drag = null; d.el.style.cursor = ''; d.el.style.scrollSnapType = ''; if (d.moved) { const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => document.removeEventListener('click', stop, true), 60); } } };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();
