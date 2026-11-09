/* plus.js — Nâng cấp học tập gắn qua ZS.bus (không sửa lõi):
   🔀 Tự kể lại chuỗi · 🙈 Thử mù · ⭐ Đánh dấu · 📝 Ghi chú · 🔗 Chia sẻ trạng thái · 🫀 Nghe tim đồng bộ ·
   🔍 Tìm toàn web (Ctrl+K) · ⌨️ Phím tắt (?) · 🎉 Ăn mừng chibi · ♿ Thông báo ARIA. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'), plain = s => String(s).replace(/\*\*/g, '');
const P = () => ZS.P || {}, bag = k => { const p = P(); p[k] = p[k] || {}; return p[k]; }, save = () => ZS.save && ZS.save();
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const CHIBI = '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M8 17Q20 2 32 17Z" fill="#fff" stroke="#e8a0b4" stroke-width="1.5"/><path d="M18 9h4v-2h-4zM19 6h2v6h-2z" fill="#ff5c7a"/><circle cx="20" cy="24" r="12" fill="#ffe2cf" stroke="#e8b89a"/><circle cx="15.5" cy="23" r="1.6" fill="#3b324d"/><circle cx="24.5" cy="23" r="1.6" fill="#3b324d"/><circle cx="13" cy="27" r="2.2" fill="#ffb5c8"/><circle cx="27" cy="27" r="2.2" fill="#ffb5c8"/><path d="M17 28q3 3 6 0" fill="none" stroke="#3b324d" stroke-width="1.4" stroke-linecap="round"/></svg>';

/* ♿ + 🎉 */
const live = document.createElement('div'); live.id = 'live'; live.className = 'sr'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
const say = m => { live.textContent = ''; setTimeout(() => { live.textContent = m; }, 40); };
const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = CHIBI + `<b>${esc(m)}</b>`; document.body.appendChild(t); say(m);
  setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2700); };
const party = m => { toast(m); if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
  c.innerHTML = Array.from({ length: 30 }, (_, i) => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * .3).toFixed(2)}s;--r:${Math.round(Math.random() * 720)}deg;background:var(--${['pink-d', 'mint-d', 'sky-d', 'butter-d', 'lav-d', 'peach-d'][i % 6]})"></i>`).join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 2000); };
ZS.toast = toast; ZS.party = party;

