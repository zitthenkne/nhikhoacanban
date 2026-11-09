/* scenes-core.js — 5 engine SVG thủ tục + bộ tổng hợp âm thanh Web Audio.
   Hợp đồng: ZS.models.<tên>(svg, o) → { update(v) }; v = trạng thái (đã nội suy mượt).
   Mọi cấu trúc có id dữ liệu 'x' → thẻ SVG id="hl-x" (khớp chain[].hl). ZS.idsOf(beat) liệt kê id hợp lệ. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a || {}) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const tx = (p, x, y, s, cls, a) => { const t = el('text', Object.assign({ x, y, class: cls }, a), p); t.textContent = s; return t; };
const fv = (v, ...r) => typeof v === 'function' ? v(...r) : v;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const key = (t, k) => { const i = clamp(Math.floor(t), 0, k.length - 2); return lerp(k[i], k[i + 1], clamp(t - i)); };
const col = c => !c || /^(#|var|color|rgb)/.test(c) ? c : `var(--${c})`;
// Máu: SpO₂ ≤ 60% = xanh (nghèo oxy) → tím (pha) → ≥ 97% = đỏ (giàu oxy)
const mix = s => `color-mix(in srgb,var(--oxy) ${Math.round(clamp((s - .6) / .37) * 100)}%,var(--deo))`;
const hid = id => id ? 'hl-' + id : null;
const n1 = v => +(+v).toFixed(1);
const MID = { 'text-anchor': 'middle' }, END = { 'text-anchor': 'end' };
// Catmull-Rom → Bézier bậc 3 (đường cong mượt qua mọi điểm mẫu)
const smooth = P => P.map((p, i) => { if (!i) return `M${n1(p[0])} ${n1(p[1])}`; const a = P[i - 2] || P[i - 1], b = P[i - 1], d = P[i + 1] || p;
  return `C${n1(b[0] + (p[0] - a[0]) / 6)} ${n1(b[1] + (p[1] - a[1]) / 6)} ${n1(p[0] - (d[0] - b[0]) / 6)} ${n1(p[1] - (d[1] - b[1]) / 6)} ${n1(p[0])} ${n1(p[1])}`; }).join('');
const circ = (cx, cy, r) => `M${n1(cx - r)} ${n1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const setFlow = (p, f) => { const a = Math.abs(f || 0); p.style.display = a < .03 ? 'none' : ''; p.style.animationDuration = n1(1.2 / clamp(a, .15, 3)) + 's'; p.style.strokeWidth = n1(1.5 + 2.5 * clamp(a, 0, 1.5)); p.classList.toggle('rev', f < 0); };
ZS.svg = { el, tx, fv, clamp, lerp, key, col, mix, smooth, circ };
ZS.key = key; ZS.clamp = clamp;

// HUD góc + dấu mộc cảnh báo dùng chung mọi engine
// + decor: hình phụ động [{id,d:v=>path,cls,c,op}] và texts [{at,t,cls,anchor,op}] vẽ đè lên engine
const common = (svg, o) => {
  const dec = (o.decor || []).map(d => ({ d, p: el('path', { id: hid(d.id), class: 'shape ' + (d.cls || ''), style: d.c ? `fill:${col(d.c)}` : null }, svg) }));
  const txs = (o.texts || []).map(t => ({ t, e: tx(svg, 0, 0, '', t.cls || 'oval', { 'text-anchor': t.anchor || 'middle' }) }));
  const [hx, hy, ha] = o.hudAt || [548, 16, 'end'], g = el('g', { class: 'hud' }, svg), rows = [];
  let st;
  if (o.stamp) { const S = o.stamp, [sx, sy] = S.at || [280, 175], w = S.w || 260;
    st = el('g', { class: 'stamp', id: hid(S.id), transform: `translate(${sx} ${sy})` }, svg);
    el('rect', { x: -w / 2, y: -28, width: w, height: S.sub ? 58 : 42, rx: 8, transform: 'rotate(-4)' }, st);
    st.t1 = tx(st, 0, -2, '', 'st1', MID); if (S.sub) st.t2 = tx(st, 0, 20, '', 'st2', MID); }
  return v => {
    dec.forEach(({ d, p }) => { p.setAttribute('d', fv(d.d, v)); if (d.op != null) p.style.opacity = n1(clamp(fv(d.op, v))); });
    txs.forEach(({ t, e }) => { const [x, y] = fv(t.at, v); e.setAttribute('x', n1(x)); e.setAttribute('y', n1(y)); e.textContent = fv(t.t, v); if (t.op != null) e.style.opacity = n1(clamp(fv(t.op, v))); });
    if (o.hud) o.hud(v).forEach(([k, val], i) => { let t = rows[i];
      if (!t) { t = rows[i] = tx(g, hx, hy + i * 18, '', '', { 'text-anchor': ha }); el('tspan', { class: 'hk' }, t); el('tspan', { class: 'hv' }, t); }
      t.firstChild.textContent = k + ' '; t.lastChild.textContent = val; });
    if (st) { st.classList.toggle('on', !!o.stamp.when(v)); st.t1.textContent = fv(o.stamp.text, v); if (st.t2) st.t2.textContent = fv(o.stamp.sub, v); }
  };
};
const models = ZS.models = {};

/* 1 ─ curvePlot: trục 2D, Bézier, dải phân vị/vùng, vạch dọc/ngang, điểm đánh dấu (Beat 1, 4, 15) */
models.curvePlot = (svg, o) => {
  const [X0, Y0, X1, Y1] = o.box || [70, 30, 540, 296], xa = o.x, ya = o.y, lg = ya.log;
  const ym = v => lg ? Math.log10(Math.max(v, ya.min)) : v;
  const sx = v => X0 + (v - xa.min) / (xa.max - xa.min) * (X1 - X0);
  const sy = v => clamp(Y1 - (ym(v) - ym(ya.min)) / (ym(ya.max) - ym(ya.min)) * (Y1 - Y0), Y0 - 4, Y1 + 4);
  const G = el('g', { class: 'plot' }, svg);
  const bands = (o.bands || []).map(b => { const r = el('rect', { id: hid(b.id), x: X0, width: X1 - X0, class: 'band', style: `fill:${col(b.c)}` }, G);
    return { b, r, t: b.label && tx(G, b.left ? X0 + 6 : X1 - 6, 0, b.label, 'blab', b.left ? null : END) }; });
  (xa.ticks || []).forEach(v => { el('line', { x1: sx(v), x2: sx(v), y1: Y0, y2: Y1, class: 'grid' }, G); tx(G, sx(v), Y1 + 15, xa.fmt ? xa.fmt(v) : v, 'tick', MID); });
  (ya.ticks || []).forEach(v => { el('line', { x1: X0, x2: X1, y1: sy(v), y2: sy(v), class: 'grid' }, G); tx(G, X0 - 6, sy(v) + 4, ya.fmt ? ya.fmt(v) : v, 'tick', END); });
  el('path', { d: `M${X0} ${Y0}V${Y1}H${X1}`, class: 'axis' }, G);
  if (xa.label) tx(G, X1, Y1 + 31, xa.label, 'alab', END);
  if (ya.label) tx(G, X0 - 4, Y0 - 9, ya.label, 'alab');
  const vls = (o.vlines || []).map(l => { const g = el('g', { id: hid(l.id), class: 'rl ' + (l.cls || '') }, G); el('line', { y1: Y0, y2: Y1 }, g);
    return { l, g, t: tx(g, 4, l.top ? Y0 + 12 : Y1 - 6, l.label || '', 'vlab') }; });
  const hls = (o.hlines || []).map(l => { const g = el('g', { id: hid(l.id), class: 'rl ' + (l.cls || '') }, G); el('line', { x1: X0, x2: X1 }, g);
    return { l, g, t: tx(g, l.end ? X1 - 3 : X0 + 4, -4, l.label || '', 'vlab', l.end ? END : null) }; });
  const cvs = (o.curves || []).map(c => ({ c, gh: el('path', { class: 'ghostc', style: `stroke:${col(c.c)}` }, G), p: el('path', { id: hid(c.id), class: 'curve ' + (c.cls || ''), style: `stroke:${col(c.c)}` }, G),
    t: c.label && tx(G, 0, 0, c.label, 'clab', { style: `fill:${col(c.c)}` }) }));
  let mk; if (o.marker) { mk = el('g', { id: hid(o.marker.id), class: 'mk' }, G); el('line', { class: 'mkl', x1: 0, y1: 0, x2: 0 }, mk); el('circle', { r: 7 }, mk); }
  const N = o.samples || 64, upd = common(svg, o);
  // Thước đọc giá trị: rê chuột trong khung đồ thị → vạch dọc + giá trị mọi đường cong
  const xh = el('g', { class: 'xh', style: 'display:none' }, G), xt = tx(xh, 0, Y0 + 12, '', 'xhl'); el('line', { y1: Y0, y2: Y1 }, xh);
  const fm = n => String(Math.abs(n) < .1 && n !== 0 ? +n.toPrecision(2) : Math.round(n * 10) / 10).replace('.', ',');
  let lastV = null;
  svg.addEventListener('pointermove', e => { if (!lastV || !svg.getScreenCTM()) return; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse());
    if (q.x < X0 || q.x > X1 || q.y < Y0 || q.y > Y1) { xh.style.display = 'none'; return; } const xv = xa.min + (q.x - X0) / (X1 - X0) * (xa.max - xa.min);
    xh.style.display = ''; xh.setAttribute('transform', `translate(${n1(q.x)} 0)`); xt.setAttribute('text-anchor', q.x > (X0 + X1) / 2 ? 'end' : 'start'); xt.setAttribute('x', q.x > (X0 + X1) / 2 ? -5 : 5);
    xt.textContent = (xa.label ? xa.label.replace(/\s*\(.*/, '') + ' ' : '') + fm(xv) + ' → ' + cvs.map(({ c }) => fm(c.fn(xv, lastV))).join(' · ') + (ya.label ? ' ' + (ya.label.match(/\((.*)\)/) || ['', ''])[1] : ''); });
  svg.addEventListener('pointerleave', () => { xh.style.display = 'none'; });
  return { sx, sy, mark() { cvs.forEach(({ p, gh }) => { gh.setAttribute('d', p.getAttribute('d') || ''); }); }, update(v) { lastV = v;
    bands.forEach(({ b, r, t }) => { const a = sy(fv(b.y1, v)), z = sy(fv(b.y0, v)), top = Math.min(a, z);
      r.setAttribute('y', n1(top)); r.setAttribute('height', n1(Math.abs(z - a))); if (t) t.setAttribute('y', n1(top + 14)); });
    vls.forEach(({ l, g, t }) => { g.setAttribute('transform', `translate(${n1(sx(fv(l.x, v)))} 0)`); if (typeof l.label === 'function') t.textContent = l.label(v); });
    hls.forEach(({ l, g, t }) => { g.setAttribute('transform', `translate(0 ${n1(sy(fv(l.y, v)))})`); if (typeof l.label === 'function') t.textContent = l.label(v); });
    cvs.forEach(({ c, p, t }) => { const P = []; for (let i = 0; i <= N; i++) { const x = xa.min + (xa.max - xa.min) * i / N; P.push([sx(x), sy(c.fn(x, v))]); }
      p.setAttribute('d', c.lin ? 'M' + P.map(q => n1(q[0]) + ' ' + n1(q[1])).join('L') : smooth(P)); if (t) { const lx = c.at ?? xa.min + (xa.max - xa.min) * .12; t.setAttribute('x', n1(sx(lx))); t.setAttribute('y', n1(sy(c.fn(lx, v)) - (c.dy ?? 9))); } });
    if (mk) { const x = sx(fv(o.marker.x, v)), y = sy(fv(o.marker.y, v)); mk.setAttribute('transform', `translate(${n1(x)} ${n1(y)})`); mk.firstChild.setAttribute('y2', n1(Y1 - y)); }
    upd(v);
  } };
};

