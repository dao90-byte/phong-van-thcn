# Hệ Điều Hành Phỏng vấn Thương hiệu Cá nhân 0đ (v3 – Zero-Friction Operations)

Hệ thống phỏng vấn & tổng hợp thương hiệu cá nhân chuẩn **MECE 4 giai đoạn**, chạy hoàn toàn **0đ** trên **GitHub Pages + Google Apps Script + Google Sheets** với kiến trúc 3 lớp tinh gọn:

- **Lớp 1 – Cổng khách hàng (`docs/`)**: giao diện tối giản, xưng `anh/chị`, lưu lạc quan **0ms**, giọng nói ở cả ô trả lời lẫn dẫn chứng bổ sung, điều hướng thông minh từ màn Xem lại, nhận diện Zalo WebView.
- **Lớp 2 – Trung tâm Điều khiển 1 cửa (`gas/CommandCenter.html`)**: 1 màn hình 2 cột ngay trong Google Sheets thay thế 5 popup rời rạc, tích hợp thanh **1-Click Copy tức thì (0ms)** (Toàn bộ câu trả lời sạch · Copy tất cả GĐ · Bản đọc trước LLM · Bản đánh giá LLM · Link · Tin nhắn Zalo) và nút **1-Click Chốt & Mở giai đoạn tiếp theo**.
- **Lớp 3 – CSDL & Tự động hóa (`gas/*.gs`)**: Google Sheets sắp xếp theo **3 vùng màu khoa học** (`Dashboard` xanh ngọc có thanh tiến độ `SPARKLINE` + màu trạng thái → `Questions`/`Templates`/`Config` hổ phách → kho dữ liệu thô xám có cảnh báo bảo vệ), **tự gửi Email kèm toàn bộ câu trả lời sạch ngay khi khách nộp bài**, và **sao lưu tự động mỗi Chủ nhật**.

---

## Cấu trúc dự án (v3)

```text
phong-van-thcn/
├── docs/                        # Lớp 1: Trang phỏng vấn khách hàng (GitHub Pages)
│   ├── config.js                # URL Web App /exec & tên thương hiệu
│   ├── index.html               # Giao diện phỏng vấn phía khách
│   ├── styles.css               # Design system tối giản
│   ├── logic.js                 # Nghiệp vụ thuần (kiểm thử độc lập)
│   └── app.js                   # Lưu lạc quan 0ms, giọng nói 2 ô, điều hướng Xem lại
├── gas/                         # Lớp 2 & 3: 9 file phẳng trên nhánh 'gas'
│   ├── appsscript.json          # Manifest V8, Asia/Ho_Chi_Minh, Web App
│   ├── Core.gs                  # Schema 8 tab, 3 vùng màu, Header-safe I/O, Token 24 ký tự
│   ├── SeedData.gs              # 39 câu MECE (anh/chị), 3 Templates, 8 Prompts, 2 mẫu Zalo
│   ├── Setup.gs                 # Khởi tạo/nâng cấp 3 vùng tab + Dashboard SPARKLINE
│   ├── ClientApi.gs             # 5 action doPost phía khách + Email tự động khi nộp bài
│   ├── ExportEngine.gs          # 4 định dạng 1-Click Copy + mẫu tin nhắn Zalo
│   ├── CommandCenterApi.gs      # API nội bộ cho Trung tâm Điều khiển (bảo mật 2FA Google)
│   ├── MenuAndBackup.gs         # Menu 5 mục tinh gọn + Sao lưu tự động Chủ nhật (giữ 8 bản)
│   └── CommandCenter.html       # Trung tâm Điều khiển 2 cột 1 cửa
├── scripts/
│   └── release.sh               # 1 lệnh duy nhất: Test -> Kiểm tra danh xưng -> Sync nhánh gas -> Push
└── tests/                       # Bộ kiểm thử tự động (jsc trên macOS)
```

---

## Quy trình vận hành hàng ngày (Chỉ 1 cửa sổ)

1. Mở Google Sheet **`CSDL Phỏng vấn THCN`** → chọn menu **`⚙️ Tư vấn THCN → 🎛️ Mở Trung tâm Điều khiển`**.
2. **Thêm khách mới**: bấm **`+ Khách mới`** → nhập tên, lĩnh vực, template → bấm **1-click Copy Tin Zalo** gửi thẳng khách.
3. **Khi khách bấm Gửi bài**: anh/chị nhận ngay **Email thông báo** kèm toàn bộ câu trả lời sạch để đọc nhanh trên điện thoại.
4. **Copy 1 chạm (0ms)**: bấm vào tên khách ở cột trái → bấm:
   - **`📋 Copy Toàn bộ Câu trả lời`** để dán sang Notion / Docs / Word / Zalo.
   - **`🤖 Đọc trước LLM`** trước buổi gặp trực tiếp.
   - **`📊 Đánh giá LLM`** sau buổi gặp (đã ghép sẵn ghi chú Live / Transcript + tóm tắt GĐ trước).
5. **Chốt & Mở giai đoạn tiếp theo**: vào tab **`✅ Chốt & Chuyển GĐ`** → tick 4 mục nghiệm thu, dán tóm tắt chốt → bấm **`🚀 Chốt GĐ hiện tại & Mở GĐ tiếp theo`** → bấm **1-click Copy Tin Zalo** báo khách điền tiếp trên đúng link cũ.

---

## Phát hành & Kiểm thử (1 lệnh duy nhất)

```bash
chmod +x scripts/release.sh
./scripts/release.sh --push
```
Lệnh này tự động: chạy toàn bộ unit test (Backend GAS + Client Logic) → kiểm tra cú pháp → kiểm tra không sót danh xưng `bạn` → đồng bộ đúng **9 file phẳng** lên nhánh `gas` → đẩy cả `main` và `gas` lên GitHub.
