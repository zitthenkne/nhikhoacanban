/* lab.js — Công cụ đi trực: Crash HUD 1 chạm (ZS.crashView), 📌 Tra nhanh (ZS.views.tra) + máy tính lâm sàng.
   Chỉ đọc dữ liệu từ ZS.CRASH; không đụng router. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {}, V = ZS.views = ZS.views || {};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vn = n => String(n).replace('.', ','), r1 = n => Math.round(n * 10) / 10;
const SIZES = [1, 3, 5, 10, 20, 50];

// Ống tiêm: chọn cỡ nhỏ nhất chứa đủ thể tích, pít-tông rút đúng vạch
const syringe = ml => { const size = SIZES.find(s => s >= ml); if (!size) return '<small class="bag">💧 Túi dịch / bơm tiêm điện</small>';
  const f = Math.max(.02, ml / size), x = 12 + 104 * f;
  return `<svg class="syr" viewBox="0 0 150 26" aria-hidden="true"><path d="M116 13h26" class="ndl"/><rect x="12" y="6" width="104" height="14" rx="3" class="brl"/>
  <rect x="12" y="6" width="${r1(104 * f)}" height="14" rx="3" class="liq"/><rect x="${r1(x)}" y="3" width="4" height="20" rx="1" class="plg"/><path d="M${r1(x + 4)} 13H${r1(x + 30)}" class="rod"/></svg><small>ống ${size} mL</small>`; };

ZS.crashView = el => {
  const C = ZS.CRASH, P = ZS.P || {}; if (!C) { el.innerHTML = '<p>Thiếu dữ liệu liều.</p>'; return; }
  let w = +P.crashW || C.w.init, age = +P.crashAge || 4;
  el.innerHTML = `<div class="cw"><label for="cwr">KÉO CÂN NẶNG BỆNH NHI</label><div class="cwrow"><input id="cwr" type="range" min="${C.w.min}" max="${C.w.max}" step="1" value="${w}"><b class="cwv"></b></div></div><div class="cgrid"></div>`;
  const grid = el.querySelector('.cgrid'), out = el.querySelector('.cwv');
  const card = it => { const d = it.dose(w), big = d.ml != null ? vn(d.ml) + ' mL' : d.mg != null ? vn(d.mg) + ' mg' : '';
    return `<article class="cc"><header><b>${esc(it.name)}</b><small>${esc(it.use)}</small></header>${big ? `<div class="big">${big}</div>` : ''}
    ${d.ml != null && it.syr ? syringe(d.ml) : ''}<p>${d.mg != null && d.ml != null ? vn(d.mg) + ' mg · ' : ''}${esc(d.txt)}</p><p class="rt">➜ ${esc(it.route)}</p>
    ${it.note ? `<p class="nt">${esc(it.note)}</p>` : ''}${it.warn ? `<p class="wn">⛔ ${esc(it.warn)}</p>` : ''}</article>`; };
  const render = () => { out.textContent = w + ' kg'; const e = C.ett(age);
    grid.innerHTML = C.groups.map(g => `<h3>${esc(g.t)}</h3>` + g.items.map(card).join('')).join('') +
      `<h3>Đường thở</h3><article class="cc"><header><b>Ống nội khí quản</b><small>Trẻ ≥ 2 tuổi</small></header>
      <div class="agerow"><button data-age="-1" aria-label="Giảm tuổi">−</button><span>${age} tuổi</span><button data-age="1" aria-label="Tăng tuổi">+</button></div>
      ${e ? `<div class="big">${vn(e.plain)} mm</div><p>Không bóng: 4 + tuổi/4 · có bóng: ${vn(e.cuff)} mm</p><p class="nt">Chuẩn bị thêm ống nhỏ hơn và lớn hơn 0,5 mm.</p>` : '<p>Dưới 2 tuổi: dùng bảng/thước theo tuổi.</p>'}</article>`; };
  el.querySelector('#cwr').addEventListener('input', e => { w = +e.target.value; P.crashW = w; ZS.save && ZS.save(); render(); if (ZS.sfx) ZS.sfx.tick(); });
  grid.addEventListener('click', e => { const b = e.target.closest('[data-age]'); if (!b) return; age = Math.max(2, Math.min(16, age + +b.dataset.age)); P.crashAge = age; ZS.save && ZS.save(); render(); });
  render();
};

/* ── Máy tính lâm sàng ── */
// Trung vị & −1 SD cân nặng/tuổi WHO (kg) tại các mốc tháng — ước lượng nhanh, nội suy tuyến tính
const WA = { m: [0, 3, 6, 9, 12, 18, 24, 36, 48, 60],
  b: [[3.3, 6.4, 7.9, 8.9, 9.6, 10.9, 12.2, 14.3, 16.3, 18.3], [2.9, 5.7, 7.1, 8.0, 8.6, 9.8, 10.8, 12.7, 14.4, 16.0]],
  g: [[3.2, 5.8, 7.3, 8.2, 8.9, 10.2, 11.5, 13.9, 16.1, 18.2], [2.8, 5.2, 6.5, 7.3, 7.9, 9.1, 10.2, 12.2, 14.0, 15.8]] };
