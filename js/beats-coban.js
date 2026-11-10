/* beats-coban.js — dữ liệu 16 Beats (POJO + hàm toán thuần, không DOM).
   Schema: { id, title, mode, ask:{q,opts,a,why}, ui:{model, init, ctl[], goal?, ids?, ...tham số engine}, chain:[{t,hl,when?}], clin, trap, pearl, src }
   Mọi chain[].hl phải nằm trong ZS.idsOf(beat) (qa/scenes-check.cjs kiểm). */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
const cl = v => Math.max(0, Math.min(1, v));

ZS.TOPICS = [
  { n: 1, t: 'Tiêm chủng', ic: '💉', beats: [['tc-dong-hoc', 'Bán rã kháng thể mẹ & mũi Sởi 9 tháng'], ['tc-vx-song-corticoid', 'Vắc xin sống & Corticoid toàn thân'], ['tc-tiem-bu-hoan', 'Tiêm bù & khoảng cách vắc xin']] },
  { n: 2, t: 'Tăng trưởng & Tâm vận', ic: '📈', beats: [['beat-4-can-can-tang-truong', 'Cán cân tăng trưởng & bẫy phù'], ['beat-5-tuoi-hieu-chinh-sinh-non', 'Tuổi hiệu chỉnh trẻ sinh non'], ['beat-6-denver-ii-red-flags', 'Denver II & cờ đỏ']] },
  { n: 3, t: 'Kê toa, thuốc & kháng sinh', ic: '💊', beats: [['beat_07_pk_so_sinh', 'Tank model dược động học sơ sinh'], ['beat_08_bay_lieu_paracetamol_aspirin', 'Paracetamol béo phì & Aspirin Kawasaki']] },
  { n: 4, t: 'Sốt, co giật & cấp cứu', ic: '🔥', beats: [['sc-sot-giat', 'Sốt co giật đơn thuần vs phức tạp'], ['sc-cat-con-giat', 'Nghịch lý GABA sơ sinh'], ['sc-phan-ve-adrenaline', 'Adrenaline tiêm bắp đùi']] },
  { n: 5, t: 'Đặc điểm tuần hoàn', ic: '🫀', beats: [['beat-12-foramen-ovale', 'Sập van lỗ bầu dục'], ['beat-13-ductus-fallot', 'Fallot & tư thế gối – ngực']] },
  { n: 6, t: 'Khám lâm sàng & tiêu chảy', ic: '🩺', beats: [['beat-14-moro-reflex', 'Phản xạ Moro 2 thì'], ['beat-15-oresol-osmosis', 'SGLT-1 & thẩm thấu Oresol'], ['beat-16-skin-pinch', 'Dấu véo da & bẫy dinh dưỡng']] },
];

const r1 = n => Math.round(n * 10) / 10, vn = n => String(n).replace('.', ',');
const C = (x, y, r) => ZS.svg.circ(x, y, r);
const virus = (x, y) => C(x, y, 9) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `M${r1(x + 9 * Math.cos(a))} ${r1(y + 9 * Math.sin(a))}l${r1(5 * Math.cos(a))} ${r1(5 * Math.sin(a))}`; }).join('');
const antibodies = (x, y) => [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3 + .5, ux = Math.cos(a), uy = Math.sin(a), ox = x + 34 * ux, oy = y + 34 * uy, ix = x + 22 * ux, iy = y + 22 * uy;
  return `M${r1(ox)} ${r1(oy)}L${r1(ix)} ${r1(iy)}l${r1(5 * (-ux - uy))} ${r1(5 * (-uy + ux))}M${r1(ix)} ${r1(iy)}l${r1(5 * (-ux + uy))} ${r1(5 * (-uy - ux))}`; }).join('');
const gResp = (t, A, rise, dec) => t <= 0 ? 0 : A * (1 - Math.exp(-t / rise)) * Math.exp(-t / dec);

// Màn 1.1 — IgG sởi từ mẹ (mô hình t½ 28 ngày, C₀ 3 IU/mL); vắc xin "bắt" được khi IgG < ~0,005 IU/mL
const IU = m => 3 * Math.pow(.5, m * 30.4 / 28), vxOK = v => cl(Math.log10(.005 / IU(v.m)) / .4 + .5);
const fIU = c => c >= .1 ? vn(c.toFixed(2)) : c >= .001 ? vn(c.toFixed(4)) : '< 0,001';
// Màn 1.2 — 4 tình huống corticoid → [hàng, cột] trên ma trận hoãn tiêm
const PK = [null, [2, 0], [0, 0], [0, 2]], supp = v => ZS.key(v.ca, [0, 0, 1, 0]);
// Màn 1.3 — trễ hẹn mũi 2 (5in1): mũi 1 lúc 2 tháng, lịch mũi 2 lúc 3 tháng
const d2 = v => 3 + ZS.key(v.tre, [1, 6, 12]), sx3 = x => 64 + x * 23.8;

