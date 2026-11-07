/* Flat product illustrations drawn in SVG so every product card has curated visuals without photo licensing. */
(function () {
  const T = [
    { bg: '#E9EAF7', fg: '#2E3192', lt: '#C4C7EA' },
    { bg: '#FDE9EA', fg: '#D8151D', lt: '#F8B9BD' },
    { bg: '#E0F5EA', fg: '#00873F', lt: '#A6DDBF' },
    { bg: '#EEF0F7', fg: '#4A4F73', lt: '#CDD2E3' },
    { bg: '#E8EAFA', fg: '#4A55C9', lt: '#BCC4F2' },
    { bg: '#DCDEF2', fg: '#151858', lt: '#A9AEDB' }
  ];
  const W = '#FFFFFF', S = '#CDD2E3';
  function frame(t, body) {
    return '<svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><rect width="240" height="180" fill="' + t.bg + '"/>' + body + '</svg>';
  }
  const kinds = {
    split(t) {
      return '<rect x="26" y="46" width="188" height="62" rx="14" fill="' + W + '" stroke="' + S + '" stroke-width="2"/>' +
        '<rect x="26" y="46" width="188" height="26" rx="14" fill="#F7F8FC"/><path d="M40 72h160" stroke="' + S + '" stroke-width="2"/>' +
        '<rect x="44" y="94" width="152" height="7" rx="3.5" fill="' + t.fg + '" opacity=".22"/>' +
        '<circle cx="190" cy="58" r="3.5" fill="' + t.fg + '"/><rect x="44" y="55" width="34" height="5" rx="2.5" fill="' + t.lt + '"/>' +
        '<g fill="none" stroke="' + t.fg + '" stroke-width="3" stroke-linecap="round" opacity=".55"><path d="M64 122q10 9 0 19"/><path d="M100 122q10 9 0 19"/><path d="M136 122q10 9 0 19"/><path d="M172 122q10 9 0 19"/></g>';
    },
    window(t) {
      let g = ''; for (let i = 0; i < 6; i++) g += '<rect x="52" y="' + (74 + i * 9) + '" width="136" height="4" rx="2" fill="' + t.fg + '" opacity=".28"/>';
      return '<rect x="38" y="38" width="164" height="104" rx="12" fill="' + W + '" stroke="' + S + '" stroke-width="2"/><rect x="50" y="50" width="140" height="18" rx="6" fill="#F7F8FC"/><circle cx="176" cy="59" r="3.5" fill="' + t.fg + '"/>' + g;
    },
    cassette(t) {
      return '<rect x="52" y="34" width="136" height="14" rx="4" fill="' + S + '"/><rect x="40" y="48" width="160" height="96" rx="16" fill="' + W + '" stroke="' + S + '" stroke-width="2"/><rect x="62" y="68" width="116" height="56" rx="10" fill="#F7F8FC" stroke="' + S + '" stroke-width="2"/><path d="M62 96h116M120 68v56" stroke="' + t.fg + '" stroke-width="3" opacity=".35"/><circle cx="120" cy="96" r="9" fill="' + t.fg + '" opacity=".6"/>';
    },
    tote(t) {
      return '<path d="M96 70c0-34 48-34 48 0" fill="none" stroke="' + t.fg + '" stroke-width="7" stroke-linecap="round"/><path d="M62 72h116l10 78H52z" fill="' + t.fg + '"/><path d="M62 72h116l3 22H59z" fill="' + t.lt + '" opacity=".35"/><rect x="104" y="108" width="32" height="8" rx="4" fill="' + W + '" opacity=".8"/>';
    },
    pack(t) {
      return '<path d="M104 38h32a8 8 0 0 1 8 8v6h-48v-6a8 8 0 0 1 8-8z" fill="none" stroke="' + t.fg + '" stroke-width="6"/><rect x="66" y="50" width="108" height="104" rx="30" fill="' + t.fg + '"/><rect x="84" y="102" width="72" height="40" rx="12" fill="' + t.lt + '" opacity=".4"/><path d="M92 118h56" stroke="' + W + '" stroke-width="5" stroke-linecap="round" opacity=".85"/><path d="M90 66h60" stroke="' + W + '" stroke-width="4" stroke-linecap="round" opacity=".4"/>';
    },
    duffel(t) {
      return '<path d="M78 76c10-26 74-26 84 0" fill="none" stroke="' + t.fg + '" stroke-width="7" stroke-linecap="round"/><rect x="32" y="74" width="176" height="66" rx="30" fill="' + t.fg + '"/><path d="M32 106h176" stroke="' + W + '" stroke-width="3" opacity=".35"/><rect x="104" y="100" width="32" height="12" rx="6" fill="' + W + '" opacity=".85"/>';
    },
    clutch(t) {
      return '<rect x="44" y="64" width="152" height="86" rx="18" fill="' + t.fg + '"/><path d="M44 82c0-10 8-18 18-18h116c10 0 18 8 18 18l-76 34z" fill="' + t.lt + '" opacity=".55"/><circle cx="120" cy="116" r="7" fill="' + W + '"/>';
    },
    tube(t) {
      return '<path d="M96 34h48l6 20H90z" fill="' + t.fg + '"/><rect x="90" y="52" width="60" height="104" rx="10" fill="' + W + '" stroke="' + S + '" stroke-width="2"/><rect x="90" y="52" width="60" height="30" fill="' + t.lt + '" opacity=".7"/><path d="M104 108h32M108 120h24" stroke="' + t.fg + '" stroke-width="4" stroke-linecap="round"/><circle cx="120" cy="92" r="5" fill="' + t.fg + '"/>';
    },
    bottle(t) {
      return '<rect x="106" y="32" width="28" height="20" rx="5" fill="' + t.fg + '"/><rect x="110" y="50" width="20" height="16" fill="' + S + '"/><rect x="82" y="64" width="76" height="92" rx="20" fill="' + t.fg + '"/><rect x="92" y="88" width="56" height="46" rx="8" fill="' + W + '" opacity=".92"/><path d="M100 104h40M100 116h26" stroke="' + t.fg + '" stroke-width="4" stroke-linecap="round"/>';
    },
    jar(t) {
      return '<rect x="70" y="62" width="100" height="22" rx="8" fill="' + t.fg + '"/><rect x="76" y="82" width="88" height="66" rx="14" fill="' + W + '" stroke="' + S + '" stroke-width="2"/><rect x="76" y="100" width="88" height="30" fill="' + t.lt + '" opacity=".75"/><path d="M96 115h48" stroke="' + t.fg + '" stroke-width="4" stroke-linecap="round"/>';
    },
    stick(t) {
      return '<g transform="rotate(-28 120 100)"><rect x="104" y="40" width="32" height="30" rx="6" fill="' + t.fg + '"/><rect x="108" y="68" width="24" height="10" fill="' + S + '"/><rect x="100" y="76" width="40" height="76" rx="8" fill="' + W + '" stroke="' + S + '" stroke-width="2"/><rect x="100" y="96" width="40" height="16" fill="' + t.lt + '"/></g>';
    },
    spray(t) {
      return '<rect x="108" y="30" width="24" height="12" rx="4" fill="' + t.fg + '"/><path d="M132 36h22" stroke="' + t.fg + '" stroke-width="5" stroke-linecap="round"/><rect x="112" y="42" width="16" height="16" fill="' + S + '"/><rect x="86" y="56" width="68" height="100" rx="18" fill="' + W + '" stroke="' + S + '" stroke-width="2"/><rect x="86" y="96" width="68" height="60" rx="18" fill="' + t.lt + '" opacity=".75"/><path d="M102 118h36" stroke="' + t.fg + '" stroke-width="4" stroke-linecap="round"/>';
    }
  };
  window.Art = {
    tints: T,
    draw(kind, tint) { const t = T[(tint || 0) % T.length]; return frame(t, (kinds[kind] || kinds.split)(t)); },
    product(p) { return this.draw(p.kind, p.tint); }
  };
})();
