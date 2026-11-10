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

/* 2 ─ organHydraulic: tim giải phẫu (Beat 12, 13) | bể dược động học (Beat 7) */
// Tim cắt đứng ngang, nhìn trước (trái ảnh = bên PHẢI bé). 2 phổi: cây tiểu ĐM phổi (cỡ = kháng lực phổi) + cây TM phổi.
// Vẽ từ sau ra trước: phổi → mạch sau tim (ĐMP P, TMC dưới, ĐMC xuống, TM phổi) → cơ tim/buồng/van → mạch trước tim có viền
// (TMC trên, ĐMC lên–quai, thân ĐMP, ĐMP T, ÔĐM). o.fo: lỗ bầu dục + đồng hồ 2 kim + bánh nhau/kẹp rốn. o.tof: 4 thành phần Fallot + chân bé.
const arr = (x, y, a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return `M${n1(x + 7 * c)} ${n1(y + 7 * s)}L${n1(x - 5 * c - 5 * s)} ${n1(y - 5 * s + 5 * c)}L${n1(x - 5 * c + 5 * s)} ${n1(y - 5 * s - 5 * c)}Z`; };
// cây mạch phổi: nhánh chính rốn phổi → đích, mỗi nhánh 2 cành con
const tree = ([hx, hy], pts) => pts.map(([x, y]) => { const px = hx + (x - hx) * .58, py = hy + (y - hy) * .58, dx = (x - hx) * .34, dy = (y - hy) * .34, tw = a => { const r = a * Math.PI / 180;
  return `M${n1(px)} ${n1(py)}l${n1(dx * Math.cos(r) - dy * Math.sin(r))} ${n1(dx * Math.sin(r) + dy * Math.cos(r))}`; };
  return `M${hx} ${hy}Q${n1((hx + x) / 2)} ${n1((hy + y) / 2 - 6)} ${x} ${y}` + tw(32) + tw(-32); }).join('');