const R = (x, y, w, h) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
// Màn 2.1 — CN/T bé trai 18 tháng: trung vị WHO ≈ 10,9 kg, Z ≈ ln(W/M)/0,11
const Z4 = v => Math.log(v.w / 10.9) / .11, sx4 = z => 64 + (z + 4) / 7 * 320, bell = z => 100 * Math.exp(-z * z / 2);
// Màn 2.2 — tuổi hiệu chỉnh (tháng) đến 24 tháng tuổi thực
const corr = v => v.age > 24 ? v.age : Math.max(0, v.age - (40 - v.ga) * 7 / 30.4), sx5 = m => 130 + m / 36 * 418;
// Màn 2.3 — bé "không chỉ tay, chưa đi" qua các mốc 9–12–18–24 tháng
const age6 = v => ZS.key(v.t, [9, 12, 18, 24]), FAIL6 = ['joint-attention-loss', 'di'];
const st6 = (v, b) => { const a = age6(v), f = FAIL6.includes(b.id);
  return f ? (a >= b.b || (b.rf && a >= b.rf) ? 'late' : a >= b.c ? 'warn' : '') : a >= b.a ? 'ok' : ''; };
const BARS6 = [
  { id: 'cuoi', row: 0, a: 1, c: 1.5, b: 2, label: 'Cười đáp' }, { id: 'joint-attention-loss', row: 0, a: 9, c: 10.5, b: 12, rf: 12, label: 'Chỉ ngón trỏ' },
  { id: 'chuyen-tay', row: 1, a: 5, c: 6, b: 7, label: 'Chuyển tay' }, { id: 'nhon', row: 1, lane: 1, a: 8, c: 9, b: 10, label: 'Nhón ngón' }, { id: 'xep', row: 1, a: 13, c: 15, b: 17, label: 'Xếp 2 khối' },
  { id: 'bap-be', row: 2, a: 6, c: 8, b: 12, rf: 12, label: 'Bập bẹ' }, { id: 'tu-don', row: 2, lane: 1, a: 11, c: 13, b: 16, rf: 16, label: 'Từ đơn' }, { id: 'cum-tu', row: 2, a: 18, c: 21, b: 24, rf: 24, label: 'Cụm 2 từ' },
  { id: 'giu-dau', row: 3, a: 2, c: 3, b: 4, rf: 4, label: 'Giữ đầu' }, { id: 'ngoi', row: 3, lane: 1, a: 5, c: 6.5, b: 9, rf: 9, label: 'Tự ngồi' }, { id: 'di', row: 3, a: 11, c: 13, b: 18, rf: 18, label: 'Tự đi' }];

// Màn 5.1 — Tuần hoàn chuyển tiếp. b phổi nở 0–1 · c kẹp rốn 0/1 · pp trẻ ngạt (PPHN) 0/1.
// Mắt xích trung gian là kháng lực phổi rp (không phải nhát thở): rp → dòng phổi qp → áp nhĩ T; mất bánh nhau + rp → áp nhĩ P.
const fo = v => { const b = cl(v.b), c = cl(v.c), pp = cl(v.pp), rp = 1 - .8 * b * (1 - .7 * pp), qp = .2 / rp,
  la = 2 + 4 * qp, ra = 3 + 1.5 * (1 - c) + 1.5 * rp, ppa = 20 + 50 * rp, pao = 45 + 10 * c, open = cl((ra - la) / 2.5), da = Math.max(-1.6, Math.min(1.6, (ppa - pao) / 15));
  // SpO₂ minh họa: phổi có khí mới trao đổi O₂; máu TMC dưới qua lỗ bầu dục trộn vào nhĩ T; SvO₂ ≈ 0,72·SaO₂
  const pv = .62 + .36 * b, qf = .8 * open; let svc = .55, ivc, la2;
  for (let i = 0; i < 6; i++) { ivc = svc + (.82 - svc) * (1 - c) * .6; la2 = (qp * pv + qf * ivc) / (qp + qf); svc = .72 * la2; }
  // ÔĐM P → T đổ máu ĐMP vào ĐMC xuống (sau chỗ tách ĐM dưới đòn) → chân tím hơn tay phải
  const pa = .6 * svc + .4 * ivc, dr = Math.min(.6, Math.max(0, da) * 2), leg = la2 * (1 - dr) + pa * dr;
  return { b, c, pp, rp, qp, qf, la, ra, ppa, pao, open, da, pv, svc, ivc, pa, sa: la2, leg }; };
const pct = x => Math.round(x * 100) + '%';

