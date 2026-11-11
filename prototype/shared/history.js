/* Personal history, saved only on this device (localStorage). It records every update the signed-in person received,
   so it survives a data reset and does not depend on the server. In the Flutter build this is a local SQLite table. */
(function () {
  const KEY = a => 'shital.history.' + a, GROUPS = { all: null, jobs: ['requested', 'forwarded', 'assigned', 'accepted', 'declined', 'timeout', 'vendor_timeout', 'ontheway', 'arrived', 'working', 'completed', 'cancelled'], orders: ['placed', 'packed', 'shipped', 'courier', 'delivered'], money: ['paid', 'wallet', 'extra', 'extra_ok', 'extra_no', 'extra_req'] };
  const IC = { requested: 'list', forwarded: 'store', assigned: 'user', accepted: 'checkc', declined: 'alert', timeout: 'clock', vendor_timeout: 'clock', crew_need: 'user', crew_invited: 'user', crew_joined: 'checkc', crew_declined: 'alert', crew_removed: 'x', ontheway: 'nav', arrived: 'pin', working: 'wrench', completed: 'checkc', cancelled: 'x', placed: 'cart', packed: 'box', shipped: 'truck', courier: 'truck', delivered: 'checkc', paid: 'wallet', wallet: 'wallet', extra: 'alert', extra_ok: 'check', extra_no: 'x', extra_req: 'alert', tech: 'user' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const read = a => { try { return JSON.parse(localStorage.getItem(KEY(a)) || '[]'); } catch (e) { return []; } };
  const write = (a, v) => { try { localStorage.setItem(KEY(a), JSON.stringify(v.slice(-400))); } catch (e) { } };
  const H = AC.history = {
    filter: 'all',
    list: a => read(a).sort((x, y) => y.at - x.at),
    clear: a => { try { localStorage.removeItem(KEY(a)); } catch (e) { } },
    sync(a) { const have = new Set(read(a).map(x => x.id)), add = AC.store.notifs(a).filter(n => !have.has(n.id)); if (add.length) write(a, read(a).concat(add.map(n => ({ id: n.id, at: n.at, text: n.text, kind: n.kind, job: n.job })))); },
    /* Start recording for an audience (a string, or a function when the signed-in person can change). */
    track(aud) { const cur = () => typeof aud === 'function' ? aud() : aud; H.sync(cur()); AC.store.subscribe(() => H.sync(cur())); },
    html(a) {
      const all = H.list(a), g = GROUPS[H.filter], rows = g ? all.filter(x => g.includes(x.kind)) : all, day = t => { const d = new Date(t), n = new Date(); return d.toDateString() === n.toDateString() ? 'Today' : new Date(n - 864e5).toDateString() === d.toDateString() ? 'Yesterday' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
      let last = '', body = '';
      rows.forEach(x => { const d = day(x.at); if (d !== last) { body += `<div class="mini" style="padding:14px 0 6px">${d}</div>`; last = d; } body += `<div class="nrow" style="cursor:default"><span class="nico">${icon(IC[x.kind] || 'bell', 18)}</span><span class="grow"><b>${esc(x.text)}</b><small>${AC.fmt.time(x.at)}${x.job ? ' . ' + x.job : ''}</small></span></div>`; });
      return `<div class="hist"><div class="hscroll" style="padding:0 0 10px">${[['all', 'All'], ['jobs', 'Jobs'], ['orders', 'Orders'], ['money', 'Money']].map(f => `<button class="chip ${H.filter === f[0] ? 'on' : ''}" data-a="hf" data-v="${f[0]}">${f[1]}</button>`).join('')}</div>${rows.length ? `<div class="cardx" style="padding:0 16px 6px">${body}</div>` : '<div class="muted" style="padding:30px 8px;text-align:center">Nothing here yet. Updates you receive are saved on this device.</div>'}<div class="note" style="margin-top:14px">${icon('lock', 18)}<span>Saved on this device only. Clearing it does not change your account or any booking.</span></div>${all.length ? `<button class="btn btn-g btn-block" style="margin-top:8px;color:var(--bad)" data-a="hclear">Clear history on this device</button>` : ''}</div>`;
    }
  };
})();
