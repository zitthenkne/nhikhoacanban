/* steth.js — 🩺 Ống nghe ảo (#/nghe): kéo đầu nghe Littmann trên lồng ngực; âm tổng hợp Web Audio (ZS.sfx) to dần khi vào đúng ổ,
   rung haptic 10 ms khi chạm ổ mới; lẫy Màng (âm cao: âm thổi, stridor) / Chuông (âm trầm: T1, T2). */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {}, V = ZS.views = ZS.views || {};
const NS = 'http://www.w3.org/2000/svg';
// Ổ nghe (trái ảnh = bên PHẢI bé). t1/t2: độ trội tiếng tim; mur: ổ nghe rõ âm thổi hẹp phổi (Fallot)
const ZONES = [
  { id: 'dmc', x: 252, y: 128, n: 'Ổ van ĐMC (KLS 2 bờ phải xương ức)', t1: .6, t2: 1.2 },
  { id: 'dmp', x: 308, y: 128, n: 'Ổ van ĐMP (KLS 2 bờ trái xương ức)', t1: .6, t2: 1.2, mur: 1 },
  { id: 'ba-la', x: 294, y: 214, n: 'Ổ van 3 lá (KLS 4–5 bờ trái xương ức)', t1: 1.1, t2: .7 },
  { id: 'hai-la', x: 352, y: 232, n: 'Mỏm tim – van 2 lá (KLS 5 trung đòn trái)', t1: 1.3, t2: .6 },
  { id: 'khi-quan', x: 280, y: 52, n: 'Khí quản (cổ)', t1: .2, t2: .2, air: 1 },
];
const PTS = [
  { k: 'thuong', n: 'Trẻ bình thường', mur: 0, str: 0 },
  { k: 'fallot', n: 'Tứ chứng Fallot', mur: 1, str: 0, hint: 'Âm thổi tâm thu tống máu rõ nhất ở **ổ van ĐMP**.' },
  { k: 'croup', n: 'Viêm thanh khí phế quản', mur: 0, str: 1, hint: 'Thở rít thì **hít vào**, nghe rõ ở **khí quản**.' },
];
V.nghe = el => {
  let pt = 0, bell = 0, x = 280, y = 300, last = null, tm = 0, n = 0;
  el.innerHTML = `<section class="steth"><div class="fig card"><div class="art"><svg viewBox="0 0 560 350" role="img" aria-label="Lồng ngực trẻ em và đầu ống nghe">
  <path class="torso" d="M200 40H360L372 80C420 92 452 120 460 170L470 340H90L100 170C108 120 140 92 188 80Z"/>
  <path class="ribs" d="${[100, 140, 180, 220, 260].map(r => `M150 ${r}C200 ${r - 18} 240 ${r - 10} 270 ${r - 6}M290 ${r - 6}C320 ${r - 10} 360 ${r - 18} 410 ${r}`).join('')}"/>
  <path class="stern" d="M270 84H290V260L280 274L270 260Z"/><path class="clav" d="M180 86C220 78 250 84 270 88M290 88C310 84 340 78 380 86"/>
  ${ZONES.map(z => `<g id="hl-${z.id}" class="zone"><circle cx="${z.x}" cy="${z.y}" r="17"/></g>`).join('')}
  <path class="tube" d=""/><g class="head"><circle r="19" class="hd1"/><circle r="11" class="hd2"/></g>
  <text class="zlab" x="280" y="336" text-anchor="middle">Kéo đầu ống nghe lên lồng ngực</text></svg></div>
  <div class="pcgbox"><small>Tâm thanh đồ</small><svg class="pcg" viewBox="0 0 500 64" preserveAspectRatio="none" aria-label="Tâm thanh đồ theo nhịp"><path class="pcgbase" d="M0 32H500"/><path class="pcgw" d="M0 32H500"/><text x="40" y="12">T1</text><text x="245" y="12">T2</text><text x="140" y="12" class="pm"></text></svg></div>
  <div class="sim"><div class="c"><label>Bệnh nhân</label><div class="steps">${PTS.map((p, i) => `<button data-p="${i}">${p.n}</button>`).join('')}</div></div>
  <div class="c c-toggle"><label>Mặt nghe</label><button class="lay" aria-pressed="false"><span>Màng (âm cao)</span><span>Chuông (âm trầm)</span></button></div></div></div>
  <div class="bside ctl"><h1><small>Khám lâm sàng · ống nghe</small>Nghe tim – phổi trên lồng ngực ảo</h1>
  <p class="box clin">🩺 Bật loa/tai nghe, kéo đầu nghe tới từng ổ. Âm to dần khi vào đúng ổ, máy rung nhẹ khi chạm ổ mới.</p><p class="box pearl hint"></p>
  <p class="box trap">⚠️ <b>Bẫy:</b> Màng nghe bắt âm cao (âm thổi, ran, stridor); chuông nghe — đặt nhẹ — bắt âm trầm (T3, rù tâm trương).</p></div></section>`;
  const svg = el.querySelector('svg'), head = svg.querySelector('.head'), tube = svg.querySelector('.tube'), lab = svg.querySelector('.zlab'), hint = el.querySelector('.hint');
  const gain = z => Math.exp(-Math.pow(Math.hypot(x - z.x, y - z.y) / 34, 2));
  const place = () => { head.setAttribute('transform', `translate(${x} ${y})`); tube.setAttribute('d', `M${x} ${y - 19}C${x} ${y - 90} 520 ${y - 60} 540 10`);
    let best = null, g = 0; ZONES.forEach(z => { const v = gain(z); svg.querySelector('#hl-' + z.id).classList.toggle('hl-on', v > .5); if (v > g) { g = v; best = z; } });
    if (best && g > .5 && best !== last) ZS.buzz && ZS.buzz(10); last = g > .5 ? best : null;
    lab.textContent = last ? last.n : 'Kéo đầu ống nghe lên lồng ngực'; };
  const P = () => PTS[pt];
  const beat = () => { if (!el.isConnected) { clearInterval(tm); tm = 0; return; } n++;
    const H = ZONES.reduce((a, z) => { const g = gain(z); a.g = Math.max(a.g, g * (z.air ? .2 : 1)); a.t1 += g * z.t1; a.t2 += g * z.t2; a.m += g * (z.mur || 0); a.air += g * (z.air || 0); return a; }, { g: 0, t1: 0, t2: 0, m: 0, air: 0 });
    const lo = bell ? 1.25 : .85, hi = bell ? .3 : 1;
    if (ZS.sfx) { ZS.sfx.heart(Math.min(1, H.g) * lo, P().mur * H.m * hi, H.t1, H.t2); if (P().str && n % 3 === 0 && H.air > .3) ZS.sfx.stridor(H.air * hi * 1.4); }
    pcg(Math.min(1, H.g) * lo * H.t1, Math.min(1, H.g) * lo * H.t2, P().mur * H.m * hi, P().str && H.air > .3 ? H.air * hi : 0); };
  // Tâm thanh đồ 1 chu chuyển: T1 (x 20–60) · âm thổi tống máu hình thoi (70–220) · T2 (232–262) · stridor thì hít vào
  const wave = el.querySelector('.pcgw'), pm = el.querySelector('.pcg .pm');
  const pcg = (a1, a2, mur, str) => { let d = 'M0 32';
    for (let x = 2; x <= 500; x += 2) { let y = 0;
      if (x >= 20 && x <= 60) y += 26 * Math.min(1, a1) * Math.sin((x - 20) * .9) * Math.sin(Math.PI * (x - 20) / 40);
      if (x >= 232 && x <= 262) y += 22 * Math.min(1, a2) * Math.sin((x - 232) * 1.1) * Math.sin(Math.PI * (x - 232) / 30);
      if (mur > .05 && x > 66 && x < 224) y += 16 * Math.min(1, mur) * (1 - Math.abs(x - 145) / 79) * (Math.random() * 2 - 1);
      if (str > .05 && x > 280) y += 13 * Math.min(1, str) * Math.sin(x * 1.7) * Math.sin(Math.PI * (x - 280) / 220);
      d += `L${x} ${(32 - y).toFixed(1)}`; }
    wave.setAttribute('d', d); pm.textContent = mur > .05 ? 'âm thổi tâm thu' : str > .05 ? '' : ''; };
  const pos = e => { const r = svg.getBoundingClientRect(), s = Math.min(r.width / 560, r.height / 350), ox = (r.width - 560 * s) / 2, oy = (r.height - 350 * s) / 2;
    x = Math.max(20, Math.min(540, (e.clientX - r.left - ox) / s)); y = Math.max(30, Math.min(330, (e.clientY - r.top - oy) / s)); place(); };
  let drag = false;
  svg.addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); pos(e); if (!tm) tm = setInterval(beat, 750); });
  svg.addEventListener('pointermove', e => { if (drag) pos(e); });
  svg.addEventListener('pointerup', () => { drag = false; });
  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { pt = +b.dataset.p; el.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b));
    hint.innerHTML = P().hint ? '💡 ' + (ZS.md ? ZS.md(P().hint) : P().hint) : '💡 Tim đều: T1 rõ ở mỏm, T2 rõ ở đáy tim.'; if (!tm) tm = setInterval(beat, 750); }));
  el.querySelector('.lay').addEventListener('click', e => { bell = 1 - bell; e.currentTarget.setAttribute('aria-pressed', bell ? 'true' : 'false'); });
  el.querySelector('[data-p="0"]').click(); place();
};
})();
