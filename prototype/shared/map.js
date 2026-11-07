/* Schematic city map drawn in SVG. No Google APIs. Production uses OpenStreetMap tiles through flutter_map (see docs/ARCHITECTURE.md). */
(function () {
  const NS = 'http://www.w3.org/2000/svg', W = 1000, H = 640;
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  function base(svg) {
    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: 'blk', width: 34, height: 34, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: 3, y: 3, width: 28, height: 28, rx: 4, fill: '#EAE3D4' }, pat);
    el('rect', { width: W, height: H, fill: '#F3EEE3' }, svg);
    el('rect', { width: W, height: H, fill: 'url(#blk)' }, svg);
    // River and lake
    el('path', { d: 'M0 505C130 478 215 548 330 592S520 668 610 646L0 650Z', fill: '#BFDFEC' }, svg);
    el('path', { d: 'M690 160c34-6 46 30 40 76s-34 70-52 52c-22-22-8-112 12-128z', fill: '#BFDFEC' }, svg);
    // Parks
    [[300, 262, 64, 44], [540, 372, 70, 44], [820, 90, 80, 52], [90, 250, 60, 40]].forEach(p => el('rect', { x: p[0], y: p[1], width: p[2], height: p[3], rx: 10, fill: '#D5E6CB' }, svg));
    // Roads: casing then fill
    const roads = ['M0 130H1000', 'M0 305H1000', 'M0 455H1000', 'M210 0V640', 'M430 0V560', 'M650 0V600', 'M850 0V640', 'M70 640 560 345 900 120'];
    roads.forEach(d => el('path', { d, fill: 'none', stroke: '#E1D9C8', 'stroke-width': 13, 'stroke-linecap': 'round' }, svg));
    roads.forEach(d => el('path', { d, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 9, 'stroke-linecap': 'round' }, svg));
    ['M0 215H1000', 'M0 380H1000', 'M320 0V640', 'M540 0V640', 'M750 0V640'].forEach(d => el('path', { d, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, opacity: .9 }, svg));
    // Area labels
    Object.values(AC.areas).forEach(a => {
      const t = el('text', { x: a.x, y: a.y + 34, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, 'letter-spacing': '.1em', fill: '#8D8574', 'font-family': 'Hanken Grotesk, sans-serif' }, svg);
      t.textContent = a.n.toUpperCase();
    });
    el('text', { x: 140, y: 600, 'font-size': 12, 'font-weight': 700, 'letter-spacing': '.14em', fill: '#4F93B0', 'font-family': 'Hanken Grotesk, sans-serif', 'text-anchor': 'middle' }, svg).textContent = 'BURIGANGA';
  }

  function pinNode(p) {
    const g = el('g', {});
    const k = p.kind, c = p.color || '';
    if (k === 'tech') {
      if (p.pulse) el('circle', { r: 12, fill: '#0E6B78', opacity: .35, class: 'pulse' }, g);
      el('circle', { r: 11, fill: p.dim ? '#98A7AD' : '#0E6B78', stroke: '#fff', 'stroke-width': 3 }, g);
      el('path', { d: 'M-3.5 3.5 3.5-3.5M-1.5-4.5h-2v2M1.5 4.5h2v-2', stroke: '#fff', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, g);
    } else if (k === 'vendor') {
      el('rect', { x: -12, y: -12, width: 24, height: 24, rx: 7, fill: '#E59A2B', stroke: '#fff', 'stroke-width': 3 }, g);
      el('path', { d: 'M-6 -2l1.8-4.5h8.4L6 -2M-6 -2h12M-5 -2v7h10v-7', stroke: '#10222B', 'stroke-width': 1.6, fill: 'none', 'stroke-linejoin': 'round' }, g);
    } else if (k === 'cust') {
      el('path', { d: 'M0 0C-14-14-16-22-16-26a16 16 0 0 1 32 0c0 4-2 12-16 26Z', transform: 'translate(0 0)', fill: '#10222B', stroke: '#fff', 'stroke-width': 2.5 }, g);
      el('circle', { cy: -26, r: 5.5, fill: '#fff' }, g);
    } else if (k === 'job') {
      el('circle', { r: 9, fill: p.color || '#2C6CB0', stroke: '#fff', 'stroke-width': 3 }, g);
    }
    if (p.label) {
      const w = Math.max(34, p.label.length * 6.4 + 14), y = k === 'cust' ? 14 : 24;
      el('rect', { x: -w / 2, y: y - 12, width: w, height: 20, rx: 10, fill: '#fff', stroke: '#CCD7DA' }, g);
      const t = el('text', { y: y + 2, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#10222B', 'font-family': 'Hanken Grotesk, sans-serif' }, g); t.textContent = p.label;
    }
    return g;
  }

  function mount(host, opts) {
    opts = opts || {};
    host.classList.add('map');
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid slice', role: 'img', 'aria-label': 'City map' });
    host.appendChild(svg); base(svg);
    const gR = el('g', {}, svg), gP = el('g', {}, svg);
    const pins = {}, routes = {}; let view = { x: 0, y: 0, w: W, h: H };
    const api = {
      setPins(list) {
        const seen = {};
        list.forEach(p => {
          seen[p.key] = 1; let n = pins[p.key];
          const sig = [p.kind, p.label, p.pulse, p.dim, p.color].join('|');
          if (!n || n.sig !== sig) { if (n) n.g.remove(); n = pins[p.key] = { g: pinNode(p), sig }; gP.appendChild(n.g); if (p.onClick) { n.g.style.cursor = 'pointer'; } }
          n.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
          n.g.onclick = p.onClick || null;
        });
        Object.keys(pins).forEach(k => { if (!seen[k]) { pins[k].g.remove(); delete pins[k]; } });
        // keep customer pins above routes and techs above vendors
        const order = { vendor: 0, job: 1, cust: 2, tech: 3 };
        [...gP.children].sort((a, b) => 0);
      },
      setRoutes(list) {
        const seen = {};
        list.forEach(r => {
          seen[r.key] = 1; let n = routes[r.key];
          if (!n) { n = routes[r.key] = { base: el('path', { fill: 'none', stroke: '#B9DCE1', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '1 11' }, gR), done: el('path', { fill: 'none', stroke: '#0E6B78', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gR) }; }
          const pts = r.pts, cur = AC.store.along(pts, r.p);
          n.base.setAttribute('d', 'M' + pts.map(q => q.x + ' ' + q.y).join('L'));
          // Done part: from start to current point
          const L = AC.store.routeLen(pts); let d = r.p * L, out = [pts[0]];
          for (let i = 1; i < pts.length; i++) { const seg = AC.store.dist(pts[i - 1], pts[i]); if (d >= seg) { out.push(pts[i]); d -= seg; } else { out.push(cur); break; } }
          n.done.setAttribute('d', 'M' + out.map(q => q.x + ' ' + q.y).join('L'));
        });
        Object.keys(routes).forEach(k => { if (!seen[k]) { routes[k].base.remove(); routes[k].done.remove(); delete routes[k]; } });
      },
      fit(points, pad) {
        pad = pad || 90; const a = host.clientWidth / Math.max(1, host.clientHeight) || 1.5;
        let x0 = Math.min(...points.map(p => p.x)) - pad, x1 = Math.max(...points.map(p => p.x)) + pad, y0 = Math.min(...points.map(p => p.y)) - pad - 20, y1 = Math.max(...points.map(p => p.y)) + pad;
        let w = x1 - x0, h = y1 - y0; if (w / h < a) { const nw = h * a; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / a; y0 -= (nh - h) / 2; h = nh; }
        w = Math.min(W, w); h = Math.min(H, h); x0 = Math.max(0, Math.min(W - w, x0)); y0 = Math.max(0, Math.min(H - h, y0));
        svg.setAttribute('viewBox', [x0, y0, w, h].map(v => v.toFixed(0)).join(' '));
      },
      full() { svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); }
    };
    if (opts.legend) { const l = document.createElement('div'); l.className = 'map-legend'; l.innerHTML = '<span><i class="lg-dot"></i>Technician</span><span><i class="lg-sq"></i>Vendor</span><span><i class="lg-pin"></i>Customer</span>'; host.appendChild(l); }
    return api;
  }
  window.CityMap = { mount };
})();
