/**
 * MenuAndBackup.gs (v3.1)
 * Menu gọn gàng trong Google Sheets (1 nút chính mở Trung tâm Điều khiển, nạp sẵn dữ liệu trực tiếp vào HTML để mở tức thì)
 * + Cơ chế tự động sao lưu file Google Sheets hàng tuần vào thư mục Backup_THCN (giữ 8 bản).
 */

var BACKUP_FOLDER_NAME = 'Backup_THCN';
var BACKUP_KEEP_COUNT = 14;

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var adminMenu = ui.createMenu('Quản trị hệ thống')
    .addItem('Đặt mã PIN Trung tâm Web', 'menuSetAdminPin')
    .addSeparator()
    .addItem('Kiểm tra / Nâng cấp cấu trúc Sheet', 'menuRunSetup')
    .addItem('Cài đặt URL trang khách (GitHub Pages)', 'menuSetClientAppUrl')
    .addItem('Làm mới bộ nhớ đệm (Clear Cache)', 'menuClearCache')
    .addItem('Bật sao lưu tự động hàng ngày (02:00)', 'menuInstallBackup');

  ui.createMenu('⚙️ Tư vấn THCN')
    .addItem('🎛️ Mở Trung tâm Điều khiển', 'menuOpenCommandCenter')
    .addSeparator()
    .addSubMenu(adminMenu)
    .addToUi();
}

function menuOpenCommandCenter() {
  var tpl = HtmlService.createTemplateFromFile('CommandCenter');
  var payload;
  try {
    payload = ccLoadSnapshot();
  } catch (err) {
    payload = { error: err && err.message ? err.message : String(err) };
  }
  tpl.initialSnapshotJson = safeJsonForHtml_(payload);
  var html = tpl.evaluate()
    .setWidth(1120)
    .setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, 'Trung tâm Điều khiển – Phỏng vấn Thương hiệu Cá nhân');
}

function menuRunSetup() {
  var res = setupWorkbook();
  SpreadsheetApp.getUi().alert(
    'Nâng cấp / Kiểm tra cấu trúc Sheet hoàn tất',
    'Đã sắp xếp 8 tab theo 3 vùng màu (Dashboard xanh ngọc -> Cấu hình hổ phách -> Dữ liệu thô xám) và giữ nguyên toàn bộ dữ liệu khách hàng.\n' +
    '- Câu hỏi thêm mới: ' + res.questionsAdded + '\n' +
    '- Template thêm mới: ' + res.templatesAdded + '\n' +
    '- Tham số Config thêm mới: ' + res.configAdded,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuClearCache() {
  clearStaticCache_();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã xóa bộ nhớ đệm. Mọi chỉnh sửa trong Questions/Templates/Config có hiệu lực ngay.', 'Tư vấn THCN', 4);
}

function menuSetClientAppUrl() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var current = props.getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var res = ui.prompt(
    'Cài đặt đường dẫn trang khách hàng (GitHub Pages)',
    'Nhập URL gốc (ví dụ: https://dao90-byte.github.io/phong-van-thcn/)\nHiện tại: ' + (current || '(chưa cài đặt)'),
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    var url = String(res.getResponseText() || '').trim();
    if (url && url.slice(-1) !== '/') url += '/';
    props.setProperty(PROP_KEYS.WEB_APP_URL, url);
    SpreadsheetApp.getActiveSpreadsheet().toast('Đã lưu URL trang khách: ' + url, 'Tư vấn THCN', 4);
  }
}

function menuSetAdminPin() {
  var ui = SpreadsheetApp.getUi();
  var statusText = hasAdminPin_() ? 'Đã cài đặt (nhập mã mới để đổi)' : 'Chưa cài đặt';
  var res = ui.prompt(
    'Đặt mã PIN Trung tâm Điều khiển Web',
    'Nhập mã PIN quản trị (tối thiểu 4 ký tự, khuyến nghị 6–12 số/ký tự).\nTrạng thái hiện tại: ' + statusText,
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;

  var pin = String(res.getResponseText() || '').trim();
  if (pin.length < 4) {
    ui.alert('Mã PIN quá ngắn', 'Vui lòng nhập mã PIN có tối thiểu 4 ký tự.', ui.ButtonSet.OK);
    return;
  }

  setAdminPin_(pin);
  var baseUrl = getClientAppBaseUrl_() || 'https://dao90-byte.github.io/phong-van-thcn/';
  if (baseUrl.slice(-1) !== '/') baseUrl += '/';
  var adminUrl = baseUrl + 'admin.html';

  ui.alert(
    'Đã lưu mã PIN Trung tâm Web',
    'Anh/chị có thể mở trực tiếp Trung tâm Điều khiển toàn màn hình tại:\n\n' +
    adminUrl + '\n\n' +
    'Ghim đường dẫn này lên thanh dấu trang (Bookmark) của trình duyệt — chỉ cần nhập mã PIN 1 lần đầu, các lần sau mở thẳng tức thì không cần vào Google Sheet.',
    ui.ButtonSet.OK
  );
}

function menuInstallBackup() {
  installDailyBackupTrigger();
  var sample = runDailyBackup();
  SpreadsheetApp.getUi().alert(
    'Đã bật sao lưu tự động hàng ngày',
    'Hệ thống sẽ tự sao lưu file Sheet vào 02:00 sáng hàng ngày trong thư mục "' + sample.folderName + '" (tự dọn giữ 14 bản gần nhất).\n\nĐã tạo sẵn bản sao lưu đầu tiên: ' + sample.fileName,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function runDailyBackup() {
  try {
    var ss = getActiveSpreadsheet_();
    var props = PropertiesService.getScriptProperties();
    var folder = getOrCreateBackupFolder_(props);

    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd_HHmm');
    var backupName = ss.getName() + '_BACKUP_' + stamp;
    var sourceFile = DriveApp.getFileById(ss.getId());
    var copied = sourceFile.makeCopy(backupName, folder);

    pruneOldBackups_(folder, BACKUP_KEEP_COUNT);
    logEvent_('INFO', 'BACKUP_OK', '', '', backupName);

    return {
      fileId: copied.getId(),
      fileName: backupName,
      folderName: folder.getName()
    };
  } catch (err) {
    logEvent_('ERROR', 'BACKUP_FAILED', '', '', err && err.message ? err.message : String(err));
    throw err;
  }
}

// Giữ tên hàm cũ để tương thích ngược với trigger hoặc kiểm thử hiện có
function runWeeklyBackup() {
  return runDailyBackup();
}

function getOrCreateBackupFolder_(props) {
  var folderId = props.getProperty(PROP_KEYS.BACKUP_FOLDER_ID);
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }
  var iter = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  var folder = iter.hasNext() ? iter.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
  props.setProperty(PROP_KEYS.BACKUP_FOLDER_ID, folder.getId());
  return folder;
}

function pruneOldBackups_(folder, keepCount) {
  var files = [];
  var iter = folder.getFiles();
  while (iter.hasNext()) {
    var f = iter.next();
    files.push({ file: f, created: f.getDateCreated().getTime() });
  }
  files.sort(function (a, b) { return b.created - a.created; });
  for (var i = keepCount; i < files.length; i++) {
    files[i].file.setTrashed(true);
  }
}

function installDailyBackupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'runWeeklyBackup' || fn === 'runDailyBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('runDailyBackup')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}

function installWeeklyBackupTrigger() {
  return installDailyBackupTrigger();
}