const interp = (xs, ys, x) => { const i = Math.max(0, Math.min(xs.length - 2, xs.findIndex((v, k) => x < xs[k + 1]) < 0 ? xs.length - 2 : xs.findIndex((v, k) => x < xs[k + 1])));
  return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]); };
const CALC = [
  { id: 'hc', t: 'Tuổi hiệu chỉnh', ins: [['ga', 'Tuổi thai lúc sinh (tuần)', 28], ['m', 'Tuổi sau sinh (tháng)', 6]],
    f: v => v.m > 24 ? 'Trên 24 tháng → dùng **tuổi thực**.' : `Tuổi hiệu chỉnh ≈ **${vn(r1(Math.max(0, v.m - (40 - v.ga) * 7 / 30.4)))} tháng** (trừ ${40 - v.ga} tuần). Tiêm chủng vẫn theo tuổi thực.` },
  { id: 'z', t: 'Z-score CN/T (ước lượng)', ins: [['m', 'Tuổi (tháng, 0–60)', 18], ['w', 'Cân nặng (kg)', 9.5], ['sx', 'Giới (1 = trai, 0 = gái)', 1]],
    f: v => { const T = WA[v.sx >= 1 ? 'b' : 'g'], M = interp(WA.m, T[0], v.m), S = M - interp(WA.m, T[1], v.m), z = (v.w - M) / S;
      return `Trung vị ${vn(r1(M))} kg → Z ≈ **${vn(r1(z))} SD** · ${z < -3 ? 'nhẹ cân nặng' : z < -2 ? 'nhẹ cân vừa' : 'trong giới hạn'}. Luôn ấn mu chân tìm phù. Đối chiếu biểu đồ WHO chuẩn.`; } },
  { id: 'hs', t: 'Dịch duy trì Holliday–Segar', ins: [['w', 'Cân nặng (kg)', 15]],
    f: v => { const d = v.w <= 10 ? 100 * v.w : v.w <= 20 ? 1000 + 50 * (v.w - 10) : 1500 + 20 * (v.w - 20); return `**${Math.round(d)} mL/ngày** ≈ ${Math.round(d / 24)} mL/giờ (100 – 50 – 20 mL/kg).`; } },
  { id: 'orsb', t: 'Bù dịch phác đồ B (có mất nước)', ins: [['w', 'Cân nặng (kg)', 10]],
    f: v => `Oresol **${Math.round(75 * v.w)} mL trong 4 giờ** (75 mL/kg), uống từng thìa; đánh giá lại sau 4 giờ.` },
  { id: 'bmi', t: 'BMI', ins: [['w', 'Cân nặng (kg)', 18], ['h', 'Chiều cao (cm)', 98]],
    f: v => `BMI = **${vn(r1(v.w / Math.pow(v.h / 100, 2)))} kg/m²** — đối chiếu bách phân vị theo tuổi, giới.` },
];

