/* myths.js — 20 bẫy lâm sàng Đúng/Sai (POJO). t = nhận định, ok = đúng hay sai, why = giải thích, beat = màn cơ chế. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
ZS.MYTHS = [
  { t: 'Trẻ sốt ≥ 38°C (đo nách) cần tạm hoãn tiêm chủng.', ok: true, why: 'Ngưỡng tạm hoãn: sốt ≥ 38°C hoặc hạ thân nhiệt ≤ 35,5°C.', beat: 'tc-vx-song-corticoid' },
  { t: 'Trễ hẹn mũi 2 hơn 1 năm thì phải tiêm lại từ đầu.', ok: false, why: 'Không bao giờ tiêm lại từ đầu — B nhớ vẫn còn.', beat: 'tc-tiem-bu-hoan' },
  { t: 'Hai vắc xin sống không tiêm cùng ngày phải cách nhau ≥ 28 ngày.', ok: true, why: 'Tránh giao thoa đáp ứng interferon giữa 2 vắc xin sống.', beat: 'tc-tiem-bu-hoan' },
  { t: 'Trẻ hen dùng corticoid khí dung phải hoãn vắc xin sống.', ok: false, why: 'Chỉ corticoid toàn thân liều cao (≥ 2 mg/kg/ngày) mới phải hoãn.', beat: 'tc-vx-song-corticoid' },
  { t: 'Lịch tiêm chủng của trẻ sinh non tính theo tuổi hiệu chỉnh.', ok: false, why: 'Tiêm theo tuổi thực; riêng BCG/VGB sơ sinh chờ đủ 34 tuần nếu sinh < 34 tuần.', beat: 'beat-5-tuoi-hieu-chinh-sinh-non' },
  { t: 'Phù ấn lõm 2 bàn chân là SDD cấp nặng dù Z-score bình thường.', ok: true, why: 'Tiêu chuẩn WHO: phù 2 bên tự nó là SAM.', beat: 'beat-4-can-can-tang-truong' },
  { t: 'Trẻ 12 tháng chưa tự đi là chậm phát triển vận động.', ok: false, why: 'Cờ đỏ khi 18 tháng chưa tự đi.', beat: 'beat-6-denver-ii-red-flags' },
  { t: '12 tháng không chỉ tay / không ra dấu là chỉ định đánh giá tâm thần.', ok: true, why: 'Mất chia sẻ chú ý — cờ đỏ giao tiếp.', beat: 'beat-6-denver-ii-red-flags' },
  { t: 'Sơ sinh non tháng dùng gentamicin cữ 8 giờ như người lớn.', ok: false, why: 'Vd lớn, Cl thấp → T½ dài → giãn cữ 24–48 giờ.', beat: 'beat_07_pk_so_sinh' },
  { t: 'Trẻ béo phì: tính Paracetamol theo cân nặng thực tế.', ok: false, why: 'Tính theo cân lý tưởng; trần ≤ 60 mg/kg/ngày, ≤ 4 g/ngày.', beat: 'beat_08_bay_lieu_paracetamol_aspirin' },
  { t: 'Sốt càng cao thì cơn co giật càng "phức tạp".', ok: false, why: 'Phân loại dựa vào thời gian, tính khu trú, tái phát — không dựa nhiệt độ.', beat: 'sc-sot-giat' },
  { t: 'Mọi trẻ sốt co giật lần đầu đều phải chọc dò tủy sống.', ok: false, why: 'Chỉ khi có chỉ định (dấu màng não, < 12 tháng chưa đủ Hib/phế cầu, > 12 tháng co giật phức tạp…).', beat: 'sc-sot-giat' },
  { t: 'Nên nhét thìa vào miệng trẻ đang giật để chống cắn lưỡi.', ok: false, why: 'Gây tắc thở, gãy răng — đặt nằm nghiêng an toàn.', beat: 'sc-cat-con-giat' },
  { t: 'Adrenaline 1:1000 có thể tiêm tĩnh mạch trực tiếp khi phản vệ nặng.', ok: false, why: 'Nguy cơ rung thất — chỉ tiêm bắp; TM là truyền pha loãng có monitor.', beat: 'sc-phan-ve-adrenaline' },
  { t: 'Tiêm bắp 1/3 giữa mặt trước ngoài đùi là vị trí ưu tiên của Adrenaline.', ok: true, why: 'Cơ giàu mạch, hấp thu nhanh nhất.', beat: 'sc-phan-ve-adrenaline' },
  { t: 'Lỗ bầu dục đóng nhờ nhĩ phải co bóp mạnh sau sinh.', ok: false, why: 'Nhĩ trái tăng áp đẩy lá van đóng một cách thụ động.', beat: 'beat-12-foramen-ovale' },
  { t: 'Ống động mạch thường đóng chức năng trong 10–15 giờ đầu sau sinh.', ok: true, why: 'Đóng giải phẫu vào tuần 2–3.', beat: 'beat-12-foramen-ovale' },
  { t: 'Trong cơn tím Fallot, âm thổi to hơn vì máu chảy mạnh hơn.', ok: false, why: 'Âm thổi nhỏ lại hoặc mất do ít máu qua phễu — dấu nguy kịch.', beat: 'beat-13-ductus-fallot' },
  { t: 'Pha thêm đường vào Oresol giúp trẻ dễ uống và hấp thu tốt hơn.', ok: false, why: 'Gây ưu trương → tiêu chảy thẩm thấu.', beat: 'beat-15-oresol-osmosis' },
  { t: 'Véo da mất nhanh ở trẻ phù giúp loại trừ mất nước nặng.', ok: false, why: 'Âm tính giả do mô kẽ ứ dịch.', beat: 'beat-16-skin-pinch' },
];
})();