const mir = P => P.map(([x, y]) => [560 - x, y]);
const RA_T = [[118, 78], [74, 116], [56, 166], [80, 218], [126, 240]], RV_T = [[100, 112], [62, 150], [66, 204], [110, 250], [146, 228]];
const HP = {
  lungs: [{ d: 'M150 50C116 40 66 66 46 124C30 172 32 232 50 258C80 272 132 266 166 248C176 214 178 178 172 150C170 112 166 74 150 50Z', c: [104, 158],
    fiss: 'M44 150C86 140 128 150 172 142M50 246C90 216 128 196 170 190', art: tree([170, 146], RA_T), vei: tree([170, 176], RV_T), lab: [104, 64, 'Phổi phải'], grip: [34, 160, -1] },
  { d: 'M410 50C444 40 494 66 514 124C530 172 528 232 510 258C480 272 432 268 404 252C414 236 414 212 398 200C386 186 384 166 388 150C390 112 394 74 410 50Z', c: [456, 158],
    fiss: 'M394 98C436 132 478 176 518 212', art: tree([390, 146], mir(RA_T)), vei: tree([390, 176], mir(RV_T)), lab: [456, 64, 'Phổi trái'], grip: [526, 160, 1] }],
  out: 'M214 132C200 140 196 170 198 196C200 226 212 260 236 282C264 304 310 318 340 314C362 302 372 270 372 234C372 198 366 168 356 148C346 128 324 120 300 122C270 122 236 120 214 132Z',
  outT: 'M214 132C200 140 196 170 198 196C200 226 208 254 228 274C252 296 296 304 328 296C354 288 372 262 372 232C372 198 366 168 356 148C346 128 324 120 300 122C270 122 236 120 214 132Z',
  ch: { ra: 'M216 142C206 156 206 184 212 208L258 210C260 186 260 160 256 138C242 132 226 134 216 142Z', la: 'M280 134C296 128 326 128 344 138C356 152 358 176 350 196L282 198C280 178 278 156 280 134Z',
    rv: 'M212 218L294 220C296 248 304 278 318 302C282 298 236 272 212 218Z', lv: 'M306 208L352 204C366 224 368 262 354 290C346 302 336 308 328 306C318 274 310 242 306 208Z' },
  chT: { rv: 'M222 226L288 228C290 248 296 268 302 282C278 276 240 258 222 226Z', lv: 'M314 216L350 212C362 230 362 258 350 278C344 288 338 292 332 290C324 264 318 240 314 216Z' },
  CL: { ra: [222, 152, 'Nhĩ P'], la: [334, 172, 'Nhĩ T'], rv: [254, 258, 'Thất P'], lv: [338, 262, 'Thất T'] }, CLT: { rv: [256, 254], lv: [336, 256] },
  valve: 'M216 212Q222 226 232 224M258 212Q252 226 242 224M312 204Q318 216 326 214M350 202Q344 214 334 214',
  V: { svc: 'M234 10V140', ivc: 'M200 338C198 300 198 262 202 236C204 222 210 212 218 206', aoD: 'M388 92V322', br: 'M300 52L294 12M322 44L322 10M344 44L352 12',
    aoA: 'M306 212C302 186 292 156 284 126C278 102 278 80 288 62C302 40 348 34 372 50C384 60 388 76 388 96',
    aoAT: 'M300 230C298 192 292 156 284 126C278 102 278 80 288 62C302 40 348 34 372 50C384 60 388 76 388 96',
    pa: 'M284 224C292 196 304 168 318 146C326 132 334 118 340 106', paT: 'M262 236C276 210 302 172 318 146C326 132 334 118 340 106',
    lpa: 'M340 106C358 104 378 114 398 132', rpa: 'M340 106C310 104 262 108 226 118C204 124 186 134 170 146', da: 'M348 104C352 90 360 74 370 58',
    pvR: 'M172 176C200 172 228 166 256 164', pvL: 'M392 176C378 172 364 170 352 168', uv: 'M70 322C120 324 170 316 201 298',
    fo: 'M216 204C236 198 256 192 300 186', vsd: 'M262 240C280 236 296 228 300 214', fem: 'M388 322C390 332 400 334 414 330' },
  W: { svc: 14, ivc: 15, aoD: 13, br: 6, aoA: 15, aoAT: 19, pa: 15, paT: 11, lpa: 10, rpa: 10, da: 8, pvR: 9, pvL: 9, uv: 7 },
  A: { svc: [234, 116, 90], ivc: [200, 262, -90], aoD: [388, 290, 90], lpa: [390, 126, 40], rpa: [184, 138, 150], pvR: [190, 174, -10], pvL: [370, 170, 190], pa: [330, 126, -62] },
};
const HEART_IDS = ['phoi', 'pvr', 'ra', 'la', 'rv', 'lv', 'fo', 'gauge', 'vsd', 'rvot', 'pa', 'ao', 'da', 'svr', 'nhau', 'co-the'];
const GZ = [260, 152], gAng = p => (135 + 270 * clamp(p / 8)) * Math.PI / 180; // đồng hồ 0–8 mmHg, quét 270°
const heart = (svg, o) => {
  const G = el('g', { class: 'heart' + (o.tof ? ' tof' : '') }, svg), ves = {}, flo = {}, grp = {}, nm = k => hid((o.ids && o.ids[k]) || k), T = !!o.tof;
  const gOf = id => grp[id] = grp[id] || el('g', { id: nm(id) }, G);
  const vessel = (k, id, cas, d) => { const g = id ? gOf(id) : G, p = d || HP.V[k];
    if (cas) el('path', { d: p, class: 'casing', 'stroke-width': HP.W[k] + 5 }, g);
    ves[k] = el('path', { d: p, class: 'ves', 'stroke-width': HP.W[k] }, g); flo[k] = el('path', { d: p, class: 'flow' }, g);
    if (HP.A[k]) el('path', { d: arr(...HP.A[k]), class: 'arrowh' }, g); };
  tx(G, 12, 18, 'VÒNG NHỎ · phổi', 'circ1');
  // ① phổi: nhu mô + cây tiểu ĐM (id pvr) + cây TM phổi; cả lá phổi phồng theo c.lung
  const lungs = gOf('phoi'), pvr = el('g', { id: nm('pvr') }, G), LG = HP.lungs.map(L => { const g = el('g', null, lungs);
    const body = el('path', { d: L.d, class: 'lung' }, g); el('path', { d: L.fiss, class: 'fiss' }, g);
    const vei = el('path', { d: L.vei, class: 'tree' }, g), art = el('path', { d: L.art, class: 'tree' }, g);
    tx(g, L.lab[0], L.lab[1], L.lab[2], 'olab', MID);
    if (o.fo) { const [x, y, sd] = L.grip, gr = el('g', { class: 'grip' }, g); el('rect', { x: x - 7, y: y - 22, width: 14, height: 44, rx: 7 }, gr);
      el('path', { d: `M${x - 2 * sd} ${y - 6}l${5 * sd} 6l${-5 * sd} 6`, class: 'chev' }, gr); }
    return { L, g, body, vei, art }; });
  pvr.remove(); lungs.appendChild(pvr); LG.forEach(l => pvr.appendChild(l.art)); // tiểu ĐM phổi gom 1 nhóm để neo #hl
  // ② vòng lớn: khối cơ thể; bánh nhau + dây rốn (thai)
  const body = gOf('co-the'); el('rect', { x: 196, y: 320, width: 200, height: 26, rx: 12, class: 'bodyb' }, body);
  tx(body, 296, 337, 'VÒNG LỚN · cơ thể', 'circ2', MID);
  let nh, clamp1, clamp2;
  if (o.fo) { nh = gOf('nhau'); el('path', { d: circ(50, 322, 19), class: 'plac' }, nh); el('path', { d: 'M38 314q8 6 4 16M52 306q-2 10 8 14M44 334q10-4 18 2', class: 'placl' }, nh);
    tx(nh, 50, 296, 'Bánh nhau', 'oval', MID); vessel('uv', 'nhau'); tx(nh, 112, 340, 'TM rốn', 'oval', MID);
    const k = el('g', { class: 'clamp' }, G); clamp1 = el('rect', { x: 126, y: 306, width: 7, height: 13, rx: 2 }, k); clamp2 = el('rect', { x: 126, y: 327, width: 7, height: 13, rx: 2 }, k); }
  // ③ mạch sau tim
  vessel('rpa'); vessel('ivc'); vessel('aoD'); vessel('pvR'); vessel('pvL');
  // ④ cơ tim, buồng, vách, van
  el('path', { d: T ? HP.outT : HP.out, class: 'myo' }, G); el('path', { d: 'M222 140C234 128 262 124 284 126', class: 'shine' }, G);
  const ch = {}, pl = {};
  for (const k in HP.ch) { const g = gOf(k), d = T && HP.chT[k] || HP.ch[k]; ch[k] = el('path', { d, class: 'cham ' + (k[1] === 'a' ? 'atr' : 'ven') }, g);
    const [x0, y0, n] = HP.CL[k], [x, y] = T && HP.CLT[k] || [x0, y0]; tx(g, x, y, n, 'olab big', MID); pl[k] = tx(g, x, y + 14, '', 'oval', MID); }
  el('path', { d: HP.valve, class: 'valve' }, G);
  const gh = el('path', { d: 'M200 178C224 177 254 175 282 170', class: 'ghost' }, G); // TM phổi P đi SAU nhĩ P vào nhĩ T (nét đứt = khuất)
  let flap, hole, ndl;
  if (o.fo) { const f = gOf('fo'); hole = el('rect', { x: 258, y: 178, width: 22, height: 26, rx: 6, class: 'hole' }, f);
    flo.fo = el('path', { d: HP.V.fo, class: 'flow' }, f); flap = el('path', { d: 'M282 206V170', class: 'flap' }, f); el('circle', { cx: 282, cy: 206, r: 2.6, class: 'hinge' }, f); }
  let vh;
  if (T) { const g = gOf('vsd'); vh = el('rect', { x: 290, y: 212, width: 20, height: 24, rx: 6, class: 'hole' }, g); flo.vsd = el('path', { d: HP.V.vsd, class: 'flow' }, g); }
  // ⑤ mạch trước tim (có viền)
  vessel('svc', null, 1); vessel(T ? 'aoAT' : 'aoA', 'ao', 1); el('path', { d: HP.V.br, class: 'casing', 'stroke-width': 10 }, grp.ao); ves.br = el('path', { d: HP.V.br, class: 'ves', 'stroke-width': 6 }, grp.ao);
  el('path', { d: T ? 'M291 222Q300 214 309 222' : 'M297 204Q305 196 313 202', class: 'valve' }, grp.ao);
  vessel(T ? 'paT' : 'pa', 'pa', 1); vessel('lpa', 'pa', 1); vessel('da', 'da', 1);
  el('path', { d: 'M310 152Q318 140 326 152', class: 'valve' }, grp.pa);
  // ⑥ bộ phận máy: đồng hồ 2 kim trên vách liên nhĩ (fo) · vòng cơ phễu + chân bé (tof)
  if (o.fo) { const g = gOf('gauge'), [cx, cy] = GZ;
    el('path', { d: `M${cx - 7} ${cy + 12}L246 184M${cx + 7} ${cy + 12}L288 182`, class: 'tap' }, g); el('circle', { cx: 246, cy: 184, r: 2.4, class: 'tapd' }, g); el('circle', { cx: 288, cy: 182, r: 2.4, class: 'tapd' }, g);
    el('circle', { cx, cy, r: 15.5, class: 'gz-b' }, g); el('circle', { cx, cy, r: 12.6, class: 'gz-f' }, g);
    let tk = ''; for (let p = 0; p <= 8; p++) { const a = gAng(p), r0 = p % 2 ? 10.6 : 9.4; tk += `M${n1(cx + r0 * Math.cos(a))} ${n1(cy + r0 * Math.sin(a))}L${n1(cx + 12 * Math.cos(a))} ${n1(cy + 12 * Math.sin(a))}`; }
    el('path', { d: tk, class: 'gz-t' }, g);
    ndl = ['ra', 'la'].map(k => el('line', { x1: cx, y1: cy, x2: cx, y2: cy - 10, class: 'gz-n ' + k }, g)); el('circle', { cx, cy, r: 2.2, class: 'gz-p' }, g); }
  let jaws, leg;
  if (T) { const g = gOf('rvot'), P = [269, 223], u = [.474, -.881], q = [.881, .474]; // vòng cơ phễu ở đường ra thất P, dưới van ĐMP
    jaws = [-1, 1].map(sd => { const j = el('rect', { x: -5, y: -10, width: 10, height: 20, rx: 5, class: 'jaw' }, g); return { j, sd }; });
    const gr = el('g', { class: 'grip' }, g); el('ellipse', { cx: P[0], cy: P[1], rx: 22, ry: 15, transform: `rotate(28 ${P[0]} ${P[1]})` }, gr);
    el('path', { d: `M${P[0] - 30} ${P[1] + 4}l-6 -4 6 -4M${P[0] + 30} ${P[1] - 4}l6 4 -6 4`, class: 'chev' }, gr);
    jaws.P = P; jaws.u = u; jaws.q = q;
    const s = gOf('svr'); leg = { pel: el('path', { d: 'M414 318C422 312 438 312 446 318L448 340C438 346 422 346 414 340Z', class: 'skinp' }, s),
      th: el('line', { class: 'limbs', 'stroke-width': 17 }, s), sh: el('line', { class: 'limbs', 'stroke-width': 13 }, s), ft: el('ellipse', { rx: 6, ry: 9, class: 'skinp' }, s),
      art: el('path', { class: 'ves', 'stroke-width': 5 }, s), af: el('path', { class: 'flow' }, s), kink: el('path', { class: 'pinch' }, s),
      grip: el('circle', { r: 13, class: 'grip' }, s), lab: tx(s, 470, 300, '', 'oval', MID) }; }
  // ⑦ nhãn mạch
  [['TMC trên', 244, 24, 0], ['TMC dưới', 194, 262, 1], ['ĐMC', 272, 86, 1], ['ĐMP', 352, 142, 0], ['TM phổi', 398, 194, 0]].concat(o.fo ? [['ÔĐM', 352, 82, 1]] : [])
    .forEach(([s, x, y, a]) => tx(G, x, y, s, 'oval', a ? END : null));
  const upd = common(svg, o);
  return { update(v) {
    const c = o.calc(v), S = c.sat || {}, F = c.flow || {}, P = c.P || {}, l = clamp(c.lung ?? 1), cal = clamp(c.cal ?? .6);
    for (const k in ch) { ch[k].style.fill = mix(S[k] ?? .6); pl[k].textContent = P[k] != null ? n1(P[k]).toString().replace('.', ',') + ' mmHg' : ''; }
    const pa = S.pa ?? S.rv ?? .6, pv = S.pv ?? S.la ?? .97, ao = S.ao ?? .97;
    const vs = { svc: S.svc ?? .55, ivc: S.ivc ?? .6, aoA: ao, aoAT: ao, br: ao, aoD: S.aoD ?? ao, pa, paT: pa, lpa: pa, rpa: pa, pvR: pv, pvL: pv, uv: S.uv ?? .85, da: (F.da || 0) >= 0 ? pa : ao, fem: S.aoD ?? ao };
    for (const k in ves) ves[k].style.stroke = mix(vs[k] ?? .6);
    gh.style.stroke = mix(pv);
    const fl = { pvR: F.lung, pvL: F.lung, rpa: F.lung, lpa: F.lung, pa: F.pa, paT: F.pa, ivc: F.ivc ?? .8, svc: F.svc ?? .6, aoA: F.ao ?? 1, aoAT: F.ao ?? 1, aoD: F.body ?? F.ao ?? 1, uv: F.uv || 0, da: F.da, fo: F.fo, vsd: F.vsd, fem: F.fem ?? 0 };
    for (const k in flo) { setFlow(flo[k], fl[k]); flo[k].style.stroke = `color-mix(in srgb, ${mix(k === 'fo' ? S.ivc ?? .6 : k === 'vsd' ? (F.vsd || 0) >= 0 ? S.rv ?? .6 : S.lv ?? .97 : vs[k] ?? .6)} 40%, #fff)`; }
    G.style.setProperty('--hb', n1(60 / (c.hr || 120)) + 's');
    // phổi: phồng + sáng màu theo l (dịch → khí); tiểu ĐM giãn theo cal; TM phổi dày theo dòng phổi
    LG.forEach(({ L, g, body: b, vei, art }) => { const [x, y] = L.c, tf = `translate(${x} ${y}) scale(${n1(.74 + .26 * l)}) translate(${-x} ${-y})`; g.setAttribute('transform', tf); art.setAttribute('transform', tf);
      b.style.fill = `color-mix(in srgb, var(--pink) ${Math.round(40 + 60 * l)}%, var(--pink-d))`;
      art.style.stroke = mix(pa); art.style.strokeWidth = n1(.9 + 3.4 * cal); vei.style.stroke = mix(pv); vei.style.strokeWidth = n1(.9 + 2.6 * clamp(F.lung ?? .5)); });
    const da = clamp(c.da ?? 0); ves.da.setAttribute('stroke-width', n1(1.5 + 6.5 * da)); grp.da.style.opacity = n1(.35 + .65 * da);
    if (flap) { const op = clamp(c.fo ?? 0); flap.setAttribute('transform', `rotate(${n1(op * 40)} 282 206)`); hole.style.fill = op > .05 ? mix(S.ivc ?? .6) : 'var(--muscle)'; }
    if (ndl) { const [cx, cy] = GZ; ndl.forEach((n, i) => { const a = gAng((c.gauge || P)[i ? 'la' : 'ra'] ?? 0); n.setAttribute('x2', n1(cx + 10.5 * Math.cos(a))); n.setAttribute('y2', n1(cy + 10.5 * Math.sin(a))); }); }
    if (nh) { const p = clamp(c.placenta ?? 0); nh.style.opacity = n1(.25 + .75 * p); const k = clamp(c.clamp ?? 0);
      clamp1.setAttribute('transform', `translate(0 ${n1(6 * k)})`); clamp2.setAttribute('transform', `translate(0 ${n1(-6 * k)})`); clamp1.parentNode.style.opacity = n1(.35 + .65 * k); }
    if (vh) vh.style.fill = mix((F.vsd || 0) >= 0 ? S.rv ?? .6 : S.lv ?? .97);
    if (jaws) { const s = clamp(c.rvot ?? 0), gap = 13 * (1 - .85 * s), [px, py] = jaws.P, [qx, qy] = jaws.q;
      jaws.forEach(({ j, sd }) => { const d = sd * (gap / 2 + 5); j.setAttribute('transform', `translate(${n1(px + qx * d)} ${n1(py + qy * d)}) rotate(28)`); }); }
    if (leg) { const k = clamp(c.svr ?? 0), H = [430, 328], A = -80 * k * Math.PI / 180, B = A + 150 * k * Math.PI / 180; // gập háng 80°, gập gối 150°
      const K = [H[0] + 60 * Math.cos(A), H[1] + 60 * Math.sin(A)], F2 = [K[0] + 54 * Math.cos(B), K[1] + 54 * Math.sin(B)];
      const ln = (e, a, b) => { e.setAttribute('x1', n1(a[0])); e.setAttribute('y1', n1(a[1])); e.setAttribute('x2', n1(b[0])); e.setAttribute('y2', n1(b[1])); };
      ln(leg.th, H, K); ln(leg.sh, K, F2); leg.ft.setAttribute('transform', `translate(${n1(F2[0])} ${n1(F2[1])}) rotate(${n1(B * 180 / Math.PI)})`);
      const ox = Math.sin(A) * 4, oy = -Math.cos(A) * 4, ad = `M388 322C392 332 410 334 ${n1(H[0] + ox)} ${n1(H[1] + oy)}L${n1(K[0] + ox)} ${n1(K[1] + oy)}`;
      leg.art.setAttribute('d', ad); leg.af.setAttribute('d', ad); leg.art.style.stroke = mix(vs.fem); leg.af.style.stroke = `color-mix(in srgb, ${mix(vs.fem)} 40%, #fff)`;
      leg.art.setAttribute('stroke-width', n1(5 - 2.5 * k)); setFlow(leg.af, (F.body ?? 1) * (1 - .6 * k));
      leg.kink.setAttribute('d', k > .2 ? `M422 ${n1(312 - 2 * k)}l7 7M436 ${n1(312 - 2 * k)}l-7 7` : ''); leg.kink.style.opacity = n1(k);
      leg.grip.setAttribute('cx', n1(K[0])); leg.grip.setAttribute('cy', n1(K[1])); leg.lab.textContent = k > .5 ? 'Gập háng → gập ĐM đùi' : 'Kéo gối lên';
      leg.lab.setAttribute('x', n1(k > .5 ? 494 : K[0])); leg.lab.setAttribute('y', n1(k > .5 ? 300 : K[1] - 20)); }
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
