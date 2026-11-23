/**
 * Setup.gs
 * Khởi tạo tự động 7 tab chuẩn + tab Dashboard theo dõi tiến độ (công thức thuần, không gây lock).
 * Chạy an toàn nhiều lần (idempotent): không ghi đè dữ liệu khách hàng đã có.
 */

function setupWorkbook() {
  var ss = getActiveSpreadsheet_();
  var summary = [];

  var orderedTabs = [
    TABS.CLIENTS,
    TABS.QUESTIONS,
    TABS.TEMPLATES,
    TABS.RESPONSES,
    TABS.LIVE_NOTES,
    TABS.STAGE_REVIEWS,
    TABS.CONFIG
  ];

  orderedTabs.forEach(function (tabName) {
    var created = ensureTabWithSchema_(ss, tabName, SCHEMAS[tabName]);
    summary.push(tabName + (created ? ' (tạo mới)' : ' (đã kiểm tra)'));
  });

  // Nạp dữ liệu mẫu cho Questions, Templates, Config nếu thiếu mã
  var qAdded = seedMissingRows_(TABS.QUESTIONS, getSeedQuestions_(), 'code');
  var tAdded = seedMissingRows_(TABS.TEMPLATES, getSeedTemplates_(), 'template_id');
  var cAdded = seedMissingRows_(TABS.CONFIG, getSeedConfig_(), 'key');

  // Áp dụng Plain Text ('@') cho toàn bộ cột khóa ở các tab
  orderedTabs.forEach(function (tabName) {
    formatPlainTextColumns_(ss.getSheetByName(tabName), tabName);
  });

  // Checkbox cho Questions (active, check_vague) và StageReviews (check_1..check_4)
  applyCheckboxColumn_(ss.getSheetByName(TABS.QUESTIONS), 'active');
  applyCheckboxColumn_(ss.getSheetByName(TABS.QUESTIONS), 'check_vague');
  ['check_1', 'check_2', 'check_3', 'check_4'].forEach(function (col) {
    applyCheckboxColumn_(ss.getSheetByName(TABS.STAGE_REVIEWS), col);
  });

  // Cảnh báo sửa tay (Protected Range warning-only) cho tab Responses
  protectResponsesWarningOnly_(ss.getSheetByName(TABS.RESPONSES));

  // Tạo tab Dashboard xem tiến độ bằng công thức Sheets (không chạm vào LockService)
  ensureDashboardTab_(ss);

  // Xóa Sheet1 mặc định nếu còn trống
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Bỏ qua nếu không xóa được
    }
  }

  clearStaticCache_();

  return {
    tabs: summary,
    questionsAdded: qAdded,
    templatesAdded: tAdded,
    configAdded: cAdded
  };
}

function ensureTabWithSchema_(ss, tabName, expectedHeaders) {
  var sheet = ss.getSheetByName(tabName);
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    created = true;
  }

  var lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  } else {
    // Bổ sung các cột mới nếu sheet cũ thiếu, không làm xáo trộn cột đang có
    var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).trim();
    });
    var missing = expectedHeaders.filter(function (h) {
      return currentHeaders.indexOf(h) === -1;
    });
    if (missing.length > 0) {
      sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
    }
  }

  // Trang trí nhẹ dòng tiêu đề & cố định dòng 1
  var totalCols = Math.max(sheet.getLastColumn(), expectedHeaders.length);
  var headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0F5257');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  return created;
}

function seedMissingRows_(tabName, items, uniqueKey) {
  var existing = readTabAsObjects_(tabName);
  var existingKeys = {};
  existing.forEach(function (row) {
    var k = String(row[uniqueKey] || '').trim();
    if (k) existingKeys[k] = true;
  });

  var added = 0;
  items.forEach(function (item) {
    var k = String(item[uniqueKey] || '').trim();
    if (!k || existingKeys[k]) return;
    appendRowByHeader_(tabName, item);
    existingKeys[k] = true;
    added++;
  });
  return added;
}

