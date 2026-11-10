# Storyboard — nâng cấp mô hình tim (beat-12, beat-13)

Hội đồng: Feynman · Norman · Osler · Kahneman (4/4 phản hồi) + 1 phản biện độc lập.
Loại hình: **giải phẫu động + bộ phận máy chồng lên mốc giải phẫu** (không thay tim bằng máy trừu tượng). Lý do: người dùng đòi tim giải phẫu thật, 2 phổi, 2 vòng; điều cần học (đường máu đi qua lỗ bầu dục / lỗ TLT / ÔĐM) gắn với vị trí giải phẫu.

## Nền chung (engine `organHydraulic` layout heart, viết lại)
- Phổi P 3 thùy, phổi T 2 thùy + khuyết tim. Trong phổi: cây **tiểu ĐM phổi** (màu máu ĐMP) và cây **TM phổi** (màu máu TM phổi). **Cỡ tiểu ĐM = kháng lực phổi** (`cal`), nhìn thấy được.
- Tim cắt đứng ngang: 4 buồng, vách liên nhĩ có **lỗ bầu dục ở phần thấp** (gần TMC dưới), lá vách nguyên phát nằm **phía nhĩ T**, bản lề dưới, mở vào nhĩ T. Vách liên thất dày. Van 3 lá, 2 lá, van ĐMP, van ĐMC vẽ tĩnh làm mốc (không diễn hoạt chu chuyển — bác vì gây nhiễu).
- Mạch: TMC trên/dưới vào nhĩ P; ĐMC lên → quai (3 nhánh) → ĐMC xuống đi **sau tim**; thân ĐMP đi **trước** gốc ĐMC (bắt chéo xoắn), chia ĐMP T (trước ĐMC xuống) và ĐMP P (đi sau ĐMC lên, dưới quai); ÔĐM nối chỗ chia ĐMP với **mặt dưới quai, phía xa chỗ tách ĐM dưới đòn T**; TM phổi 2 bên về nhĩ T (bên P đi sau nhĩ P). Mạch trước có viền.
- Màu ÔĐM theo chiều dòng: P→T lấy màu ĐMP, T→P lấy màu ĐMC (sửa lỗi cũ).
- Vòng lớn: khối "Cơ thể" dưới đáy; ĐMC xuống vào, TMC dưới ra.

## Trang 1 — beat-12 "Sập van lỗ bầu dục khi trẻ chào đời" (mode thu)
- **Mô hình (sửa nhân quả):** trung gian là kháng lực phổi `rp`, không phải nhát thở.
  - `rp = 1 − 0,8·b·(1 − 0,7·pp)`; dòng phổi `qp = 0,2/rp`; `LA = 2 + 4·qp`; `RA = 3 + 1,5·(1−c) + 1,5·rp`; `P_ĐMP = 20 + 50·rp`, `P_ĐMC = 45 + 10·c`; dòng ÔĐM `= (P_ĐMP − P_ĐMC)/15`.
  - Kiểm (node, sau dựng): thai RA 6 > LA 2,8 (mở, ÔĐM P→T, tay 67% · chân 61%) · thở+kẹp RA 3,3 < LA 6 (đóng, ÔĐM T→P, 98%) · **PPHN** RA 4,14 > LA 3,05 (mở lại, ÔĐM P→T, tay P 72% · chân 64%) · **ngạt chưa thở mà kẹp** RA 4,5 > LA 2,8 (mở) — sửa lỗi cũ (cũ cho đóng). Van lật quanh phổi nở ~65% khi đã kẹp rốn.
- **Tay nắm chính:** kéo **mép lá phổi ra ngoài theo trục x** = phổi nở `b` (0–100%). Thay thế: thanh trượt "Phổi nở" + phím ←/→.
- **Mắt xích thấy được:** phổi phồng + sáng màu → tiểu ĐM phổi giãn to → TM phổi dày dòng → **đồng hồ 2 kim (nhĩ P xanh, nhĩ T đỏ) gắn trên vách liên nhĩ**, hai kim cùng trục để so trực tiếp → lá van lật đóng khi kim nhĩ T vượt kim nhĩ P → dòng qua lỗ tắt.
- Điều khiển phụ: công tắc **Dây rốn Còn/Kẹp** (kẹp vẽ trên dây rốn; bánh nhau mờ đi), công tắc **Trẻ Khỏe/Ngạt (PPHN)** = lượt đối chứng.
- **ask (3 lựa chọn):** Phổi nở, lá van sập vì đâu? (a) tim P co mạnh đẩy van · (b) **máu phổi về nhĩ T tăng → P nhĩ T vượt P nhĩ P** · (c) kẹp rốn dồn máu về nhĩ P.
- **Đối chứng:** bật Ngạt rồi kéo phổi hết cỡ: phổi vẫn nở nhưng tiểu ĐM co, kim nhĩ T không vượt, van mở, ÔĐM P→T, SpO₂ tay P > chân.
- **Ca biên kiểm mô hình:** ngạt, chưa thở, đã kẹp rốn → van phải MỞ. Trẻ khóc/rặn làm RA thoáng tăng (Thử nhớ, không mô phỏng).
- HUD: Kháng lực phổi % · Lỗ bầu dục MỞ/ĐÓNG · SpO₂ tay P / chân (chỉ hiện khi đã kẹp rốn; còn dây rốn ghi "thai: nhau trao đổi O₂").
- SpO₂: `pv = 0,62 + 0,36·b`; `LA = (qp·pv + Qfo·ivc)/(qp + Qfo)`, Qfo = 1,2·mở; tay P = LA; chân = LA trộn máu ĐMP theo dòng ÔĐM P→T.
- Goal: b ≥ 0,9 & kẹp & khỏe.
- hl: `pulm-res` (tiểu ĐM phổi), `p-gauge` (đồng hồ), `la-chamber`, `fo-valve`, `nhau`, `da-flow`.

