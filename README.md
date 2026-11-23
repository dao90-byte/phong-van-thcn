# Web App 0đ – Phỏng vấn Thương hiệu Cá nhân (MECE 4 Giai đoạn · v2)

Hệ thống tự phỏng vấn 0đ chạy hoàn toàn trên **GitHub Pages + Google Apps Script + Google Sheets** theo kiến trúc chốt v2:
- **Khách hàng** nhận link riêng dạng `#k=<token24>` (ẩn khỏi thanh địa chỉ sau khi tải), tự điền dữ kiện trước buổi gặp trên điện thoại hoặc máy tính.
- **Nhà tư vấn** quản trị trực tiếp ngay trong **Google Sheets** qua menu **`⚙️ Tư vấn THCN`** (không cần phơi `admin.html` hay `admin_key` ra internet).
- **LLM** nhận bản tổng hợp Markdown 1-click Copy (Bản đọc trước & Bản đánh giá), có chống prompt injection, đính kèm tóm tắt giai đoạn trước và hỗ trợ ghi chú thô / transcript (`RAW`).

---

## Cấu trúc thư mục

```text
phong-van-thcn/
├── gas/                        # Copy toàn bộ vào Google Apps Script Editor
│   ├── Config.gs               # Schema 7 tab, chống lỗi locale '|', token 24 ký tự, escape XML
│   ├── SeedData.gs             # Đủ 39 câu MECE (26 GĐ1–2 + 13 GĐ3–4), 3 templates, 8 prompts
│   ├── Setup.gs                # Tự khởi tạo 7 tab + Dashboard + định dạng Plain Text
│   ├── Api.gs                  # 5 action doPost phía khách (không có endpoint admin)
│   ├── Export.gs               # Xuất Bản đọc trước & Bản đánh giá (nối ngữ cảnh GĐ1 -> GĐ2)
│   ├── Backup.gs               # Tự sao lưu hàng tuần vào thư mục Backup_THCN (giữ 8 bản)
│   ├── AdminMenu.gs            # Custom Menu '⚙️ Tư vấn THCN' ngay trong Google Sheets
│   ├── DialogCreateClient.html # Hộp thoại tạo khách & copy link #k=
│   ├── DialogManageStages.html # Hộp thoại mở/khóa giai đoạn & đóng link
│   ├── DialogLiveNotes.html    # Hộp thoại dán Raw Notes/Transcript hoặc gắn f:/a:/g:
│   ├── DialogExport.html       # Hộp thoại xuất & 1-click Copy Markdown cho LLM
│   └── DialogStageSummary.html # Hộp thoại chấm 4 mục nghiệm thu & lưu tóm tắt giai đoạn
├── docs/                       # Bật GitHub Pages trỏ vào thư mục /docs
│   ├── config.js               # File duy nhất cần dán API_URL
│   ├── index.html              # Trang tự phỏng vấn phía khách
│   ├── styles.css              # Giao diện tối giản, mobile-first
│   ├── logic.js                # Logic Zalo WebView, nhắc bằng chứng theo câu, hàng đợi offline
│   └── app.js                  # Điều khiển UI + chế độ Demo tích hợp sẵn
└── tests/                      # Kiểm thử tự động (chạy qua jsc trên macOS)
    ├── mock_gas.js
    ├── test_gas.js
    └── test_client_logic.js
```

---

## Hướng dẫn triển khai thực tế (~10 phút, chi phí 0đ)

### Bước 1: Tạo Google Sheet trên tài khoản Google riêng
1. Đăng nhập một **tài khoản Google phụ chuyên dụng cho công việc tư vấn** (tách khỏi Gmail/Drive cá nhân).
2. Tạo 1 file **Google Sheets** mới (để chế độ **Riêng tư / Private**), đặt tên ví dụ: `CSDL Phỏng vấn THCN`.
3. Vào menu **Tiện ích mở rộng (Extensions) → Apps Script**.

### Bước 2: Đưa mã nguồn vào Apps Script (1-click bằng Google Apps Script GitHub Assistant)
Repo này có sẵn **2 nhánh**:
- Nhánh **`main`**: chứa toàn bộ dự án (dùng cho GitHub Pages `/docs`).
- Nhánh **`gas`**: chỉ chứa đúng **13 file phẳng ở thư mục gốc** (`appsscript.json`, 7 `.gs`, 5 `.html`) để Pull 1-click không bị dính đường dẫn thư mục con.

Sau khi đẩy cả 2 nhánh (`main` và `gas`) lên GitHub:
1. Trong Google Sheet `CSDL Phỏng vấn THCN`, vào **Tiện ích mở rộng (Extensions) → Apps Script**.
2. Trên thanh công cụ của extension **Google Apps Script GitHub Assistant**:
   - Chọn Repository vừa tạo.
   - Chọn nhánh (**Branch**): **`gas`** *(quan trọng: chọn `gas`, không chọn `main`)*.
   - Bấm nút **Pull** (mũi tên đi xuống) để kéo toàn bộ 13 file vào dự án Apps Script.