/* 2 ─ organHydraulic: tim 4 buồng + mạch lớn + shunt thai (Beat 12, 13) | bể dược động học (Beat 7) */
// Tim nhìn thẳng kiểu giải phẫu (trái ảnh = bên PHẢI bé): 2 lá phổi, ĐMC lên – quai – xuống, thân ĐMP chia 2 nhánh,
// TM phổi về nhĩ T, TMC trên/dưới về nhĩ P. Mạch phía trước có viền (casing) để đọc được trước/sau. 2 vòng có nhãn riêng.
const arr = (x, y, a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return `M${n1(x + 7 * c)} ${n1(y + 7 * s)}L${n1(x - 5 * c - 5 * s)} ${n1(y - 5 * s + 5 * c)}L${n1(x - 5 * c + 5 * s)} ${n1(y - 5 * s - 5 * c)}Z`; };
const HP = {
  out: 'M232 116C204 122 194 160 202 196C212 246 262 290 320 306C344 288 368 252 374 212C380 170 362 128 330 116C300 104 260 106 232 116Z',
  ch: { ra: 'M236 126C214 134 208 168 216 198L258 200C262 176 260 146 250 126Z', la: 'M268 122C290 114 324 116 338 128C348 148 346 172 338 188L272 190C266 166 264 144 268 122Z',
    rv: 'M220 208L294 210C296 240 300 268 308 294C276 284 238 258 220 208Z', lv: 'M306 200L344 196C366 214 370 252 352 282C344 294 334 300 322 300C314 270 308 236 306 200Z' },
  CL: { ra: [234, 164, 'Nhĩ P'], la: [314, 156, 'Nhĩ T'], rv: [258, 240, 'Thất P'], lv: [338, 244, 'Thất T'] },
  lungs: [['M150 46C120 40 70 70 48 130C30 180 34 236 52 256C80 268 128 262 160 246C170 210 172 120 150 46Z', 100, 156, 'Phổi phải'],
    ['M410 46C440 40 490 70 512 130C530 180 526 236 508 256C480 268 432 262 400 246C390 210 388 120 410 46Z', 462, 156, 'Phổi trái']],
  fiss: 'M60 150C90 140 130 150 160 136M66 204C100 196 134 206 160 196M500 170C470 160 430 168 402 158',
  V: { pvl: 'M166 176C200 176 240 168 274 160', pvr: 'M398 176C380 172 360 166 340 160', rpa: 'M326 112C290 104 220 112 166 146', ivc: 'M206 324C204 290 208 240 216 202',
    aoD: 'M372 108V324', uv: 'M76 330C130 330 180 324 206 300', aoA: 'M318 200C304 160 282 120 270 96C262 72 290 50 326 50C356 50 372 70 372 110', svc: 'M238 22V128',
    pa: 'M262 208C268 170 292 132 326 112', lpa: 'M326 112C350 112 372 124 398 146', da: 'M338 110C342 92 346 74 350 60' },
  W: { pvl: 9, pvr: 9, rpa: 10, ivc: 15, aoD: 14, uv: 7, aoA: 15, svc: 14, pa: 15, lpa: 10, da: 8 },
  G: { uv: 'nhau', aoA: 'ao', aoD: 'ao', pa: 'pa', lpa: 'pa', da: 'da' }, CASE: { aoA: 1, pa: 1, lpa: 1, svc: 1 },
  L: [['TMC trên', 248, 30, 0], ['TMC dưới', 198, 284, 1], ['ĐMC', 326, 42, 2], ['ĐMP', 362, 102, 2], ['TM phổi', 400, 196, 0]],
  A: arr(238, 118, 90) + arr(215, 208, -80) + arr(172, 144, 150) + arr(392, 141, 35) + arr(268, 161, -5) + arr(346, 161, 185) + arr(372, 316, 90),
};
const HEART_IDS = ['phoi', 'ra', 'la', 'rv', 'lv', 'fo', 'vsd', 'rvot', 'pa', 'ao', 'da', 'svr', 'nhau', 'co-the'];
const heart = (svg, o) => {
  const G = el('g', { class: 'heart' }, svg), ves = {}, flo = {}, grp = {}, nm = k => hid((o.ids && o.ids[k]) || k);
  tx(G, 12, 16, 'VÒNG NHỎ: Thất P → ĐMP → 2 phổi → TM phổi → Nhĩ T', 'circ1');
  const lungs = el('g', { id: nm('phoi') }, G), lg = HP.lungs.map(([d, x, y, n]) => { const g = el('g', null, lungs); el('path', { d, class: 'lung' }, g); tx(g, x, y, n, 'olab', MID); return [g, x, y]; });
  el('path', { d: HP.fiss, class: 'fiss' }, lungs);
  const body = el('g', { id: nm('co-the') }, G); el('rect', { x: 176, y: 324, width: 230, height: 24, rx: 10, class: 'bodyb' }, body);
  tx(body, 291, 341, 'VÒNG LỚN: Thất T → ĐMC → cơ thể → TMC → Nhĩ P', 'circ2', MID);
  const nh = grp.nhau = el('g', { id: nm('nhau') }, G); el('path', { d: circ(58, 330, 16), class: 'plac' }, nh); tx(nh, 58, 306, 'Bánh nhau', 'oval', MID);
  const vessel = k => { const id = HP.G[k], g = id ? (grp[id] = grp[id] || el('g', { id: nm(id) }, G)) : G;
    if (HP.CASE[k]) el('path', { d: HP.V[k], class: 'casing', 'stroke-width': HP.W[k] + 5 }, g);
    ves[k] = el('path', { d: HP.V[k], class: 'ves', 'stroke-width': HP.W[k] }, g); flo[k] = el('path', { d: HP.V[k], class: 'flow' }, g); };
  ['pvl', 'pvr', 'rpa', 'ivc', 'aoD', 'uv'].forEach(vessel);                  // nằm sau tim
  el('path', { d: HP.out, class: 'myo' }, G); el('path', { d: 'M226 140C236 124 262 118 284 120', class: 'shine' }, G);
  const ch = {}, pl = {};
  for (const k in HP.ch) { const g = el('g', { id: nm(k) }, G); ch[k] = el('path', { d: HP.ch[k], class: 'cham ' + (k[1] === 'a' ? 'atr' : 'ven') }, g);
    const [x, y, n] = HP.CL[k]; tx(g, x, y, n, 'olab', MID); pl[k] = tx(g, x, y + 14, '', 'oval', MID); }
  const fo = el('g', { id: nm('fo') }, G), hole = el('rect', { x: 257, y: 146, width: 14, height: 24, rx: 4, class: 'hole' }, fo), flap = el('path', { d: 'M272 172V144', class: 'flap' }, fo);
  flo.fo = el('path', { d: 'M236 158H302', class: 'flow' }, fo);
  el('path', { d: HP.V.pvl, class: 'ghost' }, G); // TM phổi phải đi SAU nhĩ P (nét đứt = phần khuất)
  const vsd = el('g', { id: nm('vsd') }, G), vh = el('rect', { x: 296, y: 230, width: 16, height: 22, rx: 4, class: 'hole' }, vsd); flo.vsd = el('path', { d: 'M262 241H342', class: 'flow' }, vsd);
  ['svc', 'aoA', 'pa', 'lpa', 'da'].forEach(vessel);                         // nằm trước tim
  tx(grp.da, 346, 80, 'ÔĐM', 'oval', END); tx(nh, 112, 340, 'TM rốn', 'oval', MID);
  el('path', { d: HP.A, class: 'arrowh' }, G);
  const rvot = el('g', { id: nm('rvot') }, G), pin = el('path', { class: 'pinch' }, rvot);
  const svr = el('g', { id: nm('svr') }, G), jaw = el('path', { class: 'pinch' }, svr); tx(svr, 386, 296, 'Gập ĐM đùi', 'oval');
  HP.L.forEach(([s, x, y, a]) => tx(G, x, y, s, 'oval', a === 1 ? END : a === 2 ? MID : null));
  const upd = common(svg, o);
  return { update(v) {
    const c = o.calc(v), S = c.sat || {}, F = c.flow || {}, P = c.P || {}, l = clamp(c.lung ?? 1);
    for (const k in HP.ch) { ch[k].style.fill = mix(S[k] ?? .6); pl[k].textContent = P[k] != null ? Math.round(P[k]) + ' mmHg' : ''; }
    const pa = S.pa ?? S.rv, vs = { pvl: S.la, pvr: S.la, rpa: pa, lpa: pa, pa: S.rv, ivc: S.ivc ?? .6, svc: S.svc ?? .55, aoA: S.ao, aoD: S.ao, uv: .9, da: S.da ?? pa };
    for (const k in ves) ves[k].style.stroke = mix(vs[k] ?? .6);
    const fl = { pvl: F.lung, pvr: F.lung, rpa: F.lung, lpa: F.lung, pa: F.pa, ivc: F.ivc ?? .8, svc: F.svc ?? .6, aoA: F.ao ?? 1, aoD: F.body ?? F.ao ?? 1, uv: F.uv || 0, da: F.da, fo: F.fo, vsd: F.vsd };
    for (const k in flo) { setFlow(flo[k], fl[k]); flo[k].style.stroke = `color-mix(in srgb, ${mix(k === 'fo' ? S.ra ?? .6 : k === 'vsd' ? S.rv ?? .6 : vs[k] ?? .6)} 45%, #fff)`; }
    G.style.setProperty('--hb', n1(60 / (c.hr || 120)) + 's'); // nhịp tim → chu chuyển co bóp
    lg.forEach(([g, x, y]) => g.setAttribute('transform', `translate(${x} ${y}) scale(${n1(.62 + .38 * l)}) translate(${-x} ${-y})`));
    const da = clamp(c.da ?? 0); ves.da.setAttribute('stroke-width', n1(1 + 7 * da)); grp.da.style.opacity = n1(.2 + .8 * da);
    const op = clamp(c.fo ?? 0); flap.setAttribute('transform', `rotate(${n1(op * 38)} 272 172)`); hole.style.fill = op > .05 ? mix(S.ra ?? .6) : 'var(--muscle)';
    nh.style.display = c.placenta > .02 ? '' : 'none'; nh.style.opacity = n1(clamp(c.placenta ?? 0)); ves.uv.style.opacity = nh.style.opacity; flo.uv.style.opacity = nh.style.opacity;
    vsd.style.display = c.vsd == null ? 'none' : ''; vh.style.fill = mix(S.rv ?? .6);
    rvot.style.display = c.rvot == null ? 'none' : ''; const gp = 14 * (1 - clamp(c.rvot ?? 0)) + 2;
    pin.setAttribute('d', `M${n1(262 - gp / 2 - 6)} 192v16M${n1(266 + gp / 2 + 6)} 192v16`);
    svr.style.display = c.svr == null ? 'none' : ''; const k = 7 * clamp(c.svr ?? 0); jaw.setAttribute('d', `M${n1(358 + k)} 282v22M${n1(386 - k)} 282v22`);
    upd(v);
  } };
};
const tank = (svg, o) => {
  const G = el('g', { class: 'tank' }, svg), x0 = 50, y0 = 100, y1 = 300, nm = k => hid((o.ids && o.ids[k]) || k);
  const vd = el('g', { id: nm('vd') }, G), wall = el('path', { class: 'tankw' }, vd), vdl = tx(vd, 0, y1 + 20, (o.tl || {}).vd || 'Vd — thể tích phân bố', 'olab', MID);
  const water = el('path', { id: nm('muc'), class: 'water' }, G);
  const ing = el('g', { id: nm('nap') }, G); el('path', { d: 'M120 30V96', class: 'ves', 'stroke-width': 8 }, ing); const inf = el('path', { d: 'M120 30V96', class: 'flow' }, ing); tx(ing, 132, 40, (o.tl || {}).nap || 'Liều nạp', 'olab');
  const cl = el('g', { id: nm('cl') }, G), pipe = el('path', { class: 'ves drain' }, cl), pf = el('path', { class: 'flow' }, cl), cll = tx(cl, 0, 334, (o.tl || {}).cl || 'Cl — độ thanh thải', 'olab', MID);
  const sub = o.plot && models.curvePlot(svg, Object.assign({ box: [392, 50, 545, 296] }, o.plot)), upd = common(svg, o);
  return { update(v) {
    const c = o.calc(v), x1 = x0 + 120 + 150 * clamp(c.vd), lv = y1 - (y1 - y0 - 12) * clamp(c.level), pd = `M${x1} ${y1 - 14}H${x1 + 34}V322`;
    wall.setAttribute('d', `M${x0} ${y0}V${y1}H${n1(x1)}V${y0}`); vdl.setAttribute('x', n1((x0 + x1) / 2));
    water.setAttribute('d', `M${x0 + 3} ${n1(lv)}V${y1 - 3}H${n1(x1 - 3)}V${n1(lv)}Z`);
    pipe.setAttribute('d', pd); pf.setAttribute('d', pd); pipe.setAttribute('stroke-width', n1(3 + 12 * clamp(c.cl))); cll.setAttribute('x', n1(Math.min(x1 + 34, 300)));
    setFlow(pf, clamp(c.cl) * clamp(c.level) * 2); setFlow(inf, c.inflow || 0);
    if (sub) sub.update(v); upd(v);
  }, mark: () => sub && sub.mark() };
};
models.organHydraulic = (svg, o) => o.layout === 'tank' ? tank(svg, o) : heart(svg, o);

