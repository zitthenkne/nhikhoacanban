/* app.js — Router hash, Event Bus, render trang tí hon, Drawer không phá trạng thái, lưu tiến độ.
   Hash: #/ · #/L/<beatId> · #/q/<n> · #/ca · #/osce · #/bay · #/tra   (window.ALL_SCREENS() cho QA) */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
ZS.esc = esc; ZS.md = md;

// Tiến độ (localStorage, chịu lỗi chế độ riêng tư)
const KEY = 'nhi-cb-v1'; let P = {};
try { P = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { P = {}; }
['seen', 'ask', 'quiz', 'done'].forEach(k => { P[k] = P[k] || {}; });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* bỏ qua */ } };
ZS.P = P; ZS.save = save;

// Event bus
const ET = new EventTarget();
ZS.bus = { on: (e, f) => ET.addEventListener(e, x => f(x.detail)), emit: (e, d) => ET.dispatchEvent(new CustomEvent(e, { detail: d })) };

const BEATS = ZS.BEATS || [], BY = ZS.BY = Object.fromEntries(BEATS.map(b => [b.id, b]));
const TOPICS = ZS.TOPICS || [];
const MODE = { thu: 'Thử', xem: 'Xem', so: 'So sánh', zoom: 'Phóng to' };
const topicOf = id => TOPICS.find(t => t.beats.some(([b]) => b === id));
const mq = matchMedia('(max-width: 760px)');

const SCREENS = () => {
  const L = ['#/'];
  TOPICS.forEach(t => { t.beats.forEach(([id]) => { if (BY[id]) L.push('#/L/' + id); });
    (ZS.QUIZ || []).forEach((q, i) => { if (q.topic === t.n) L.push('#/q/' + i); }); });
  if (ZS.CASES) L.push('#/ca'); if (ZS.OSCE) L.push('#/osce'); if (ZS.MYTHS) L.push('#/bay');
  if (ZS.views && ZS.views.nghe) L.push('#/nghe'); if (ZS.views && ZS.views.on) L.push('#/on');
  L.push('#/tra');
  return L;
};
window.ALL_SCREENS = SCREENS;

