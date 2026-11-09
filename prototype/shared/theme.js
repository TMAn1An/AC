/* Light, dark or system theme for every app. The choice is saved on the device and shared between the hub and the app frames. */
(function () {
  window.AC = window.AC || {};
  const KEY = 'new.theme', mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const read = () => { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch (e) { return 'system'; } };
  let pref = read();
  const effective = () => pref === 'system' ? (mq && mq.matches ? 'dark' : 'light') : pref;
  const listeners = [];
  function apply() {
    const t = effective(), r = document.documentElement;
    r.setAttribute('data-theme', t); r.setAttribute('data-theme-pref', pref);
    let m = document.querySelector('meta[name=theme-color]'); if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; (document.head || r).appendChild(m); }
    m.content = t === 'dark' ? '#0F1013' : '#F4F1EC';
    listeners.forEach(f => f(t, pref));
  }
  apply();
  AC.theme = {
    pref: () => pref, isDark: () => effective() === 'dark', effective,
    set(v) { pref = v === 'light' || v === 'dark' ? v : 'system'; try { if (pref === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, pref); } catch (e) { } apply(); },
    on: f => listeners.push(f),
    /* Segmented control markup. Each app wires data-theme-set clicks through AC.theme.bind(). */
    seg() { const o = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']]; return '<div class="theme-seg" role="radiogroup" aria-label="Appearance">' + o.map(x => '<button role="radio" aria-checked="' + (pref === x[0]) + '" class="' + (pref === x[0] ? 'on' : '') + '" data-theme-set="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>'; },
    bind() { document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-theme-set]'); if (b) { e.stopPropagation(); AC.theme.set(b.dataset.themeSet); } }, true); }
  };
  AC.theme.bind();
  addEventListener('storage', e => { if (e.key === KEY || e.key === null) { pref = read(); apply(); } });
  if (mq) (mq.addEventListener ? mq.addEventListener('change', () => { if (pref === 'system') apply(); }) : mq.addListener(() => { if (pref === 'system') apply(); }));
})();