/* Công cụ trên mỗi màn cơ chế */
const shuffle = (a, seed) => a.map((x, i) => [x, Math.sin(i * 99 + seed) * 1e4 % 1]).sort((p, q) => p[1] - q[1]).map(p => p[0]);
const tools = ({ root, b, s, v, set }) => {
  const side = $('.bside', root); if (!side || $('.tools', side)) return;
  const heart = b.ui.model === 'organHydraulic' && b.ui.layout !== 'tank', star = bag('star'), notes = bag('notes'), stp = (b.ui.ctl || []).find(c => c.t === 'steps');
  side.querySelector('h1').insertAdjacentHTML('afterend', `<div class="tools" role="toolbar" aria-label="Công cụ học">
    ${stp ? '<button data-x="play" title="Tự trình diễn từng bước">▶ Trình diễn</button>' : ''}<button data-x="retell" title="Tự kể lại: xếp chuỗi nhân–quả">🔀 Kể lại</button><button data-x="blind" aria-pressed="false" title="Che chữ, tự nhớ lại">🙈 Thử mù</button>
    ${heart ? '<button data-x="hb" aria-pressed="false" title="Nghe tiếng tim đồng bộ">🫀 Nghe tim</button>' : ''}
    <button data-x="star" aria-pressed="${!!star[b.id]}" title="Đánh dấu màn quan trọng">${star[b.id] ? '★' : '☆'}</button><button data-x="note" title="Ghi chú của tôi">📝</button><button data-x="share" title="Chép link đúng trạng thái hình">🔗</button></div><div class="toolpane" hidden></div>`);
  const pane = $('.toolpane', side); let hb = 0;
  const open = html => { pane.hidden = !html || (pane.dataset.k === html && !pane.hidden); pane.innerHTML = html; pane.dataset.k = html; return !pane.hidden; };
  side.querySelector('.tools').addEventListener('click', e => { const t = e.target.closest('[data-x]'); if (!t) return; const x = t.dataset.x;
    if (x === 'blind') { const on = t.getAttribute('aria-pressed') !== 'true'; t.setAttribute('aria-pressed', on); $('.chain', root).classList.toggle('blind', on); say(on ? 'Đã che chữ chuỗi. Chạm từng thẻ để mở.' : 'Đã hiện chữ.'); }
    if (x === 'star') { star[b.id] = !star[b.id]; if (!star[b.id]) delete star[b.id]; save(); t.textContent = star[b.id] ? '★' : '☆'; t.setAttribute('aria-pressed', !!star[b.id]); say(star[b.id] ? 'Đã đánh dấu.' : 'Đã bỏ đánh dấu.'); }
    if (x === 'note' && open(`<label class="nlab">📝 Ghi chú của tôi<textarea rows="3" placeholder="Viết lại cơ chế bằng lời của bạn…">${esc(notes[b.id] || '')}</textarea></label>`))
      pane.querySelector('textarea').addEventListener('input', e2 => { notes[b.id] = e2.target.value; if (!notes[b.id]) delete notes[b.id]; save(); });
    if (x === 'share') { const url = location.href.split('#')[0] + '#/L/' + b.id + '?s=' + encodeURIComponent(JSON.stringify(s));
      open(`<label class="nlab">🔗 Link mở đúng trạng thái hình này<input readonly value="${esc(url)}"></label>`); pane.querySelector('input').select();
      try { navigator.clipboard.writeText(url).then(() => toast('Đã chép link!'), () => {}); } catch (e3) { /* trình duyệt chặn clipboard */ } }
    if (x === 'hb') { if (hb) { clearInterval(hb); hb = 0; t.setAttribute('aria-pressed', 'false'); return; } t.setAttribute('aria-pressed', 'true');
      const tick = () => { if (!root.isConnected || !$('[data-x="hb"][aria-pressed="true"]', root)) { clearInterval(hb); hb = 0; return; }
        const c = b.ui.calc(v); ZS.sfx.heart(.8, b.ui.murmur ? b.ui.murmur(v) : 0); clearInterval(hb); hb = setInterval(tick, 60000 / (c.hr || 120)); };
      tick(); }
    if (x === 'retell') retell(b, pane, open);
    if (x === 'play') play(root, b, stp, set, t); });
  callouts(root, b);
};
// ▶ Tự trình diễn: chạy lần lượt các bước, mỗi bước có lời dẫn + sáng mắt xích vừa bật
const play = async (root, b, stp, set, btn) => { if (btn.dataset.run) { btn.dataset.run = ''; return; } btn.dataset.run = 1; btn.textContent = '⏸ Dừng';
  const art = $('.art', root), cap = document.createElement('div'); cap.className = 'narr'; art.appendChild(cap);
  const wait = ms => new Promise(r => setTimeout(r, ms)), lis = $$('.chain li', root);
  for (let i = 0; i < stp.opts.length && btn.dataset.run && root.isConnected; i++) {
    const before = lis.map(li => li.classList.contains('on')); set(stp.k, i, 900); cap.textContent = stp.opts[i]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    await wait(1000); lis.forEach((li, j) => { if (li.classList.contains('on') && !before[j]) { li.classList.add('lit'); const e = root.querySelector('[id="hl-' + li.dataset.hl + '"]'); if (e) e.classList.add('hl-on'); } });
    await wait(1700); $$('.lit', root).forEach(e => e.classList.remove('lit')); $$('.hl-on', root).forEach(e => e.classList.remove('hl-on')); }
  cap.remove(); btn.dataset.run = ''; btn.textContent = '▶ Trình diễn'; };
