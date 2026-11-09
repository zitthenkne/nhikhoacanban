/* practice.js — Vùng luyện tập: 🧩 Ca lâm sàng 4 bước (#/ca), 🩺 OSCE 6 phút có điểm liệt (#/osce), ⚖️ 20 bẫy Đúng/Sai (#/bay).
   Đọc ZS.CASES / ZS.OSCE / ZS.MYTHS; lưu tiến độ vào ZS.P. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {}, V = ZS.views = ZS.views || {};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'), $$ = (s, r) => [...r.querySelectorAll(s)];
const store = k => { const P = ZS.P || {}; P[k] = P[k] || {}; return P[k]; }, save = () => ZS.save && ZS.save();
const sfx = ok => ZS.sfx && (ok ? ZS.sfx.ok() : ZS.sfx.err());
const mech = b => b ? `<button class="mech" data-drawer="${b}">📖 Xem cơ chế</button>` : '';
const list = (el, title, sub, arr, base, prog) => { el.innerHTML = `<section class="plist"><h1>${title}</h1><p class="sub">${sub}</p><div class="pgrid">${arr.map(x =>
  `<a class="pcard card" href="#/${base}/${x.id}"><span class="pic">${x.ic}</span><b>${esc(x.title)}</b><small>${esc(x.who || x.scene || '')}</small><em>${prog(x)}</em></a>`).join('')}</div></section>`; };

/* ── Ca lâm sàng 4 bước: đúng mới mở bước tiếp; sai được thử lại ── */
V.ca = (el, id) => {
  const C = ZS.CASES || [], S = store('cases');
  if (!id) return list(el, '🧩 Ca lâm sàng từng bước', 'Hỏi bệnh → Thăm dò → Đối chiếu tiêu chuẩn → Quyết định.', C, 'ca', x => `${(S[x.id] || {}).s || 0}/${x.steps.length} bước`);
  const c = C.find(x => x.id === id); if (!c) return V._404(el);
  const st = S[id] = S[id] || { s: 0 };
  const draw = () => {
    el.innerHTML = `<section class="case"><div class="rec card tape"><h1>${c.ic} ${esc(c.title)}</h1><p><b>${esc(c.who)}</b></p><p>${esc(c.why)}</p>
    <div class="mon">${c.vit.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>${mech(c.beat)}
    <a class="back" href="#/ca">← Danh sách ca</a></div><ol class="csteps">${c.steps.map((s, i) => i > st.s ? `<li class="lock">🔒 Bước ${i + 1}: ${esc(s.t)}</li>` :
      `<li class="${i < st.s ? 'solved' : 'cur'}"><h2>Bước ${i + 1} · ${esc(s.t)}</h2><p>${md(s.q)}</p><div class="opts">${s.opts.map((o, j) =>
        `<button class="opt${i < st.s && j === s.a ? ' right' : ''}" data-i="${i}" data-j="${j}"${i < st.s ? ' disabled' : ''}>${md(o)}</button>`).join('')}</div>
        ${i < st.s ? `<p class="why">✅ ${md(s.why)}</p>` : '<p class="why" hidden></p>'}</li>`).join('')}
    ${st.s >= c.steps.length ? `<li class="done-case">🎉 Hoàn thành ca! <button class="redo">↺ Làm lại</button></li>` : ''}</ol></section>`;
    $$('.cur .opt', el).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, j = +b.dataset.j, s = c.steps[i], ok = j === s.a;
      b.classList.add(ok ? 'right' : 'wrong'); sfx(ok);
      const w = b.closest('li').querySelector('.why'); w.hidden = false; w.innerHTML = (ok ? '✅ ' : '❌ Chưa đúng — thử lại. ') + (ok ? md(s.why) : '');
      if (ok) { st.s = i + 1; save(); setTimeout(draw, 650); } }));
    const r = el.querySelector('.redo'); if (r) r.addEventListener('click', () => { st.s = 0; save(); draw(); });
  };
  draw();
};