/* ── Bảng tra 5 giây ── */
const TABLES = [
  { t: 'Lịch tiêm chủng mở rộng (TCMR)', k: 'tiêm chủng lịch vắc xin bcg sởi dpt viêm gan', h: ['Tuổi', 'Vắc xin'], rows: [['Sơ sinh', 'BCG · Viêm gan B (trong 24 giờ)'], ['2 · 3 · 4 tháng', 'DPT-VGB-Hib (5 trong 1) + bại liệt uống'], ['5 tháng', 'Bại liệt tiêm (IPV)'], ['9 tháng', 'Sởi'], ['12 tháng', 'Viêm não Nhật Bản (2 mũi cách 1–2 tuần)'], ['18 tháng', 'DPT nhắc · Sởi – Rubella (MR)'], ['24 tháng', 'Viêm não Nhật Bản mũi 3']] },
  { t: 'Ngưỡng thở nhanh (WHO / IMCI)', k: 'thở nhanh nhịp thở viêm phổi imci', h: ['Tuổi', 'Thở nhanh khi'], rows: [['< 2 tháng', '≥ 60 lần/phút'], ['2 – 11 tháng', '≥ 50 lần/phút'], ['12 – 59 tháng', '≥ 40 lần/phút']] },
  { t: 'Cờ đỏ phát triển', k: 'denver cờ đỏ phát triển chậm vận động ngôn ngữ', h: ['Mốc', 'Đánh giá ngay khi'], rows: [['4 tháng', 'Không giữ được đầu khi ngồi'], ['9 tháng', 'Không tự ngồi'], ['12 tháng', 'Không bập bẹ · không chỉ tay / ra dấu'], ['16 tháng', 'Không nói được từ đơn'], ['18 tháng', 'Không tự đi'], ['24 tháng', 'Không nói cụm 2 từ'], ['Mọi tuổi', 'Mất kỹ năng ngôn ngữ / giao tiếp đã có']] },
  { t: 'Phân độ mất nước (IMCI)', k: 'mất nước tiêu chảy véo da oresol phác đồ', h: ['Dấu hiệu (≥ 2)', 'Phân loại → xử trí'], rows: [['Li bì/khó đánh thức · mắt trũng · không uống được/uống kém · véo da mất rất chậm > 2 giây', 'MẤT NƯỚC NẶNG → phác đồ C (truyền TM)'], ['Vật vã, kích thích · mắt trũng · uống háo hức · véo da mất chậm', 'CÓ MẤT NƯỚC → phác đồ B: ORS 75 mL/kg/4 giờ'], ['Không đủ dấu hiệu trên', 'KHÔNG MẤT NƯỚC → phác đồ A + kẽm']] },
  { t: 'Sốt co giật', k: 'sốt co giật đơn giản phức tạp chọc dò', h: ['Đơn giản', 'Phức tạp'], rows: [['Toàn thể', 'Khu trú'], ['< 15 phút', '> 15 phút'], ['Không tái phát trong 24 giờ', '≥ 2 cơn / 24 giờ'], ['Không chọc dò thường quy', 'Chọc dò nếu > 12 tháng + phức tạp, hoặc dấu màng não']] },
];

V.tra = el => {
  el.innerHTML = `<section class="tra"><div class="trahead"><h1>📌 Tra nhanh 5 giây</h1><input class="tq" type="search" placeholder="Tìm: thở nhanh, lịch tiêm, véo da, denver…" aria-label="Tìm nhanh">
  <button class="crashbtn">⚡ Mở bảng liều cấp cứu</button></div>
  <div class="tgrid">${TABLES.map(T => `<article class="tcard card" data-k="${esc(T.t + ' ' + T.k)}"><h2>${esc(T.t)}</h2><table><thead><tr>${T.h.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead>
  <tbody>${T.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></article>`).join('')}
  ${CALC.map(c => `<article class="tcard card calc" data-k="${esc(c.t)} máy tính" data-c="${c.id}"><h2>🧮 ${esc(c.t)}</h2><div class="ins">${c.ins.map(([k, l, d]) => `<label>${esc(l)}<input type="number" step="any" data-k="${k}" value="${d}"></label>`).join('')}</div><output></output></article>`).join('')}</div></section>`;
  const run = card => { const c = CALC.find(x => x.id === card.dataset.c), v = {};
    card.querySelectorAll('input').forEach(i => { v[i.dataset.k] = +i.value || 0; });
    card.querySelector('output').innerHTML = (ZS.md || esc)(c.f(v)); };
  el.querySelectorAll('.calc').forEach(card => { run(card); card.addEventListener('input', () => run(card)); });
  el.querySelector('.tq').addEventListener('input', e => { const q = e.target.value.trim().toLowerCase();
    el.querySelectorAll('.tcard').forEach(c => { c.hidden = !!q && !c.dataset.k.toLowerCase().includes(q) && !c.textContent.toLowerCase().includes(q); }); });
  el.querySelector('.crashbtn').addEventListener('click', () => document.getElementById('fab').click());
};
})();
