/**
 * config.js
 * Cấu hình duy nhất bạn cần sửa sau khi triển khai Google Apps Script Web App.
 */
window.APP_CONFIG = {
  // Dán URL Web App từ Google Apps Script (Deploy -> New deployment -> Web app)
  // Ví dụ: 'https://script.google.com/macros/s/AKfycb.../exec'
  // Để trống ('') để chạy chế độ Demo kiểm thử giao diện tại chỗ.
  API_URL: '',

  // Tên hiển thị trên tiêu đề trang
  BRAND_NAME: 'Phỏng vấn Thương hiệu Cá nhân',
  CONSULTANT_NAME: 'Chuyên gia tư vấn',

  // Tắt về false sau khi triển khai thật nếu không muốn ai mở chế độ #demo
  ENABLE_DEMO: true
};
