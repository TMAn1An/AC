/* Small interaction helpers shared by every app. */
(function () {
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