ZS.BEATS = [
{
  id: 'tc-dong-hoc', n: 1, title: 'Kháng thể mẹ tan dần & mũi Sởi 9 tháng', mode: 'thu',
  ask: { q: 'Vì sao mũi **Sởi** trong TCMR tiêm lúc **9 tháng** chứ không tiêm lúc 2 tháng như 5in1?',
    opts: ['Trẻ 2 tháng chưa có tế bào B', 'IgG sởi từ mẹ giảm dần theo hàm mũ — còn cao thì trung hòa virus vắc xin sống'], a: 1,
    why: 'Trẻ 2 tháng đã đáp ứng tốt với 5in1 (vắc xin bất hoạt). Vấn đề của vắc xin **sống** là IgG mẹ "tóm" virus vắc xin trước khi nó kịp nhân lên.' },
  ui: {
    model: 'curvePlot', init: { m: 2 }, box: [64, 30, 392, 296], samples: 72,
    x: { min: 0, max: 18, ticks: [0, 3, 6, 9, 12, 15, 18], label: 'Tháng tuổi' },
    y: { min: .001, max: 10, log: true, ticks: [.001, .01, .1, 1, 10], fmt: vn, label: 'IgG sởi (IU/mL)' },
    bands: [{ id: 'igg-drop', y0: .005, y1: .12, c: 'butter', label: 'Khoảng trống miễn dịch' }],
    hlines: [{ id: 'nguong', y: .12, label: 'Ngưỡng bảo vệ 0,12', cls: 'hot' }],
    vlines: [{ id: 'm9', x: 9, label: 'Mũi Sởi 9 th' }],
    curves: [{ id: 'igg-me', fn: x => IU(x), c: 'lav-i', label: 'IgG từ mẹ', at: 1 }],
    marker: { id: 'tuoi', x: v => v.m, y: v => IU(v.m) },
    ctl: [{ t: 'range', k: 'm', label: 'Tháng tuổi khi tiêm Sởi', min: 0, max: 18, step: .5, unit: 'tháng', snaps: [6, 9, 18], fmt: vn, zones: [[0, 4, 'mint-d'], [4, 7.6, 'butter-d'], [7.6, 18, 'sky-d']] }],
    drag: [{ k: 'm', box: [64, 30, 392, 296], r: [0, 18], step: .5 }],
    goal: s => s.m >= 9,
    decor: [
      { d: 'M404 70h144v270h-144Z', cls: 'panel' },
      { id: 'naive-b', d: C(476, 210, 30), cls: 'bcell' },
      { d: C(476, 210, 39), cls: 'glow', op: vxOK },
      { d: v => antibodies(476, 120 + 52 * vxOK(v)), cls: 'ab', op: v => 1 - vxOK(v) },
      { d: v => virus(476, 120 + 52 * vxOK(v)), cls: 'virus' },
      { id: 'b-mem', d: C(438, 294, 9) + C(476, 304, 9) + C(514, 294, 9), cls: 'bmem', op: v => vxOK(v) * vxOK(v) },
    ],
    texts: [{ at: [476, 88], t: 'Hạch lympho của bé', cls: 'alab' }, { at: [476, 264], t: 'Tế bào B non' }, { at: [476, 330], t: 'B nhớ', op: vxOK }],
    hud: v => [['Tuổi', vn(r1(v.m)) + ' tháng'], ['IgG mẹ', fIU(IU(v.m)) + ' IU/mL'], ['Mũi Sởi', vxOK(v) > .5 ? 'tạo miễn dịch ✓' : 'bị trung hòa ✗']],
  },
  chain: [
    { t: 'IgG sởi của mẹ qua nhau thai **giảm một nửa mỗi ~28 ngày** (bán rã hàm mũ).', hl: 'igg-me' },
    { t: 'Từ ~4 tháng IgG đã dưới **ngưỡng bảo vệ** nhưng vẫn đủ trung hòa virus vắc xin → **khoảng trống miễn dịch**.', hl: 'igg-drop', when: v => v.m >= 4 },
    { t: 'Khoảng **9 tháng** IgG mẹ gần cạn: virus sởi sống giảm độc lực chạm được **tế bào B non**.', hl: 'naive-b', when: v => vxOK(v) > .5 },
    { t: 'B biệt hóa thành tương bào + **B nhớ** → miễn dịch chủ động bền vững.', hl: 'b-mem', when: v => vxOK(v) > .9 },
  ],
  clin: 'TCMR: **Sởi đơn lúc 9 tháng**, nhắc **Sởi – Rubella (MR) lúc 18 tháng**.',
  trap: 'Trẻ sinh non nhận ít IgG mẹ hơn (IgG qua nhau nhiều nhất 3 tháng cuối thai kỳ), nhưng lịch tiêm Sởi vẫn tính theo **tuổi thực**.',
  pearl: 'Kháng thể mẹ là chiếc khiên của sơ sinh, nhưng là chướng ngại của vắc xin sống.',
  src: 'Nguồn: Tiêm chủng Text (BM Nhi ĐHYD TPHCM) — miễn dịch thụ động từ mẹ, lịch TCMR. Đường cong: mô hình bán rã IgG t½ 28 ngày, C₀ = 3 IU/mL.',
},
{
  id: 'tc-vx-song-corticoid', n: 2, title: 'Vắc xin sống & Corticoid toàn thân', mode: 'so',
  ask: { q: 'Bé hội chứng thận hư đang uống Prednisolone. Khi nào **bắt buộc tạm hoãn** vắc xin sống?',
    opts: ['Mọi liều corticoid, kể cả khí dung', 'Prednisolone ≥ 2 mg/kg/ngày, đang dùng hoặc mới ngưng < 14 ngày'], a: 1,
    why: 'Chỉ corticoid **toàn thân liều cao** mới ức chế miễn dịch tế bào đủ để virus vắc xin sống thoát kiểm soát.' },
  ui: {
    model: 'matrixGrid', init: { ca: 2 }, box: [150, 54, 384, 282],
    rows: [{ id: 'corticoid-high', label: 'Pred ≥ 2 mg/kg/ng' }, { id: 'lieu-thap', label: 'Pred < 2 mg/kg/ng' }, { id: 'tai-cho', label: 'Bôi / khí dung' }],
    cols: [{ label: 'Đang dùng' }, { label: 'Ngưng < 14 ng' }, { label: 'Ngưng ≥ 14 ng' }],
    cell: (v, i, j) => (i === 0 && j < 2 ? 'no' : 'ok') + (PK[Math.round(v.ca)] && PK[Math.round(v.ca)][0] === i && PK[Math.round(v.ca)][1] === j ? ' pick' : ''),
    cellText: (v, i, j) => i === 0 && j < 2 ? 'HOÃN' : 'Tiêm được',
    ctl: [{ t: 'steps', k: 'ca', label: 'Tình huống', opts: ['Khỏe mạnh', 'Hen khí dung', 'Thận hư: Pred 2 mg/kg', 'Thận hư: ngưng 3 tuần'] }],
    goal: s => s.ca === 3,
    decor: [
      { d: 'M404 70h144v270h-144Z', cls: 'panel' },
      { id: 'cd4-suppress', d: C(446, 140, 24), cls: 'bcell', op: v => 1 - .55 * supp(v) },
      { id: 'dai-thuc-bao', d: 'M478 214c14-22 50-16 54 8s-8 44-34 40-34-26-20-48Z', cls: 'mac', op: v => 1 - .55 * supp(v) },
      { id: 'disseminated', d: v => [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4 + .3, rr = 10 + 52 * supp(v); return virus(r1(492 + rr * Math.cos(a) * .9), r1(230 + rr * Math.sin(a))); }).join(''), cls: 'virus' },
    ],
    texts: [{ at: [476, 88], t: 'Virus vắc xin sống', cls: 'alab' }, { at: [446, 108], t: 'T CD4⁺' }, { at: [500, 286], t: 'Đại thực bào' }],
    stamp: { id: 'hoan', text: 'HOÃN VẮC XIN SỐNG', sub: 'Lao · Sởi · MR · Thủy đậu · Rota', at: [268, 312], w: 290, when: v => supp(v) > .5 },
    hud: v => [['Vắc xin sống', supp(v) > .5 ? 'TẠM HOÃN' : 'tiêm được ✓']],
  },
  chain: [
    { t: '**Prednisolone ≥ 2 mg/kg/ngày** toàn thân là liều ức chế miễn dịch.', hl: 'corticoid-high' },
    { t: 'Lympho **T CD4⁺** và đại thực bào bị ức chế → mất khả năng khống chế virus.', hl: 'cd4-suppress', when: v => supp(v) > .5 },
    { t: 'Virus vắc xin sống nhân lên không kiểm soát → **nhiễm trùng lan tỏa**.', hl: 'disseminated', when: v => supp(v) > .5 },
  ],
  clin: 'Bộ Y tế: tạm hoãn vắc xin sống khi **đang dùng hoặc mới ngưng < 14 ngày** corticoid liều cao (≥ 2 mg/kg/ngày). ACIP (Mỹ) chặt hơn: nếu đã dùng ≥ 14 ngày thì chờ **≥ 1 tháng** sau ngưng.',
  trap: 'Corticoid **bôi da, nhỏ mắt, khí dung** hen hoặc liều thấp **không** phải lý do hoãn vắc xin sống.',
  pearl: 'Corticoid tại chỗ là bạn; corticoid toàn thân liều cao là lệnh hoãn tiêm.',
  src: 'Nguồn: Tiêm chủng Text (BM Nhi ĐHYD) — các trường hợp tạm hoãn tiêm chủng theo quy định Bộ Y tế.',
},
{
  id: 'tc-tiem-bu-hoan', n: 3, title: 'Trễ hẹn tiêm: bù tiếp, không làm lại', mode: 'thu',
  ask: { q: 'Bé 8 tháng mới tiêm **1 mũi 5in1** lúc 2 tháng rồi bỏ dở. Nay tiêm thế nào?',
    opts: ['Tiêm lại từ đầu vì đã trễ quá lâu', 'Tiêm tiếp mũi 2 ngay, không làm lại từ đầu'], a: 1,
    why: 'Mũi 1 đã để lại **tế bào B nhớ**. Trễ hẹn không xóa trí nhớ miễn dịch — chỉ cần tiêm tiếp.' },
  ui: {
    model: 'curvePlot', init: { tre: 1, bu: 0 }, box: [64, 30, 540, 296], samples: 120,
    x: { min: 0, max: 20, ticks: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20], label: 'Tháng tuổi' },
    y: { min: 0, max: 150, ticks: [0, 50, 100, 150], label: 'Kháng thể (tương đối)' },
    hlines: [{ id: 'bao-ve', y: 40, label: 'Ngưỡng bảo vệ' }],
    vlines: [{ id: 'm1', x: 2, label: 'Mũi 1', top: true }, { id: 'mbu', x: d2, label: 'Mũi bù', top: true, cls: 'hot' }],
    curves: [{ id: 'anamnestic', fn: (x, v) => gResp(x - 2, 34, .45, 2.2) + v.bu * gResp(x - d2(v), 150, .1, 10), c: 'pink-i', lin: true }],
    ctl: [{ t: 'steps', k: 'tre', label: 'Trễ hẹn mũi 2', opts: ['1 tháng', '6 tháng', '1 năm'] }, { t: 'toggle', k: 'bu', label: 'Hành động', a: 'Chưa tiêm', b: 'Tiêm mũi bù 💉' }],
    goal: s => s.bu === 1,
    decor: [
      { id: 'gap-timeline', d: v => `M${sx3(3)} 280h${r1(sx3(d2(v)) - sx3(3))}v9h${-r1(sx3(d2(v)) - sx3(3))}Z`, cls: 'gap' },
      { id: 'b-memory-rest', d: C(82, 76, 12), cls: 'bmem' },
      { d: C(82, 76, 18), cls: 'glow', op: v => v.bu },
    ],
    texts: [{ at: [122, 80], t: v => v.bu > .5 ? 'B nhớ bừng tỉnh!' : 'B nhớ đang "ngủ"', anchor: 'start', cls: 'olab' }],
    hud: v => [['Trễ hẹn mũi 2:', ['1 tháng', '6 tháng', '1 năm'][Math.round(v.tre)]]],
  },
  chain: [
    { t: 'Trễ hẹn bao lâu cũng **không xóa** trí nhớ miễn dịch của mũi trước.', hl: 'gap-timeline' },
    { t: '**Tế bào B nhớ** vẫn nằm chờ trong tủy xương, hạch lympho.', hl: 'b-memory-rest' },
    { t: 'Mũi bù đánh thức B nhớ → **đáp ứng thứ phát**: kháng thể vọt cao chỉ sau vài ngày.', hl: 'anamnestic', when: v => v.bu > .5 },
  ],
  clin: 'Tiêm tiếp mũi kế tiếp theo lịch, **không tiêm lại từ đầu** bất kể mũi trước đã cách bao lâu.',
  trap: 'Hai vắc xin **sống** (Sởi, Thủy đậu…) không tiêm cùng ngày thì phải **cách nhau ≥ 28 ngày**. Khoảng cách **tối thiểu** là luật thép: tiêm sớm hơn > 4 ngày thì liều đó không được tính.',
  pearl: 'Khoảng cách tối thiểu là luật thép; khoảng cách tối đa không có hạn hủy bỏ.',
  src: 'Nguồn: Slide Tiêm chủng 2023 (BM Nhi ĐHYD, theo ACIP) — khoảng cách giữa các liều; Tiêm chủng Text — vắc xin sống cách 28 ngày.',
},
{
  id: 'beat-4-can-can-tang-truong', n: 4, title: 'Cán cân tăng trưởng & chiếc mặt nạ phù', mode: 'so',
  ask: { q: 'Bé 18 tháng, **CN/T = −1,2 SD** (tưởng bình thường) nhưng ấn lõm **mu 2 bàn chân**. Xếp loại?',
    opts: ['Bình thường vì Z-score > −2 SD', 'Suy dinh dưỡng cấp nặng thể phù (Kwashiorkor)'], a: 1,
    why: 'WHO: **phù ấn lõm 2 bàn chân** tự nó đã là SDD cấp nặng — nước phù làm cân nặng "đẹp" giả tạo.' },
  ui: {
    model: 'curvePlot', init: { w: 9.5, e: 0, pr: 0 }, box: [64, 40, 384, 290],
    x: { min: -4, max: 3, ticks: [-4, -3, -2, -1, 0, 1, 2, 3], label: 'Z-score CN/T' }, y: { min: 0, max: 110 },
    vlines: [{ id: 'sd3', x: -3, label: '−3' }, { id: 'sd2', x: -2, label: '−2' }],
    curves: [{ id: 'bell', fn: bell, c: 'sky-i' }],
    marker: { id: 'fake-weight', x: v => Math.max(-4, Math.min(3, Z4(v))), y: v => bell(Z4(v)) },
    ctl: [{ t: 'range', k: 'w', label: 'Cân nặng bé 18 tháng', min: 6, max: 14, step: .1, unit: 'kg', snaps: [7.8, 8.7], fmt: vn, off: s => s.e, zones: [[6, 7.8, 'pink-d'], [7.8, 8.7, 'butter-d'], [8.7, 14, 'mint-d']] }, { t: 'toggle', k: 'e', label: 'Bé này có phù?', a: 'KHÔNG', b: 'CÓ' }],
    // Kéo trên đường chuông = đổi cân nặng; ẤN GIỮ 3 giây lên mu chân = nghiệm pháp tìm dấu lõm
    drag: [{ k: 'w', box: [64, 40, 384, 290], r: [-4, 3], f: z => Math.max(6, Math.min(14, Math.round(10.9 * Math.exp(.11 * z) * 10) / 10)) }, { k: 'pr', box: [404, 90, 548, 300], hold: 3000 }],
    goal: s => s.e === 1,
    decor: [
      { d: R(64, 40, sx4(-3) - 64, 250), cls: 'zone', c: 'pink' }, { d: R(sx4(-3), 40, sx4(-2) - sx4(-3), 250), cls: 'zone', c: 'butter' },
      { d: R(60, 30, 330, 270), cls: 'fog', op: v => .72 * v.e },
      { d: 'M404 70h144v270h-144Z', cls: 'panel' },
      { d: v => `M414 282C414 250 426 ${r1(232 - 8 * v.e)} 444 ${r1(226 - 14 * v.e)}C462 ${r1(220 - 16 * v.e)} 470 196 474 168L476 120H512L514 178C516 214 530 240 540 262C544 276 538 284 526 284Z`, cls: '' },
      { id: 'hypoalbumin', d: v => C(450, r1(226 - 14 * v.e), 4 + 4 * v.pr), cls: 'pit', op: v => v.e * v.pr },
      { d: v => { const y = r1(176 + 40 * Math.sin(Math.PI * Math.min(1, v.pr * 1.15)) - 14 * v.e); return `M434 ${y - 84}V${y - 14}a16 15 0 0 0 32 0V${y - 84}ZM440 ${y - 22}q10 -8 20 0`; }, cls: 'thumb', op: v => v.pr < 1 ? 1 : 0 },
      { d: v => `M420 254a30 30 0 1 1 60 0`, cls: 'glow', op: v => v.pr > 0 && v.pr < 1 ? 1 : 0 },
    ],
    texts: [{ at: [476, 82], t: v => v.pr >= 1 ? 'Đã ấn đủ 3 giây' : v.pr > 0 ? 'Giữ… ' + Math.ceil(3 * (1 - v.pr)) + ' giây' : '👆 Ấn & giữ mu chân', cls: 'alab' }, { at: [476, 318], t: v => v.pr < 1 ? 'Chưa khám' : v.e > .5 ? 'Lõm (+) cả 2 chân' : 'Không lõm', cls: 'olab' }],
    stamp: { id: 'sam-alert', text: 'KWASHIORKOR', sub: 'SDD cấp nặng (SAM) — nguy kịch', at: [224, 150], w: 250, when: v => v.e > .5 },
    hud: v => [['CN/T', vn(r1(Z4(v))) + ' SD'], ['Xếp loại', v.e > .5 ? 'SDD cấp nặng (phù)' : Z4(v) < -3 ? 'Nhẹ cân nặng' : Z4(v) < -2 ? 'Nhẹ cân vừa' : 'Trong giới hạn']],
  },
  chain: [
    { t: 'Ăn thiếu đạm kéo dài → **giảm albumin máu** → nước thoát ra mô kẽ: phù trắng, mềm, **ấn lõm**.', hl: 'hypoalbumin', when: v => v.e > .5 },
    { t: 'Nước phù làm **cân nặng tăng giả tạo** → Z-score trông "bình thường".', hl: 'fake-weight', when: v => v.e > .5 },
    { t: 'Phù ấn lõm **2 bàn chân** = **SDD cấp nặng (SAM)**, bất kể Z-score.', hl: 'sam-alert', when: v => v.e > .5 },
  ],
  clin: 'Mọi trẻ khám dinh dưỡng: ấn ngón cái lên mu 2 bàn chân **3 giây**. SAM = **phù 2 bên** hoặc **CN/CC < −3 SD** hoặc **vòng cánh tay < 115 mm**.',
  trap: 'Thấy Z-score −1,2 SD mà kết luận "bình thường" là bỏ sót SAM — trẻ dễ **hạ đường huyết, hạ thân nhiệt**, nhiễm trùng nặng.',
  pearl: 'Phù là chiếc mặt nạ của cái cân: đừng để nước che mất khối cơ đã cạn kiệt.',
  src: 'Nguồn: Điều trị SDD trẻ em & Slide SDD (BM Nhi ĐHYD, theo WHO). Đường chuông: trung vị CN/T WHO bé trai 18 tháng ≈ 10,9 kg.',
},
{
  id: 'beat-5-tuoi-hieu-chinh-sinh-non', n: 5, title: 'Đồng hồ riêng của trẻ sinh non', mode: 'thu',
  ask: { q: 'Bé sinh non **28 tuần**, nay được **6 tháng** sau sinh. Chấm mốc tâm vận và Z-score theo tuổi nào?',
    opts: ['6 tháng — tuổi thực', '≈ 3 tháng — tuổi hiệu chỉnh'], a: 1,
    why: 'Thiếu 40 − 28 = **12 tuần** trong tử cung → trừ ~3 tháng. Bé lẫy, giữ cổ chắc lúc này là **đúng tuổi**.' },
  ui: {
    model: 'matrixGrid', init: { ga: 28, age: 6 }, box: [130, 50, 548, 290],
    x: { min: 0, max: 36, ticks: [0, 6, 12, 18, 24, 30, 36], label: 'Tháng' },
    rows: [{ id: 'tuoi-thuc', label: 'Tuổi thực' }, { id: 'myelination-delay', label: 'Tuổi hiệu chỉnh' }, { id: 'milestone-catchup', label: 'Mốc vận động' }],
    bars: [{ id: 'giu-co', row: 2, a: 2, b: 4, label: 'Giữ cổ' }, { id: 'lay', row: 2, lane: 1, a: 3, b: 5, label: 'Lẫy' }, { id: 'ngoi5', row: 2, a: 6, b: 9, label: 'Tự ngồi' }, { id: 'di5', row: 2, a: 12, b: 18, label: 'Tự đi' }],
    barState: (v, b) => corr(v) >= b.b ? 'ok' : corr(v) >= b.a ? 'warn' : '',
    cursor: { id: 'corr', x: corr, label: '' },
    ctl: [{ t: 'range', k: 'ga', label: 'Tuổi thai lúc sinh', min: 24, max: 40, step: 1, unit: 'tuần', snaps: [28, 32, 37], zones: [[24, 32, 'pink-d'], [32, 37, 'butter-d'], [37, 40, 'mint-d']] }, { t: 'range', k: 'age', label: 'Tuổi sau sinh', min: 1, max: 36, step: 1, unit: 'tháng', snaps: [6, 24] }],
    goal: s => s.ga <= 32 && s.age >= 6,
    drag: [{ k: 'age', box: [130, 66, 548, 114], r: [0, 36], step: 1, f: x => Math.max(1, x) }],
    decor: [
      { d: v => R(130, 78, sx5(v.age) - 130, 24), cls: 'barA' },
      { d: v => R(130, 158, Math.max(0, sx5(corr(v)) - 130), 24), cls: 'barB' },
      { id: 'preterm-deficit', d: v => R(sx5(corr(v)), 158, Math.max(1, sx5(v.age) - sx5(corr(v))), 24), cls: 'gap' },
      { id: 'moc-24', d: `M${sx5(24)} 44V290`, cls: 'dash' },
    ],
    texts: [{ at: v => [Math.min(sx5(v.age) + 6, 476), 95], t: v => 'Thực ' + v.age + ' th', anchor: 'start', cls: 'olab' },
      { at: v => [Math.min(sx5(v.age) + 6, 476), 175], t: v => 'HC ' + vn(r1(corr(v))) + ' th', anchor: 'start', cls: 'olab' },
      { at: [sx5(24), 40], t: 'Ngừng hiệu chỉnh', cls: 'vlab' }],
    hudAt: [10, 340, 'start'],
    hud: v => [['Thiếu', (40 - v.ga) + ' tuần ≈ ' + vn(r1((40 - v.ga) * 7 / 30.4)) + ' tháng' + (v.age > 24 ? ' — đã quá 24 tháng, dùng tuổi thực' : '')]],
  },
  chain: [
    { t: 'Sinh non 28 tuần = thiếu **12 tuần** phát triển trong tử cung.', hl: 'preterm-deficit' },
    { t: 'Não cần thời gian bù (myelin hóa, kết nối) → so với **tuổi hiệu chỉnh**, không so với tuổi thực.', hl: 'myelination-delay' },
    { t: 'Theo tuổi hiệu chỉnh, bé 6 tháng (HC ~3 tháng) giữ cổ, lẫy là **đúng tuổi** — không phải chậm.', hl: 'milestone-catchup' },
  ],
  clin: 'Tuổi hiệu chỉnh = tuổi thực − (40 − tuổi thai lúc sinh) tuần. Dùng để chấm **tăng trưởng và tâm vận đến 24 tháng**.',
  trap: 'Lịch tiêm chủng tính theo **tuổi thực**. Ngoại lệ: sinh < 34 tuần thì **BCG** (và VGB sơ sinh nếu mẹ HBsAg âm) chờ đủ 34 tuần tuổi thai hiệu chỉnh.',
  pearl: 'Đừng bắt trẻ sinh non chạy đua theo đồng hồ của trẻ đủ tháng.',
  src: 'Nguồn: Sự phát triển tâm thần vận động ở trẻ em (BM Nhi ĐHYD); Slide Tiêm chủng 2023 — tạm hoãn BCG/VGB khi tuổi thai < 34 tuần.',
},
{
  id: 'beat-6-denver-ii-red-flags', n: 6, title: 'Ma trận Denver II & cờ đỏ phát triển', mode: 'xem',
  ask: { q: 'Bé **12 tháng** bò nhanh, **chưa tự đi**, **không chỉ ngón trỏ** vào đồ vật. Cờ đỏ đáng lo nhất?',
    opts: ['Chưa tự đi', 'Không chỉ ngón trỏ (chia sẻ chú ý)'], a: 1,
    why: 'Tự đi bình thường có thể đến **18 tháng**. Nhưng **12 tháng không chỉ tay / không ra dấu** là chỉ định đánh giá tâm thần ngay.' },
  ui: {
    model: 'matrixGrid', init: { t: 1 }, box: [128, 40, 548, 288],
    x: { min: 0, max: 24, ticks: [0, 3, 6, 9, 12, 15, 18, 21, 24], label: 'Tháng tuổi' },
    rows: [{ id: 'social-circuit', label: 'Cá nhân – XH' }, { id: 'vd-tinh', label: 'Vận động tinh' }, { id: 'ngon-ngu', label: 'Ngôn ngữ' }, { id: 'vd-tho', label: 'Vận động thô' }],
    bars: BARS6, barState: st6,
    cursor: { id: 'tuoi6', x: age6, label: v => Math.round(age6(v)) + ' tháng' },
    ctl: [{ t: 'steps', k: 't', label: 'Bé "không chỉ tay, chưa đi" ở mốc', opts: ['9 tháng', '12 tháng', '18 tháng', '24 tháng'] }],
    goal: s => s.t >= 2,
    drag: [{ k: 't', box: [128, 40, 548, 288], r: [0, 24], f: a => a <= 9 ? 0 : a <= 12 ? (a - 9) / 3 : a <= 18 ? 1 + (a - 12) / 6 : 2 + (a - 18) / 6 }],
    stamp: { id: 'early-intervention', text: 'CỜ ĐỎ', sub: 'Đánh giá tâm thần ngay', at: [452, 70], w: 190, when: v => age6(v) >= 11.9 },
    hudAt: [10, 340, 'start'],
    hud: v => { const a = age6(v); return [['Kết luận:', a >= 17.9 ? 'cờ đỏ giao tiếp + vận động thô' : a >= 11.9 ? 'cờ đỏ giao tiếp (không chỉ tay)' : 'chưa có mốc trễ']]; },
  },
  chain: [
    { t: '12 tháng **không chỉ ngón trỏ** / không ra dấu = mất **chia sẻ chú ý**.', hl: 'joint-attention-loss', when: v => age6(v) >= 11.9 },
    { t: 'Gợi ý rối loạn mạng lưới **giao tiếp xã hội** (tự kỷ, chậm giao tiếp).', hl: 'social-circuit', when: v => age6(v) >= 11.9 },
    { t: 'Kích hoạt **cờ đỏ** → đánh giá tâm thần, can thiệp sớm.', hl: 'early-intervention', when: v => age6(v) >= 11.9 },
  ],
  clin: 'Đánh giá đủ **4 miền**. Chậm nói đơn thuần → **đo thính lực trước tiên**. Cờ đỏ vận động: 4 tháng chưa giữ đầu · 9 tháng chưa ngồi · **18 tháng chưa đi**.',
  trap: '18 tháng chưa tự đi là **cờ đỏ vận động thô** → khám thần kinh – cơ; bé trai cân nhắc đo **CK** tầm soát loạn dưỡng cơ Duchenne.',
  pearl: 'Mất kỹ năng đã có (**thoái lui**) về ngôn ngữ, giao tiếp ở bất kỳ tuổi nào là cờ đỏ mạnh nhất.',
  src: 'Nguồn: Sự phát triển tâm thần và vận động ở trẻ em (BM Nhi ĐHYD) — mục 5.1 dấu hiệu chậm phát triển. Thanh mốc: khoảng tuổi điển hình, làm tròn.',
},
{
  id: 'beat-12-foramen-ovale', n: 12, title: 'Sập van lỗ bầu dục khi trẻ chào đời', mode: 'thu',
  ask: { q: 'Trẻ khóc tiếng đầu tiên, phổi nở ra. Lá van lỗ bầu dục **sập lại vì đâu**?',
    opts: ['Tim phải co bóp mạnh hơn, đẩy lá van đóng', 'Máu từ phổi về nhĩ trái tăng → áp nhĩ trái vượt nhĩ phải, ép lá van vào vách', 'Kẹp rốn làm máu dồn về nhĩ phải, căng đóng van'], a: 1,
    why: 'Tiểu ĐM phổi giãn → máu lên phổi tăng → TM phổi đổ về **nhĩ trái** → áp nhĩ T vượt nhĩ P, ép lá van vào vách. Kẹp rốn làm áp nhĩ P **giảm**, không tăng.' },
  ui: {
    model: 'organHydraulic', fo: true, init: { b: 0, c: 0, pp: 0 },
    ids: { pvr: 'pulm-res', la: 'la-chamber', fo: 'fo-valve', gauge: 'p-gauge', da: 'da-flow' },
    ctl: [{ t: 'range', k: 'b', label: 'Phổi nở', min: 0, max: 1, step: .05, fmt: x => Math.round(x * 100), unit: '%' },
      { t: 'toggle', k: 'c', label: 'Dây rốn', a: 'Còn', b: 'Kẹp', d: 700 }, { t: 'toggle', k: 'pp', label: 'Đối chứng', a: 'Trẻ khỏe', b: 'Trẻ ngạt', d: 700 }],
    // kéo mép ngoài 2 lá phổi ra xa tim = phổi nở
    drag: [{ k: 'b', box: [20, 40, 178, 272], r: [1, 0], step: .05 }, { k: 'b', box: [382, 40, 540, 272], r: [0, 1], step: .05 }],
    goal: s => s.b >= .9 && s.c === 1 && !s.pp,
    calc: v => { const p = fo(v);
      return { hr: 140 - 10 * p.b, P: { ra: p.ra, la: p.la }, gauge: { ra: p.ra, la: p.la }, lung: p.b, cal: cl((1 / p.rp - 1) / 4), fo: p.open, da: 1, placenta: 1 - p.c, clamp: p.c,
        sat: { svc: p.svc, ivc: p.ivc, ra: (p.svc + p.ivc) / 2, rv: p.pa, pa: p.pa, la: p.sa, lv: p.sa, ao: p.sa, aoD: p.leg, pv: p.pv, uv: .85 },
        flow: { fo: p.qf, lung: p.qp, pa: p.qp + Math.max(0, p.da) * .6, da: p.da, uv: .8 * (1 - p.c), ivc: .8, svc: .6, ao: 1, body: 1 } }; },
    hudAt: [548, 282, 'end'],
    hud: v => { const p = fo(v); return [['Kháng lực phổi', pct(p.rp)], ['Lỗ bầu dục', p.open > .02 ? 'MỞ P→T' : 'ĐÓNG']].concat(p.c < .5
      ? [['SpO₂', 'nhau cấp O₂']] : [['SpO₂ tay P', pct(p.sa)], ['SpO₂ chân', pct(p.leg)]]); },
  },
  chain: [
    { t: 'Phổi nở + oxy → **tiểu ĐM phổi giãn**, kháng lực phổi tụt, máu ùa lên phổi.', hl: 'pulm-res', when: v => fo(v).rp < .6 },
    { t: 'TM phổi đổ về nhĩ T nhiều → **kim nhĩ T vượt kim nhĩ P**.', hl: 'p-gauge', when: v => fo(v).la > fo(v).ra },
    { t: 'Chênh áp ép **lá van** (nằm phía nhĩ T) vào vách → lỗ bầu dục đóng chức năng.', hl: 'fo-valve', when: v => fo(v).la > fo(v).ra },
    { t: 'Kẹp rốn: mất **bánh nhau** kháng lực thấp → áp ĐMC tăng, máu về nhĩ P giảm; ÔĐM đảo chiều T → P.', hl: 'nhau', when: v => v.c >= .5 },
  ],
  clin: 'Bật **Trẻ ngạt**, kéo phổi hết cỡ: tiểu ĐM vẫn co → van mở lại, ÔĐM P → T = **PPHN**. Đo SpO₂ **tay phải và chân**: tay cao hơn chân gợi ý shunt qua ÔĐM.',
  trap: 'Nhĩ T **đẩy** lá van đóng thụ động; tim P không "bơm" đóng van. Khóc, rặn làm áp nhĩ P vọt lên → van có thể mở lại thoáng qua.',
  pearl: 'Thứ quyết định van là **kháng lực phổi**, không phải bản thân nhát thở.',
  src: 'Nguồn: Đặc điểm hệ tuần hoàn trẻ em — BM Nhi ĐHYD TPHCM (2019), mục Tuần hoàn chuyển tiếp & sơ sinh.',
},
];
})();
