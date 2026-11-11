/* Notification list used by all five apps. Recipients are explicit: admin sees every job event, a vendor sees only its own jobs,
   a technician sees their own jobs, a customer sees their own booking. See mkNotifs in store.js. */
(function () {
  const IC = { requested: 'list', forwarded: 'store', assigned: 'user', accepted: 'checkc', declined: 'alert', ontheway: 'nav', arrived: 'pin', working: 'wrench', extra: 'alert', extra_ok: 'check', extra_no: 'x', completed: 'checkc', paid: 'wallet', cancelled: 'x', timeout: 'clock', vendor_timeout: 'clock', extra_req: 'alert', crew_need: 'user', crew_invited: 'user', crew_joined: 'checkc', crew_declined: 'alert', crew_removed: 'x', placed: 'cart', packed: 'box', shipped: 'truck', courier: 'truck', delivered: 'checkc', tech: 'user', wallet: 'wallet' };
  const TONE = { crew_declined: 'bad', crew_joined: 'ok', declined: 'bad', extra: 'warn', cancelled: 'bad', completed: 'ok', accepted: 'ok', extra_ok: 'ok', paid: 'ok', forwarded: 'warn', timeout: 'bad', vendor_timeout: 'bad', extra_req: 'warn', delivered: 'ok' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  AC.notifUI = {
    html(aud, action, orderAction) {
      const S = AC.store, list = S.notifs(aud), read = (S.get().nread || {})[aud] || 0;
      if (!list.length) return '<div class="muted" style="padding:28px 8px;text-align:center">No notifications yet. Updates appear here as jobs move.</div>';
      return list.slice(0, 40).map(n => `<button class="nrow" ${(String(n.job).startsWith('O-') ? orderAction : action) && n.job ? `data-a="${String(n.job).startsWith('O-') ? orderAction : action}" data-v="${n.job}"` : ''}><span class="nico ${TONE[n.kind] || ''}">${icon(IC[n.kind] || 'bell', 18)}</span><span class="grow"><b>${esc(n.text)}</b><small>${AC.fmt.ago(n.at)} . ${n.job}</small></span>${n.at > read ? '<i class="ndot"></i>' : ''}</button>`).join('');
    }
  };
})();
