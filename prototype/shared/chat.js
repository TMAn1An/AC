/* Shared chat rendering: customer to technician job chat, technician to dispatch (assistant then agent), and the admin agent panel. */
(function () {
  window.AC = window.AC || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  AC.chatUI = {
    /* me: the `from` values drawn on the right. names: label for each `from` shown above other people's bubbles. */
    bubbles(msgs, me, names) {
      names = names || {};
      return '<div class="chat">' + msgs.map(m => {
        if (m.from === 'sys') return '<div class="chat-sys"><span>' + esc(m.text) + '</span></div>';
        const mine = me.includes(m.from), who = m.from === 'bot' ? 'Assistant' : m.from === 'agent' ? (m.by || 'Agent') + ' . Dispatch' : names[m.from] || '';
        return '<div class="bub ' + (mine ? 'me' : 'them') + (!mine && m.from === 'bot' ? ' bot' : '') + (!mine && m.from === 'agent' ? ' agent' : '') + '">' + (!mine && who ? '<b class="who">' + esc(who) + '</b>' : '') + esc(m.text) + '<small>' + AC.fmt.time(m.at) + '</small></div>';
      }).join('') + '</div>';
    }
  };
})();
