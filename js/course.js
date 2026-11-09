/* course.js — 3 trạm OSCE 6 phút (POJO). items: 8 bước đúng (pts) + bẫy crit (chọn = ĐIỂM LIỆT). Tổng 10 điểm, đạt ≥ 5 và không liệt. */
'use strict';
(() => {
const ZS = window.ZS = window.ZS || {};
ZS.OSCE = [
{ id: 'osce-giat', ic: '🔥', title: 'Cấp cứu co giật do sốt', beat: 'sc-cat-con-giat',
  scene: 'Bé 2 tuổi, 12 kg, đang co giật toàn thân 4 phút, sốt 39,8°C. Mẹ hoảng loạn. Bạn là bác sĩ trực.',
  items: [
    { t: 'Giữ bình tĩnh, đặt trẻ nằm nghiêng an toàn, dọn vật cứng xung quanh', pts: 1 },
    { t: 'Hút đàm nhớt, khai thông đường thở', pts: 1 },
    { t: 'Thở oxy', pts: 1 },
    { t: 'Ghi giờ khởi phát; cơn ≥ 5 phút → Diazepam bơm hậu môn 0,5 mg/kg (6 mg) hoặc Midazolam', pts: 2 },
    { t: 'Thử đường huyết mao mạch', pts: 1 },
    { t: 'Hạ sốt: Paracetamol 15 mg/kg, lau mát', pts: 1 },
    { t: 'Sau cơn: đánh giá tri giác, dấu thần kinh khu trú, dấu màng não, tìm ổ nhiễm', pts: 1.5 },
    { t: 'Giải thích – tư vấn gia đình về sốt co giật', pts: 1.5 },
    { t: 'Nhét thìa / đè lưỡi vào miệng chống cắn lưỡi', crit: true, why: 'Gây tắc đường thở, gãy răng, hít sặc.' },
    { t: 'Giữ chặt tay chân để cơn ngưng', crit: true, why: 'Không cắt được cơn, gây chấn thương.' },
  ] },
{ id: 'osce-phan-ve', ic: '💉', title: 'Sàng lọc tiêm chủng & phản vệ', beat: 'sc-phan-ve-adrenaline',
  scene: 'Bé 4 tuổi, 16 kg đến tiêm. 10 phút sau tiêm: mề đay, khàn tiếng, thở rít, SpO₂ 91%.',
  items: [
    { t: 'Trước tiêm: hỏi tiền sử phản vệ / phản ứng nặng lần trước', pts: 1 },
    { t: 'Hỏi bệnh lý, thuốc đang dùng (corticoid, ức chế miễn dịch)', pts: 1 },
    { t: 'Đo nhiệt độ, khám toàn thân trước tiêm', pts: 1 },
    { t: 'Theo dõi tại chỗ 30 phút sau tiêm', pts: 1 },
    { t: 'Nhận diện phản vệ độ II (da + hô hấp)', pts: 1.5 },
    { t: 'Adrenaline 1:1000 0,16 mL (0,01 mL/kg) tiêm bắp mặt trước ngoài đùi', pts: 2 },
    { t: 'Nằm đầu thấp nâng chân, thở oxy, gọi hỗ trợ', pts: 1.5 },
    { t: 'Theo dõi mạch, HA, SpO₂ mỗi 3–5 phút; nhắc liều nếu chưa đáp ứng', pts: 1 },
    { t: 'Tiêm tĩnh mạch trực tiếp Adrenaline 1:1000', crit: true, why: 'Nguy cơ loạn nhịp, rung thất.' },
    { t: 'Cho uống kháng histamin rồi chờ theo dõi', crit: true, why: 'Trì hoãn Adrenaline trong phản vệ độ II là sai lầm chết người.' },
  ] },
{ id: 'osce-mat-nuoc', ic: '💧', title: 'Đánh giá mất nước tiêu chảy cấp', beat: 'beat-16-skin-pinch',
  scene: 'Bé 10 tháng, 8 kg, tiêu lỏng 8 lần/ngày. Đánh giá mất nước và xử trí trước mặt giám khảo.',
  items: [
    { t: 'Đánh giá tri giác (tỉnh / kích thích / li bì)', pts: 1 },
    { t: 'Xem mắt trũng', pts: 1 },
    { t: 'Cho uống nước, đánh giá khát', pts: 1 },
    { t: 'Véo da bụng giữa rốn – mạn sườn, theo chiều dọc, giữ 1 giây rồi thả', pts: 1.5 },
    { t: 'Phân loại đúng theo IMCI', pts: 1.5 },
    { t: 'Chọn phác đồ B: Oresol 75 mL/kg trong 4 giờ', pts: 1.5 },
    { t: 'Hướng dẫn pha Oresol đúng + kẽm 10–14 ngày', pts: 1.5 },
    { t: 'Dặn dấu hiệu cần quay lại khám ngay', pts: 1 },
    { t: 'Véo da ngang thành bụng', crit: true, why: 'Sai kỹ thuật → đọc sai dấu véo da.' },
    { t: 'Pha Oresol thêm đường cho dễ uống', crit: true, why: 'Ưu trương → tiêu chảy thẩm thấu nặng thêm.' },
  ] },
];
})();