/* ── OSCE 6 phút: chọn các thao tác sẽ làm; chọn bẫy = ĐIỂM LIỆT ── */
const ORDER = [0, 1, 8, 2, 3, 4, 9, 5, 6, 7];
V.osce = (el, id) => {
  const O = ZS.OSCE || [], S = store('osce');
  if (!id) return list(el, '🩺 Trạm OSCE 6 phút', 'Chọn đúng các thao tác cần làm. Chọn nhầm thao tác nguy hiểm = điểm liệt.', O, 'osce', x => S[x.id] ? `Điểm cao nhất ${String(S[x.id].best).replace('.', ',')}/10` : 'Chưa thi');
  const o = O.find(x => x.id === id); if (!o) return V._404(el);
  const pick = new Set(); let left = 360, tm = 0;
  el.innerHTML = `<section class="osce"><div class="rec card tape"><h1>${o.ic} ${esc(o.title)}</h1><p>${esc(o.scene)}</p>
  <div class="timer"><b>6:00</b><button class="tgo">▶ Bắt đầu</button><button class="treset">↺</button></div>${mech(o.beat)}<a class="back" href="#/osce">← Danh sách trạm</a></div>
  <div class="card chk"><h2>Phiếu chấm — chọn các thao tác bạn sẽ làm</h2><ul>${ORDER.map(k => `<li><button class="it" data-k="${k}">☐ ${esc(o.items[k].t)}</button></li>`).join('')}</ul>
  <button class="grade">Nộp bài & chấm điểm</button><div class="res" hidden></div></div></section>`;
  const T = el.querySelector('.timer b'), show = () => { T.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; T.classList.toggle('late', left <= 120); };
  const stop = () => { clearInterval(tm); tm = 0; };
  el.querySelector('.tgo').addEventListener('click', e => { if (tm) { stop(); e.target.textContent = '▶ Tiếp tục'; return; } e.target.textContent = '⏸ Dừng';
    tm = setInterval(() => { if (!el.isConnected) return stop(); left--; if (left === 120 && ZS.sfx) ZS.sfx.ok(); show(); if (left <= 0) { stop(); el.querySelector('.grade').click(); } }, 1000); });
  el.querySelector('.treset').addEventListener('click', () => { stop(); left = 360; show(); el.querySelector('.tgo').textContent = '▶ Bắt đầu'; });
  $$('.it', el).forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k; pick.has(k) ? pick.delete(k) : pick.add(k);
    b.classList.toggle('on', pick.has(k)); b.textContent = (pick.has(k) ? '☑ ' : '☐ ') + o.items[k].t; if (ZS.sfx) ZS.sfx.tick(); }));
  el.querySelector('.grade').addEventListener('click', () => { stop();
    const crit = [...pick].filter(k => o.items[k].crit), score = [...pick].filter(k => !o.items[k].crit).reduce((s, k) => s + o.items[k].pts, 0);
    const miss = o.items.filter((x, k) => !x.crit && !pick.has(k)), pass = !crit.length && score >= 5;
    S[id] = { best: Math.max((S[id] || {}).best || 0, crit.length ? 0 : score) }; save(); sfx(pass);
    $$('.it', el).forEach(b => { const x = o.items[+b.dataset.k]; b.classList.add(x.crit ? 'bad' : 'good'); b.disabled = true; });
    const r = el.querySelector('.res'); r.hidden = false;
    r.innerHTML = crit.length ? `<p class="fail">⛔ ĐIỂM LIỆT</p>${crit.map(k => `<p>✗ ${esc(o.items[k].t)} — ${esc(o.items[k].why)}</p>`).join('')}`
      : `<p class="${pass ? 'pass' : 'fail'}">${String(score).replace('.', ',')}/10 — ${pass ? 'ĐẠT' : 'CHƯA ĐẠT'}</p>${miss.length ? '<p>Bỏ sót:</p>' + miss.map(x => `<p>• ${esc(x.t)} (${String(x.pts).replace('.', ',')}đ)</p>`).join('') : '<p>Đầy đủ các bước 👏</p>'}`; });
  show();
};

/* ── 20 bẫy Đúng/Sai ── */
V.bay = el => {
  const M = ZS.MYTHS || [], S = store('myths');
  const draw = () => { const done = M.filter((m, i) => S[i] != null), right = M.filter((m, i) => S[i] === m.ok).length;
    el.innerHTML = `<section class="plist"><h1>⚖️ 20 bẫy Đúng / Sai</h1><p class="sub">Đã làm ${done.length}/20 · đúng ${right} <button class="redo">↺ Làm lại</button></p>
    <div class="mgrid">${M.map((m, i) => { const a = S[i]; return `<article class="mcard card${a == null ? '' : a === m.ok ? ' ok' : ' no'}"><p>${i + 1}. ${md(m.t)}</p>
      ${a == null ? `<div class="tf"><button data-i="${i}" data-v="1">Đúng</button><button data-i="${i}" data-v="0">Sai</button></div>`
        : `<p class="why">${a === m.ok ? '✅' : '❌'} Đáp án: <b>${m.ok ? 'ĐÚNG' : 'SAI'}</b> — ${md(m.why)}</p>${mech(m.beat)}`}</article>`; }).join('')}</div></section>`;
    $$('.tf button', el).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, v = b.dataset.v === '1'; S[i] = v; save(); sfx(v === M[i].ok); draw(); }));
    el.querySelector('.redo').addEventListener('click', () => { M.forEach((m, i) => delete S[i]); save(); draw(); });
    ZS.bus && ZS.bus.emit('myth', { S, M });
  };
  draw();
};

