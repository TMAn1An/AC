/* Static reference data. Brand name "NEW" comes from the client logo. Change it in one place: AC.brand. */
window.AC = window.AC || {};
(function () {
  AC.brand = { name: 'NEW', tagline: 'Cooling, serviced and delivered.' };

  AC.fmt = {
    money: n => '৳' + Math.round(n).toLocaleString('en-IN'),
    ago(t) {
      const s = Math.max(0, (Date.now() - t) / 1000);
      if (s < 45) return 'just now';
      const m = Math.round(s / 60); if (m < 60) return m + ' min ago';
      const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
      return Math.round(h / 24) + ' d ago';
    },
    time: t => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    ini: n => n.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase(),
    km: d => (d * 0.025).toFixed(1) + ' km'
  };

  // Schematic city coordinates on a 1000 x 640 board (1 unit = 25 m). Not geographic; real build uses OpenStreetMap tiles.
  AC.areas = {
    uttara: { n: 'Uttara', x: 720, y: 60 }, bashundhara: { n: 'Bashundhara', x: 905, y: 185 }, mirpur: { n: 'Mirpur', x: 230, y: 170 },
    mohakhali: { n: 'Mohakhali', x: 480, y: 270 }, banani: { n: 'Banani', x: 600, y: 225 }, gulshan: { n: 'Gulshan', x: 790, y: 270 },
    badda: { n: 'Badda', x: 905, y: 355 }, farmgate: { n: 'Farmgate', x: 440, y: 345 }, mohammadpur: { n: 'Mohammadpur', x: 235, y: 365 },
    dhanmondi: { n: 'Dhanmondi', x: 355, y: 420 }, motijheel: { n: 'Motijheel', x: 650, y: 490 }, olddhaka: { n: 'Old Dhaka', x: 450, y: 548 }
  };
  /* Business rules live here so they can change without touching app code. */
  AC.config = { SERVICE_RADIUS: 160, OFFER_SECONDS: 60, VENDOR_MINUTES: 15, INSTALL_FEE: 1800, INSTALL_DISCOUNT: 0.2, INCENTIVE_RATE: 0.12, CONFIRM_DISCOUNT: 100, SERVICE_INTERVAL_DAYS: 180, WARRANTY_DAYS: 365 };
  AC.SERVICE_RADIUS = AC.config.SERVICE_RADIUS; // map units, about 4 km

  AC.services = [
    { id: 'ac-repair', tone: 0, name: 'AC Repair', price: 1000, dur: '60-90 min', icon: 'wrench', desc: 'Diagnosis and repair of any fault: noise, water leak, tripping, remote or board issues.' },
    { id: 'ac-cooling', tone: 5, name: 'AC Cooling Problem', price: 1000, dur: '60-90 min', icon: 'snow', desc: 'Weak or no cooling. Gas pressure, filter and compressor check.' },
    { id: 'ac-service', tone: 2, name: 'General Servicing', price: 1200, dur: '75 min', icon: 'sparkle', desc: 'Indoor and outdoor wash, filter clean, drain flush and a performance report.' },
    { id: 'ac-gas', tone: 3, name: 'Gas Refill', price: 2200, dur: '60 min', icon: 'drop', desc: 'Leak test, vacuum and refill to the manufacturer pressure.' },
    { id: 'ac-install', tone: 1, name: 'AC Installation', price: 1800, dur: '2-3 h', icon: 'box', desc: 'Wall mounting, copper piping up to 10 ft, drain line and test run.' },
    { id: 'ac-reloc', tone: 4, name: 'Uninstall and Relocate', price: 2500, dur: '3-4 h', icon: 'truck', desc: 'Safe removal, gas recovery and re-installation at the new location.' }
  ];
  AC.slots = ['Today, 2-4 PM', 'Today, 4-6 PM', 'Tomorrow, 10 AM-12 PM', 'Tomorrow, 2-4 PM'];
  AC.parts = [
    { label: 'Compressor capacitor', price: 650 }, { label: 'Gas top-up (R32)', price: 2500 },
    { label: 'Control board repair', price: 3200 }, { label: 'Fan motor', price: 1800 }
  ];
  AC.INSTALL_FEE = AC.config.INSTALL_FEE;

  AC.catalog = [
    { id: 'ac1', cat: 'ac', brand: 'Arctica', name: 'Inverter Split AC 1.5 Ton', price: 68500, was: 72000, rating: 4.8, kind: 'split', tint: 0, tag: 'Inverter', variants: ['1 Ton', '1.5 Ton', '2 Ton'], stock: 14, sold: 63 },
    { id: 'ac2', cat: 'ac', brand: 'Hima', name: 'Non-Inverter Split AC 1 Ton', price: 42900, was: 45500, rating: 4.5, kind: 'split', tint: 5, tag: 'Best value', variants: ['1 Ton', '1.5 Ton'], stock: 22, sold: 91 },
    { id: 'ac3', cat: 'ac', brand: 'Zephyr', name: 'Window AC 1.5 Ton', price: 39500, was: 0, rating: 4.3, kind: 'window', tint: 1, tag: 'Window', variants: ['1 Ton', '1.5 Ton'], stock: 9, sold: 24 },
    { id: 'ac4', cat: 'ac', brand: 'Arctica', name: 'Ceiling Cassette AC 3 Ton', price: 148000, was: 0, rating: 4.6, kind: 'cassette', tint: 4, tag: 'Commercial', variants: ['2 Ton', '3 Ton', '4 Ton'], stock: 4, sold: 7 },
    { id: 'bg1', cat: 'bag', brand: 'Tanti Crafts', name: 'Mohua Leather Tote', price: 3450, was: 4200, rating: 4.7, kind: 'tote', tint: 1, tag: 'Handmade', variants: ['Tan', 'Black'], stock: 40, sold: 118 },
    { id: 'bg2', cat: 'bag', brand: 'Urban Kit', name: 'City Daypack 22L', price: 2650, was: 0, rating: 4.4, kind: 'pack', tint: 0, tag: 'Water resistant', variants: ['Navy', 'Slate'], stock: 62, sold: 207 },
    { id: 'bg3', cat: 'bag', brand: 'Urban Kit', name: 'Weekender Duffel 40L', price: 3900, was: 4500, rating: 4.5, kind: 'duffel', tint: 2, tag: 'Travel', variants: ['Olive', 'Black'], stock: 28, sold: 66 },
    { id: 'bg4', cat: 'bag', brand: 'Tanti Crafts', name: 'Jamdani Evening Clutch', price: 1850, was: 0, rating: 4.9, kind: 'clutch', tint: 3, tag: 'Local weave', variants: ['Rose', 'Ivory'], stock: 33, sold: 54 },
    { id: 'cs1', cat: 'cos', brand: 'Nodi', name: 'Neem and Tulsi Face Wash', price: 320, was: 0, rating: 4.6, kind: 'tube', tint: 2, tag: 'Local', variants: ['100 ml'], stock: 210, sold: 640 },
    { id: 'cs2', cat: 'cos', brand: 'Kesh', name: 'Amla and Hibiscus Hair Oil', price: 450, was: 520, rating: 4.7, kind: 'bottle', tint: 4, tag: 'Local', variants: ['200 ml'], stock: 150, sold: 512 },
    { id: 'cs3', cat: 'cos', brand: 'Golap', name: 'Rose Water Mist', price: 380, was: 0, rating: 4.5, kind: 'spray', tint: 3, tag: 'Local', variants: ['100 ml'], stock: 120, sold: 301 },
    { id: 'cs4', cat: 'cos', brand: 'Haldi', name: 'Turmeric Glow Cream', price: 540, was: 600, rating: 4.4, kind: 'jar', tint: 1, tag: 'Local', variants: ['50 g'], stock: 88, sold: 233 },
    { id: 'cs5', cat: 'cos', brand: 'Kajol', name: 'Pure Kohl Pencil', price: 260, was: 0, rating: 4.8, kind: 'stick', tint: 5, tag: 'Local', variants: ['Black'], stock: 300, sold: 880 }
  ];
  AC.catById = Object.fromEntries(AC.catalog.map(p => [p.id, p]));
  AC.svcById = Object.fromEntries(AC.services.map(s => [s.id, s]));

  AC.vendors = [
    { id: 'V1', name: 'CoolTech Services', owner: 'Mizanur Rahman', area: 'mirpur', x: 250, y: 190, addr: 'Plot 12, Section 10, Mirpur, Dhaka', phone: '01700-000311', commission: 12, since: 'Mar 2025' },
    { id: 'V2', name: 'Zenith Air Care', owner: 'Shafiqul Alam', area: 'uttara', x: 700, y: 85, addr: 'House 8, Sector 7, Uttara, Dhaka', phone: '01700-000312', commission: 12, since: 'Jun 2025' },
    { id: 'V3', name: 'Metro Cooling Solutions', owner: 'Kamrul Hasan', area: 'motijheel', x: 630, y: 510, addr: 'Shapla Tower, Motijheel C/A, Dhaka', phone: '01700-000313', commission: 10, since: 'Aug 2025' }
  ];
  AC.vendById = Object.fromEntries(AC.vendors.map(v => [v.id, v]));

  AC.techs = [
    { id: 'T1', name: 'Rakib Hasan', vendor: null, area: 'mohakhali', x: 515, y: 298, phone: '01700-000201', rating: 4.9, jobs: 312 },
    { id: 'T2', name: 'Sumon Mia', vendor: null, area: 'mirpur', x: 215, y: 195, phone: '01700-000202', rating: 4.7, jobs: 268 },
    { id: 'T3', name: 'Imran Hossain', vendor: null, area: 'dhanmondi', x: 340, y: 430, phone: '01700-000203', rating: 4.8, jobs: 290 },
    { id: 'T4', name: 'Jahid Karim', vendor: null, area: 'gulshan', x: 775, y: 285, phone: '01700-000204', rating: 4.6, jobs: 201 },
    { id: 'T5', name: 'Alamin Sheikh', vendor: 'V1', area: 'mirpur', x: 270, y: 150, phone: '01700-000205', rating: 4.5, jobs: 144 },
    { id: 'T6', name: 'Faruk Ahmed', vendor: 'V1', area: 'mohammadpur', x: 250, y: 350, phone: '01700-000206', rating: 4.4, jobs: 118 },
    { id: 'T7', name: 'Shohag Rana', vendor: 'V2', area: 'uttara', x: 740, y: 75, phone: '01700-000207', rating: 4.6, jobs: 96 },
    { id: 'T8', name: 'Nasir Uddin', vendor: 'V2', area: 'uttara', x: 690, y: 45, phone: '01700-000208', rating: 4.3, jobs: 71 },
    { id: 'T9', name: 'Babul Mia', vendor: 'V3', area: 'motijheel', x: 670, y: 505, phone: '01700-000209', rating: 4.5, jobs: 133 }
  ];
  AC.techById = Object.fromEntries(AC.techs.map(t => [t.id, t]));

  AC.customers = [
    { id: 'C1', name: 'Nadia Rahman', phone: '01700-000101', area: 'banani', addr: 'House 14, Road 5, Banani', x: 612, y: 217, joined: 'Sep 2026' },
    { id: 'C2', name: 'Tanvir Ahmed', phone: '01700-000102', area: 'mirpur', addr: 'Block C, Road 3, Mirpur 10', x: 238, y: 178, joined: 'Jan 2026' },
    { id: 'C3', name: 'Farhana Akter', phone: '01700-000103', area: 'uttara', addr: 'House 22, Sector 11, Uttara', x: 700, y: 40, joined: 'Mar 2026' },
    { id: 'C4', name: 'Mahmudul Hasan', phone: '01700-000104', area: 'dhanmondi', addr: 'Road 9A, Dhanmondi', x: 362, y: 414, joined: 'Nov 2025' },
    { id: 'C5', name: 'Sadia Islam', phone: '01700-000105', area: 'gulshan', addr: 'Road 41, Gulshan 2', x: 798, y: 262, joined: 'Feb 2026' },
    { id: 'C6', name: 'Arif Chowdhury', phone: '01700-000106', area: 'motijheel', addr: 'Dilkusha C/A, Motijheel', x: 658, y: 478, joined: 'Apr 2026' },
    { id: 'C7', name: 'Mitu Begum', phone: '01700-000107', area: 'mohammadpur', addr: 'Tajmahal Road, Mohammadpur', x: 228, y: 372, joined: 'May 2026' },
    { id: 'C8', name: 'Rafiq Uddin', phone: '01700-000108', area: 'badda', addr: 'Middle Badda, Link Road', x: 900, y: 345, joined: 'Jul 2026' },
    { id: 'C9', name: 'Imtiaz Kabir', phone: '01700-000109', area: 'mohakhali', addr: 'DOHS, Mohakhali', x: 488, y: 262, joined: 'Jun 2026' },
    { id: 'C10', name: 'Lubna Yasmin', phone: '01700-000110', area: 'banani', addr: 'Road 11, Block D, Banani', x: 590, y: 212, joined: 'Aug 2026' },
    { id: 'C11', name: 'Nusrat Jahan', phone: '01700-000111', area: 'mirpur', addr: 'Pallabi, Mirpur 12', x: 215, y: 150, joined: 'Oct 2026' }
  ];
  AC.custById = Object.fromEntries(AC.customers.map(c => [c.id, c]));

  AC.promos = [
    { code: 'FIRST15', title: 'First purchase discount', desc: '15% off your first shop order, up to ৳500.', status: 'Active', used: 148, kind: 'Percent' },
    { code: 'ACINSTALL', title: 'AC and installation bundle', desc: '20% off installation when you buy an AC from us. Includes 1 year warranty on repair.', status: 'Active', used: 37, kind: 'Bundle' },
    { code: 'CONFIRM100', title: 'Confirmation call discount', desc: '৳100 off a service when the booking is confirmed by our support call.', status: 'Active', used: 212, kind: 'Flat' },
    { code: 'BKASH10', title: 'bKash payment offer', desc: '10% cashback up to ৳200. Terms pending with the provider.', status: 'Draft', used: 0, kind: 'Payment' },
    { code: 'NAGAD05', title: 'Nagad payment offer', desc: '5% instant discount. Terms pending with the provider.', status: 'Draft', used: 0, kind: 'Payment' }
  ];
  AC.couriers = ['Pathao Courier', 'RedX'];
  AC.payMethods = [
    { id: 'cod', name: 'Cash on delivery', note: 'Pay the technician or courier in cash', icon: 'wallet' },
    { id: 'bkash', name: 'bKash', note: 'Pay with your bKash wallet', icon: 'phone' },
    { id: 'nagad', name: 'Nagad', note: 'Pay with your Nagad wallet', icon: 'phone' },
    { id: 'card', name: 'Card or net banking', note: 'Visa, Mastercard, DBBL via SSLCommerz', icon: 'card' }
  ];
  AC.payName = id => (AC.payMethods.find(m => m.id === id) || {}).name || id;

  /* Shop promo codes. rule: pct (percent) or flat, optional cap, min subtotal, first (first order only), cat (only for that category) */
  AC.shopPromos = [
    { code: 'FIRST15', title: 'First purchase', desc: '15% off your first order, up to \u09F3500', pct: 15, cap: 500, first: true },
    { code: 'COOL10', title: 'AC offer', desc: '10% off air conditioners above \u09F330,000, up to \u09F33,000', pct: 10, cap: 3000, min: 30000, cat: 'ac' },
    { code: 'WELCOME100', title: 'Welcome', desc: '\u09F3100 off orders above \u09F31,000', flat: 100, min: 1000 }
  ];
  AC.courierSteps = ['Parcel picked up', 'At sorting hub', 'In transit', 'Out for delivery', 'Delivered', 'Delivery attempt failed', 'Returning to NEW'];
  /* Public tracking pages. Confirm the exact URL format with each courier before launch. */
  AC.courierLinks = { 'Pathao Courier': id => 'https://merchant.pathao.com/tracking?consignment_id=' + id, 'RedX': id => 'https://redx.com.bd/track-global-parcel/?trackingId=' + id };



  /* Service report: what the technician confirms before closing a job. Per service, editable here. The customer and admin see the result. */
  AC.checklists = {
    'default': ['Tested cooling and airflow', 'Cleaned the work area', 'Explained the work to the customer'],
    'ac-service': ['Washed filters and indoor coil', 'Cleaned the outdoor unit', 'Cleared the drain line', 'Checked gas pressure', 'Tested cooling and airflow'],
    'ac-gas': ['Checked for leaks', 'Refilled gas to the rated pressure', 'Tested cooling and airflow', 'Explained the work to the customer'],
    'ac-install': ['Mounted indoor and outdoor units', 'Vacuumed and connected the piping', 'Checked the drain slope', 'Tested cooling and airflow', 'Showed the customer how to use the remote'],
    'ac-cooling': ['Found and explained the fault', 'Cleaned filters and coil', 'Checked gas pressure', 'Tested cooling and airflow'],
    'ac-repair': ['Found and explained the fault', 'Replaced or repaired the faulty part', 'Tested cooling and airflow', 'Cleaned the work area']
  };
  AC.checklistFor = svc => AC.checklists[svc] || AC.checklists['default'];
  /* Dispatch assistant (technician help). Rules are plain data so wording and topics can change without touching code.
     Each rule lists keywords (any match counts, the rule with most matches wins). `handoff` sends the chat to a human agent at once.
     No rule matched twice in a row also hands off. In production the same interface can be backed by a language model. */
  AC.botRules = [
    { id: 'agent', handoff: true, k: ['agent', 'human', 'person', 'call me', 'urgent', 'emergency', 'accident', 'hurt', 'injur', 'police', 'threat', 'fight', 'unsafe'], a: 'I am passing you to a dispatch agent now.' },
    { id: 'hello', k: ['hello', 'hi ', 'hey', 'salam', 'help'], a: 'Hi, I am the NEW dispatch assistant. Tell me the problem in a few words, for example customer, address, payment, extra work or the app.' },
    { id: 'thanks', k: ['thanks', 'thank you', 'solved', 'ok got it', 'fixed'], a: 'Glad to help. Message me any time.' },
    { id: 'noanswer', k: ['not answer', 'no answer', 'not picking', 'not opening', 'phone off', 'not home', 'not here', 'gate', 'unreachable', 'switched off'], a: 'Call the customer twice, then send a message in the job chat. Wait up to ten minutes at the address. If there is still no answer, tap Talk to an agent and dispatch will decide whether to reschedule or cancel.' },
    { id: 'address', k: ['address', 'location', 'cannot find', 'cant find', 'lost', 'wrong pin', 'map', 'direction', 'route', 'landmark'], a: 'Open the job and follow the live directions on the map. If the pin looks wrong, call the customer from the job screen and ask for a landmark. Still stuck? Tell me the area name or tap Talk to an agent.' },
    { id: 'extra', k: ['extra', 'part', 'spare', 'price', 'cost', 'not in list', 'capacitor', 'gas'], a: 'For extra work tap Extra work and pick a priced item. If it is not on the list, choose Ask for a price and describe it. NEW or your vendor adds the price, and the customer decides. Do not start extra work before they approve.' },
    { id: 'cash', k: ['cash', 'payment', 'paid', 'deposit', 'collect', 'money', 'balance', 'wallet'], a: 'Cash you collect stays in your wallet. Open Earnings and tap Deposit cash. Admin or your vendor accepts it, and only then does your cash balance go to zero.' },
    { id: 'withdraw', k: ['withdraw', 'incentive', 'bonus', 'payout', 'commission'], a: 'Incentive can be withdrawn once your cash balance is zero. Open Earnings and tap Withdraw. Finance pays it to your bKash or Nagad.' },
    { id: 'code', k: ['code', 'otp', 'finish', 'complete', 'close job', 'cannot complete'], a: 'To finish a job, ask the customer for the 4 digit completion code in their NEW app. It is not an SMS. If they cannot find it, they open the booking in their app.' },
    { id: 'late', k: ['late', 'traffic', 'delay', 'stuck', 'jam', 'running behind'], a: 'Send the customer your new arrival time in the job chat. If you will be more than 30 minutes late, tap Talk to an agent so dispatch can warn them or reassign.' },
    { id: 'cancel', k: ['cancel', 'reassign', 'change job', 'swap', 'give job'], a: 'Only dispatch can cancel or reassign a job. Tap Talk to an agent and share the job number.' },
    { id: 'app', k: ['app', 'crash', 'bug', 'not working', 'slow', 'freeze', 'error', 'login', 'network'], a: 'Close and reopen the app and check your connection. If it keeps failing, tap Talk to an agent. An agent can finish the job from the admin panel if the app is down.' }
  ];
  AC.bot = {
    reply(text, miss, job) {
      const t = ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ';
      let best = null, bestN = 0;
      AC.botRules.forEach(r => { const n = r.k.filter(k => t.includes(k.includes(' ') || k.endsWith(' ') ? k : ' ' + k) || t.includes(k)).length; if (n > bestN) { best = r; bestN = n; } });
      if (best) { const ctx = job && best.id !== 'agent' && best.id !== 'hello' && best.id !== 'thanks' ? ' (Your current job is ' + job.id + '.)' : ''; return { text: best.a + ctx, handoff: !!best.handoff, miss: 0 }; }
      if ((miss || 0) >= 1) return { text: 'I could not work that out. I am passing you to a dispatch agent. You do not need to repeat yourself.', handoff: true, miss: 0 };
      return { text: 'I am not sure I understood. Can you say it another way, for example customer, address, payment, extra work or app? Or tap Talk to an agent.', handoff: false, miss: 1 };
    }
  };
  /* Staff permissions and default roles. Editable at runtime in the admin web app (Team and roles). */
  AC.perms = [['dispatch', 'Dispatch and bookings'], ['override', 'Override job status'], ['extra', 'Price extra work'], ['orders', 'Orders and couriers'], ['catalog', 'Services, products, categories'], ['promos', 'Promotions'], ['people', 'Users, technicians, vendors'], ['kyc', 'Onboard and verify technicians'], ['finance', 'Payments, collections, earnings'], ['reviews', 'Reviews and ratings'], ['messages', 'Customer messages'], ['roles', 'Staff and roles']];
  AC.defaultRoles = [
    { id: 'super', name: 'Super admin', perms: AC.perms.map(p => p[0]) },
    { id: 'ops', name: 'Operations executive', perms: ['dispatch', 'override', 'extra', 'orders', 'kyc', 'messages', 'people'] },
    { id: 'fin', name: 'Finance', perms: ['finance', 'reviews'] },
    { id: 'cat', name: 'Catalog manager', perms: ['catalog', 'promos', 'orders'] },
    { id: 'sup', name: 'Support agent', perms: ['messages', 'dispatch'] }
  ];
  AC.defaultStaff = [
    { id: 'U1', name: 'Rafi Ahmed', email: 'rafi@new.example', role: 'super' }, { id: 'U2', name: 'Tania Rahman', email: 'tania@new.example', role: 'ops' },
    { id: 'U3', name: 'Imran Chowdhury', email: 'imran@new.example', role: 'fin' }, { id: 'U4', name: 'Salma Akter', email: 'salma@new.example', role: 'cat' }, { id: 'U5', name: 'Joy Das', email: 'joy@new.example', role: 'sup' }
  ];
  /* Technician identity records (demo). Onboarded by admin or by a vendor. Vendors only ever see their own technicians. */
  AC.techs.forEach((t, i) => { t.by = t.vendor || 'admin'; t.kyc = { status: 'verified', nid: '*** *** ' + (4100 + i * 37), method: 'NID photos, live check, live selfie', verifiedBy: t.vendor ? AC.vendById[t.vendor].name : 'NEW Admin', at: 'Mar 2026' }; });
})();
