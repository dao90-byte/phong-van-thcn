# Sổ Tay Vận Hành & Xử Lý Sự Cố 1 Trang (RUNBOOK)

> Dành cho chủ sở hữu hoặc trợ lý/cộng tác viên (không cần biết lập trình). Làm đúng theo từng mục dưới đây để hệ thống chạy ổn định và không bao giờ làm hỏng đường link khách hàng đang dùng.

---

## 1. Quy trình làm việc hàng ngày (Chỉ 1 cửa sổ)

1. Mở Trung tâm Điều khiển Web: `https://dao90-byte.github.io/phong-van-thcn/admin.html` (nhập mã PIN 1 lần đầu).
2. **Tạo khách mới**: Bấm `+ Khách mới` → nhập tên, lĩnh vực, chọn template → bấm **Copy Tin Zalo** gửi khách.
   - *Lưu ý gửi khách dùng iPhone*: Nhắn kèm 1 câu *"Anh/chị bấm dấu 3 chấm góc trên trong Zalo chọn Mở bằng Safari để nói thành chữ mượt nhất nhé"*.
3. **Khi khách nộp bài**: Kiểm tra Email `[THCN]` hoặc mở Trung tâm Điều khiển → bấm tên khách → dùng các nút **1-Click Copy** (Câu trả lời sạch / Đọc trước AI / Đánh giá AI).
4. **Chốt & Mở Giai đoạn tiếp theo**: Vào tab `Chốt & Chuyển GĐ` → tick đủ 4 mục nghiệm thu → dán tóm tắt chốt → bấm **Chốt GĐ hiện tại & Mở GĐ tiếp theo** → Copy tin Zalo gửi khách (khách vẫn dùng đúng link cũ).

---

## 2. Kiểm tra sức khỏe hệ thống (2 phút mỗi tuần)

Mở Google Sheet `CSDL Phỏng vấn THCN` → xem tab **`EventLog`** (cuối cùng, màu xám):
- **`BACKUP_OK`**: Sao lưu tự động 02:00 sáng hàng ngày đang chạy tốt.
- **`EMAIL_FAILED`**: Khách đã nộp bài nhưng Gmail bị lỗi/hết hạn mức (100 mail/ngày). Mở ngay Trung tâm Điều khiển để xem bài khách.
- **`LOCK_TIMEOUT`**: Có nhiều thao tác lưu đè nhau cùng lúc. Nếu xuất hiện > 5 lần/tuần → báo kỹ thuật tối ưu thêm.
- **`ADMIN_BAD_PIN`**: Có người nhập sai mã PIN quản trị. Nếu thấy nhiều lần liên tiếp bất thường → đổi mã PIN ngay trong menu `⚙️ Tư vấn THCN → Quản trị hệ thống → Đặt mã PIN Trung tâm Web`.

---

## 3. Khôi phục dữ liệu khi xóa nhầm hoặc hỏng Sheet (RTO ≤ 15 phút)

1. Vào Google Drive (tài khoản `daothuan90@gmail.com`) → mở thư mục **`Backup_THCN`**.
2. Chọn bản sao lưu gần nhất trước thời điểm xảy ra sự cố (hệ thống tự lưu mỗi ngày lúc 02:00 sáng, giữ 14 bản).
3. Mở file sao lưu đó và copy lại đúng tab bị hỏng (ví dụ `Responses` hoặc `Clients`) dán đè sang file `CSDL Phỏng vấn THCN` hiện tại.
   - **QUAN TRỌNG**: Không xóa file `CSDL Phỏng vấn THCN` gốc để thay bằng file sao lưu, vì Apps Script và đường link `/exec` đang gắn chặt với file gốc.

---

## 4. Cập nhật hệ thống mới (TUYỆT ĐỐI KHÔNG LÀM HỎNG LINK KHÁCH)

Mỗi khi có bản nâng cấp mới trên GitHub:
1. Mở Google Sheet `CSDL Phỏng vấn THCN` → chọn `Tiện ích mở rộng → Apps Script`.
2. Kéo code mới từ nhánh **`gas`** (chỉ có 9 file phẳng).
3. Bấm **Triển khai (Deploy) → Quản lý các bản triển khai (Manage deployments)**.
4. Bấm biểu tượng **Cây bút (Chỉnh sửa / Edit)** ở bản triển khai đang chạy → mục Phiên bản chọn **Phiên bản mới (New version)** → bấm **Triển khai**.
   - **CẤM**: Không bấm "Tạo bản triển khai mới (New deployment)" vì sẽ làm đổi đường link `/exec` và khiến toàn bộ link đã gửi khách bị lỗi.
5. Quay lại Google Sheet → bấm menu **`⚙️ Tư vấn THCN → Quản trị hệ thống → Kiểm tra / Nâng cấp cấu trúc Sheet`** (an toàn, không bao giờ xóa dữ liệu khách) và bấm **`Bật sao lưu tự động hàng ngày (02:00)`** 1 lần.