// 💬 Chú thích nổi: rê/chạm cấu trúc #hl-* → bong bóng nội dung mắt xích tương ứng
const callouts = (root, b) => { const svg = $('svg', root), art = $('.art', root); if (!svg) return; const tip = document.createElement('div'); tip.className = 'callout'; tip.hidden = true; art.appendChild(tip);
  svg.addEventListener('pointermove', e => { const h = e.target.closest && e.target.closest('[id^="hl-"]'), c = h && b.chain.find(x => 'hl-' + x.hl === h.id);
    if (!c) { tip.hidden = true; return; } const r = art.getBoundingClientRect(); tip.innerHTML = md(c.t); tip.hidden = false;
    const x = e.clientX - r.left, y = e.clientY - r.top; tip.style.left = Math.min(Math.max(8, x + 14), r.width - 250) + 'px'; tip.style.top = Math.max(4, y - 64) + 'px'; });
  svg.addEventListener('pointerleave', () => { tip.hidden = true; }); };
const retell = (b, pane, open) => {
  const items = b.chain.map((c, i) => ({ i, t: plain(c.t) })), mixd = shuffle(items, b.id.length);
  if (!open('<p class="rt-h">🔀 Bấm các mắt xích theo đúng thứ tự nhân → quả:</p><div class="rt">' + mixd.map(c => `<button data-i="${c.i}">${esc(c.t)}</button>`).join('') + '</div>')) return;
  let k = 0;
  pane.querySelectorAll('.rt button').forEach(btn => btn.addEventListener('click', () => {
    if (+btn.dataset.i === k) { btn.classList.add('ok'); btn.disabled = true; btn.insertAdjacentHTML('afterbegin', `<b>${++k}</b> `); ZS.sfx.tick();
      if (k === items.length) { bag('retell')[b.id] = 1; save(); party('Kể lại chuẩn chỉnh! 🧠'); } }
    else { btn.classList.add('shake'); ZS.sfx.err(); setTimeout(() => btn.classList.remove('shake'), 400); say('Chưa đúng thứ tự, thử mắt xích khác.'); } }));
};

/* 🔍 Tìm toàn web */
let IDX = null;
const index = () => IDX = IDX || [].concat(
  (ZS.BEATS || []).map(b => ({ t: '🧩 ' + b.title, s: 'Màn cơ chế', h: '#/L/' + b.id, k: fold([b.title, b.clin, b.trap, b.pearl].concat(b.chain.map(c => c.t)).join(' ')) })),
  (ZS.QUIZ || []).map((q, i) => ({ t: '🧠 ' + plain(q.q).slice(0, 90), s: 'Thử nhớ · câu ' + (i + 1), h: '#/q/' + i, k: fold(q.q + ' ' + q.opts.join(' ')) })),
  (ZS.CASES || []).map(c => ({ t: c.ic + ' ' + c.title, s: 'Ca lâm sàng', h: '#/ca/' + c.id, k: fold(c.title + ' ' + c.why) })),
  (ZS.OSCE || []).map(o => ({ t: o.ic + ' ' + o.title, s: 'Trạm OSCE', h: '#/osce/' + o.id, k: fold(o.title + ' ' + o.scene) })),
  (ZS.MYTHS || []).map(m => ({ t: '⚖️ ' + m.t, s: 'Bẫy Đúng/Sai', h: '#/bay', k: fold(m.t + ' ' + m.why) })),
  ((ZS.CRASH || {}).groups || []).flatMap(g => g.items).map(it => ({ t: '⚡ ' + it.name, s: 'Liều cấp cứu · ' + it.use, h: '!crash', k: fold(it.name + ' ' + it.use) })),
  [['📌 Tra nhanh: lịch tiêm, thở nhanh, mất nước, máy tính', '#/tra'], ['🎧 Ống nghe ảo', '#/nghe'], ['🗂 Ôn tập Leitner', '#/on']].map(([t, h]) => ({ t, s: 'Trang', h, k: fold(t) })));