/* ── Trang tí hon: ① ask → ② hình → ③ chain sáng #hl-* → ④ lâm sàng/bẫy ── */
const mountBeat = (root, b, opt) => {
  const u = b.ui, a = b.ask, ans = P.ask[b.id], t = topicOf(b.id);
  root.innerHTML = `<section class="tihon" data-mode="${esc(b.mode)}">
  <div class="fig fresh${a && ans == null ? ' veil' : ''}"><div class="art"><svg viewBox="0 0 560 350" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(b.title)}"></svg><span class="badge">✓ Xong</span></div>
  <div class="sim"></div><p class="src">${esc(b.src)}</p></div>
  <div class="bside ctl"><h1><small>${t ? esc(t.t) + ' · ' : ''}${MODE[b.mode] || ''}</small>${esc(b.title)}</h1>
  ${a ? `<div class="ask${ans != null ? ' answered' : ''}"><p>🤔 ${md(a.q)}</p><div class="opts">${a.opts.map((o, i) => `<button class="opt" data-i="${i}">${md(o)}</button>`).join('')}</div><p class="why" hidden></p><button class="skip">Bỏ qua, xem hình luôn</button></div>` : ''}
  <ol class="chain">${b.chain.map(c => `<li data-hl="${esc(c.hl)}">${md(c.t)}</li>`).join('')}</ol>
  <p class="box clin">🩺 <b>Lâm sàng:</b> ${md(b.clin)}</p><p class="box trap">⚠️ <b>Bẫy:</b> ${md(b.trap)}</p>
  ${b.pearl ? `<p class="box pearl">💡 <b>Lời dặn:</b> ${md(b.pearl)}</p>` : ''}</div></section>`;
  const fig = $('.fig', root), svg = $('svg', root), sim = $('.sim', root), lis = $$('.chain li', root);
  const s = Object.assign({}, u.init); if (root.id === 'stage' && ZS.qs) { try { const q = JSON.parse(new URLSearchParams(ZS.qs).get('s') || '{}'); for (const k in q) if (k in s && isFinite(q[k])) s[k] = +q[k]; } catch (e) { /* link hỏng → trạng thái gốc */ } }
  if (opt && opt.s) Object.assign(s, opt.s);
  const v = Object.assign({}, s), m = ZS.models[u.model](svg, u), tw = {}, ctls = [];
  let raf = 0;
  const paint = () => {
    m.update(v);
    lis.forEach((li, i) => li.classList.toggle('on', !b.chain[i].when || !!b.chain[i].when(v)));
    if (u.goal) { const g = !!u.goal(s); fig.classList.toggle('done', g); if (g && !P.done[b.id]) { P.done[b.id] = 1; save(); ZS.sfx.ok(); ZS.bus.emit('done', b.id); } }
    ctls.forEach(([c, w]) => {
      if (c.off) w.classList.toggle('off', !!c.off(s));
      if (c.t === 'range') { $('.val', w).textContent = (c.fmt ? c.fmt(s[c.k]) : s[c.k]) + (c.unit ? ' ' + c.unit : ''); const i = $('input', w); if (document.activeElement !== i) i.value = s[c.k]; }
      else if (c.t === 'toggle') $('.lay', w).setAttribute('aria-pressed', s[c.k] ? 'true' : 'false');
      else $$('.steps button', w).forEach((x, i) => x.classList.toggle('on', i === s[c.k]));
    });
  };
  const step = now => { raf = 0; let more = false;
    for (const k in tw) { const T = tw[k], p = Math.min(1, (now - T.t0) / T.d); v[k] = T.a + (T.b - T.a) * (1 - (1 - p) ** 3); if (p < 1) more = true; else delete tw[k]; }
    if (root.isConnected) { paint(); if (more) raf = requestAnimationFrame(step); } };
  // noMark: kéo liên tục không ghi bóng mờ mỗi khung hình; bóng mờ = trạng thái ngay trước thao tác
  const set = (k, x, d = 380, noMark) => { if (!noMark && !raf && m.mark) m.mark(); fig.classList.remove('fresh'); s[k] = x; tw[k] = { a: v[k] ?? x, b: x, t0: performance.now(), d }; if (!raf) raf = requestAnimationFrame(step); };

  (u.ctl || []).forEach(c => {
    const w = document.createElement('div'); w.className = 'c c-' + c.t;
    if (c.t === 'range') {
      w.innerHTML = `<label>${esc(c.label)} <b class="val"></b></label><input type="range" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${s[c.k]}" aria-label="${esc(c.label)}">` +
        (c.zones ? `<div class="zbar" aria-hidden="true">${c.zones.map(([z0, z1, col]) => `<i style="left:${(z0 - c.min) / (c.max - c.min) * 100}%;width:${(z1 - z0) / (c.max - c.min) * 100}%;background:var(--${col})"></i>`).join('')}</div>` : '') +
        (c.snaps ? `<div class="snaps">${c.snaps.map(x => `<i style="left:${(x - c.min) / (c.max - c.min) * 100}%">${x}</i>`).join('')}</div>` : '');
      const inp = $('input', w); let last = null;
      inp.addEventListener('input', () => { let x = +inp.value; const tol = (c.max - c.min) / 40, sn = (c.snaps || []).find(z => Math.abs(z - x) <= tol);
        if (sn != null) { x = sn; inp.value = sn; if (last !== sn) { ZS.sfx.tick(); ZS.buzz(8); } } last = sn ?? null; set(c.k, x, 140); });
    } else if (c.t === 'toggle') {
      w.innerHTML = (c.label ? `<label>${esc(c.label)}</label>` : '') + `<button class="lay" aria-pressed="false"><span>${esc(c.a)}</span><span>${esc(c.b)}</span></button>`;
      $('button', w).addEventListener('click', () => { set(c.k, s[c.k] ? 0 : 1, c.d || 450); ZS.sfx.tick(); ZS.buzz(10); });
    } else {
      w.innerHTML = (c.label ? `<label>${esc(c.label)}</label>` : '') + `<div class="steps">${c.opts.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      $$('.steps button', w).forEach(x => x.addEventListener('click', () => { set(c.k, +x.dataset.i, c.d || 700); ZS.sfx.tick(); }));
    }
    sim.appendChild(w); ctls.push([c, w]);
  });

  // Dự đoán vi mô: chọn → lộ hình + giải thích; luôn có lối "Bỏ qua" (zero-gate)
  if (a) {
    const box = $('.ask', root), why = $('.why', box), show = i => {
      $$('.opt', box).forEach((x, j) => { x.classList.toggle('right', j === a.a); x.classList.toggle('wrong', j === i && i !== a.a); });
      why.hidden = false; why.innerHTML = (i === a.a ? '✅ ' : '❌ ') + md(a.why); box.classList.add('answered'); fig.classList.remove('veil'); };
    if (ans != null && ans >= 0) show(ans);
    $$('.opt', box).forEach(x => x.addEventListener('click', () => { const i = +x.dataset.i; P.ask[b.id] = i; save(); show(i); (i === a.a ? ZS.sfx.ok : ZS.sfx.err)(); }));
    $('.skip', box).addEventListener('click', () => { fig.classList.remove('veil'); box.classList.add('answered'); });
  }

  // Chain ↔ #hl-* sáng hai chiều
  const lit = (id, on) => { const e = root.querySelector(`[id="hl-${id}"]`); if (e) e.classList.toggle('hl-on', on); lis.forEach(li => { if (li.dataset.hl === id) li.classList.toggle('lit', on); }); };
  lis.forEach(li => { li.addEventListener('pointerenter', () => lit(li.dataset.hl, true)); li.addEventListener('pointerleave', () => lit(li.dataset.hl, false));
    li.addEventListener('click', () => { lit(li.dataset.hl, true); fig.classList.remove('mini'); setTimeout(() => lit(li.dataset.hl, false), 1600); }); });
  let cur = null;
  svg.addEventListener('pointerover', e => { const h = e.target.closest('[id^="hl-"]'), id = h ? h.id.slice(3) : null; if (id !== cur) { if (cur) lit(cur, false); if (id) lit(id, true); cur = id; } });
  svg.addEventListener('pointerleave', () => { if (cur) lit(cur, false); cur = null; });

  // Sticky Stage 2 trạng thái trên điện thoại; giữ chỗ bằng margin để không giật bố cục
  root.onscroll = () => { if (!mq.matches) return; const y = root.scrollTop;
    if (y > 100 && !fig.classList.contains('mini')) { const h0 = fig.offsetHeight; fig.classList.add('mini'); fig.style.marginBottom = 12 + h0 - fig.offsetHeight + 'px'; }
    else if (y < 24 && fig.classList.contains('mini')) { fig.classList.remove('mini'); fig.style.marginBottom = ''; } };
  fig.addEventListener('click', () => { if (fig.classList.contains('mini')) root.scrollTo({ top: 0, behavior: 'smooth' }); });
  // Kéo / ấn giữ trực tiếp trên hình (ui.drag: [{k, box:[x0,y0,x1,y1], r:[min,max], axis, step, f, hold(ms), up}])
  // tay nắm trục x: vẫn cuộn dọc được trên điện thoại; có tay nắm trục y thì SVG giữ trọn cử chỉ
  if (u.drag) svg.style.touchAction = u.drag.some(d => d.axis === 'y') ? 'none' : 'pan-y';
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
  let dg = null, hr = 0;
  const move = e => { const [x, y] = toSvg(e), D = dg, bx = D.box, t = Math.max(0, Math.min(1, D.axis === 'y' ? (bx[3] - y) / (bx[3] - bx[1]) : (x - bx[0]) / (bx[2] - bx[0])));
    let val = D.r[0] + t * (D.r[1] - D.r[0]); if (D.step) val = Math.round(val / D.step) * D.step; if (D.f) val = D.f(val, s); val = +(+val).toFixed(4);
    const c = (u.ctl || []).find(z => z.k === D.k), sn = c && c.snaps && c.snaps.find(z => Math.abs(z - val) <= (c.max - c.min) / 40);
    if (sn != null && s[D.k] !== sn) { val = sn; ZS.sfx.tick(); ZS.buzz(8); } if (s[D.k] !== val) set(D.k, val, 60, true); };
  svg.addEventListener('pointerdown', e => { const [x, y] = toSvg(e), D = (u.drag || []).find(d => x >= d.box[0] && x <= d.box[2] && y >= d.box[1] && y <= d.box[3]); if (!D) return;
    dg = D; svg.setPointerCapture(e.pointerId); e.preventDefault(); if (m.mark) m.mark(); fig.classList.add('dragging');
    if (!D.hold) return move(e); const t0 = performance.now(), base = +s[D.k] || 0;
    const tick = now => { if (dg !== D) return; const p = Math.min(1, base + (now - t0) / D.hold); set(D.k, +p.toFixed(3), 0, true); if (p < 1) hr = requestAnimationFrame(tick); else { ZS.buzz(30); ZS.sfx.ok(); } };
    hr = requestAnimationFrame(tick); });
  svg.addEventListener('pointermove', e => { if (dg && !dg.hold) move(e); });
  const end = () => { if (!dg) return; const D = dg; dg = null; cancelAnimationFrame(hr); fig.classList.remove('dragging'); if (D.up) D.up(s, set); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  paint(); ZS.bus.emit('beat', { root, b, s, v, set });
  if (opt && opt.hl) { lit(opt.hl, true); setTimeout(() => lit(opt.hl, false), 2600); }
};

/* ── Các màn ── */
const V = ZS.views = ZS.views || {};
V[''] = el => {
  const all = TOPICS.flatMap(t => t.beats), have = all.filter(([id]) => BY[id]), seen = have.filter(([id]) => P.seen['#/L/' + id]).length;
  const first = have[0] ? '#/L/' + have[0][0] : '#/';
  el.innerHTML = `<section class="home"><div class="hero card tape"><h1>Sổ Tay Tương Tác<br><b>Nhi Khoa Cơ Bản</b></h1>
  <p>${all.length} trang cơ chế · 18 câu tinh hoa · 5 ca lâm sàng · 3 trạm OSCE</p>
  <div class="pg"><i style="width:${all.length ? Math.round(seen / all.length * 100) : 0}%"></i></div><p>${seen}/${all.length} trang đã xem</p>
  <a class="go" href="${P.last && BY[P.last.slice(4)] ? P.last : first}">${P.last ? 'Học tiếp →' : 'Bắt đầu →'}</a>
  <div class="quick"><a href="#/q/0">🧠 18 câu tinh hoa</a><a href="#/ca">🧩 Ca lâm sàng</a><a href="#/osce">🩺 Trạm OSCE</a><a href="#/bay">⚖️ Bẫy Đúng/Sai</a><a href="#/tra">📌 Tra nhanh</a></div></div>
  <div class="topics">${TOPICS.map(t => `<div class="topic card"><h2>${t.ic} ${t.n}. ${esc(t.t)}</h2><ol>${t.beats.map(([id, tt]) => BY[id]
    ? `<li><a href="#/L/${id}" class="${P.done[id] ? 'ok' : P.seen['#/L/' + id] ? 'seen' : ''}">${esc(tt)}</a></li>`
    : `<li class="soon">${esc(tt)} <em>đang soạn</em></li>`).join('')}</ol></div>`).join('')}</div></section>`;
};
V.L = (el, id) => { const b = BY[id]; if (!b) return V._404(el); mountBeat(el, b); };
const stub = (title, note) => el => { el.innerHTML = `<div class="stub card tape"><h1>${title}</h1><p>${note}</p><p><a href="#/">← Về bản đồ</a></p></div>`; };
// Thử nhớ: 18 câu tinh hoa, nhãn kép Dual-Truth, phân tích từng phương án, mở cơ chế trong drawer (không mất trạng thái)
V.q = (el, n) => {
  const Q = ZS.QUIZ || [], i = +n || 0, q = Q[i]; if (!q) return V._404(el);
  const T = TOPICS.find(t => t.n === q.topic), AB = 'ABCDE';
  el.innerHTML = `<section class="quiz"><div class="qcard card tape">
  <small class="qtag">🧠 Thử nhớ · ${T ? T.ic + ' ' + esc(T.t) : ''} · Câu ${i + 1}/${Q.length}</small>
  <div class="dual"><span class="stampx">📜 ${esc(q.exam)}</span><span class="whistle">🚨 ${md(q.bed)}</span></div>
  <h1 class="qq">${md(q.q)}</h1>
  <ol class="qopts">${q.opts.map((o, j) => `<li><button class="qo" data-j="${j}"><b>${AB[j]}</b>${md(o)}</button><p class="qw" hidden>${md(q.why[j])}</p></li>`).join('')}</ol>
  ${q.chk ? `<p class="chk">ⓘ ${esc(q.chk)}</p>` : ''}
  <div class="qfoot">${q.beat && BY[q.beat] ? `<button class="mech" data-drawer="${q.beat}"${q.st ? ` data-st="${esc(JSON.stringify(q.st))}"` : ''}${q.hl ? ` data-hl="${q.hl}"` : ''}>📖 Xem cơ chế</button>` : '<span></span>'}
  <button class="redo" hidden>↺ Làm lại câu này</button>
  <span class="dots">${Q.map((x, k) => `<a href="#/q/${k}" class="${k === i ? 'cur ' : ''}${P.quiz[x.id] == null ? '' : P.quiz[x.id] === x.a ? 'ok' : 'no'}" aria-label="Câu ${k + 1}"></a>`).join('')}</span></div></div></section>`;
  const show = j => { $$('.qo', el).forEach((b, k) => { b.classList.toggle('right', k === q.a); b.classList.toggle('wrong', k === j && j !== q.a); b.disabled = true; });
    $$('.qw', el).forEach(p => { p.hidden = false; }); $('.redo', el).hidden = false; };
  if (P.quiz[q.id] != null) show(P.quiz[q.id]);
  $$('.qo', el).forEach(b => b.addEventListener('click', () => { const j = +b.dataset.j; P.quiz[q.id] = j; save(); show(j); (j === q.a ? ZS.sfx.ok : ZS.sfx.err)(); ZS.bus.emit('quiz', { q, ok: j === q.a }); }));
  $('.redo', el).addEventListener('click', () => { delete P.quiz[q.id]; save(); V.q(el, i); });
};
V.ca = V.ca || stub('🧩 Ca lâm sàng', 'Đang nạp dữ liệu (Pha 2).');
V.osce = V.osce || stub('🩺 Trạm OSCE', 'Đang nạp dữ liệu (Pha 2).');
V.bay = V.bay || stub('⚖️ Bẫy thi Đúng/Sai', 'Đang nạp dữ liệu (Pha 2).');
V.tra = V.tra || stub('📌 Tra nhanh', 'Bảng tra & máy tính Z-score, tuổi hiệu chỉnh (Pha 2).');
V._404 = stub('Không tìm thấy trang', 'Liên kết này chưa có.');

/* ── Router ── */
const stage = $('#stage');
const norm = () => (location.hash && location.hash !== '#') ? location.hash : '#/';
const route = () => {
  const [hs, qs = ''] = norm().split('?'), [name = '', ...args] = hs.slice(2).split('/'); ZS.qs = qs;
  stage.onscroll = null; stage.scrollTop = 0; stage.innerHTML = '';
  (V[name] || V._404)(stage, ...args.map(decodeURIComponent));
  P.seen[hs] = 1; if (name === 'L') P.last = hs; save();
  const L = SCREENS(), i = L.indexOf(hs), b = name === 'L' && BY[args[0]];
  $('#bPrev').disabled = i <= 0; $('#bNext').disabled = i < 0 || i >= L.length - 1;
  $('#crumb').textContent = b ? `${topicOf(b.id).n}. ${topicOf(b.id).t} › ${b.title}` : ({ '': 'Bản đồ chương', q: `🧠 Thử nhớ · câu ${+args[0] + 1}/${(ZS.QUIZ || []).length}`, ca: 'Ca lâm sàng', osce: 'Trạm OSCE', bay: 'Bẫy thi', tra: 'Tra nhanh', nghe: 'Ống nghe ảo', on: 'Ôn tập Leitner' }[name] || '');
  $('#bar').style.width = (i < 0 ? 0 : (i + 1) / L.length * 100) + '%';
  $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href').split('/')[1] === name));
  $('#top').classList.remove('open'); ZS.bus.emit('route', hs);
};
const go = d => { const L = SCREENS(), j = L.indexOf(norm().split('?')[0]) + d; if (L[j]) location.hash = L[j]; };
ZS.go = go;
addEventListener('hashchange', route);

/* ── Drawer: trượt từ phải, nền mờ 15%, Esc quay lại — không đụng hash/trạng thái bài đang làm ── */
const drawer = $('#drawer');
ZS.drawer = {
  open(id, opt) { const b = BY[id]; if (!b) return; $('#dTitle').textContent = '📖 ' + b.title; mountBeat($('#dBody'), b, opt); document.body.classList.add('drawer'); drawer.setAttribute('aria-hidden', 'false'); $('#dClose').focus(); },
  close() { document.body.classList.remove('drawer'); drawer.setAttribute('aria-hidden', 'true'); setTimeout(() => { if (!document.body.classList.contains('drawer')) $('#dBody').innerHTML = ''; }, 320); },
};
$('#dClose').addEventListener('click', ZS.drawer.close);
document.addEventListener('click', e => { const d = e.target.closest('[data-drawer]'); if (!d) return; e.preventDefault(); let st = null; try { st = d.dataset.st ? JSON.parse(d.dataset.st) : null; } catch (x) { st = null; } ZS.drawer.open(d.dataset.drawer, { s: st, hl: d.dataset.hl }); });

/* ── Crash HUD (nội dung do crash-data.js + Pha 3 gắn qua ZS.crashView) ── */
const crash = $('#crash'), crashOpen = on => { crash.hidden = !on; if (on) { if (ZS.crashView) ZS.crashView($('#cBody')); else $('#cBody').innerHTML = '<p>Bảng liều cấp cứu đang nạp (Pha 2–3).</p>'; $('#cClose').focus(); } };
$('#fab').addEventListener('click', () => crashOpen(true));
$('#cClose').addEventListener('click', () => crashOpen(false));

/* ── Phím, nút topbar ── */
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!crash.hidden) crashOpen(false); else if (document.body.classList.contains('drawer')) ZS.drawer.close(); return; }
  if (!crash.hidden || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') go(-1);
});
$('#bPrev').addEventListener('click', () => go(-1)); $('#bNext').addEventListener('click', () => go(1));
const setMute = m => { ZS.sfx.mute = m; P.mute = m; $('#bMute').textContent = m ? '🔇' : '🔊'; };
$('#bMute').addEventListener('click', () => { setMute(!ZS.sfx.mute); save(); });
const setTheme = t => { document.documentElement.dataset.theme = t; P.theme = t; $('#bTheme').textContent = t === 'night' ? '☀️' : '🌙'; $('meta[name=theme-color]').content = t === 'night' ? '#16151a' : '#fff8fb'; };
$('#bTheme').addEventListener('click', () => { setTheme(document.documentElement.dataset.theme === 'night' ? 'day' : 'night'); save(); });
$('#bMenu').addEventListener('click', () => $('#top').classList.toggle('open'));
setMute(!!P.mute); setTheme(document.documentElement.dataset.theme || 'day');
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
route();
})();
