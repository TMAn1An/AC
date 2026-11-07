/* Technician onboarding with identity verification (demo). Steps: details, NID photos, live NID check, live selfie, review.
   Production: capture with the camera, run on-device OCR and liveness first (free), and add a licensed eKYC provider only if needed.
   Whoever onboards a technician (admin or a vendor) is responsible for the verification, and it is logged with their name. */
(function () {
  const STEPS = ['Details', 'NID photos', 'NID check', 'Selfie', 'Review'], esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const phoneOk = p => /^01[3-9]\d{8}$/.test(String(p).replace(/\D/g, '').replace(/^88/, ''));
  const nidMask = n => { const d = String(n).replace(/\D/g, ''); return '*** *** ' + d.slice(-4); };
  const tile = (key, label, on) => `<button class="kyc-tile ${on ? 'on' : ''}" data-a="kyc" data-kyc="${key}" aria-label="${label}">${on ? `<span class="nid-mock"><i></i><i></i><i></i></span><span class="kyc-ok">${icon('check', 14, 3)} Captured</span>` : `${icon('camera', 26)}<b>${label}</b><small>Tap to capture</small>`}</button>`;
  AC.kyc = {
    fresh(vendor) { return { step: 1, vendor: vendor || null, name: '', phone: '', area: vendor ? AC.vendById[vendor].area : 'banani', nid: '', front: false, back: false, check: 0, face: 0, agree: false, err: '' }; },
    html(f) {
      const dots = STEPS.map((s, i) => `<span class="kyc-dot ${i + 1 < f.step ? 'done' : i + 1 === f.step ? 'now' : ''}"><i>${i + 1 < f.step ? icon('check', 12, 3) : i + 1}</i><em>${s}</em></span>`).join('<b class="kyc-line"></b>');
      let body = '';
      if (f.step === 1) body = `<div class="field"><label for="k-name">Full name (as on NID)</label><input class="input" id="k-name" data-k="name" value="${esc(f.name)}" autocomplete="off"></div><div class="field"><label for="k-phone">Mobile number</label><input class="input" id="k-phone" data-k="phone" value="${esc(f.phone)}" inputmode="tel" placeholder="01XXXXXXXXX"></div><div class="field"><label for="k-nid">NID number</label><input class="input" id="k-nid" data-k="nid" value="${esc(f.nid)}" inputmode="numeric" placeholder="10, 13 or 17 digits"></div><div class="field"><label for="k-area">Service area</label><select class="select" id="k-area" data-k="area">${Object.entries(AC.areas).map(([k, a]) => `<option value="${k}" ${f.area === k ? 'selected' : ''}>${a.n}</option>`).join('')}</select></div>`;
      if (f.step === 2) body = `<p class="muted">Take clear photos of both sides of the NID card. Avoid glare and keep all four corners inside the frame.</p><div class="kyc-tiles">${tile('front', 'NID front', f.front)}${tile('back', 'NID back', f.back)}</div>`;
      if (f.step === 3) {
        const rows = [['Card details read', 'Name and NID number extracted from the photo'], ['NID number format valid', 'Length and checksum look correct'], ['Photo quality', 'Sharp, no glare, corners visible']];
        body = `<p class="muted">A live check reads the card and tests the photo quality.</p><div class="kyc-list">${rows.map((r, i) => `<div class="kyc-row ${f.check === 2 ? 'ok' : ''}"><span class="kyc-st">${f.check === 2 ? icon('check', 14, 3) : f.check === 1 ? '<i class="spin"></i>' : ''}</span><div><b>${r[0]}</b><small>${r[1]}</small></div></div>`).join('')}</div>${f.check === 0 ? `<button class="btn btn-p btn-block" data-a="kyc" data-kyc="runcheck">Run live check</button>` : f.check === 1 ? `<div class="muted" style="text-align:center">Checking...</div>` : `<div class="note ok">${icon('checkc', 18)}<span>Card read. Name matches the details you entered.</span></div>`}<div class="faint" style="font-size:12px;margin-top:10px">Prototype check. For an official match against the Election Commission record, a licensed eKYC provider is needed (optional, paid).</div>`;
      }
      if (f.step === 4) {
        const prompts = ['Look straight at the camera', 'Blink once', 'Turn your head to the left'];
        body = `<p class="muted">A live selfie proves the person is present. The technician must be next to you.</p><div class="kyc-face ${f.face > 0 ? 'live' : ''} ${f.face === 4 ? 'done' : ''}">${f.face === 4 ? icon('check', 44, 2.5) : icon('user', 56, 1.4)}</div><div style="text-align:center;font-weight:700;min-height:24px">${f.face === 0 ? 'Ready when you are' : f.face === 4 ? 'Face matches the NID photo (96%)' : prompts[f.face - 1]}</div>${f.face === 0 ? `<button class="btn btn-p btn-block" style="margin-top:12px" data-a="kyc" data-kyc="runface">${icon('camera', 18)}Start live selfie</button>` : f.face === 4 ? `<div class="note ok" style="margin-top:12px">${icon('checkc', 18)}<span>Liveness passed and the face matches the NID photo.</span></div>` : ''}`;
      }
      if (f.step === 5) body = `<div class="kyc-sum"><div><small>Name</small><b>${esc(f.name)}</b></div><div><small>Mobile</small><b>${esc(f.phone)}</b></div><div><small>NID</small><b>${nidMask(f.nid)}</b></div><div><small>Area</small><b>${AC.areas[f.area].n}</b></div><div><small>Employer</small><b>${f.vendor ? esc(AC.vendById[f.vendor].name) : 'Shital direct'}</b></div></div><div class="kyc-checks"><span>${icon('check', 14, 3)} NID front and back</span><span>${icon('check', 14, 3)} Live NID check</span><span>${icon('check', 14, 3)} Live selfie matches</span></div>
        <button class="chk-row" data-a="kyc" data-kyc="agree"><span class="ck ${f.agree ? 'on' : ''}">${f.agree ? icon('check', 14, 3) : ''}</span><span>I checked this person's identity. This verification is logged under ${f.vendor ? esc(AC.vendById[f.vendor].name) : 'Shital Admin'}.</span></button>
        <div class="faint" style="font-size:12px">Visible to: Shital Admin${f.vendor ? ' and ' + esc(AC.vendById[f.vendor].name) + ' only' : ' only. No vendor can see this technician'}.</div>`;
      const last = f.step === 5;
      return `<div class="kyc"><div class="kyc-steps">${dots}</div>${f.err ? `<div class="err" style="color:var(--bad);font-weight:600;margin-bottom:10px">${esc(f.err)}</div>` : ''}<div class="kyc-body">${body}</div><div class="kyc-nav">${f.step > 1 ? `<button class="btn btn-s" data-a="kyc" data-kyc="prev">Back</button>` : '<span></span>'}<button class="btn btn-p" data-a="kyc" data-kyc="${last ? 'submit' : 'next'}" ${last && !f.agree ? 'disabled' : ''}>${last ? 'Verify and add technician' : 'Continue'}</button></div></div>`;
    },
    set(f, k, v) { f[k] = v; f.err = ''; },
    act(a, f, render, submit) {
      f.err = '';
      if (a === 'front' || a === 'back') f[a] = !f[a];
      else if (a === 'agree') f.agree = !f.agree;
      else if (a === 'prev') f.step = Math.max(1, f.step - 1);
      else if (a === 'runcheck') { f.check = 1; render(); setTimeout(() => { f.check = 2; render(); }, 1900); return; }
      else if (a === 'runface') { f.face = 1; render(); setTimeout(() => { f.face = 2; render(); }, 1000); setTimeout(() => { f.face = 3; render(); }, 2000); setTimeout(() => { f.face = 4; render(); }, 3000); return; }
      else if (a === 'next') {
        if (f.step === 1) { if (f.name.trim().length < 3) f.err = 'Enter the full name.'; else if (!phoneOk(f.phone)) f.err = 'Enter a valid mobile number, for example 01712345678.'; else if (!/^(\d{10}|\d{13}|\d{17})$/.test(f.nid.replace(/\D/g, ''))) f.err = 'NID must be 10, 13 or 17 digits.'; }
        if (f.step === 2 && !(f.front && f.back)) f.err = 'Capture both sides of the NID.';
        if (f.step === 3 && f.check !== 2) f.err = 'Run the live check first.';
        if (f.step === 4 && f.face !== 4) f.err = 'Complete the live selfie first.';
        if (!f.err) f.step++;
      } else if (a === 'submit') { if (!f.agree) return; submit({ name: f.name.trim(), phone: f.phone, area: f.area, vendor: f.vendor, kyc: { status: 'verified', nid: nidMask(f.nid), method: 'NID photos, live check, live selfie', verifiedBy: f.vendor ? AC.vendById[f.vendor].name : 'Shital Admin', at: 'Today' } }); return; }
      render();
    }
  };
})();