## Trang 2 — beat-13 "Fallot: cơn tím & tư thế gối – ngực" (mode thu)
- **Vẽ đủ 4 thành phần:** hẹp phễu (vòng cơ quanh đường ra thất P, dưới van ĐMP; thân ĐMP nhỏ) · **TLT** phần cao (quanh màng) vách liên thất, ngay dưới van ĐMC · **ĐMC to cưỡi trên lỗ TLT** · **phì đại thất P** (thành dày, buồng nhỏ, mỏm hếch).
- **Mô hình (sửa):** TLT rộng ⇒ 2 thất cùng áp, cung lượng chia theo kháng lực 2 lối: `Rr = 0,6 + 5,4·s²` (s = co thắt phễu), `Rs = 1 + 0,6·sq`, `q = Qp/Qs = Rs/(Rr + 0,15)`. Nếu q < 1: shunt P→T, `SaO₂ = 0,98q/(0,3 + 0,7q)`. Nếu q ≥ 1: shunt T→P (Fallot hồng), SaO₂ 98%.
  - Thất T luôn **đỏ** (máu TM phổi); trộn ở gốc ĐMC. Dòng TLT: thất P → **ĐMC** (q<1) hoặc thất T → thất P (q≥1).
  - Âm thổi theo dòng qua phễu: `fp = q/(1+q)`, hiển thị `m = min(1, (fp/0,571)²)` (phản biện: fp thô chỉ giảm 57% → 14%): 0% → 100%, 40% → 45%, 90% → 8%, 100% → 6%.
  - SvO₂ = 0,7·SaO₂ là trộn máu tĩnh (không mô phỏng phản hồi toan → hạ SVR).
  - Kiểm: phễu 0% → SpO₂ 98% (hồng) · 40% → ~83% · 90% nằm ~44% → gối–ngực ~59% · 100% → âm thổi ~5%.
- **Tay nắm chính:** **2 hàm cơ phễu**, kéo ngang (x) để siết = `ph`. Thay thế: thanh trượt (khấc 50, 100) + phím.
- **Tay nắm phụ:** **đầu gối** của chân bé (góc dưới phải): kéo lên = gập háng–gối, ĐM đùi gập ở nếp bẹn → `sq`. Thay thế: công tắc Nằm/Gối–ngực.
- **ask (3 lựa chọn, dự đoán điều phản trực giác):** Phễu co thắt dần đến 100%, âm thổi thế nào? (a) to hơn vì hẹp hơn · (b) **nhỏ dần rồi gần mất vì ít máu qua phễu** · (c) không đổi vì thổi do lỗ TLT.
- **Đối chứng:** cùng mức co thắt, gập gối → lối ĐMC khó đi → dòng lên phổi dày ra, SpO₂ hồi. Biến thể Thử nhớ (chưa trình diễn): thuốc giãn mạch/sốt hạ SVR → tím nặng hơn (đưa vào Bẫy).
- **Ca biên:** Fallot hồng (hẹp nhẹ) → shunt T→P, SpO₂ ≥ 90%.
- hl: `rvot-stenosis`, `vsd-shunt`, `femoral-kink`, `pulm-rescue-flow`.

## Bố cục PC/mobile
- PC: hình 560×350 chiếm ~62% trái; thanh trượt + công tắc dưới hình. Mobile: hình ghim đầu; tay nắm phổi ở 2 mép ngoài (ngón tay không che vách liên nhĩ); `touch-action: pan-y` trên SVG có tay nắm trục x, `none` nếu có trục y.
- Chữ nhãn buồng ≥ 13px để còn đọc được ở 390px.

## Trang khác
- beat_07 (bể dược động học) được 2 phiếu, beat-15 SGLT-1 được 2 phiếu. Làm sau khi tim đạt.