/* 3 ─ reflexMechanic: khung xương 2D (chi = chuỗi đoạn có góc), hình biến dạng theo hàm (Beat 14, 16) */
models.reflexMechanic = (svg, o) => {
  const G = el('g', { class: 'mech' }, svg);
  const shp = list => (list || []).map(s => ({ s, p: el('path', { id: hid(s.id), class: 'shape ' + (s.cls || ''), style: s.c ? `fill:${col(s.c)}` : null }, G) }));
  const under = shp(o.shapes);
  const limbs = (o.limbs || []).map(L => { const g = el('g', { id: hid(L.id), class: 'limb ' + (L.cls || '') }, G);
    const segs = L.segs.map(s => el('line', { class: 'bone', 'stroke-width': s.w || 13 }, g)), joints = L.segs.map(() => el('circle', { class: 'joint', r: 3.5 }, g));
    let end, fing; if (L.end === 'hand') { end = el('g', null, g); fing = [-2, -1, 0, 1, 2].map(() => el('line', { class: 'finger' }, end)); el('circle', { r: 8, class: 'palm' }, end); }
    return { L, segs, joints, end, fing }; });
  const over = shp(o.over), labs = (o.labels || []).map(l => ({ l, t: tx(G, 0, 0, '', 'olab ' + (l.cls || ''), Object.assign({ id: hid(l.id) }, l.end ? END : l.mid ? MID : null)) }));
  const upd = common(svg, o);
  return { update(v) {
    under.concat(over).forEach(({ s, p }) => { p.setAttribute('d', fv(s.d, v)); if (s.op) p.style.opacity = n1(clamp(fv(s.op, v))); });
    limbs.forEach(({ L, segs, joints, end, fing }) => { let [x, y] = fv(L.at, v), a = 0;
      segs.forEach((ln, i) => { a = fv(L.segs[i].ang, v); const r = a * Math.PI / 180, nx = x + L.segs[i].len * Math.cos(r), ny = y + L.segs[i].len * Math.sin(r);
        ln.setAttribute('x1', n1(x)); ln.setAttribute('y1', n1(y)); ln.setAttribute('x2', n1(nx)); ln.setAttribute('y2', n1(ny)); joints[i].setAttribute('cx', n1(x)); joints[i].setAttribute('cy', n1(y)); x = nx; y = ny; });
      if (end) { const sp = clamp(fv(L.spread, v) || 0); end.setAttribute('transform', `translate(${n1(x)} ${n1(y)}) rotate(${n1(a)})`);
        fing.forEach((f, i) => { const r = (i - 2) * (8 + 22 * sp) * Math.PI / 180, len = 6 + 9 * sp; f.setAttribute('x2', n1(len * Math.cos(r) + 4)); f.setAttribute('y2', n1(len * Math.sin(r))); }); } });
    labs.forEach(({ l, t }) => { const [x, y] = fv(l.at, v); t.setAttribute('x', n1(x)); t.setAttribute('y', n1(y)); t.textContent = fv(l.t, v); });
    upd(v);
  } };
};

