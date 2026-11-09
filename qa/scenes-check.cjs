// qa/scenes-check.cjs — kiểm tĩnh không cần trình duyệt: cú pháp, hợp đồng #hl-*, NaN ở mọi trạng thái biên, schema dữ liệu.
// Chạy: node qa/scenes-check.cjs   (thoát mã 1 nếu có lỗi)
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const JS = path.join(__dirname, '..', 'js'), errs = [], warn = [];
const files = ['scenes-core', 'beats-coban', 'beats-coban-2', 'quiz-data', 'crash-data', 'cases-data', 'course', 'myths', 'lab', 'practice', 'steth', 'plus', 'app'];
for (const f of files) { try { execFileSync(process.execPath, ['--check', path.join(JS, f + '.js')]); } catch (e) { errs.push(`[cú pháp] ${f}.js: ${e.stderr}`); } }

const ctx = { window: {}, console, addEventListener: () => {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
for (const f of files.slice(0, 8)) vm.runInContext(fs.readFileSync(path.join(JS, f + '.js'), 'utf8'), ctx, { filename: f });
const ZS = ctx.ZS, bad = x => typeof x === 'number' && !isFinite(x);
const scan = (v, where) => { const s = JSON.stringify(v); if (/null|NaN|undefined/.test(s) && /NaN|Infinity/.test(String(v)) || (typeof v === 'string' && /NaN|undefined/.test(v))) errs.push(`[NaN] ${where}: ${s.slice(0, 80)}`); };

// 1. Beats: 7 trường + chain.hl ⊆ id SVG + hàm toán sạch ở mọi trạng thái biên
const need = ['id', 'title', 'mode', 'ask', 'ui', 'chain', 'clin', 'trap', 'pearl'];
const ids = new Set(ZS.BEATS.map(b => b.id));
ZS.TOPICS.forEach(t => t.beats.forEach(([id]) => { if (!ids.has(id)) errs.push(`[mục lục] thiếu beat ${id}`); }));
for (const b of ZS.BEATS) {
  need.forEach(k => { if (b[k] == null) errs.push(`[schema] ${b.id}: thiếu trường ${k}`); });
  const valid = new Set(ZS.idsOf(b));
  b.chain.forEach(c => { if (!valid.has(c.hl)) errs.push(`[#hl mồ côi] ${b.id}: chain trỏ #hl-${c.hl} nhưng SVG không có`); });
  if (b.ask && !(b.ask.a >= 0 && b.ask.a < b.ask.opts.length)) errs.push(`[ask] ${b.id}: đáp án ngoài phạm vi`);
  // tổ hợp trạng thái: init + từng điều khiển ở min/max/giữa (hoặc từng bước)
  const ctl = b.ui.ctl || [], states = [Object.assign({}, b.ui.init)];
  ctl.forEach(c => { const vals = c.t === 'range' ? [c.min, c.max, (c.min + c.max) / 2] : c.t === 'toggle' ? [0, .5, 1] : c.opts.map((_, i) => i).concat([.5]);
    states.slice().forEach(s => vals.forEach(x => states.push(Object.assign({}, s, { [c.k]: x })))); });
  const probe = (fn, ...a) => { try { return fn(...a); } catch (e) { errs.push(`[lỗi hàm] ${b.id}: ${e.message}`); } };
  states.slice(0, 60).forEach(s => {
    const u = b.ui, where = `${b.id} ${JSON.stringify(s)}`;
    if (u.calc) { const c = probe(u.calc, s); const walk = (o, p) => { for (const k in o) { if (bad(o[k])) errs.push(`[NaN] ${where} calc.${p}${k}`); else if (o[k] && typeof o[k] === 'object') walk(o[k], p + k + '.'); } }; walk(c || {}, ''); }
    if (u.hud) (probe(u.hud, s) || []).forEach(r => scan(r[1], where + ' hud'));
    (u.curves || (u.plot && u.plot.curves) || []).forEach(c => [0, .25, .5, .75, 1].forEach(t => { const xa = u.x || u.plot.x, x = xa.min + (xa.max - xa.min) * t, y = probe(c.fn, x, s); if (bad(y)) errs.push(`[NaN] ${where} curve ${c.id} x=${x}`); }));
    (u.decor || []).concat(u.shapes || [], u.over || []).forEach(d => { if (typeof d.d === 'function') { const p = probe(d.d, s); if (/NaN|undefined/.test(p)) errs.push(`[NaN] ${where} decor ${d.id || ''}`); } });
    b.chain.forEach(c => c.when && probe(c.when, s));
  });
  const words = [b.clin, b.trap, b.pearl].join(' ').split(/\s+/).length; if (words > 120) warn.push(`[chữ] ${b.id}: ${words} chữ ở hộp cuối`);
}
// 2. Dữ liệu luyện tập
if (ZS.QUIZ.length !== 18) errs.push(`[quiz] cần 18 câu, đang ${ZS.QUIZ.length}`);
const byId = Object.fromEntries(ZS.BEATS.map(b => [b.id, b]));
ZS.QUIZ.forEach(q => { if (q.hl && q.beat && !ZS.idsOf(byId[q.beat]).includes(q.hl)) errs.push(`[quiz] ${q.id}: hl ${q.hl} không có trong ${q.beat}`);
  if (q.st && q.beat) Object.keys(q.st).forEach(k => { if (!(k in byId[q.beat].ui.init)) errs.push(`[quiz] ${q.id}: trạng thái ${k} lạ với ${q.beat}`); }); });
ZS.QUIZ.forEach(q => { if (q.why.length !== q.opts.length) errs.push(`[quiz] ${q.id}: why ≠ số phương án`); if (!(q.a in q.opts)) errs.push(`[quiz] ${q.id}: đáp án lệch`); if (q.beat && !ids.has(q.beat)) errs.push(`[quiz] ${q.id}: beat ${q.beat} không tồn tại`); });
if (ZS.MYTHS.length !== 20) errs.push(`[myths] cần 20, đang ${ZS.MYTHS.length}`);
if (ZS.CASES.length !== 5 || ZS.CASES.some(c => c.steps.length !== 4)) errs.push('[cases] cần 5 ca × 4 bước');
ZS.OSCE.forEach(o => { const ok = o.items.filter(i => !i.crit); const sum = ok.reduce((s, i) => s + i.pts, 0);
  if (ok.length !== 8 || Math.abs(sum - 10) > 1e-9) errs.push(`[osce] ${o.id}: ${ok.length} bước, tổng ${sum} điểm (cần 8 bước / 10 điểm)`); if (!o.items.some(i => i.crit)) errs.push(`[osce] ${o.id}: thiếu điểm liệt`); });
// 3. Liều cấp cứu: không NaN, có trần
[3, 10, 15, 30, 50].forEach(w => ZS.CRASH.groups.forEach(g => g.items.forEach(it => { const d = it.dose(w); ['mg', 'ml'].forEach(k => { if (d[k] != null && bad(d[k])) errs.push(`[crash] ${it.id} ${w}kg ${k}`); }); })));
if (ZS.CRASH.groups[0].items[0].dose(50).ml > .5) errs.push('[crash] Adrenaline IM vượt trần 0,5 mL');

console.log(`Beats ${ZS.BEATS.length}/16 · Quiz ${ZS.QUIZ.length} · Ca ${ZS.CASES.length} · OSCE ${ZS.OSCE.length} · Bẫy ${ZS.MYTHS.length}`);
warn.forEach(w => console.log('⚠️ ', w));
if (errs.length) { console.log(`\n❌ ${errs.length} lỗi:\n  ` + [...new Set(errs)].slice(0, 40).join('\n  ')); process.exit(1); }
console.log('✅ scenes-check: sạch (cú pháp, #hl-*, NaN, schema, liều).');