3. Nếu không dùng extension, bạn có thể tạo thủ công 7 file `.gs` và 5 file `.html` từ thư mục `gas/`.

*(Khi cần sửa code trong `gas/` sau này, chạy `./scripts/sync_gas_branch.sh` rồi `git push origin main gas`.)*

### Bước 3: Khởi tạo Sheet 7 tab tự động
1. Tải lại (F5) tab Google Sheets vừa tạo. Sau ~3 giây, menu **`⚙️ Tư vấn THCN`** sẽ xuất hiện trên thanh công cụ.
2. Chọn **`⚙️ Tư vấn THCN → 🚀 Khởi tạo / Kiểm tra Sheet 7 tab`** và cấp quyền cho script chạy trên tài khoản của bạn.
3. Hệ thống tự tạo đủ 7 tab (`Clients`, `Questions`, `Templates`, `Responses`, `LiveNotes`, `StageReviews`, `Config`) + tab `Dashboard` và nạp sẵn toàn bộ 39 câu MECE, 3 template, 8 prompt.
4. *(Khuyên làm ngay)* Chọn **`⚙️ Tư vấn THCN → ☁️ Bật sao lưu tự động hàng tuần`** để tự backup mỗi Chủ nhật 02:00.

### Bước 4: Triển khai Apps Script dạng Web App
1. Quay lại Apps Script Editor → bấm **Triển khai (Deploy) → Tùy chọn triển khai mới (New deployment)**.
2. Chọn loại **Ứng dụng web (Web app)**:
   - **Thực thi dưới tư cách (Execute as)**: `Tôi (Me)`
   - **Ai có quyền truy cập (Who has access)**: `Bất kỳ ai (Anyone)`
3. Bấm **Triển khai**, copy đường dẫn Web App có dạng `https://script.google.com/macros/s/.../exec`.

### Bước 5: Xuất bản trang khách trên GitHub Pages
1. Mở [docs/config.js](docs/config.js), dán đường dẫn Web App vào `API_URL` (và đổi `ENABLE_DEMO: false` khi chạy thật).
2. Đẩy toàn bộ dự án lên một repository GitHub (chỉ chứa code, không chứa bất kỳ dữ liệu khách hay khóa bí mật nào).
3. Vào **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`, thư mục **`/docs`** → bấm **Save**.
4. Lấy URL trang khách (vd: `https://tenban.github.io/phong-van-thcn/`), quay lại Google Sheets chọn **`⚙️ Tư vấn THCN → 🔗 Cài đặt URL trang khách`** và dán vào.

---

## Quy trình làm việc với 1 khách hàng

1. **Trước Buổi 1**: Mở menu `⚙️ Tư vấn THCN → ➕ Tạo khách mới & Lấy link` → copy link `#k=...` gửi cho khách (dặn khách mở bằng Safari/Chrome nếu gửi qua Zalo).
2. **Khi khách bấm "Hoàn tất & Gửi"**: Tab `Dashboard` báo `Đã nộp` → vào menu `📋 Xuất Bản đọc trước` (GĐ1) → dán vào LLM lấy bộ câu hỏi đào sâu riêng cho buổi gặp.
3. **Trong / Sau Buổi 1**: Dán ghi chú tự do hoặc transcript buổi họp vào menu `📝 Nhập ghi chú / Transcript buổi họp` (`RAW`) → vào `📋 Xuất Bản đánh giá` (GĐ1) → dán vào LLM.
4. **Chốt GĐ1 & Mở GĐ2**:
   - Copy khối **TÓM TẮT CHỐT GĐ1** từ LLM → vào menu `💾 Chấm Checklist & Lưu Tóm tắt GĐ` dán vào ô `approved_summary`.
   - Vào menu `🔓 Mở / Khóa giai đoạn khách` → tích mở **GĐ 1 & GĐ 2** và tích **Khóa GĐ 1** → nhắn khách mở lại đúng link cũ để làm GĐ2.
5. **Kết thúc dự án**: Vào `🔓 Mở / Khóa giai đoạn khách` → đổi trạng thái sang `closed` để đóng link.

---

## Chạy kiểm thử cục bộ (macOS)

- **Chạy 53 test tự động** (Apps Script backend + Client logic):
  ```bash
  /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/test_gas.js
  /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/test_client_logic.js
  ```
- **Xem thử giao diện Demo trên máy**:
  ```bash
  python3 -m http.server 8765 --directory docs
  ```
  Sau đó mở `http://127.0.0.1:8765/#demo` trên trình duyệt.
