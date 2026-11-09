/* crash-data.js — Bảng liều cấp cứu theo cân nặng (POJO + hàm toán thuần, không DOM).
   Mỗi mục: dose(w, age) → { mg?, ml?, txt } ; syr = cỡ ống tiêm gợi ý (mL) để vẽ pít-tông. Nguồn: phác đồ BM Nhi ĐHYD (Sốc, Ngưng tim, Co giật). */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
const r2 = n => Math.round(n * 100) / 100, cap = (x, m) => Math.min(x, m);
ZS.CRASH = {
  w: { min: 3, max: 50, init: 15 },
  groups: [
    { t: 'Phản vệ – Ngưng tim', items: [
      { id: 'adr-im', name: 'Adrenaline 1:1000 (1 mg/mL)', use: 'Phản vệ từ độ II', route: 'TIÊM BẮP 1/3 giữa mặt trước ngoài đùi', syr: 1,
        dose: w => { const ml = cap(.01 * w, w <= 30 ? .3 : .5); return { ml: r2(ml), mg: r2(ml), txt: '0,01 mL/kg · tối đa 0,3 mL (≤ 30 kg) / 0,5 mL' }; },
        note: 'Nhắc lại mỗi 3–5 phút nếu chưa đáp ứng.', warn: 'CẤM tiêm tĩnh mạch trực tiếp dung dịch 1:1000.' },
      { id: 'adr-iv', name: 'Adrenaline 1:10.000 (0,1 mg/mL)', use: 'Ngưng tim', route: 'TM / tủy xương', syr: 10,
        dose: w => { const mg = cap(.01 * w, 1); return { mg: r2(mg), ml: r2(mg * 10), txt: '0,01 mg/kg = 0,1 mL/kg · tối đa 1 mg' }; },
        note: 'Pha 1 ống 1 mg + 9 mL NaCl 0,9%. Lặp lại mỗi 3–5 phút.' },
      { id: 'shock-e', name: 'Sốc điện', use: 'Rung thất / nhanh thất vô mạch', route: 'Phá rung',
        dose: w => ({ txt: `Lần 1: ${Math.round(2 * w)} J (2 J/kg) · lần 2: ${Math.round(4 * w)} J (4 J/kg) · tối đa 10 J/kg` }) },
    ] },
    { t: 'Sốc', items: [
      { id: 'bolus', name: 'Lactate Ringer / NaCl 0,9%', use: 'Bolus chống sốc (trừ sốc tim)', route: 'TM nhanh 5–20 phút', syr: 50,
        dose: w => ({ ml: Math.round(20 * w), txt: '20 mL/kg · đánh giá lại sau mỗi bolus' }), note: '> 40 kg: cần 2 đường truyền.' },
      { id: 'glu', name: 'Dextrose 10%', use: 'Hạ đường huyết', route: 'TM', syr: 50,
        dose: w => ({ ml: Math.round(5 * w), txt: '5 mL/kg (0,5 g/kg)' }), warn: 'Không dùng dịch có đường để chống sốc.' },
    ] },
    { t: 'Co giật – Sốt', items: [
      { id: 'mida', name: 'Midazolam (5 mg/mL)', use: 'Cắt cơn ≥ 5 phút', route: 'Tiêm bắp / TM chậm', syr: 1,
        dose: w => { const mg = cap(.2 * w, 10); return { mg: r2(mg), ml: r2(mg / 5), txt: '0,1–0,2 mg/kg · tối đa 10 mg' }; } },
      { id: 'diaz', name: 'Diazepam (5 mg/mL)', use: 'Cắt cơn, chưa có đường truyền', route: 'Bơm hậu môn (trẻ > 2 tuổi)', syr: 5,
        dose: w => { const mg = cap(.5 * w, 20); return { mg: r2(mg), ml: r2(mg / 5), txt: '0,2–0,5 mg/kg · tối đa 20 mg' }; } },
      { id: 'pheno', name: 'Phenobarbital', use: 'Thuốc hàng 2 (sơ sinh – nhũ nhi)', route: 'Truyền TM 15–30 phút',
        dose: w => ({ mg: Math.round(cap(20 * w, 1000)), txt: '20 mg/kg · tối đa 1.000 mg' }) },
      { id: 'para', name: 'Paracetamol', use: 'Hạ sốt', route: 'Uống / đặt hậu môn',
        dose: w => ({ mg: Math.round(cap(15 * w, 1000)), txt: '10–15 mg/kg/lần · cách 4–6 giờ · ≤ 60 mg/kg/ngày' }) },
    ] },
  ],
  // Ống NKQ không bóng (≥ 2 tuổi): ID = 4 + tuổi/4; có bóng: nhỏ hơn 0,5 mm
  ett: age => age >= 2 ? { plain: r2(4 + age / 4), cuff: r2(3.5 + age / 4) } : null,
};
})();