/* 4 ─ synapseCircuit: màng lipid kép, kênh/bơm ion, hạt ion chạy, dao động ký điện thế màng (Beat 9, 10) */
models.synapseCircuit = (svg, o) => {
  const [X0, X1] = o.span || [20, 380], MY = 174, G = el('g', { class: 'syn' }, svg);
  el('rect', { x: X0, y: 12, width: X1 - X0, height: MY - 30, rx: 10, class: 'ecf' }, G); el('rect', { x: X0, y: MY + 18, width: X1 - X0, height: 338 - MY - 18, rx: 10, class: 'icf' }, G);
  tx(G, X0 + 8, 30, o.outLabel || 'Ngoại bào', 'alab'); tx(G, X0 + 8, 330, o.inLabel || 'Nội bào', 'alab');
  let seed = 11; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const pools = (o.pools || []).map(p => { const [a, b, c, d] = p.area;
    return { p, dots: Array.from({ length: p.max || 30 }, () => el('circle', { cx: n1(a + rnd() * (c - a)), cy: n1(b + rnd() * (d - b)), r: 3.2, class: 'ion ' + (p.cls || '') }, G)) }; });
  const mem = el('g', { id: hid(o.memId), class: 'mem' }, G);
  for (let x = X0 + 6; x < X1; x += 11) { el('path', { d: `M${x} ${MY - 8}v6M${x} ${MY + 8}v-6`, class: 'tail' }, mem); el('circle', { cx: x, cy: MY - 11, r: 4.2, class: 'head' }, mem); el('circle', { cx: x, cy: MY + 11, r: 4.2, class: 'head' }, mem); }
  const chans = (o.chans || []).map(c => { const g = el('g', { id: hid(c.id), class: 'chan' }, G); let gate;
    if (c.kind === 'pump') el('ellipse', { cx: c.x, cy: MY, rx: 20, ry: 25, class: 'pump' }, g);
    else { el('rect', { x: c.x - 18, y: MY - 24, width: 12, height: 48, rx: 6, class: 'sub' }, g); el('rect', { x: c.x + 6, y: MY - 24, width: 12, height: 48, rx: 6, class: 'sub' }, g); gate = el('rect', { x: c.x - 6, y: MY - 22, width: 12, height: 10, rx: 3, class: 'gate' }, g); }
    tx(g, c.x, MY - 44, c.label, 'olab', MID); const sb = c.sub && tx(g, c.x, MY - 31, '', 'oval', MID);
    const ions = [0, 1, 2].map(i => el('circle', { cx: c.x, cy: MY, r: 3.6, class: 'ion mv ' + (c.cls || ''), style: `animation-delay:${-i * .4}s` }, g));
    return { c, g, gate, ions, sb }; });
  const sub = o.plot && models.curvePlot(svg, Object.assign({ box: [418, 36, 545, 296] }, o.plot)), upd = common(svg, o);
  return { update(v) {
    pools.forEach(({ p, dots }) => { const n = Math.round(fv(p.n, v)); dots.forEach((d, i) => d.style.display = i < n ? '' : 'none'); });
    chans.forEach(({ c, g, gate, ions, sb }) => { const f = fv(c.flux, v) || 0, a = Math.abs(f);
      ions.forEach(d => { d.style.display = a < .05 ? 'none' : ''; d.classList.toggle('out', f < 0); d.style.animationDuration = n1(1.6 / clamp(a, .2, 2)) + 's'; });
      if (gate) gate.setAttribute('transform', `translate(0 ${n1(-18 * clamp(fv(c.open, v) || 0))})`);
      if (c.act) g.style.opacity = n1(.3 + .7 * clamp(fv(c.act, v))); if (sb) sb.textContent = fv(c.sub, v); });
    if (sub) sub.update(v); upd(v);
  }, mark: () => sub && sub.mark() };
};

