# HANDOFF — Hệ thống Phỏng vấn Thương hiệu Cá nhân (THCN)

Tài liệu bàn giao nhanh để tiếp tục phát triển và vận hành dự án trong phiên làm việc mới.

## 1. Tổng quan kiến trúc (v3.3)
- **Web App khách hàng (GitHub Pages)**: thư mục `docs/` → https://dao90-byte.github.io/phong-van-thcn/
- **Trung tâm Điều khiển Web độc lập (GitHub Pages)**: `docs/admin.html` → https://dao90-byte.github.io/phong-van-thcn/admin.html (đồng bộ tự động từ `gas/CommandCenter.html`, bảo vệ bằng mã PIN SHA-256 + tự nhớ trình duyệt + cache `localStorage` mở tức thì 0ms)
- **Backend API & Trung tâm Điều khiển (Google Apps Script)**: thư mục `gas/` (9 tệp phẳng đồng bộ sang nhánh `gas`)
- **Cơ sở dữ liệu (Google Sheets)**: 8 tab chia 3 vùng (`Dashboard`, `Questions`, `Templates`, `Config`, `Clients`, `Responses`, `LiveNotes`, `StageReviews`)

## 2. Định danh hệ thống đang chạy thật (Production)
- **GitHub Repo**: `https://github.com/dao90-byte/phong-van-thcn` (SSH: `git@github.com:dao90-byte/phong-van-thcn.git`)
  - Nhánh `main`: mã nguồn đầy đủ (`docs/`, `gas/`, `tests/`, `scripts/`)
  - Nhánh `gas`: nhánh phẳng chỉ chứa đúng 9 tệp Apps Script ở thư mục gốc
- **Google Sheet (`daothuan90@gmail.com`)**: `CSDL Phỏng vấn THCN`
  - Spreadsheet ID: `1GW8ldtGK-AYyr1R2uHgRv_X2LC_uu3M28v7TYKtrIMw`
  - Locale: `vi_VN`, TimeZone: `Asia/Saigon`
- **Google Apps Script (`daothuan90@gmail.com`)**: `THCN_App`
  - Project ID: `1h8RuMF8BA6NCb0Q13AczVN8bS1H3qzxaR1dMtfX4zeBa9Hnx0rb9mqym`
  - Bản triển khai: **v3.3** (cần Pull từ nhánh `gas` → Sửa bản triển khai hiện tại → Phiên bản mới, giữ nguyên URL `/exec`)
- **Web App `/exec` URL (BẮT BUỘC GIỮ NGUYÊN khi cập nhật bản triển khai)**:
  - `https://script.google.com/macros/s/AKfycbwDPT-h3y3jDlGEmD2-HjABDeMgAoaIllfir8StmlyTV69pRM8eXYfKkgyvem-O035N/exec`

## 3. Tính năng hiện có (đến v3.3)
- **Trung tâm Điều khiển Web độc lập (`docs/admin.html`)**: ghim bookmark trên trình duyệt, mở toàn màn hình tức thì (0ms từ cache `localStorage` + tự đồng bộ nền từ Sheet), không cần mở Google Sheets. Bảo vệ bằng mã PIN băm SHA-256 (`PROP_KEYS.ADMIN_PIN_HASH`, cài 1 lần trong menu Google Sheet `⚙️ Tư vấn THCN → Quản trị hệ thống → Đặt mã PIN Trung tâm Web`), chống dò mã PIN (rate-limit 10 lần/5 phút).
- **Tải nhanh 0ms**: `ccLoadSnapshot()` đọc mỗi tab đúng 1 lượt (≤ 4 lượt đọc khi cache nóng), nhúng JSON trực tiếp vào `CommandCenter.html` khi mở hộp thoại; chuyển khách, chuyển giai đoạn và Copy 1-click xử lý hoàn toàn trên trình duyệt.
- **Tab Câu trả lời chia 3 mục MECE**:
  - `Tự điền`: câu tự điền + câu phỏng vấn trực tiếp đã lưu; hỗ trợ **chỉnh sửa trực tiếp tại chỗ** (`ccSaveResponse`) và tự cập nhật bản Copy / Xuất AI.
  - `Lưu ý`: chỉ lọc các câu có cờ (`Hơi ngắn`, `Còn chung chung`, `Bỏ qua bổ sung`, `Đánh dấu làm sau`), cho phép sửa trực tiếp.
  - `Trực tiếp`: chỉ hiện câu khách chưa trả lời, kèm khung trống nhập trực tiếp, **chế độ Nói (thu âm trực tiếp `vi-VN`)**, gợi ý đào sâu thu gọn và nút `Lưu câu này`.
- **Xuất 1-click**: Copy câu trả lời sạch (GĐ này / tất cả GĐ), Xuất AI đọc trước / AI đánh giá, Copy link, Copy tin Zalo, chế độ ẩn tên khách.

## 4. Lệnh kiểm thử & phát hành cục bộ (macOS)
Máy dùng `jsc` tích hợp sẵn của macOS và `python3` (không cần `node`):

```bash
# Chạy toàn bộ test backend GAS (53 tests) & logic giao diện khách (21 tests)
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/test_gas.js
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/test_client_logic.js

# Kiểm tra danh xưng (phải trả về 0 kết quả)
grep -rn -i "bạn" docs/ gas/

# Đóng gói, chạy kiểm thử, đồng bộ 9 file sang nhánh 'gas' và đẩy cả main + gas lên GitHub
./scripts/release.sh --push
```

Nếu dùng CLI `gsheets` với bảng tính trên, luôn chỉ định đúng tài khoản chủ sở hữu:
```bash
AGY_ACCOUNT=daothuan90@gmail.com gsheets ...
```

## 5. Quy tắc bắt buộc phải tuân thủ
1. **Danh xưng**: Tuyệt đối KHÔNG dùng từ `bạn` trong `docs/` và `gas/` — thống nhất dùng `anh/chị`.
2. **Bảo toàn URL `/exec`**: Khi triển khai Apps Script mới, luôn vào **Triển khai → Quản lý các bản triển khai → Sửa bản triển khai hiện tại → Phiên bản mới**. Tuyệt đối không tạo bản triển khai mới làm đổi URL.
3. **An toàn dữ liệu thật**: Không xóa hoặc ghi đè dữ liệu khách hàng thật trong `CSDL Phỏng vấn THCN` khi kiểm thử.
4. **Locale `vi_VN` & Typed Columns**: Giữ `getFormulaSeparators_(ss)` trong `Setup.gs` (`;` và `\`) và `try { SpreadsheetApp.flush(); } catch (e) {}` khi định dạng `@` trong `Core.gs` / `Setup.gs`.
5. **Những nội dung đã loại bỏ (không thêm lại)**: Chế độ Demo trong `docs/`, nút `Lưu nháp` thừa, câu miễn trừ AI training trong `consent_text`, nhãn mô tả giai đoạn, dòng `Đang nghe (tiếng Việt)...`, và ghi chú trong ngoặc về gửi ảnh Zalo ở câu `1.2.2`.
