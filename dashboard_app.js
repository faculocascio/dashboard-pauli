(() => {
  const $ = s => document.querySelector(s);
  const NB = '\u00a0';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nfInt = new Intl.NumberFormat('es-ES');
  const pct = v => Math.round(v) + NB + '%';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const MAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  const linkMail = s => esc(s).replace(MAIL, m => '<a href="mailto:' + m + '">' + m + '</a>');
  const firstMail = s => (String(s).match(MAIL) || [])[0] || '';
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic'];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const SECTORS = {
    V:'Vanlife y camping', E:'Energía portátil', C:'Material de camping y montaña', B:'Bici y MTB',
    R:'Ropa y calzado', M:'Mochilas y equipaje', T:'Foto, vídeo y tecnología', A:'Apps y servicios digitales',
    J:'Viajes y transporte', D:'Destinos turísticos', F:'Finanzas y seguros', S:'Surf, nieve y agua', N:'Alimentación y cuidado'
  };
  const ST = {
    YC:{label:'Ya colaboró', c:'var(--st-yc)', o:0},
    CR:{label:'Contactado, respondió', c:'var(--st-cr)', o:1},
    CP:{label:'Contactado, pendiente', c:'var(--st-cp)', o:2},
    NI:{label:'No interesado', c:'var(--st-ni)', o:3},
    P:{label:'Potencial', c:'var(--st-p)', o:4}
  };
  const stOf = r => ST[r.est] || ST.P;
  const pill = r => '<span class="pill"><i class="dot" style="background:' + stOf(r).c + '"></i>' + stOf(r).label + '</span>';

  function cutSentence(s) {
    const re = /\.\s+(?=[A-ZÁÉÍÓÚÑ¿])/g; let m;
    while ((m = re.exec(s))) {
      const tok = s.slice(0, m.index).split(/\s/).pop();
      if (!/^(Dr|EE|UU|RR|PP|Sr|Sra)$/.test(tok)) return s.slice(0, m.index + 1);
    }
    return s;
  }
  function extract(text, startRe) {
    const out = []; let t = text, i = t.search(startRe);
    while (i > -1) {
      const sent = cutSentence(t.slice(i));
      out.push(sent);
      t = t.slice(i + sent.length);
      i = t.search(startRe);
    }
    return out;
  }
  function getAvisos(r) {
    const OJO = /\bOJO\b|\bOjo\b/;
    const items = [...extract(r.email, OJO), ...extract(r.notas, OJO)].map(s => s.replace(/^(OJO|Ojo):?\s*/, '').trim());
    const norm = s => s.toLowerCase().replace(/[.,;:\s]+$/, '');
    const out = [];
    items.forEach(s => {
      const n = norm(s);
      const covered = items.some(o => norm(o) !== n && norm(o).includes(n));
      const cap = /^[^\s]*@/.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1);
      if (!covered && !out.some(o => norm(o) === n)) out.push(cap);
    });
    return out;
  }
  function alertType(s) {
    if (/BBVA/.test(s)) return 'Conflicto con BBVA';
    if (/Bluetti/.test(s)) return 'Competencia de Bluetti';
    if (/falsa|falso/i.test(s)) return 'Emails o webs falsas';
    if (/elegir|compite con/i.test(s)) return 'Elegir solo una';
    if (/no paga/i.test(s)) return 'No pagan a creadores';
    return 'Otros avisos';
  }
  function getCanal(r) {
    const e = r.email;
    if (r.est === 'YC') return 'Relación existente';
    if (/^Enviado a:|^Contactado a través/.test(e)) return 'Email ya enviado';
    if (firstMail(e)) return 'Email disponible';
    if (/formulario/i.test(e)) return 'Formulario o programa';
    if (/\bDM\b|LinkedIn/.test(e)) return 'DM o LinkedIn';
    if (/afiliad|programa|solicitud|microsite|registro|sala de prensa/i.test(e)) return 'Formulario o programa';
    if (/verificar/i.test(e)) return 'Web por verificar';
    return 'Sin vía clara';
  }
  const CANALES = ['Email disponible','Formulario o programa','DM o LinkedIn','Web por verificar','Sin vía clara','Email ya enviado','Relación existente'];

  function parse(id) {
    return document.getElementById(id).textContent.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const f = l.split('|');
      const r = {sec:f[0], name:f[1], cat:f[2], contacto:f[3], est:f[4], fecha:f[5] || '', grupo:f[6] || '', email:f[7] || '', notas:f[8] || ''};
      const m = /^(\d{1,2})\/(\d{1,2})$/.exec(r.fecha);
      r.date = m ? new Date(2026, +m[2] - 1, +m[1]) : null;
      r.fechaTxt = r.date ? r.date.getDate() + ' ' + MONTHS[r.date.getMonth()] : r.fecha;
      const fit = /Fit (\d)\/5/.exec(r.notas); r.fit = fit ? +fit[1] : 0;
      r.avisos = getAvisos(r);
      r.canal = getCanal(r);
      r.search = (r.name + ' ' + r.cat + ' ' + r.contacto + ' ' + r.email + ' ' + r.notas + ' ' + r.grupo + ' ' + (SECTORS[r.sec] || '')).toLowerCase();
      return r;
    });
  }
  const pot = parse('dataPot');
  const col = parse('dataCol');
  const all = [...col, ...pot];
  const byName = new Map(all.map(r => [r.name, r]));
  const count = (arr, est) => arr.filter(r => r.est === est).length;
  const daysSince = r => r.date ? Math.round((today - r.date) / 864e5) : null;

  const nCP = count(pot, 'CP'), nCR = count(pot, 'CR'), nContact = nCP + nCR;
  const KPIS = [
    {v:pot.length, t:'marcas en la lista de potenciales'},
    {v:nContact, t:'contactadas', sub:pct(nContact / pot.length * 100) + ' de la lista'},
    {v:nCR, t:'han respondido', sub:'tasa de respuesta del ' + pct(nCR / nContact * 100), accent:true},
    {v:nCP, t:'esperando respuesta'},
    {v:col.length, t:'ya colaboraron'}
  ];
  $('#kpis').innerHTML = KPIS.map(k => '<div class="kpi' + (k.accent ? ' accent' : '') + '"><dt>' + k.t + (k.sub ? '<span class="sub">' + k.sub + '</span>' : '') + '</dt><dd data-count="' + k.v + '">' + nfInt.format(k.v) + '</dd></div>').join('');
  if (!reduced) {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count, t0 = performance.now(), dur = 1000;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = nfInt.format(Math.round(target * e));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0'; requestAnimationFrame(step);
    });
  }
  const grow = (pairs, prop) => {
    const p = prop || 'width';
    if (reduced) { pairs.forEach(([el, v]) => el.style[p] = v); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => pairs.forEach(([el, v]) => el.style[p] = v)));
  };

  const sorted = [...all].sort((a, b) => stOf(a).o - stOf(b).o || a.name.localeCompare(b.name, 'es'));
  const wall = $('#wall');
  $('#wallTitle').textContent = all.length + ' marcas en la hoja: ' + nContact + ' contactadas y ' + col.length + ' que ya colaboraron';
  wall.setAttribute('aria-label', sorted.length + ' marcas por estado');
  wall.innerHTML = sorted.map((r, i) => '<i data-i="' + i + '" title="' + esc(r.name) + '" style="background:' + stOf(r).c + '"></i>').join('');
  const info = $('#wallInfo');
  let selDot = null;
  function showBrandInfo(r, el) {
    if (selDot) selDot.classList.remove('sel');
    selDot = el; if (el) el.classList.add('sel');
    info.innerHTML = '<strong>' + esc(r.name) + '</strong><span>' + stOf(r).label + '</span><span class="muted">' + esc(r.cat) + (r.fechaTxt ? ', ' + esc(r.fechaTxt) : '') + '</span><button type="button" class="link-btn" data-open="' + esc(r.name) + '">Ver ficha</button>';
  }
  wall.addEventListener('pointerover', e => { const el = e.target.closest('i'); if (el) showBrandInfo(sorted[+el.dataset.i], el); });
  wall.addEventListener('click', e => { const el = e.target.closest('i'); if (el) showBrandInfo(sorted[+el.dataset.i], el); });
  const wallLegend = $('#wallLegend');
  ['YC','CR','CP','NI','P'].forEach(k => {
    const n = all.filter(r => r.est === k).length;
    if (!n) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lg-btn'; b.dataset.st = k; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<i class="dot" style="background:' + ST[k].c + '"></i>' + ST[k].label + ' <b>' + n + '</b>';
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      wallLegend.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(on));
      wall.classList.toggle('dim', on);
      wall.querySelectorAll('i').forEach(el => el.classList.toggle('hl', on && sorted[+el.dataset.i].est === k));
      info.innerHTML = on
        ? '<strong>' + n + ' marcas</strong><span>' + ST[k].label + '</span><button type="button" class="link-btn" data-filter-st="' + k + '">Ver en la lista</button>'
        : '<span class="muted">Toca un cuadro o un estado.</span>';
    });
    wallLegend.appendChild(b);
  });
  info.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) openBrand(o.dataset.open);
    const f = e.target.closest('[data-filter-st]'); if (f) applyFilter({est:f.dataset.filterSt});
  });

  const STORDER = ['YC','CR','CP','NI','P'];
  const secRows = Object.keys(SECTORS).map(k => {
    const rows = all.filter(r => r.sec === k);
    return {k, name:SECTORS[k], total:rows.length, by:STORDER.map(s => rows.filter(r => r.est === s).length)};
  }).filter(s => s.total).sort((a, b) => b.total - a.total);
  const maxSec = secRows[0] ? secRows[0].total : 1;
  const secFills = [];
  $('#sectorBars').innerHTML = '';
  secRows.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hb';
    const contacted = s.by[1] + s.by[2];
    b.setAttribute('aria-label', s.name + ': ' + s.total + ' marcas, ' + contacted + ' contactadas');
    b.innerHTML = '<span class="nm">' + s.name + '</span><span class="bar" style="width:' + (s.total / maxSec * 100) + '%"></span><span class="tot">' + s.total + '</span>';
    const bar = b.querySelector('.bar');
    STORDER.forEach((st, i) => {
      if (!s.by[i]) return;
      const sp = document.createElement('span');
      sp.style.background = ST[st].c; sp.style.width = '0';
      bar.appendChild(sp);
      secFills.push([sp, (s.by[i] / s.total * 100) + '%']);
    });
    b.addEventListener('click', () => applyFilter({sector:s.k}));
    $('#sectorBars').appendChild(b);
  });
  grow(secFills);
  $('#sectorLegend').innerHTML = STORDER.filter(k => all.some(r => r.est === k)).map(k => '<span><i class="dot" style="background:' + ST[k].c + '"></i>' + ST[k].label + '</span>').join('');

  const contacted = pot.filter(r => (r.est === 'CP' || r.est === 'CR') && r.date);
  const dayMap = new Map();
  contacted.forEach(r => { const k = r.date.getTime(); dayMap.set(k, (dayMap.get(k) || 0) + 1); });
  const dKeys = [...dayMap.keys()].sort((a, b) => a - b);
  const allDays = [];
  if (dKeys.length) for (let t = dKeys[0]; t <= dKeys[dKeys.length - 1]; t += 864e5) allDays.push(t);
  const maxDay = Math.max(...[...dayMap.values(), 1]);
  const dayFills = [];
  $('#dayBars').innerHTML = allDays.map(t => {
    const d = new Date(t), n = dayMap.get(t) || 0;
    return '<div class="day"><b>' + n + '</b><div class="col" data-h="' + (n / maxDay * 100) + '"></div><span>' + d.getDate() + ' ' + MONTHS[d.getMonth()] + '</span></div>';
  }).join('');
  $('#dayBars').querySelectorAll('.col').forEach(el => dayFills.push([el, 'calc((100% - 44px) * ' + (+el.dataset.h / 100) + ')']));
  grow(dayFills, 'height');

  const replies = pot.filter(r => r.est === 'CR').sort((a, b) => (a.date || 0) - (b.date || 0));
  $('#replies').innerHTML = replies.map(r => {
    const next = /PRÓXIMO PASO:\s*([^.]+)/.exec(r.notas);
    const note = r.notas.replace(/PRÓXIMO PASO:[^.]+\.\s*/, '');
    return '<div class="reply"><div class="reply-top"><b>' + esc(r.name) + '</b><span>' + esc(r.cat) + ', contactada el ' + esc(r.fechaTxt) + '</span></div>' +
      '<p>' + esc(note) + '</p>' + (next ? '<span class="next">Próximo paso: ' + esc(next[1].trim()) + '</span>' : '') + '</div>';
  }).join('');

  const waiting = pot.filter(r => r.est === 'CP').sort((a, b) => (a.date || 0) - (b.date || 0) || a.name.localeCompare(b.name, 'es'));
  let waitShown = 8;
  function renderWait() {
    $('#waitList').innerHTML = waiting.slice(0, waitShown).map(r => {
      const d = daysSince(r);
      const hints = [...extract(r.notas, /Si no contestan|Verificar /), ...r.avisos];
      const mail = firstMail(r.email);
      const subj = encodeURIComponent('Seguimiento: colaboración con @pauliiguerra');
      return '<li><div class="w-name"><b>' + esc(r.name) + '</b><small>' + esc(r.cat) + ', contactada el ' + esc(r.fechaTxt) + '</small></div>' +
        '<span class="badge-days' + (d >= 7 ? ' old' : '') + '">' + (d === 0 ? 'hoy' : 'hace ' + d + (d === 1 ? ' día' : ' días')) + '</span>' +
        (hints.length ? '<div class="w-hint">' + hints.map(esc).join(' ') + '</div>' : '') +
        (mail ? '<div class="w-act"><a href="mailto:' + mail + '?subject=' + subj + '">Escribir seguimiento a ' + esc(mail) + '</a></div>' : '') + '</li>';
    }).join('');
    const btn = $('#waitMore');
    btn.hidden = waiting.length <= 8;
    btn.textContent = waitShown < waiting.length ? 'Ver las ' + waiting.length + ' marcas pendientes' : 'Ver menos';
  }
  $('#waitMore').addEventListener('click', () => { waitShown = waitShown < waiting.length ? waiting.length : 8; renderWait(); });
  renderWait();

  const alerts = [];
  all.forEach(r => r.avisos.forEach(a => alerts.push({r, a, t:alertType(a)})));
  const aTypes = [...new Set(alerts.map(x => x.t))].sort((a, b) => alerts.filter(x => x.t === b).length - alerts.filter(x => x.t === a).length);
  let aSel = 'todos';
  function renderAlerts() {
    const chips = [{id:'todos', n:alerts.length, name:'Todos'}, ...aTypes.map(t => ({id:t, n:alerts.filter(x => x.t === t).length, name:t}))];
    $('#alertChips').innerHTML = chips.map(c => '<button type="button" class="chip" data-a="' + esc(c.id) + '" aria-pressed="' + (c.id === aSel) + '">' + esc(c.name) + '<span class="n">' + c.n + '</span></button>').join('');
    $('#alertList').innerHTML = alerts.filter(x => aSel === 'todos' || x.t === aSel)
      .sort((a, b) => stOf(a.r).o - stOf(b.r).o || a.r.name.localeCompare(b.r.name, 'es'))
      .map(x => '<li><button type="button" data-open="' + esc(x.r.name) + '">' + esc(x.r.name) + '</button> (' + stOf(x.r).label.toLowerCase() + '): ' + esc(x.a) + '</li>').join('');
  }
  $('#alertChips').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { aSel = b.dataset.a; renderAlerts(); } });
  $('#alertList').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openBrand(b.dataset.open); });
  renderAlerts();

  const PRIOS = [
    {t:'Marcas de vanlife y campers', w:'Fit perfecto y contenido natural.', b:['Siesta Campers','Furgocasa','People Camper']},
    {t:'Energía portátil', w:'Muy útil y demostrable en la furgo.', b:['EcoFlow','Bluetti','Goal Zero','BioLite']},
    {t:'eSIM y conectividad', w:'Problema real de viajeros, alta conversión.', b:['Holafly','Airalo']},
    {t:'Cámaras y tech de contenido', w:'', b:['Insta360','GoPro','DJI','Peak Design']},
    {t:'Outdoor gear accesible y premium sostenible', w:'', b:['Decathlon / Quechua','Patagonia']},
    {t:'Seguros de viaje', w:'', b:['IATI Seguros']}
  ];
  const brandChip = name => {
    const r = byName.get(name);
    const c = r ? stOf(r).c : 'var(--st-p)';
    const lbl = r ? stOf(r).label : 'No está en la hoja';
    return '<button type="button" class="chip" data-open="' + esc(name) + '" title="' + esc(lbl) + '" aria-label="' + esc(name + ', ' + lbl) + '"><i class="dot" style="background:' + c + '"></i>' + esc(name) + '</button>';
  };
  $('#prios').innerHTML = PRIOS.map((p, i) => {
    const done = p.b.filter(n => { const r = byName.get(n); return r && r.est !== 'P'; }).length;
    return '<li class="prio"><span class="num">' + (i + 1) + '</span><span class="pt">' + p.t + '</span>' +
      (p.w ? '<span class="pw">' + p.w + '</span>' : '<span></span>') +
      '<div><div class="chips">' + p.b.map(brandChip).join('') + '</div><p class="progress">' + done + ' de ' + p.b.length + ' contactadas o con colaboración</p></div></li>';
  }).join('');
  $('#prios').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openBrand(b.dataset.open); });
  $('#collab').innerHTML = col.map(r => '<div class="cb"><b>' + esc(r.name) + '</b><small>' + esc(r.cat) + (r.fecha ? ', ' + esc(r.fecha) : '') + '</small><p>' + esc(r.notas) + '</p></div>').join('');

  const canalCounts = CANALES.slice(0, 5).map(c => ({c, n:pot.filter(r => r.est === 'P' && r.canal === c).length})).filter(x => x.n);
  const maxCanal = Math.max(...canalCounts.map(x => x.n), 1);
  const canalFills = [];
  $('#canalBars').innerHTML = '';
  canalCounts.forEach(x => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hb';
    b.innerHTML = '<span class="nm">' + x.c + '</span><span class="bar"><span style="background:var(--teal);width:0"></span></span><span class="tot">' + x.n + '</span>';
    canalFills.push([b.querySelector('.bar span'), (x.n / maxCanal * 100) + '%']);
    b.addEventListener('click', () => applyFilter({canal:x.c, est:'P'}));
    $('#canalBars').appendChild(b);
  });
  grow(canalFills);

  const gRows = document.getElementById('dataGrp').textContent.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const f = l.split('|'); return {g:f[0], b:f[1], n:f[2] || ''}; });
  const groups = [...new Set(gRows.map(x => x.g))].map(g => {
    const items = gRows.filter(x => x.g === g);
    const open = items.some(x => { const r = byName.get(x.b); return r && r.est !== 'P'; });
    return {g, items, open};
  }).sort((a, b) => (b.open - a.open) || b.items.length - a.items.length || a.g.localeCompare(b.g, 'es'));
  let gSel = 'todos';
  function renderGroups() {
    const nOpen = groups.filter(g => g.open).length;
    $('#groupChips').innerHTML =
      '<button type="button" class="chip" data-g="todos" aria-pressed="' + (gSel === 'todos') + '">Todos<span class="n">' + groups.length + '</span></button>' +
      '<button type="button" class="chip" data-g="open" aria-pressed="' + (gSel === 'open') + '">Con una marca ya contactada o colaborada<span class="n">' + nOpen + '</span></button>';
    $('#groups').innerHTML = groups.filter(g => gSel === 'todos' || g.open).map(g =>
      '<div class="grp' + (g.open ? ' open' : '') + '"><div class="grp-top"><b>' + esc(g.g) + '</b><span>' + g.items.length + ' marcas</span></div>' +
      '<div class="chips">' + g.items.map(x => brandChip(x.b)).join('') + '</div>' +
      (g.items.some(x => x.n) ? '<ul class="grp-notes">' + g.items.filter(x => x.n).map(x => '<li><b>' + esc(x.b) + ':</b> ' + esc(x.n) + '</li>').join('') + '</ul>' : '') +
      (g.open ? '<span class="grp-tag">Puerta de entrada abierta</span>' : '') + '</div>').join('');
  }
  $('#groupChips').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { gSel = b.dataset.g; renderGroups(); } });
  $('#groups').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openBrand(b.dataset.open); });
  renderGroups();

  const F = {q:'', est:'todos', sector:'todos', canal:'todos', warn:false, sort:'estado'};
  let shown = 40;
  const fSector = $('#fSector'), fCanal = $('#fCanal'), fSort = $('#fSort'), qIn = $('#q');
  fSector.innerHTML = '<option value="todos">Todos los sectores</option>' + secRows.map(s => '<option value="' + s.k + '">' + s.name + ' (' + s.total + ')</option>').join('');
  fCanal.innerHTML = '<option value="todos">Todas las vías</option>' + CANALES.filter(c => all.some(r => r.canal === c)).map(c => '<option>' + c + '</option>').join('');
  const stChips = $('#stChips');
  function renderStChips() {
    const opts = [{k:'todos', l:'Todos', n:all.length}, ...STORDER.filter(k => all.some(r => r.est === k)).map(k => ({k, l:ST[k].label, n:all.filter(r => r.est === k).length}))];
    stChips.innerHTML = opts.map(o => '<button type="button" class="chip" data-st="' + o.k + '" aria-pressed="' + (F.est === o.k) + '">' + (o.k !== 'todos' ? '<i class="dot" style="background:' + ST[o.k].c + '"></i>' : '') + o.l + '<span class="n">' + o.n + '</span></button>').join('');
  }
  stChips.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (b) { F.est = b.dataset.st; shown = 40; renderStChips(); renderRows(); } });
  qIn.addEventListener('input', () => { F.q = qIn.value.trim().toLowerCase(); shown = 40; renderRows(); });
  fSector.addEventListener('change', () => { F.sector = fSector.value; shown = 40; renderRows(); });
  fCanal.addEventListener('change', () => { F.canal = fCanal.value; shown = 40; renderRows(); });
  fSort.addEventListener('change', () => { F.sort = fSort.value; renderRows(); });
  $('#onlyWarn').addEventListener('click', e => { F.warn = !F.warn; e.currentTarget.setAttribute('aria-pressed', String(F.warn)); shown = 40; renderRows(); });

  function filtered() {
    let list = all.filter(r =>
      (F.est === 'todos' || r.est === F.est) &&
      (F.sector === 'todos' || r.sec === F.sector) &&
      (F.canal === 'todos' || r.canal === F.canal) &&
      (!F.warn || r.avisos.length) &&
      (!F.q || r.search.includes(F.q)));
    const byNameCmp = (a, b) => a.name.localeCompare(b.name, 'es');
    if (F.sort === 'nombre') list.sort(byNameCmp);
    else if (F.sort === 'fecha') list.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0) || byNameCmp(a, b));
    else if (F.sort === 'fit') list.sort((a, b) => b.fit - a.fit || stOf(a).o - stOf(b).o || byNameCmp(a, b));
    else list.sort((a, b) => stOf(a).o - stOf(b).o || byNameCmp(a, b));
    return list;
  }
  function rowHTML(r) {
    const tags = (r.fit ? '<span class="fit">Fit ' + r.fit + '/5</span>' : '') + (r.avisos.length ? '<span class="warn-tag">Aviso</span>' : '');
    const body =
      '<dl>' +
      '<dt>Tipo de contacto</dt><dd>' + esc(r.contacto) + '</dd>' +
      '<dt>Email o vía</dt><dd>' + (r.email ? linkMail(r.email) : '—') + '</dd>' +
      '<dt>Notas</dt><dd>' + linkMail(r.notas || '—') + '</dd>' +
      (r.fecha ? '<dt>Fecha de contacto</dt><dd>' + esc(r.date ? r.fechaTxt + ' de 2026' : r.fecha) + '</dd>' : '') +
      (r.grupo ? '<dt>Grupo empresarial</dt><dd>' + esc(r.grupo) + '</dd>' : '') +
      (r.avisos.length ? '<dt>Avisos</dt><dd>' + r.avisos.map(esc).join(' ') + '</dd>' : '') +
      '<dt>Sector y vía</dt><dd>' + esc(SECTORS[r.sec]) + ', ' + esc(r.canal.toLowerCase()) + '</dd>' +
      '</dl>';
    return '<li class="row"><button type="button" class="row-head" aria-expanded="false">' +
      '<span class="r-name"><b>' + esc(r.name) + '</b>' + tags + '<small>' + esc(r.cat) + '</small></span>' +
      '<span class="r-sec">' + esc(SECTORS[r.sec]) + '</span>' +
      '<span class="r-st">' + pill(r) + '</span>' +
      '<span class="r-date">' + (r.date ? esc(r.fechaTxt) : '') + '</span>' +
      '<span class="r-chev" aria-hidden="true">+</span></button>' +
      '<div class="row-body" hidden>' + body + '</div></li>';
  }
  function renderRows() {
    const list = filtered();
    $('#rows').innerHTML = list.slice(0, shown).map(rowHTML).join('');
    $('#count').textContent = list.length === all.length ? 'Mostrando las ' + all.length + ' marcas' : list.length + ' de ' + all.length + ' marcas';
    const more = $('#rowsMore');
    more.hidden = list.length <= shown;
    more.textContent = 'Mostrar ' + Math.min(40, list.length - shown) + ' más';
    if (!list.length) $('#rows').innerHTML = '<li class="row" style="padding:18px 4px;color:var(--muted)">Ninguna marca coincide con estos filtros. Quita alguno para ver más.</li>';
  }
  $('#rowsMore').addEventListener('click', () => { shown += 40; renderRows(); });
  $('#rows').addEventListener('click', e => {
    const h = e.target.closest('.row-head'); if (!h) return;
    const open = h.getAttribute('aria-expanded') !== 'true';
    h.setAttribute('aria-expanded', String(open));
    h.nextElementSibling.hidden = !open;
  });

  function syncControls() {
    qIn.value = F.q; fSector.value = F.sector; fCanal.value = F.canal; fSort.value = F.sort;
    $('#onlyWarn').setAttribute('aria-pressed', String(F.warn));
    renderStChips();
  }
  function applyFilter(patch) {
    Object.assign(F, {q:'', est:'todos', sector:'todos', canal:'todos', warn:false}, patch);
    shown = 40; syncControls(); renderRows();
    document.getElementById('marcas').scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
  }
  function openBrand(name) {
    Object.assign(F, {q:name.toLowerCase(), est:'todos', sector:'todos', canal:'todos', warn:false});
    shown = 40; syncControls(); qIn.value = name; renderRows();
    const heads = [...document.querySelectorAll('#rows .row-head')];
    const h = heads.find(x => x.querySelector('.r-name b').textContent === name) || heads[0];
    if (h) { h.setAttribute('aria-expanded', 'true'); h.nextElementSibling.hidden = false; }
    document.getElementById('marcas').scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
  }
  renderStChips();
  renderRows();

  const navInner = $('#navInner');
  const links = [...navInner.querySelectorAll('a')];
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      const a = links.find(x => x.classList.contains('on'));
      if (a) navInner.scrollTo({left: a.offsetLeft - navInner.clientWidth / 2 + a.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth'});
    });
  }, {rootMargin:'-40% 0px -55% 0px'});
  document.querySelectorAll('main section').forEach(s => io.observe(s));
})();