/* 5 ─ matrixGrid: hàng × trục thời gian — thanh mốc kiểu Denver II hoặc ô heatmap (Beat 2, 3, 6) */
models.matrixGrid = (svg, o) => {
  const [X0, Y0, X1, Y1] = o.box || [128, 40, 548, 296], R = o.rows, rh = (Y1 - Y0) / R.length, xa = o.x || { min: 0, max: 1 }, G = el('g', { class: 'mtx' }, svg);
  const sx = v => X0 + (v - xa.min) / (xa.max - xa.min) * (X1 - X0);
  R.forEach((r, i) => { const g = el('g', { id: hid(r.id) }, G); el('rect', { x: X0, y: Y0 + i * rh, width: X1 - X0, height: rh, class: 'row' + (i % 2) }, g);
    tx(g, X0 - 8, Y0 + i * rh + rh / 2 + 4, r.label, 'olab', END); });
  (xa.ticks || []).forEach(t => { el('line', { x1: sx(t), x2: sx(t), y1: Y0, y2: Y1, class: 'grid' }, G); tx(G, sx(t), Y1 + 15, xa.fmt ? xa.fmt(t) : t, 'tick', MID); });
  if (xa.label) tx(G, X1, Y1 + 31, xa.label, 'alab', END);
  const C = o.cols || [], cw = (X1 - X0) / (C.length || 1);
  C.forEach((c, j) => tx(G, X0 + cw * j + cw / 2, Y0 - 8, c.label, 'tick', MID));
  const cells = o.cell ? R.map((r, i) => C.map((c, j) => { const g = el('g', null, G); el('rect', { x: n1(X0 + cw * j + 2), y: n1(Y0 + i * rh + 2), width: n1(cw - 4), height: n1(rh - 4), rx: 6, class: 'cell' }, g);
    return { g, t: tx(g, n1(X0 + cw * j + cw / 2), n1(Y0 + i * rh + rh / 2 + 4), '', 'oval', MID) }; })) : [];
  const BH = o.barH || 18, bars = (o.bars || []).map(b => { const y = Y0 + b.row * rh + 9 + (b.lane || 0) * (BH + 8), g = el('g', { id: hid(b.id), class: 'bar' }, G);
    el('rect', { x: n1(sx(b.a)), y, width: n1(sx(b.b) - sx(b.a)), height: BH, rx: 5, class: 'b1' }, g);
    if (b.c != null) el('rect', { x: n1(sx(b.c)), y, width: n1(sx(b.b) - sx(b.c)), height: BH, rx: 5, class: 'b2' }, g);
    if (b.rf) el('path', { d: `M${n1(sx(b.rf))} ${y - 3}l5 -7h-10Z`, class: 'rf' }, g);
    tx(g, n1(sx(b.a) + 4), y + BH - 5, b.label, 'blab2'); return { b, g }; });
  let cur; if (o.cursor) { cur = el('g', { id: hid(o.cursor.id), class: 'cur' }, G); el('line', { y1: Y0 - 4, y2: Y1 }, cur); cur.t = tx(cur, 0, Y0 - 8, '', 'vlab', MID); }
  const upd = common(svg, o);
  return { sx, update(v) {
    bars.forEach(({ b, g }) => g.setAttribute('class', 'bar ' + (o.barState ? o.barState(v, b) || '' : '')));
    cells.forEach((row, i) => row.forEach(({ g, t }, j) => { g.setAttribute('class', 'cl-' + (o.cell(v, i, j) || '')); t.textContent = o.cellText ? o.cellText(v, i, j) : ''; }));
    if (cur) { const x = sx(fv(o.cursor.x, v)); cur.setAttribute('transform', `translate(${n1(x)} 0)`); cur.t.textContent = fv(o.cursor.label, v);
      cur.t.setAttribute('text-anchor', x > X1 - 30 ? 'end' : x < X0 + 30 ? 'start' : 'middle'); }
    upd(v);
  } };
};