const pal = document.createElement('div'); pal.id = 'pal'; pal.hidden = true;
pal.innerHTML = '<div class="palbox" role="dialog" aria-label="Tìm toàn web"><input type="search" placeholder="Tìm màn, câu hỏi, ca, bẫy, thuốc… (gõ không dấu cũng được)" aria-label="Tìm"><ul role="listbox"></ul><p class="palhint">↑↓ chọn · Enter mở · Esc đóng</p></div>';
document.body.appendChild(pal);
let sel = 0, hits = [];
const go = h => { closePal(); if (h === '!crash') $('#fab').click(); else location.hash = h; };
const draw = () => { const q = fold(pal.querySelector('input').value.trim()), w = q.split(/\s+/).filter(Boolean);
  hits = (w.length ? index().filter(x => w.every(t => x.k.includes(t) || fold(x.t).includes(t))) : index().slice(0, 16)).slice(0, 12); sel = Math.min(sel, Math.max(0, hits.length - 1));
  pal.querySelector('ul').innerHTML = hits.map((x, i) => `<li role="option" aria-selected="${i === sel}" data-i="${i}"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></li>`).join('') || '<li class="none">Không thấy — thử từ khóa khác.</li>'; };
const openPal = () => { pal.hidden = false; const i = pal.querySelector('input'); i.value = ''; sel = 0; draw(); i.focus(); };
const closePal = () => { pal.hidden = true; };
pal.addEventListener('input', () => { sel = 0; draw(); });
pal.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) go(hits[+li.dataset.i].h); else if (e.target === pal) closePal(); });
pal.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); draw(); }
  if (e.key === 'Enter' && hits[sel]) go(hits[sel].h); if (e.key === 'Escape') { e.stopPropagation(); closePal(); } });
ZS.search = openPal;

/* ⌨️ Phím tắt */
const KEYS = [['← / →', 'Màn trước / tiếp'], ['Space', 'Màn tiếp'], ['Ctrl + K hoặc /', 'Tìm toàn web'], ['Esc', 'Đóng drawer / bảng cấp cứu'], ['C', 'Mở bảng cấp cứu'], ['N', 'Đêm trực ↔ ban ngày'], ['M', 'Tắt / bật âm'], ['?', 'Bảng phím tắt']];
const help = document.createElement('div'); help.id = 'keys'; help.hidden = true;
help.innerHTML = `<div class="palbox"><h2>⌨️ Phím tắt</h2><table>${KEYS.map(([k, d]) => `<tr><td><kbd>${k}</kbd></td><td>${d}</td></tr>`).join('')}</table><p class="palhint">Bấm phím bất kỳ để đóng</p></div>`;
document.body.appendChild(help);
addEventListener('keydown', e => {
  if (!help.hidden) { help.hidden = true; e.preventDefault(); return; }
  const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPal() : closePal(); return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === '/') { e.preventDefault(); openPal(); } else if (k === '?') help.hidden = false;
  else if (k === 'c') $('#fab').click(); else if (k === 'n') $('#bTheme').click(); else if (k === 'm') $('#bMute').click();
}, true);

/* Gắn vào app */
addEventListener('DOMContentLoaded', () => {
  const b = document.createElement('button'); b.className = 'ib'; b.id = 'bFind'; b.title = 'Tìm toàn web (Ctrl+K)'; b.setAttribute('aria-label', 'Tìm toàn web'); b.textContent = '🔍';
  $('#bMute').before(b); b.addEventListener('click', openPal);
  if (!ZS.bus) return;
  ZS.bus.on('beat', tools);
  ZS.bus.on('done', () => party('Giỏi quá! Đạt đích màn này ✨'));
  ZS.bus.on('quiz', d => say(d.ok ? 'Chính xác!' : 'Chưa đúng, xem giải thích từng phương án.'));
});
})();
