/* beats-coban-2.js — Beats chủ đề 3–6 (tách file để mỗi tệp ≤ 350 dòng). Cùng schema với beats-coban.js. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {}, K = ZS.key;
const cl = v => Math.max(0, Math.min(1, v)), r1 = n => Math.round(n * 10) / 10, vn = n => String(n).replace('.', ',');
const C = (x, y, r) => ZS.svg.circ(x, y, r), R = (x, y, w, h) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
const bolt = (x, y) => `M${x} ${y}l-9 15h9l-7 17`;

// Màn 3.1 — gentamicin 4 mg/kg, mô hình 1 ngăn: người lớn / sơ sinh đủ tháng / non tháng
const pk = v => { const Vd = K(v.sub, [.25, .45, .6]), T = K(v.sub, [2, 5, 8]), k = Math.LN2 / T, e = Math.exp(-k * v.tau);
  return { Vd, T, k, c0: 4 / Vd, cl: Math.LN2 * Vd / T, tr: 4 / Vd * e / (1 - e) }; };
const conc = (t, v) => { const p = pk(v); let c = 0; for (let n = 0; n * v.tau <= t; n++) c += p.c0 * Math.exp(-p.k * (t - n * v.tau)); return c; };
// Màn 3.2 — Paracetamol trẻ 8 tuổi béo phì, IBW 25 kg
const per8 = v => Math.min(1000, 15 * (v.w + (25 - v.w) * v.ibw)), mgkg8 = v => 4 * per8(v) / 25, dep8 = v => cl((mgkg8(v) - 60) / 60);
// Màn 4.1 — sốt co giật
const cx9 = v => v.dur > 15 || v.foc > .5;
// Màn 4.2 — Nernst: E_Cl = 61,5·log10(Cl_trong / Cl_ngoài); a: 0 sơ sinh → 1 nhũ nhi; d: 0 chưa thuốc · 1 Midazolam · 2 Phenobarbital
const syn = v => { const cin = 30 - 23 * v.a, ecl = 61.5 * Math.log10(cin / 120), gw = K(v.d, [0, 1, 1]), pb = K(v.d, [0, 0, 1]), v0 = -50 - 25 * pb;
  return { cin, ecl, gw, pb, vm: v0 + .5 * gw * (ecl - v0) }; };
const spikes = (base, x) => base > -55 ? Math.min(30, 80 * Math.exp(-Math.pow((x * (8 + (base + 55)) % 1) - .5, 2) / .004) * cl((base + 55) / 8)) : 0;
// Màn 4.3 — Adrenaline 1:1000 = 1 mg/mL → 0,01 mL/kg, tối đa 0,3 mL (≤ 30 kg) / 0,5 mL
const vol11 = v => Math.min(.01 * v.w, v.w <= 30 ? .3 : .5), py11 = v => 300 - 240 * cl(v.pv), im = v => cl(1 - Math.abs(v.route - 1)) * cl(1 - Math.abs(v.pv - vol11(v)) * 20);

// Màn 5.2 — Fallot: phân chia cung lượng thất phải giữa phễu ĐMP (Rr) và lỗ TLT → ĐMC (Rs, tăng khi gối – ngực)
const tof = v => { const s = v.ph / 100, Rr = 1 + 9 * s * s, Rs = 1 + 1.5 * v.sq, fp = Rs / (Rs + .5 * Rr); return { s, fp, sat: fp * .98 + (1 - fp) * .55 }; };
const murmur = v => tof(v).fp > .45 ? 'to, dài' : tof(v).fp > .25 ? 'nhỏ, ngắn lại' : 'gần mất!';
// Màn 6.1 — Moro: t 0 nằm yên · 1 dang–duỗi · 2 khép ôm; cond 0 bình thường · 1 gãy đòn P · 2 Erb P (trái ảnh = bên phải bé)
const moroU = v => K(v.t, [125, 195, 140]), moroF = v => K(v.t, [20, 200, -10]), spr = v => K(v.t, [0, 1, .2]);
const hy = v => 84 - 6 * K(v.t, [0, 1, 0]); // đầu bé hơi ngửa khi thả đầu
const armU = v => K(v.cond, [moroU(v), 125, 100]), armF = v => K(v.cond, [moroF(v), 20, 95]), asym = v => cl(v.cond) * cl(v.t);
// Màn 6.2 — Oresol 245 mOsm/L / gói pha 1 lít; thêm 2 muỗng canh đường (~30 g) ≈ +166 mOsm/L
const osm = (x, v) => (245 + 166 * v.su) * 1000 / x, glu = v => (75 + 166 * v.su) * 1000 / v.vol, na = v => 75000 / v.vol;
const hex = (x, y) => `M${x - 6} ${y}l3-5h6l3 5-3 5h-6Z`, LUM = [[372, 74], [396, 96], [420, 70], [444, 92], [468, 72], [492, 98], [516, 76], [384, 118], [408, 132], [432, 114], [456, 130], [480, 116], [504, 134], [528, 112], [372, 136], [528, 136]];
// Màn 6.3 — thời gian nếp véo da trở về (giây): mất nước + kiểu dinh dưỡng (ty: 0 bình thường · 1 teo đét · 2 phù)
const T16 = v => { const b = .3 + 2.7 * cl((v.dh - 3) / 10), m = b + 2 * K(v.ty, [0, 1, 0]), e = K(v.ty, [0, 0, 1]); return m * (1 - e) + Math.min(m, .4) * e; };
const fake16 = v => Math.round(v.ty) === 1 && v.dh < 5 ? 'DƯƠNG TÍNH GIẢ' : Math.round(v.ty) === 2 && v.dh >= 10 ? 'ÂM TÍNH GIẢ' : '';

ZS.BEATS = (ZS.BEATS || []).concat([
{
  id: 'beat_07_pk_so_sinh', n: 7, title: 'Bể chứa dược động học sơ sinh', mode: 'thu',
  ask: { q: 'Vì sao gentamicin ở sơ sinh non tháng có **T½ dài gấp 3–4 lần** người lớn?',
    opts: ['Nước ngoại bào nhiều làm Vd lớn, trong khi GFR (Cl) còn thấp', 'Gentamicin gắn protein huyết tương rất mạnh'], a: 0,
    why: 'T½ = 0,693 · **Vd / Cl**: bể to hơn (Vd ↑) mà van xả nhỏ hơn (Cl ↓) thì nước rút chậm. Gentamicin gắn protein rất ít.' },
  ui: {
    model: 'organHydraulic', layout: 'tank', init: { sub: 2, tau: 8 },
    ids: { vd: 'ecf-tank', cl: 'gfr-clearance' }, tl: { nap: 'Gentamicin 4 mg/kg', vd: 'Dịch ngoại bào (Vd)', cl: 'Thận — Cl (GFR)' },
    calc: v => { const p = pk(v); return { vd: (p.Vd - .2) / .45, cl: p.cl / .09, level: cl(p.tr / 6 + .15), inflow: .6 }; },
    plot: { x: { min: 0, max: 96, ticks: [0, 24, 48, 72, 96], label: 'Giờ' }, y: { min: 0, max: 20, ticks: [0, 2, 10, 20], label: 'µg/mL' }, samples: 192,
      curves: [{ id: 'nong-do', fn: conc, c: 'sky-i', lin: true }], hlines: [{ id: 'ctrough-safe', y: 2, label: 'Đáy 2', end: true, cls: 'hot' }],
      marker: { id: 'cmax-peak', x: 0, y: v => pk(v).c0 } },
    ctl: [{ t: 'steps', k: 'sub', label: 'Bệnh nhân', opts: ['Người lớn', 'Sơ sinh đủ tháng', 'Sơ sinh non tháng'] }, { t: 'range', k: 'tau', label: 'Cữ dùng', min: 8, max: 48, step: 2, unit: 'giờ', snaps: [8, 24, 36, 48] }],
    goal: s => s.sub === 2 && s.tau >= 36,
    stamp: { id: 'tich-luy', text: 'TÍCH LŨY', sub: 'Độc thận + điếc → giãn cữ ngay', at: [185, 200], w: 240, when: v => pk(v).tr > 2 },
    hud: v => [['T½ ' + vn(r1(pk(v).T)) + ' giờ · C đáy', vn(r1(pk(v).tr)) + ' µg/mL']],
  },
  chain: [
    { t: 'Sơ sinh nhiều nước (≈ 75–80% thể trọng), **dịch ngoại bào rộng** → Vd gentamicin lớn.', hl: 'ecf-tank' },
    { t: 'Liều 4–5 mg/kg đẩy **C đỉnh** vượt ngưỡng diệt khuẩn (aminoglycoside diệt theo nồng độ).', hl: 'cmax-peak' },
    { t: '**GFR thấp** → Cl giảm → T½ = 0,693 · Vd/Cl kéo dài.', hl: 'gfr-clearance', when: v => v.sub > .5 },
    { t: 'Giãn cữ **24–48 giờ** để **C đáy < 2 µg/mL** trước liều kế.', hl: 'ctrough-safe', when: v => pk(v).tr < 2 },
  ],
  clin: 'Đo **C đáy** trước liều thứ 2–3; **> 2 µg/mL** → giãn cữ. Non tháng càng nhỏ tuổi thai, cữ càng giãn.',
  trap: 'Cho cữ 8–12 giờ như người lớn ở trẻ non tháng → thuốc **tích lũy** → điếc không hồi phục, tổn thương thận.',
  pearl: 'C đỉnh quyết định hiệu lực diệt khuẩn; C đáy quyết định độc tính trên thận và tai.',
  src: 'Nguồn: Kháng sinh tổng hợp (aminoglycoside) — tài liệu đọc thêm Y4; Vd, T½ theo tuổi: dược lý chuẩn, mô hình 1 ngăn.',
},
{
  id: 'beat_08_bay_lieu_paracetamol_aspirin', n: 8, title: 'Paracetamol ở trẻ béo phì: kho Glutathione', mode: 'so',
  ask: { q: 'Bé 8 tuổi béo phì **55 kg** (cân lý tưởng 25 kg). Liều Paracetamol mỗi cữ an toàn nhất?',
    opts: ['15 mg/kg × 55 kg = 825 mg/cữ', '15 mg/kg × 25 kg (IBW) = 375 mg/cữ'], a: 1,
    why: 'Paracetamol tan trong nước, phân bố theo **mô nạc** chứ không vào mỡ. Tính theo cân thực → quá liều so với gan thật của bé.' },
  ui: {
    model: 'organHydraulic', layout: 'tank', init: { w: 55, ibw: 0 },
    ids: { vd: 'obese-liver', muc: 'liver-glutathione', cl: 'napqi-necrosis' }, tl: { nap: 'Paracetamol vào gan', vd: 'Tế bào gan — kho Glutathione', cl: 'NAPQI rút cạn' },
    calc: v => ({ vd: .55, level: 1 - dep8(v), cl: .15 + .85 * dep8(v), inflow: mgkg8(v) / 60 }),
    plot: { x: { min: 25, max: 70, ticks: [25, 40, 55, 70], label: 'Cân thực (kg)' }, y: { min: 0, max: 4500, ticks: [0, 1500, 3000, 4500], fmt: x => vn(x / 1000) + ' g', label: 'Liều/ngày' },
      curves: [{ id: 'theo-thuc', fn: x => Math.min(1000, 15 * x) * 4, c: 'pink-i', lin: true }, { id: 'theo-ibw', fn: () => 1500, c: 'mint-i' }],
      hlines: [{ id: 'tran-4g', y: 4000, label: 'Trần 4 g', end: true, cls: 'hot' }], marker: { id: 'lieu', x: v => v.w, y: v => 4 * per8(v) } },
    ctl: [{ t: 'range', k: 'w', label: 'Cân nặng thực', min: 25, max: 70, step: 1, unit: 'kg', snaps: [25, 55] }, { t: 'toggle', k: 'ibw', label: 'Tính liều theo', a: 'Cân thực', b: 'Cân lý tưởng' }],
    goal: s => s.ibw === 1 && s.w >= 50,
    drag: [{ k: 'w', box: [392, 50, 545, 296], r: [25, 70], step: 1 }],
    stamp: { id: 'hoai-tu', text: 'HOẠI TỬ GAN', sub: 'NAPQI vượt kho Glutathione', at: [185, 200], w: 230, when: v => dep8(v) > .5 },
    hud: v => [['Liều/cữ', Math.round(per8(v)) + ' mg · ' + Math.round(mgkg8(v)) + ' mg/kg/ngày']],
  },
  chain: [
    { t: 'Béo phì: Paracetamol **không phân bố vào mỡ**, dồn vào mô nạc và gan.', hl: 'obese-liver' },
    { t: 'Tính theo cân thực → lượng NAPQI vượt khả năng trung hòa → **cạn Glutathione**.', hl: 'liver-glutathione', when: v => dep8(v) > .2 },
    { t: 'NAPQI tự do gắn protein tế bào gan → **hoại tử gan cấp**.', hl: 'napqi-necrosis', when: v => dep8(v) > .5 },
  ],
  clin: 'Paracetamol **10–15 mg/kg/lần**, cách 4–6 giờ; trẻ béo phì tính theo **cân lý tưởng**. Kawasaki (AHA): IVIG **2 g/kg** trong 10 ngày đầu + Aspirin **80–100 mg/kg/ngày**; hết sốt 48–72 giờ hạ còn **3–5 mg/kg/ngày**.',
  trap: 'Trần Paracetamol: **≤ 60 mg/kg/ngày**, **≤ 1 g/liều** và **≤ 4 g/ngày** — dù cân nặng bao nhiêu.',
  pearl: 'Ngộ độc Paracetamol: N-acetylcysteine (tiền chất Glutathione) hiệu quả nhất khi dùng **trong 8 giờ** đầu.',
  src: 'Nguồn: dược lý chuẩn & AHA 2017 (Kawasaki) — bộ tài liệu BM chưa có bài riêng; đối chiếu Dược thư Quốc gia trước khi kê.',
},
{
  id: 'sc-sot-giat', n: 9, title: 'Sốt co giật: đơn giản hay phức tạp?', mode: 'so',
  ask: { q: 'Bé 2 tuổi sốt 39,5°C, **giật toàn thân đối xứng 4 phút**, sau cơn tỉnh hoàn toàn. Xếp loại?',
    opts: ['Sốt co giật đơn giản', 'Sốt co giật phức tạp'], a: 0,
    why: 'Toàn thể + **< 15 phút** + không tái phát trong 24 giờ = đơn giản. Nhiệt độ cao bao nhiêu **không** quyết định xếp loại.' },
  ui: {
    model: 'reflexMechanic', init: { dur: 4, foc: 0 },
    ctl: [{ t: 'range', k: 'dur', label: 'Thời gian cơn giật', min: 1, max: 25, step: 1, unit: 'phút', snaps: [5, 15], zones: [[1, 15, 'mint-d'], [15, 25, 'pink-d']] }, { t: 'toggle', k: 'foc', label: 'Kiểu cơn', a: 'Toàn thể', b: 'Khu trú' }],
    goal: s => s.dur > 15 || s.foc === 1,
    drag: [{ k: 'dur', box: [474, 56, 524, 304], axis: 'y', r: [0, 25], step: 1, f: x => Math.max(1, x) }],
    decor: [
      { id: 'node-cortex', d: 'M272 76C214 60 132 84 120 168C110 248 170 304 268 296ZM288 76C346 60 428 84 440 168C450 248 390 304 292 296Z', cls: 'mac' },
      { d: 'M150 150c30-18 60 6 90-12M146 210c40 10 70-14 108 4M320 140c30 14 60-10 96 6M312 212c40-12 70 14 112 0', cls: 'line' },
      { d: [[170, 110], [220, 190], [160, 240], [340, 110], [380, 190], [330, 240]].map(p => bolt(p[0], p[1])).join(''), cls: 'alarm', op: v => 1 - v.foc },
      { d: C(400, 230, 30), cls: 'zone', c: 'red', op: v => v.foc * .6 }, { d: bolt(402, 214), cls: 'alarm', op: v => v.foc },
      { id: 'node-threshold', d: R(48, 80, 14, 150) + C(55, 248, 14), cls: 'bcell' }, { d: R(51, 100, 8, 140) + C(55, 248, 10), cls: 'virus' },
      { d: R(484, 60, 28, 240), cls: 'panel' },
      { id: 'node-safe-cortex', d: v => R(486, 300 - 9.6 * Math.min(v.dur, 15), 24, 9.6 * Math.min(v.dur, 15)), cls: 'bmem' },
      { d: v => R(486, 156 - 9.6 * Math.max(0, v.dur - 15), 24, 9.6 * Math.max(0, v.dur - 15)), cls: 'virus' },
      { id: 'moc-15', d: 'M478 156h40', cls: 'dash' },
    ],
    texts: [{ at: [55, 72], t: '39,5°C', cls: 'olab' }, { at: [498, 50], t: 'Thời gian', cls: 'alab' }, { at: [474, 160], t: '15′', cls: 'vlab', anchor: 'end' },
      { at: [498, 318], t: v => Math.round(v.dur) + ' phút', cls: 'olab' }, { at: [196, 326], t: 'Bán cầu P' }, { at: [364, 326], t: 'Bán cầu T' }],
    stamp: { id: 'phuc-tap', text: 'CO GIẬT PHỨC TẠP', sub: 'Khu trú · > 15 phút · tái phát trong 24 giờ', at: [280, 180], w: 300, when: cx9 },
    hudAt: [12, 22, 'start'],
    hud: v => [['Xếp loại:', cx9(v) ? 'PHỨC TẠP' : 'ĐƠN GIẢN']],
  },
  chain: [
    { t: 'Sốt làm vỏ não non nớt **vượt ngưỡng kích thích**.', hl: 'node-threshold' },
    { t: 'Phóng điện **lan tỏa đối xứng 2 bán cầu** → giật toàn thể co cứng – co giật.', hl: 'node-cortex', when: v => v.foc < .5 },
    { t: 'Cơn tự giới hạn **< 15 phút**, không tái phát trong 24 giờ → **đơn giản**, lành tính.', hl: 'node-safe-cortex', when: v => !cx9(v) },
  ],
  clin: 'Đơn giản = **toàn thể + < 15 phút + không tái phát trong 24 giờ**. Tìm ổ nhiễm trùng gây sốt, trấn an và hướng dẫn gia đình.',
  trap: '**Không chọc dò tủy thường quy.** Chỉ định (AAP): dấu hiệu nhiễm trùng TKTW · < 12 tháng co giật lần đầu chưa đủ Hib/phế cầu · > 12 tháng co giật **phức tạp** · đã dùng kháng sinh TM.',
  pearl: 'Thời gian cơn và tính đối xứng quyết định tiên lượng, không phải độ cao của nhiệt kế.',
  src: 'Nguồn: Co giật ở trẻ em (Phác đồ – BM Nhi ĐHYD) — phân loại sốt co giật, chỉ định chọc dò dịch não tủy.',
},
{
  id: 'sc-cat-con-giat', n: 10, title: 'Nghịch lý GABA ở sơ sinh', mode: 'so',
  ask: { q: 'Ở trẻ sơ sinh, vì sao benzodiazepine (Midazolam) có thể **cắt cơn kém**?',
    opts: ['NKCC1 mạnh làm Cl⁻ trong tế bào cao — mở GABA-A khiến Cl⁻ thoát ra, màng khử cực', 'Midazolam độc gan ở sơ sinh'], a: 0,
    why: 'Chiều dòng Cl⁻ do **E_Cl** quyết định. Cl⁻ nội bào cao → E_Cl ≈ −37 mV, cao hơn điện thế màng → GABA thành kích thích.' },
  ui: {
    model: 'synapseCircuit', init: { a: 0, d: 0 },
    chans: [
      { id: 'node-nkcc1', x: 70, kind: 'pump', label: 'NKCC1', sub: () => 'Cl⁻ vào', flux: v => 1 - v.a, act: v => 1 - .8 * v.a },
      { id: 'kcc2', x: 160, kind: 'pump', label: 'KCC2', sub: () => 'Cl⁻ ra', flux: v => -v.a, act: v => .2 + .8 * v.a },
      { id: 'node-cl-efflux', x: 255, label: 'GABA-A', open: v => syn(v).gw, sub: v => syn(v).gw < .1 ? 'đóng' : syn(v).vm < syn(v).ecl ? 'Cl⁻ RA!' : 'Cl⁻ vào', flux: v => syn(v).gw * Math.sign(syn(v).vm - syn(v).ecl) },
      { id: 'node-ampa-block', x: 345, label: 'AMPA', cls: 'na', open: v => 1 - syn(v).pb, sub: v => syn(v).pb > .5 ? 'bị chẹn' : 'Na⁺ vào', flux: v => 1 - syn(v).pb },
    ],
    pools: [{ area: [26, 40, 376, 112], max: 24, n: 24 }, { area: [26, 204, 236, 316], max: 24, n: v => 24 * syn(v).cin / 30 }],
    plot: { x: { min: 0, max: 1 }, y: { min: -90, max: 30, ticks: [-80, -55, -30, 0], fmt: x => x, label: 'mV' }, samples: 160,
      curves: [{ id: 'vm', c: 'pink-i', lin: true, fn: (x, v) => { const s = syn(v), b = x < .3 ? -50 : s.vm; return b + spikes(b, x); } }],
      hlines: [{ id: 'ecl', y: v => syn(v).ecl, label: 'E_Cl' }, { id: 'nguong', y: -55, label: 'ngưỡng', end: true }] },
    ctl: [{ t: 'toggle', k: 'a', label: 'Lứa tuổi', a: 'Sơ sinh < 7 ngày', b: 'Nhũ nhi > 1 tháng' }, { t: 'steps', k: 'd', label: 'Thuốc cắt cơn', opts: ['Chưa thuốc', 'Midazolam', 'Phenobarbital'] }],
    goal: s => s.a === 0 && s.d === 2,
    stamp: { id: 'nghich-ly', text: 'KHỬ CỰC NGHỊCH LÝ', sub: 'Mở GABA-A → Cl⁻ thoát ra', at: [200, 78], w: 250, when: v => v.a < .5 && v.d > .5 && v.d < 1.5 },
    hudAt: [380, 236, 'end'],
    hud: v => { const s = syn(v); return [['Cl⁻ trong', Math.round(s.cin) + ' mM'], ['E_Cl', Math.round(s.ecl) + ' mV'], ['Vm', Math.round(s.vm) + ' mV']]; },
  },
  chain: [
    { t: 'Sơ sinh: bơm **NKCC1** trội → Cl⁻ nội bào cao (≈ 30 mM) → E_Cl ≈ −37 mV.', hl: 'node-nkcc1', when: v => v.a < .5 },
    { t: 'Mở **GABA-A** (benzodiazepine): Cl⁻ **thoát ra** → màng khử cực thay vì ức chế.', hl: 'node-cl-efflux', when: v => v.a < .5 && v.d > .5 },
    { t: 'Phenobarbital ngoài GABA-A còn **chẹn AMPA** (glutamate) → giảm kích thích không phụ thuộc Cl⁻.', hl: 'node-ampa-block', when: v => v.d > 1.5 },
  ],
  clin: 'Trẻ lớn, cơn > 5 phút: Midazolam **0,1–0,2 mg/kg** TB/TM hoặc Diazepam bơm hậu môn **0,2–0,5 mg/kg**. Phenobarbital **20 mg/kg** TTM 15–30 phút. **WHO**: Phenobarbital là thuốc đầu tay cho co giật **sơ sinh**; phác đồ BM: là thuốc hàng 2 ưu tiên ở sơ sinh – nhũ nhi khi benzodiazepine thất bại.',
  trap: 'Không nhét thìa, đè lưỡi hay vắt chanh vào miệng trẻ đang giật — **nằm nghiêng an toàn**, hút đàm, thở oxy.',
  pearl: 'Thời gian là tế bào não: cơn kéo dài **5 phút** là lệnh phải dùng thuốc cắt cơn.',
  src: 'Nguồn: Co giật ở trẻ em (Phác đồ – BM Nhi ĐHYD) — thuốc cắt cơn; E_Cl tính theo phương trình Nernst (37°C).',
},
{
  id: 'sc-phan-ve-adrenaline', n: 11, title: 'Ống tiêm 1 mL: Adrenaline tiêm bắp đùi', mode: 'thu',
  ask: { q: 'Sau tiêm 10 phút, bé nổi mề đay + **thở rít** (phản vệ độ II). Thuốc đầu tay cứu mạng?',
    opts: ['Methylprednisolon tĩnh mạch', 'Adrenaline 1:1000 tiêm bắp mặt trước ngoài đùi'], a: 1,
    why: 'Corticoid tác dụng chậm (giờ). Chỉ **Adrenaline** đảo ngược phù thanh quản và giãn mạch trong vài phút.' },
  ui: {
    model: 'reflexMechanic', init: { w: 15, route: 0, pv: 0 },
    ctl: [{ t: 'range', k: 'w', label: 'Cân nặng', min: 3, max: 50, step: 1, unit: 'kg', snaps: [10, 15, 30, 50] }, { t: 'steps', k: 'route', label: 'Đường tiêm', opts: ['Chưa tiêm', 'Bắp đùi', 'Tĩnh mạch trực tiếp'] }],
    goal: s => s.route === 1 && Math.abs(s.pv - vol11(s)) <= .011,
    // KÉO PÍT-TÔNG rút thuốc tới đúng vạch (0,01 mL/kg); hình chỉ đổi khi tay bạn kéo
    drag: [{ k: 'pv', box: [130, 40, 236, 304], axis: 'y', r: [-.0167, 1.083], step: .01, f: x => Math.max(0, Math.min(1, x)) }],
    decor: [
      { d: R(150, 60, 60, 240), cls: 'panel' }, { d: 'M180 300v40', cls: 'line' },
      { d: v => R(152, py11(v), 56, 300 - py11(v)), cls: 'virus' },
      { d: v => R(146, py11(v) - 8, 68, 8) + R(176, py11(v) - 52, 8, 44) + R(160, py11(v) - 60, 40, 8), cls: 'gap grip' },
      { d: Array.from({ length: 21 }, (_, i) => `M210 ${300 - 12 * i}h${i % 2 ? -6 : -12}`).join(''), cls: 'line' },
      { d: 'M300 70C292 150 300 250 318 330H404C412 250 420 150 410 70Z', cls: '' },
      { id: 'node-im-thigh', d: C(386, 196, 14), cls: 'glow' }, { d: C(386, 196, 5), cls: 'virus' },
      { id: 'node-anaphylaxis-shock', d: v => `M452 60C${r1(470 + 8 * (1 - im(v)))} 110 ${r1(470 + 8 * (1 - im(v)))} 150 452 200M536 60C${r1(518 - 8 * (1 - im(v)))} 110 ${r1(518 - 8 * (1 - im(v)))} 150 536 200`, cls: 'ab' },
      { id: 'node-rescue-flow', d: 'M494 70V190', cls: 'glow', op: im },
    ],
    texts: [{ at: [222, 304], t: '0', anchor: 'start' }, { at: [222, 184], t: '0,5', anchor: 'start' }, { at: [222, 64], t: '1 mL', anchor: 'start' },
      { at: v => [140, py11(v) + 4], t: v => vn((+v.pv).toFixed(2)) + ' mL', anchor: 'end', cls: 'olab' }, { at: [180, 30], t: v => v.pv < .005 ? '↕ Kéo pít-tông rút thuốc' : Math.abs(v.pv - vol11(v)) <= .011 ? '✓ Đúng liều!' : v.pv > vol11(v) ? 'Quá liều — đẩy bớt' : 'Chưa đủ — rút thêm', cls: 'alab' },
      { at: [358, 346], t: 'Mặt trước ngoài đùi' }, { at: [494, 52], t: 'Thanh quản', cls: 'alab' }, { at: [494, 222], t: v => im(v) > .5 ? 'đã mở ✓' : 'phù nề, thở rít', cls: 'olab' }],
    stamp: { id: 'cam-tm', text: 'CẤM TIÊM TĨNH MẠCH', sub: 'Adrenaline 1:1000 nguyên chất → rung thất', at: [400, 296], w: 270, when: v => v.route > 1.5 },
    hudAt: [12, 22, 'start'],
    hud: v => [['Cần rút', vn(vol11(v).toFixed(2)) + ' mL'], ['Đã rút', vn((+v.pv).toFixed(2)) + ' mL']],
  },
  chain: [
    { t: 'Phản vệ độ II: giãn mạch, **phù nề thanh quản** → thở rít, tụt huyết áp.', hl: 'node-anaphylaxis-shock' },
    { t: 'Tiêm bắp **1/3 giữa mặt trước ngoài đùi**: cơ giàu mạch, hấp thu nhanh nhất.', hl: 'node-im-thigh', when: v => im(v) > .5 },
    { t: 'Adrenaline kích thích **α1** (co mạch, giảm phù) và **β2** (giãn phế quản) → đường thở mở lại.', hl: 'node-rescue-flow', when: v => im(v) > .5 },
  ],
  clin: 'Adrenaline 1:1000 **0,01 mL/kg** tiêm bắp (tối đa **0,3 mL** trẻ nhỏ – **0,5 mL** trẻ lớn), nhắc lại mỗi **3–5 phút** nếu chưa đáp ứng. Chỉ định ngay từ **độ II**.',
  trap: '**CẤM** tiêm tĩnh mạch trực tiếp dung dịch 1:1000 → loạn nhịp, rung thất. Đường TM chỉ là truyền liên tục dung dịch pha loãng, có monitor.',
  pearl: 'Phản vệ từ độ II: tiêm Adrenaline trước, hỏi han sau — chậm trễ mới là sai lầm chết người.',
  src: 'Nguồn: Chẩn đoán và điều trị sốc ở trẻ em (BM Nhi ĐHYD); Tiêm chủng Text — phân độ & xử trí phản vệ theo Bộ Y tế.',
},
{
  id: 'beat-13-ductus-fallot', n: 13, title: 'Fallot: cơn tím & tư thế gối – ngực', mode: 'thu',
  ask: { q: 'Vì sao tư thế **gối – ngực** (ngồi xổm) cắt được cơn tím thiếu oxy trong tứ chứng Fallot?',
    opts: ['Giúp trẻ bớt khóc, đỡ tốn oxy', 'Gập ĐM đùi → tăng kháng lực ngoại biên → giảm shunt phải – trái qua lỗ TLT, máu dồn lên phổi'], a: 1,
    why: 'Máu thất phải chọn đường **ít trở kháng**: phễu ĐMP hẹp hay ĐMC qua lỗ thông liên thất. Tăng kháng lực hệ thống thì máu quay về phổi.' },
  ui: {
    model: 'organHydraulic', init: { ph: 40, sq: 0 },
    ids: { rvot: 'rvot-stenosis', svr: 'femoral-kink', phoi: 'pulm-rescue-flow' },
    murmur: v => tof(v).fp, // độ to âm thổi phễu ∝ dòng máu qua phễu
    calc: v => { const t = tof(v); return { hr: 110 + 50 * (1 - t.fp), lung: .6 + .4 * t.fp, rvot: t.s, vsd: 1, svr: v.sq, da: 0, fo: 0,
      sat: { svc: .55, ivc: .55, ra: .55, rv: .55, pa: .55, la: .98, lv: t.sat, ao: t.sat },
      flow: { pa: .3 + 1.4 * t.fp, lung: 1.4 * t.fp, vsd: (1 - t.fp) * 1.3, ao: 1.2, ivc: .8 } }; },
    ctl: [{ t: 'range', k: 'ph', label: 'Co thắt phễu ĐMP', min: 0, max: 100, step: 5, unit: '%', snaps: [50, 100], zones: [[0, 50, 'mint-d'], [50, 80, 'butter-d'], [80, 100, 'pink-d']] }, { t: 'toggle', k: 'sq', label: 'Tư thế', a: 'Nằm', b: 'Gối – ngực' }],
    goal: s => s.ph >= 90 && s.sq === 1,
    stamp: { id: 'con-tim', text: 'CƠN TÍM THIẾU OXY', sub: 'Âm thổi nhỏ lại / mất — cấp cứu', at: [104, 74], w: 200, when: v => tof(v).fp < .25 },
    hud: v => [['SpO₂', Math.round(tof(v).sat * 100) + '%'], ['Âm thổi phễu', murmur(v)]],
  },
  chain: [
    { t: 'Kích xúc (khóc, rặn) → **co thắt phễu ĐMP** → máu thất phải không lên được phổi.', hl: 'rvot-stenosis', when: v => v.ph >= 50 },
    { t: 'Gối – ngực **gập ĐM đùi** → kháng lực hệ thống tăng, máu tĩnh mạch về tim tăng.', hl: 'femoral-kink', when: v => v.sq > .5 },
    { t: 'Shunt phải → trái qua lỗ TLT giảm → máu **dồn lên phổi** lấy oxy.', hl: 'pulm-rescue-flow', when: v => v.sq > .5 },
  ],
  clin: 'Cơn tím: **gối – ngực**, thở oxy, an thần (morphin 0,1 mg/kg), chống toan, ức chế β (propranolol), thuốc co mạch tăng kháng lực ngoại biên.',
  trap: 'Âm thổi Fallot do **hẹp phễu**: hẹp càng nặng âm thổi càng **nhỏ và ngắn**. Âm thổi **biến mất** trong cơn tím là dấu hiệu nguy kịch, không phải bệnh đỡ.',
  pearl: 'Hai nhánh song song: tăng trở kháng nhánh hệ thống thì dòng chảy dồn về nhánh phổi.',
  src: 'Nguồn: Tứ chứng Fallot (BM Nhi ĐHYD) — mục 5.5 cơn tím thiếu oxy, 8.1.1 xử trí cơn tím.',
},
{
  id: 'beat-14-moro-reflex', n: 14, title: 'Phản xạ Moro 2 thì & bất đối xứng', mode: 'xem',
  ask: { q: 'Sơ sinh: Moro tay **trái** bung bình thường, tay **phải** nằm im. Nghĩ tổn thương nào đầu tiên?',
    opts: ['Tổn thương bán cầu não trái', 'Gãy xương đòn phải hoặc liệt đám rối cánh tay (Erb C5–C6) bên phải'], a: 1,
    why: 'Moro **bất đối xứng** gợi ý tổn thương **ngoại biên** một bên (xương đòn, đám rối). Tổn thương trung ương thường làm Moro yếu/mất cả hai bên.' },
  ui: {
    model: 'reflexMechanic', init: { t: 0, cond: 0 },
    shapes: [
      { d: 'M168 36H392Q414 36 414 58V316Q414 338 392 338H168Q146 338 146 316V58Q146 36 168 36Z', cls: 'mat' },
      { d: 'M240 122C228 128 226 150 230 175C234 210 244 240 252 262H308C316 240 326 210 330 175C334 150 332 128 320 122C300 114 260 114 240 122Z' },
      { d: 'M250 236H310L304 268C296 280 264 280 256 268Z', c: 'sky' },
    ],
    limbs: [
      { id: 'moro-asymmetry', at: [244, 132], end: 'hand', spread: v => K(v.cond, [spr(v), 0, 0]), segs: [{ len: 52, ang: armU, w: 15 }, { len: 46, ang: armF, w: 13 }] },
      { id: 'tay-trai', at: [316, 132], end: 'hand', spread: spr, segs: [{ len: 52, ang: v => 180 - moroU(v), w: 15 }, { len: 46, ang: v => 180 - moroF(v), w: 13 }] },
      { at: [262, 258], segs: [{ len: 46, ang: 115, w: 16 }, { len: 40, ang: 70, w: 14 }] },
      { at: [298, 258], segs: [{ len: 46, ang: 65, w: 16 }, { len: 40, ang: 110, w: 14 }] },
    ],
    over: [
      { d: v => C(246, hy(v) + 4, 8) + C(314, hy(v) + 4, 8) }, { d: v => C(280, hy(v), 34) },
      { d: v => `M262 ${hy(v) - 30}q10 -14 22 -4q6 -12 16 2`, cls: 'hair' },
      { d: v => C(260, hy(v) + 10, 6) + C(300, hy(v) + 10, 6), cls: 'cheek' },
      { d: v => `M264 ${hy(v) - 2}q6 4 12 0M284 ${hy(v) - 2}q6 4 12 0`, cls: 'line', op: v => 1 - K(v.t, [0, 1, 0]) },
      { d: v => C(270, hy(v) - 2, 3.2) + C(290, hy(v) - 2, 3.2), cls: 'eye', op: v => K(v.t, [0, 1, 0]) },
      { d: v => `M273 ${hy(v) + 13}q7 6 14 0`, cls: 'line', op: v => 1 - K(v.t, [0, 1, 1]) },
      { d: v => C(280, hy(v) + 16, 3 + 4 * K(v.t, [0, 0, 1])), cls: 'pit', op: v => K(v.t, [0, 1, 1]) },
      { d: v => `M258 ${hy(v) + 2}q-3 7 0 11M302 ${hy(v) + 2}q3 7 0 11`, cls: 'tear', op: v => K(v.t, [0, 0, 1]) },
      { id: 'don', d: 'M280 124L246 131', cls: 'line' },
      { d: 'M258 122l4 6-5 3 4 6', cls: 'alarm', op: v => K(v.cond, [0, 1, 0]) },
    ],
    ctl: [{ t: 'steps', k: 't', label: 'Nghiệm pháp hạ đầu 30°', opts: ['Nằm yên', 'Thì 1: dang – duỗi', 'Thì 2: khép ôm'] }, { t: 'steps', k: 'cond', label: 'Tình trạng', opts: ['Bình thường', 'Gãy xương đòn P', 'Liệt Erb C5–C6 P'] }],
    goal: s => s.cond > 0 && s.t > 0,
    decor: [
      { id: 'vestibular-nuclei', d: v => `M318 ${78 - 6 * K(v.t, [0, 1, 0])}a8 8 0 1 1 8 8a4 4 0 1 1 -4-4`, cls: 'glow', op: v => cl(v.t * 2) },
      { id: 'extensor-arm', d: 'M150 92l-26-8m26 8l-18 10M410 92l26-8m-26 8l18 10', cls: 'alarm', op: v => K(v.t, [0, 1, 0]) },
      { id: 'flexor-arm', d: 'M196 150l26 4m-26-4l14-14M364 150l-26 4m26-4l-14-14', cls: 'ab', op: v => K(v.t, [0, 0, 1]) },
    ],
    texts: [{ at: [168, 318], t: 'Tay phải bé', cls: 'olab' }, { at: [392, 318], t: 'Tay trái bé', cls: 'olab' }],
    stamp: { id: 'bat-doi-xung', text: 'MORO BẤT ĐỐI XỨNG', sub: 'Sờ xương đòn · khám đám rối C5–C6', at: [444, 64], w: 210, when: v => asym(v) > .5 },
    hudAt: [12, 22, 'start'],
    hud: v => [['Thì', ['nằm yên', 'dang – duỗi, xòe ngón', 'khép ôm, khóc'][Math.round(v.t)]], ['Đối xứng', asym(v) > .5 ? 'MẤT (bên phải)' : 'có']],
  },
  chain: [
    { t: 'Hạ đầu đột ngột kích thích **tiền đình** → khởi phát cung phản xạ thân não.', hl: 'vestibular-nuclei', when: v => v.t > .3 },
    { t: 'Thì 1: hai tay **dang – duỗi**, ngón **xòe hình chữ C**.', hl: 'extensor-arm', when: v => v.t > .5 },
    { t: 'Thì 2: hai tay **khép – gập ôm** vào ngực, thường kèm khóc.', hl: 'flexor-arm', when: v => v.t > 1.5 },
    { t: 'Một tay nằm im → **gãy xương đòn** hoặc **liệt Erb C5–C6** bên đó.', hl: 'moro-asymmetry', when: v => asym(v) > .5 },
  ],
  clin: 'Khám Moro **cả 2 bên**. Gãy xương đòn: lạo xạo, dấu "phím đàn". Liệt Erb: cánh tay **duỗi, khép sát thân, xoay trong, bàn tay úp** (C5–C6 ± C7).',
  trap: 'Moro mất tự nhiên khoảng **4–6 tháng**; còn tồn tại **sau 6 tháng** là dấu hiệu gợi ý tổn thương thần kinh trung ương (bại não).',
  pearl: 'Mất đối xứng = hỏng "đòn bẩy" (xương đòn) hoặc "dây cáp" (đám rối) một bên, không phải hỏng "tổng đài" (não).',
  src: 'Nguồn: Khám trẻ sơ sinh (BM Nhi ĐHYD) — mục 4.9 xương đòn, liệt đám rối thần kinh cánh tay.',
},
{
  id: 'beat-15-oresol-osmosis', n: 15, title: 'Bơm SGLT-1 & thẩm thấu Oresol', mode: 'thu',
  ask: { q: 'Vì sao Oresol giảm thẩm thấu (245 mOsm/L) giữ **Glucose : Na ≈ 1 : 1** và **cấm pha thêm đường**?',
    opts: ['Đường dư làm quá tải SGLT-1, lòng ruột thành ưu trương → tiêu chảy thẩm thấu', 'Đường làm giảm hấp thu kẽm'], a: 0,
    why: 'SGLT-1 kéo **1 glucose + Na⁺** cùng lúc, nước đi theo. Glucose dư không được hấp thu, nằm lại trong ruột và **hút nước ngược ra**.' },
  ui: {
    model: 'curvePlot', init: { vol: 1000, su: 0 }, box: [64, 40, 330, 290], samples: 90,
    x: { min: 100, max: 2000, ticks: [100, 500, 1000, 1500, 2000], label: 'Nước pha 1 gói (mL)' },
    y: { min: 0, max: 900, ticks: [0, 300, 600, 900], label: 'mOsm/L' },
    bands: [{ id: 'huyet-tuong', y0: 275, y1: 295, c: 'mint', label: 'Huyết tương' }],
    hlines: [{ id: 'ors', y: 245, label: '245' }],
    curves: [{ id: 'pha', fn: osm, c: 'sky-i' }],
    marker: { id: 'ly-pha', x: v => v.vol, y: v => osm(v.vol, v) },
    ctl: [{ t: 'range', k: 'vol', label: 'Lượng nước pha', min: 100, max: 2000, step: 50, unit: 'mL', snaps: [1000], zones: [[100, 800, 'pink-d'], [800, 1200, 'mint-d'], [1200, 2000, 'butter-d']] }, { t: 'toggle', k: 'su', label: 'Thêm 2 muỗng canh đường', a: 'Không', b: 'Có' }],
    goal: s => s.su === 1,
    drag: [{ k: 'vol', box: [64, 40, 330, 290], r: [100, 2000], step: 50 }],
    decor: [
      { d: 'M356 50h192v290h-192Z', cls: 'panel' },
      { id: 'lumen-conc', d: v => LUM.slice(0, Math.min(16, Math.round(6 * glu(v) / 75))).map(p => hex(p[0], p[1])).join(''), cls: 'bmem' },
      { d: v => LUM.slice(0, Math.min(16, Math.round(6 * na(v) / 75))).map(p => C(p[0] + 10, p[1] + 10, 4)).join(''), cls: 'ab' },
      { d: R(356, 160, 192, 70), cls: 'mac' },
      { id: 'sglt1-pump', d: C(452, 160, 13), cls: 'pit' },
      // Hoạt hình đồng vận: cặp glucose (lục giác) + Na⁺ (tròn) chui qua SGLT-1; nước đi theo. Ưu trương → bơm bão hòa, nước bị hút ngược
      { d: hex(446, 132) + C(460, 132, 4), cls: 'bmem pair', op: v => .25 + .75 * cl((330 - osm(v.vol, v)) / 40) }, { d: hex(446, 132) + C(460, 132, 4), cls: 'bmem pair p2', op: v => .25 + .75 * cl((330 - osm(v.vol, v)) / 40) },
      { d: C(476, 140, 4) + C(484, 128, 3), cls: 'drop', op: v => cl((330 - osm(v.vol, v)) / 40) }, { d: C(424, 140, 4) + C(432, 128, 3), cls: 'drop p2', op: v => cl((330 - osm(v.vol, v)) / 40) },
      { d: C(400, 214, 4) + C(508, 214, 4), cls: 'drop up', op: v => cl((osm(v.vol, v) - 310) / 40) },
      { id: 'gut-efflux', d: v => osm(v.vol, v) > 310 ? 'M410 290V176m0 0l-8 12m8-12l8 12M494 290V176m0 0l-8 12m8-12l8 12' : 'M410 176V290m0 0l-8-12m8 12l8-12M494 176V290m0 0l-8-12m8 12l8-12', cls: 'alarm' },
      { id: 'brain-shrink', d: v => { const k = 1 - .35 * cl((na(v) - 75) / 75 + (osm(v.vol, v) - 300) / 300); return C(452, 302, 22 * k); }, cls: 'mac' },
    ],
    texts: [{ at: [452, 44], t: 'Lòng ruột', cls: 'alab' }, { at: [452, 202], t: 'Tế bào ruột · SGLT-1' }, { at: [452, 250], t: v => osm(v.vol, v) > 310 ? 'Nước bị hút ra lòng ruột!' : 'Nước theo Na⁺ vào máu', cls: 'olab' }, { at: [500, 306], t: 'Não', anchor: 'start' }],
    stamp: { id: 'tieu-chay-tham-thau', text: 'TIÊU CHẢY THẨM THẤU', sub: 'Lòng ruột ưu trương hút nước ngược', at: [200, 110], w: 250, when: v => osm(v.vol, v) > 330 },
    hud: v => [['ALTT', Math.round(osm(v.vol, v)) + ' mOsm/L'], ['Na⁺', Math.round(na(v)) + ' mmol/L']],
  },
  chain: [
    { t: '**Glucose : Na⁺ = 75 : 75** → SGLT-1 kéo cặp đôi vào tế bào, nước đi theo.', hl: 'sglt1-pump' },
    { t: 'Thêm đường / pha đặc → glucose dư, lòng ruột **ưu trương** (> huyết tương).', hl: 'lumen-conc', when: v => osm(v.vol, v) > 310 },
    { t: 'Nước bị **hút ngược** từ máu ra lòng ruột → tiêu chảy nặng thêm.', hl: 'gut-efflux', when: v => osm(v.vol, v) > 310 },
    { t: 'Mất nước nhiều hơn muối → **tăng Na máu** → tế bào não mất nước, co lại.', hl: 'brain-shrink', when: v => osm(v.vol, v) > 330 },
  ],
  clin: 'Oresol giảm thẩm thấu: Glucose 75 · Na 75 · K 20 · Cl 65 · Citrate 10 mmol/L → **245 mOsm/L** (huyết tương 275–295). Pha **nguyên gói** với **đúng lượng nước** ghi trên bao; không thêm đường, sữa, nước ngọt.',
  trap: 'Nước ngọt công nghiệp **500–700 mOsm/L** làm tiêu chảy nặng thêm. Pha quá đặc → tăng Na máu; pha quá loãng → bù Na kém.',
  pearl: 'SGLT-1 là động cơ kéo nước cứu sinh; thêm đường là đổ cát vào buồng đốt.',
  src: 'Nguồn: Tiêu chảy cấp (BM Nhi ĐHYD, E-learning) — mục 9.2 dung dịch bù nước Oresol.',
},
{
  id: 'beat-16-skin-pinch', n: 16, title: 'Dấu véo da & bẫy dinh dưỡng', mode: 'so',
  ask: { q: 'Trẻ SDD thể **phù (Kwashiorkor)** tiêu chảy **mất nước nặng**. Dấu véo da sẽ ra sao?',
    opts: ['Mất rất chậm > 2 giây', 'Mất nhanh — âm tính giả do mô kẽ ứ dịch'], a: 1,
    why: 'Nếp véo da đo **độ căng của mô kẽ**, không đo trực tiếp thể tích lòng mạch. Mô kẽ phù đẩy nếp da về ngay.' },
  ui: {
    model: 'reflexMechanic', init: { dh: 12, ty: 0, pull: 0 },
    shapes: [
      { d: 'M30 236H530V330H30Z', c: 'pink' },
      { d: v => { const f = K(v.ty, [22, 4, 40]); return `M30 ${236 - f}H530V236H30Z`; }, c: 'butter' },
    ],
    over: [
      { id: 'false-negative-pinch', d: v => { const f = K(v.ty, [22, 4, 40]), y = 236 - f, h = 4 + 74 * cl(v.pull); return `M30 ${y}H220C246 ${y} 262 ${r1(y - h)} 280 ${r1(y - h)}C298 ${r1(y - h)} 314 ${y} 340 ${y}H530V${y + 8}H30Z`; } },
      { id: 'interstitial-fluid', d: v => [60, 110, 160, 380, 430, 480].map(x => C(x, 222, 5)).join(''), cls: 'ab', op: v => K(v.ty, [0, 0, 1]) },
      { id: 'hypovolemic-shock', d: v => C(280, 292, 18 - 10 * cl(v.dh / 15)), cls: 'virus' },
    ],
    ctl: [{ t: 'range', k: 'dh', label: 'Mức mất nước thật', min: 0, max: 15, step: 1, unit: '%', snaps: [5, 10], zones: [[0, 5, 'mint-d'], [5, 10, 'butter-d'], [10, 15, 'pink-d']] }, { t: 'steps', k: 'ty', label: 'Thể trạng', opts: ['Bình thường', 'Teo đét (Marasmus)', 'Phù (Kwashiorkor)'] }],
    goal: s => s.ty === 2 && s.dh >= 10,
    // KÉO nếp da lên rồi THẢ: nếp da trở về đúng T giây (thời gian thật)
    drag: [{ k: 'pull', box: [170, 110, 390, 250], axis: 'y', r: [-.4, 1.2], f: x => Math.max(0, Math.min(1, x)), up: (s, set) => set('pull', 0, Math.max(150, T16(s) * 1000)) }],
    decor: [
      { d: C(474, 104, 40), cls: 'panel' },
      { d: v => { const a = (cl(T16(v) / 3) * 300 - 90) * Math.PI / 180; return `M474 104L${r1(474 + 32 * Math.cos(a))} ${r1(104 + 32 * Math.sin(a))}`; }, cls: 'alarm' },
    ],
    texts: [{ at: [474, 162], t: v => vn(r1(T16(v))) + ' giây', cls: 'olab' }, { at: [474, 56], t: 'Nếp da trở về', cls: 'alab' }, { at: [280, 276], t: v => v.pull > .05 ? '✋ Thả tay ra!' : '☝ Véo & kéo nếp da lên', cls: 'alab' },
      { at: [80, 322], t: 'Cơ thành bụng', anchor: 'start' }, { at: [280, 340], t: 'Lòng mạch' }],
    stamp: { id: 'gia', text: fake16, sub: v => fake16(v) === 'ÂM TÍNH GIẢ' ? 'Phù che giấu mất nước nặng' : 'Mất mỡ dưới da, không phải mất nước', at: [200, 90], w: 260, when: v => !!fake16(v) },
    hudAt: [12, 22, 'start'],
    hud: v => [['Véo da mất', T16(v) > 2 ? 'rất chậm (> 2 giây)' : T16(v) > 1 ? 'chậm (< 2 giây)' : 'nhanh'], ['Thực tế', v.dh > 10 ? 'mất nước nặng' : v.dh >= 5 ? 'có mất nước' : 'không mất nước']],
  },
  chain: [
    { t: 'Phù mô kẽ tạo **sức căng** đẩy nếp da phẳng lại tức thì.', hl: 'interstitial-fluid', when: v => v.ty > 1.5 },
    { t: 'Che giấu tình trạng **giảm thể tích lòng mạch** đang diễn ra.', hl: 'hypovolemic-shock', when: v => v.dh >= 10 },
    { t: '**Âm tính giả** → trì hoãn bù dịch cấp cứu.', hl: 'false-negative-pinch', when: v => fake16(v) === 'ÂM TÍNH GIẢ' },
  ],
  clin: 'Véo nếp da bụng (giữa rốn và mạn sườn, **theo chiều dọc cơ thể**), giữ ~1 giây rồi thả. Mất **rất chậm > 2 giây** + 1 dấu khác (li bì, mắt trũng, không uống được) = **mất nước nặng**.',
  trap: '**Dương tính giả** ở trẻ teo đét Marasmus (mất mỡ dưới da) và **âm tính giả** ở trẻ phù hoặc béo phì. Luôn đối chiếu tri giác, mắt, khát, mạch.',
  pearl: 'Nếp véo da đo độ căng của mô kẽ — đừng nhầm mô kẽ ứ nước với lòng mạch đủ dịch.',
  src: 'Nguồn: IMCI 2016 & Tiêu chảy cấp (BM Nhi ĐHYD) — đánh giá mất nước, dấu véo da.',
},
]);
})();