// Liệt kê id hợp lệ của một beat (cho chain[].hl và QA kiểm tra mồ côi)
ZS.idsOf = b => { const s = new Set(), walk = x => { if (!x || typeof x !== 'object') return; if (typeof x.id === 'string') s.add(x.id); Object.values(x).forEach(walk); };
  walk(b.ui); if (b.ui.memId) s.add(b.ui.memId);
  if (b.ui.model === 'organHydraulic') (b.ui.layout === 'tank' ? ['vd', 'muc', 'nap', 'cl'] : HEART_IDS).forEach(i => s.add((b.ui.ids && b.ui.ids[i]) || i));
  return [...s]; };

/* Web Audio thuần: T1–T2 rơi cao độ, âm thổi = bạch âm lọc bandpass, stridor = răng cưa thì hít vào */
let AC, mute = false;
const ac = () => { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; };
const tone = (f0, f1, dur, type = 'sine', vol = .2, at = 0) => { if (mute) return; const c = ac(), t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02); };
const noise = (dur, lo, hi, vol, at = 0) => { if (mute) return; const c = ac(), t = c.currentTime + at, n = c.sampleRate * dur | 0, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = Math.sqrt(lo * hi); f.Q.value = f.frequency.value / (hi - lo);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .3); g.gain.linearRampToValueAtTime(.0001, t + dur); s.connect(f).connect(g).connect(c.destination); s.start(t); };
ZS.sfx = {
  get mute() { return mute; }, set mute(x) { mute = !!x; },
  tick: () => tone(1400, 900, .03, 'triangle', .05),
  ok: () => { tone(660, 660, .12, 'sine', .1); tone(880, 880, .14, 'sine', .1, .09); },
  err: () => tone(220, 150, .18, 'square', .05),
  heart(g = 1, murmur = 0, t1 = 1, t2 = 1) { if (g < .02) return; tone(120, 40, .12, 'sine', .5 * g * t1 + .001); if (murmur > .02) noise(.22, 400, 800, .14 * g * murmur, .09); tone(95, 35, .1, 'sine', .38 * g * t2 + .001, .34); },
  stridor: (g = 1) => tone(450, 430, .6, 'sawtooth', .05 * g),
};
ZS.buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* iOS không hỗ trợ */ } };
})();
