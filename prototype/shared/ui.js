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
    queued = false; reRipple();
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
  /* Press ripple on tab bar items (foodpanda style): colour spreads from the touch point for a moment, then fades and only the icon stays coloured.
     Tapping re-renders the bar, so the ripple is re-created on the new item with the time already elapsed. */
  let rip = null;
  function ripple(el, x, y, elapsed) {
    const b = el.getBoundingClientRect(), d = Math.max(b.width, b.height) * 1.6, px = x - b.left, py = y - b.top, late = elapsed || 0;
    const clip = document.createElement('i'); clip.className = 'rip-clip';
    const r = document.createElement('i'); r.className = 'ripple';
    r.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (px - d / 2) + 'px;top:' + (py - d / 2) + 'px;animation-delay:-' + late + 'ms';
    clip.appendChild(r); el.appendChild(clip);
    // Glitter: dense tiny speckles twinkle inside the pressed area (like the Pixel launcher press), then fade
    const fx = document.createElement('i'); fx.className = 'glitter'; fx.style.cssText = 'left:' + px + 'px;top:' + py + 'px';
    for (let k = 0; k < 70; k++) {
      const a = Math.random() * Math.PI * 2, dist = Math.sqrt(Math.random()) * 30, s = 0.7 + Math.random() * 1.1, dl = Math.random() * 380, du = 260 + Math.random() * 300;
      const dp = document.createElement('b');
      dp.style.cssText = 'left:' + Math.cos(a) * dist + 'px;top:' + Math.sin(a) * dist + 'px;width:' + s + 'px;height:' + s + 'px;animation-delay:' + (dl - late) + 'ms;animation-duration:' + du + 'ms';
      fx.appendChild(dp);
    }
    clip.appendChild(fx); setTimeout(() => { clip.remove(); }, 800 - late);
    return;
    el.appendChild(fx); setTimeout(() => { clip.remove(); fx.remove(); }, 800 - late);
  }
  document.addEventListener('pointerdown', e => {
    const t = e.target.closest && e.target.closest('.tabbar .tab'); if (!t) return;
    rip = { v: t.dataset.v, x: e.clientX, y: e.clientY, at: performance.now(), bar: t.parentElement.className }; ripple(t, e.clientX, e.clientY, 0);
  }, true);
  function reRipple() {
    if (!rip) return; const el = performance.now() - rip.at; if (el > 600) { rip = null; return; }
    const t = document.querySelector('.tabbar .tab[data-v="' + rip.v + '"]'); if (t && !t.querySelector('.rip-clip')) ripple(t, rip.x, rip.y, el);
  }
  const queueGlass = () => { if (!queued) { queued = true; requestAnimationFrame(glassSync); } };
  new MutationObserver(queueGlass).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', queueGlass); addEventListener('load', queueGlass);
  AC.ui.dedupe = function (el) {
    const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'); let last = null;
    Object.defineProperty(el, 'innerHTML', { get() { return d.get.call(this); }, set(v) { if (v === last) return; last = v; d.set.call(this, v); } });
  };
  /* Tap rescue: if the control under the finger was replaced by a re-render between press and release, the browser drops the click.
     Remember what was pressed and, when the release lands on an equivalent control and no click arrived, click it. */
  let press = null, clicked = false;
  const keyOf = el => el.dataset.a + '|' + (el.dataset.v || '') + '|' + (el.dataset.id || '') + '|' + (el.dataset.k || '');
  document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('[data-a]'); press = el ? { key: keyOf(el), x: e.clientX, y: e.clientY } : null; clicked = false; }, true);
  document.addEventListener('click', () => { clicked = true; }, true);
  document.addEventListener('pointerup', e => {
    const p = press; press = null; if (!p || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) return;
    clicked = false;
    setTimeout(() => {
      if (clicked) return;
      const at = document.elementFromPoint(e.clientX, e.clientY), el = at && at.closest && at.closest('[data-a]');
      if (el && keyOf(el) === p.key && !el.disabled) el.click();
    }, 40);
  }, true);
  /* Keep at most two toasts on screen. */
  document.addEventListener('DOMContentLoaded', () => { const h = document.getElementById('toasts'); if (h) new MutationObserver(() => { while (h.children.length > 2) h.removeChild(h.firstChild); }).observe(h, { childList: true }); });
  /* Screen transitions. Each app calls AC.ui.nav() after a render with the current screen key and stack depth.
     A deeper stack slides in from the right, a shallower one from the left, a tab or page change fades up. A render that keeps the same screen
     (a live update) animates nothing, and an open sheet or drawer is not re-animated either. Only the entering screen animates. */
  const navState = new WeakMap();
  AC.ui.nav = function (app, key, depth) {
    const s = navState.get(app), open = !!app.querySelector('.sheet, .drawer');
    app.classList.toggle('still', !!(s && s.open && open));
    let timer = s && s.timer;
    if (s && s.key !== key) {
      const dir = depth > s.depth ? 'push' : depth < s.depth ? 'pop' : 'tab';
      app.classList.remove('nav-push', 'nav-pop', 'nav-tab'); app.classList.add('nav-' + dir);
      clearTimeout(timer); timer = setTimeout(() => app.classList.remove('nav-push', 'nav-pop', 'nav-tab'), 380);
    }
    navState.set(app, { key, depth, open, timer });
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