function formatPlainTextColumns_(sheet, tabName) {
  if (!sheet) return;
  var plainCols = PLAIN_TEXT_COLUMNS[tabName] || [];
  if (plainCols.length === 0) return;

  var info = getTabHeaders_(sheet);
  var maxRows = Math.max(sheet.getMaxRows(), 200);
  plainCols.forEach(function (colName) {
    if (Object.prototype.hasOwnProperty.call(info.map, colName)) {
      var colIdx = info.map[colName] + 1;
      sheet.getRange(2, colIdx, maxRows - 1, 1).setNumberFormat('@');
    }
  });
}

function applyCheckboxColumn_(sheet, colName) {
  if (!sheet || typeof SpreadsheetApp.newDataValidation !== 'function') return;
  var info = getTabHeaders_(sheet);
  if (!Object.prototype.hasOwnProperty.call(info.map, colName)) return;
  var colIdx = info.map[colName] + 1;
  var lastRow = Math.max(sheet.getLastRow(), 2);
  try {
    var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    sheet.getRange(2, colIdx, Math.max(lastRow - 1, 50), 1).setDataValidation(rule);
  } catch (e) {
    // Bỏ qua trong môi trường mock không hỗ trợ DataValidation
  }
}

function protectResponsesWarningOnly_(sheet) {
  if (!sheet || typeof sheet.protect !== 'function') return;
  try {
    var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    var alreadyProtected = existing.some(function (p) {
      return p.getDescription() === 'THCN_RESPONSES_GUARD';
    });
    if (!alreadyProtected) {
      var protection = sheet.protect().setDescription('THCN_RESPONSES_GUARD');
      protection.setWarningOnly(true);
    }
  } catch (e) {
    // Bỏ qua trong môi trường không hỗ trợ protection
  }
}

function ensureDashboardTab_(ss) {
  var sheet = ss.getSheetByName(TABS.DASHBOARD);
  if (!sheet) {
    sheet = ss.insertSheet(TABS.DASHBOARD);
  }
  if (sheet.getLastRow() > 0) return; // Không ghi đè nếu nhà tư vấn đã tùy biến Dashboard

  var headers = [
    'client_id', 'Tên khách', 'Lĩnh vực', 'Nhánh', 'GĐ đang mở', 'Trạng thái',
    'Số câu đã trả lời', 'Số câu có cờ', 'Đã nộp GĐ1?', 'Đã nộp GĐ2?', 'Lần trả lời gần nhất'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1C1917').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  // Công thức động lấy danh sách khách từ tab Clients (dòng 2 -> 100)
  var formulas = [];
  for (var r = 2; r <= 51; r++) {
    formulas.push([
      '=IF(Clients!A' + r + '="","",Clients!A' + r + ')',
      '=IF(A' + r + '="","",Clients!C' + r + ')',
      '=IF(A' + r + '="","",Clients!D' + r + ')',
      '=IF(A' + r + '="","",Clients!H' + r + ')',
      '=IF(A' + r + '="","",Clients!I' + r + ')',
      '=IF(A' + r + '="","",Clients!N' + r + ')',
      '=IF(A' + r + '="","",COUNTIFS(Responses!$A$2:$A,A' + r + ',Responses!$E$2:$E,"<>"))',
      '=IF(A' + r + '="","",COUNTIFS(Responses!$A$2:$A,A' + r + ',Responses!$I$2:$I,"<>"))',
      '=IF(A' + r + '="","",IF(COUNTIFS(StageReviews!$A$2:$A,A' + r + ',StageReviews!$C$2:$C,1,StageReviews!$D$2:$D,"<>")>0,"Đã nộp","Chưa"))',
      '=IF(A' + r + '="","",IF(COUNTIFS(StageReviews!$A$2:$A,A' + r + ',StageReviews!$C$2:$C,2,StageReviews!$D$2:$D,"<>")>0,"Đã nộp","Chưa"))',
      '=IF(A' + r + '="","",IFERROR(INDEX(SORT(FILTER(Responses!$K$2:$K,Responses!$A$2:$A=A' + r + '),1,FALSE),1),""))'
    ]);
  }
  sheet.getRange(2, 1, formulas.length, headers.length).setFormulas(formulas);
}