/* ── 🗂 Leitner 3 hộp (Native IndexedDB): sai → hộp 1 (ôn mỗi ngày), đúng → lên hộp (2: sau 2 ngày, 3: sau 5 ngày) ── */
const IDB = (() => { let dbp;
  const open = () => dbp = dbp || new Promise((res, rej) => { const r = indexedDB.open('nhi-cb', 1); r.onupgradeneeded = () => r.result.createObjectStore('leitner'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const req = (mode, fn) => open().then(db => new Promise((res, rej) => { const q = fn(db.transaction('leitner', mode).objectStore('leitner')); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  return { get: k => req('readonly', s => s.get(k)), put: (k, v) => req('readwrite', s => s.put(v, k)),
    all: () => open().then(db => new Promise(res => { const out = {}, c = db.transaction('leitner').objectStore('leitner').openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } else res(out); }; c.onerror = () => res(out); })) }; })();
const GAP = [0, 0, 2, 5];
ZS.leitner = { grade: (id, ok) => IDB.get(id).then(c => { const box = ok ? Math.min(3, ((c && c.box) || 0) + 1) : 1; return IDB.put(id, { box, due: Date.now() + GAP[box] * 864e5 }); }).catch(() => {}) };
addEventListener('DOMContentLoaded', () => { if (!ZS.bus) return;
  ZS.bus.on('quiz', d => ZS.leitner.grade(d.q.id, d.ok));
  ZS.bus.on('myth', d => d.M.forEach((m, i) => { if (d.S[i] != null) ZS.leitner.grade('M' + i, d.S[i] === m.ok); })); });
const deck = () => (ZS.QUIZ || []).map(q => ({ id: q.id, f: q.q, b: `**${'ABCDE'[q.a]}. ${q.opts[q.a]}** — ${q.why[q.a]}`, beat: q.beat }))
  .concat((ZS.MYTHS || []).map((m, i) => ({ id: 'M' + i, f: `Đúng hay Sai? ${m.t}`, b: `**${m.ok ? 'ĐÚNG' : 'SAI'}** — ${m.why}`, beat: m.beat })));
V.on = el => {
  el.innerHTML = '<section class="plist"><h1>🗂 Ôn tập Leitner</h1><p class="sub">Đang mở hộp thẻ…</p></section>';
  const D = deck(), run = st => { const now = Date.now(), cnt = [0, 0, 0, 0];
    D.forEach(c => cnt[(st[c.id] || {}).box || 0]++);
    const due = D.filter(c => st[c.id] && st[c.id].due <= now).concat(D.filter(c => !st[c.id]).slice(0, 5));
    let i = 0;
    const card = () => { const c = due[i];
      el.innerHTML = `<section class="plist"><h1>🗂 Ôn tập Leitner</h1><div class="boxes">${['🆕 Thẻ mới', '📥 Hộp 1 · mỗi ngày', '📦 Hộp 2 · 2 ngày', '🏆 Hộp 3 · 5 ngày'].map((t, k) => `<div class="bx card"><b>${cnt[k]}</b><small>${t}</small></div>`).join('')}</div>
      ${c ? `<article class="flash card tape"><small>Thẻ ${i + 1}/${due.length}</small><p class="ff">${md(c.f)}</p><div class="fb" hidden>${md(c.b)}${mech(c.beat)}</div>
      <div class="fbtn"><button class="flip">🔄 Lật thẻ</button><button class="forgot" hidden>😅 Quên</button><button class="knew" hidden>😎 Nhớ rồi</button></div></article>`
        : '<article class="flash card"><p class="ff">🎉 Hết thẻ cần ôn hôm nay. Quay lại sau nhé!</p></article>'}</section>`;
      if (!c) return;
      el.querySelector('.flip').addEventListener('click', e => { el.querySelector('.fb').hidden = false; e.target.hidden = true; el.querySelectorAll('.forgot,.knew').forEach(b => { b.hidden = false; }); });
      const go = ok => ZS.leitner.grade(c.id, ok).then(() => { const old = (st[c.id] || {}).box || 0; cnt[old]--; const nb = ok ? Math.min(3, old + 1) : 1; cnt[nb]++; st[c.id] = { box: nb }; sfx(ok); i++; card(); });
      el.querySelector('.forgot').addEventListener('click', () => go(false)); el.querySelector('.knew').addEventListener('click', () => go(true)); };
    card(); };
  IDB.all().then(run).catch(() => run({}));
};
})();
