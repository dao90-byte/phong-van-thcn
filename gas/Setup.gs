/**
 * Setup.gs (v3)
 * Khởi tạo & nâng cấp cấu trúc Google Sheets chuẩn 3 vùng màu trực quan:
 * - Vùng 1 (Xanh ngọc): Dashboard (thanh tiến độ SPARKLINE + màu trạng thái điều kiện + KPI tổng quan)
 * - Vùng 2 (Hổ phách): Questions, Templates, Config
 * - Vùng 3 (Xám): Clients, Responses, LiveNotes, StageReviews (bật cảnh báo sửa tay nhầm)
 * Chạy an toàn nhiều lần (idempotent): TUYỆT ĐỐI KHÔNG xóa hay ghi đè dữ liệu khách hàng đã có.
 */

function setupWorkbook() {
  var ss = getActiveSpreadsheet_();
  var summary = [];

  var dataTabs = [
    TABS.QUESTIONS,
    TABS.TEMPLATES,
    TABS.CONFIG,
    TABS.CLIENTS,
    TABS.RESPONSES,
    TABS.LIVE_NOTES,
    TABS.STAGE_REVIEWS
  ];

  dataTabs.forEach(function (tabName) {
    var created = ensureTabWithSchema_(ss, tabName, SCHEMAS[tabName]);
    summary.push(tabName + (created ? ' (tạo mới)' : ' (đã kiểm tra)'));
  });

  // Nạp dữ liệu mẫu còn thiếu (không ghi đè câu hỏi/prompt đã tùy biến)
  var qAdded = seedMissingRows_(TABS.QUESTIONS, getSeedQuestions_(), 'code');
  var tAdded = seedMissingRows_(TABS.TEMPLATES, getSeedTemplates_(), 'template_id');
  var cAdded = seedMissingRows_(TABS.CONFIG, getSeedConfig_(), 'key');

  // Áp dụng Plain Text ('@') cho toàn bộ cột khóa ở các tab
  dataTabs.forEach(function (tabName) {
    formatPlainTextColumns_(ss.getSheetByName(tabName), tabName);
  });

  // Checkbox cho Questions và StageReviews
  applyCheckboxColumn_(ss.getSheetByName(TABS.QUESTIONS), 'active');
  applyCheckboxColumn_(ss.getSheetByName(TABS.QUESTIONS), 'check_vague');
  ['check_1', 'check_2', 'check_3', 'check_4'].forEach(function (col) {
    applyCheckboxColumn_(ss.getSheetByName(TABS.STAGE_REVIEWS), col);
  });

  // Cảnh báo sửa tay (warning-only) cho các tab dữ liệu thô
  [TABS.RESPONSES, TABS.LIVE_NOTES, TABS.STAGE_REVIEWS].forEach(function (tName) {
    protectWarningOnly_(ss.getSheetByName(tName), 'THCN_GUARD_' + tName.toUpperCase());
  });

  // Xây dựng / Nâng cấp tab Dashboard trực quan (100% công thức, không chạm vào dữ liệu gốc)
  rebuildDashboardTab_(ss);

  // Sắp xếp thứ tự 3 vùng & tô màu tab khoa học
  organizeTabsAndColors_(ss);

  // Xóa Sheet1 mặc định nếu còn trống
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
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

  var totalCols = Math.max(sheet.getLastColumn(), expectedHeaders.length);
  var headerBg = TAB_COLORS[tabName] || '#0F5257';
  var headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground(headerBg);
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
  var numRows = Math.max(sheet.getMaxRows() - 1, 1);
  plainCols.forEach(function (colName) {
    if (Object.prototype.hasOwnProperty.call(info.map, colName)) {
      var colIdx = info.map[colName] + 1;
      try {
        sheet.getRange(2, colIdx, numRows, 1).setNumberFormat('@');
      } catch (e) {
        // Bỏ qua an toàn nếu cột là typed column (Google Sheets Table / Dropdown / Date / Checkbox)
      }
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
  } catch (e) {}
}

function protectWarningOnly_(sheet, desc) {
  if (!sheet || typeof sheet.protect !== 'function') return;
  try {
    var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    var alreadyProtected = existing.some(function (p) { return p.getDescription() === desc; });
    if (!alreadyProtected) {
      sheet.protect().setDescription(desc).setWarningOnly(true);
    }
  } catch (e) {}
}

/**
 * Sắp xếp lại 8 tab theo đúng 3 vùng màu:
 * 1. Dashboard (Xanh ngọc) -> 2..4. Questions/Templates/Config (Hổ phách) -> 5..8. Clients/Responses/LiveNotes/StageReviews (Xám)
 */
function organizeTabsAndColors_(ss) {
  for (var i = 0; i < TAB_ORDER.length; i++) {
    var name = TAB_ORDER[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) continue;
    try {
      if (typeof sheet.setTabColor === 'function' && TAB_COLORS[name]) {
        sheet.setTabColor(TAB_COLORS[name]);
      }
      if (typeof ss.setActiveSheet === 'function' && typeof ss.moveActiveSheet === 'function') {
        ss.setActiveSheet(sheet);
        ss.moveActiveSheet(i + 1);
      }
    } catch (e) {}
  }
  // Đưa màn hình về đúng tab Dashboard làm việc chính
  var dash = ss.getSheetByName(TABS.DASHBOARD);
  if (dash && typeof ss.setActiveSheet === 'function') {
    try { ss.setActiveSheet(dash); } catch (e) {}
  }
}

/**
 * Dựng tab Dashboard trực quan (v3):
 * - Dòng 1: Tiêu đề + hướng dẫn mở Trung tâm Điều khiển
 * - Dòng 2-3: Thanh chỉ số KPI tổng quan (Tổng khách, Đang mở, Đã nộp GĐ1, Đã nộp GĐ2)
 * - Dòng 5: Tiêu đề bảng khách
 * - Dòng 6..55: 50 dòng công thức động kèm thanh tiến độ SPARKLINE & màu trạng thái điều kiện.
 */
function rebuildDashboardTab_(ss) {
  var sheet = ss.getSheetByName(TABS.DASHBOARD);
  if (!sheet) {
    sheet = ss.insertSheet(TABS.DASHBOARD);
  }
  if (typeof sheet.clear === 'function') {
    sheet.clear();
  }

  // Banner tiêu đề (dòng 1)
  sheet.getRange(1, 1, 1, 11).setValues([[
    '🎛️ BẢNG ĐIỀU KHIỂN PHỎNG VẤN THƯƠNG HIỆU CÁ NHÂN', '', '', '', '', '', '',
    'Mẹo: Mở menu ⚙️ Tư vấn THCN → 🎛️ Mở Trung tâm Điều khiển để Copy 1-click', '', '', ''
  ]]);
  sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#0F5257').setFontColor('#FFFFFF');

  // KPI tổng quan (dòng 2-3)
  sheet.getRange(2, 1, 1, 8).setValues([[
    'Tổng khách hàng', 'Đang hoạt động', 'Đã nộp GĐ 1', 'Đã nộp GĐ 2',
    'Tổng câu đã thu thập', 'Tổng câu có cờ', 'Đã đóng link', ''
  ]]);
  sheet.getRange(2, 1, 1, 8).setFontWeight('bold').setBackground('#F5F4F0').setFontColor('#57534E');

  sheet.getRange(3, 1, 1, 7).setFormulas([[
    '=COUNTA(Clients!A2:A)',
    '=COUNTIF(Clients!N2:N,"active")',
    '=COUNTIFS(StageReviews!C2:C,1,StageReviews!D2:D,"<>")',
    '=COUNTIFS(StageReviews!C2:C,2,StageReviews!D2:D,"<>")',
    '=COUNTIF(Responses!E2:E,"<>")',
    '=COUNTIF(Responses!I2:I,"<>")',
    '=COUNTIF(Clients!N2:N,"closed")'
  ]]);
  sheet.getRange(3, 1, 1, 7).setFontWeight('bold').setBackground('#FFFFFF').setFontColor('#0F5257');

  // Tiêu đề bảng chi tiết (dòng 5)
  var headers = [
    'Mã KH', 'Tên khách hàng', 'Lĩnh vực', 'Nhánh', 'GĐ mở',
    'Trạng thái', 'Đã trả lời', 'Tiến độ trực quan', 'Câu có cờ', 'Nộp GĐ1 / GĐ2', 'Cập nhật gần nhất'
  ];
  sheet.getRange(5, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(5, 1, 1, headers.length).setFontWeight('bold').setBackground('#1C1917').setFontColor('#FFFFFF');
  sheet.setFrozenRows(5);

  var formulas = [];
  for (var i = 0; i < 50; i++) {
    var cr = i + 2; // dòng tương ứng trong tab Clients
    var dr = i + 6; // dòng hiện tại trong Dashboard
    formulas.push([
      '=IF(Clients!A' + cr + '="","",Clients!A' + cr + ')',
      '=IF(A' + dr + '="","",Clients!C' + cr + ')',
      '=IF(A' + dr + '="","",Clients!D' + cr + ')',
      '=IF(A' + dr + '="","",IF(Clients!H' + cr + '="","Tự chọn",Clients!H' + cr + '))',
      '=IF(A' + dr + '="","",Clients!I' + cr + ')',
      '=IF(A' + dr + '="","",IF(Clients!N' + cr + '="closed","🔒 Đã đóng",IF(COUNTIFS(StageReviews!$A$2:$A,A' + dr + ',StageReviews!$D$2:$D,"<>")>0,"🟢 Đã nộp",IF(G' + dr + '>0,"🟡 Đang làm","⚪ Chưa làm"))))',
      '=IF(A' + dr + '="","",COUNTIFS(Responses!$A$2:$A,A' + dr + ',Responses!$E$2:$E,"<>"))',
      '=IF(A' + dr + '="","",SPARKLINE(MIN(G' + dr + ',17),{"charttype","bar";"max",IF(ISNUMBER(SEARCH("2",E' + dr + ')),17,9);"color1","#0F5257"}))',
      '=IF(A' + dr + '="","",COUNTIFS(Responses!$A$2:$A,A' + dr + ',Responses!$I$2:$I,"<>"))',
      '=IF(A' + dr + '="","",IF(COUNTIFS(StageReviews!$A$2:$A,A' + dr + ',StageReviews!$C$2:$C,1,StageReviews!$D$2:$D,"<>")>0,"✓ GĐ1","–")&" | "&IF(COUNTIFS(StageReviews!$A$2:$A,A' + dr + ',StageReviews!$C$2:$C,2,StageReviews!$D$2:$D,"<>")>0,"✓ GĐ2","–"))',
      '=IF(A' + dr + '="","",IFERROR(LEFT(INDEX(SORT(FILTER(Responses!$K$2:$K,Responses!$A$2:$A=A' + dr + '),1,FALSE),1),16),""))'
    ]);
  }
  sheet.getRange(6, 1, formulas.length, headers.length).setFormulas(formulas);

  // Tô màu điều kiện (Conditional Formatting) cho cột Trạng thái (cột F)
  if (typeof SpreadsheetApp.newConditionalFormatRule === 'function' && typeof sheet.setConditionalFormatRules === 'function') {
    try {
      var statusRange = sheet.getRange(6, 6, 50, 1);
      var rules = [
        SpreadsheetApp.newConditionalFormatRule().whenTextContains('Đã nộp').setBackground('#ECFDF5').setFontColor('#047857').setRanges([statusRange]).build(),
        SpreadsheetApp.newConditionalFormatRule().whenTextContains('Đang làm').setBackground('#FFFBEB').setFontColor('#B45309').setRanges([statusRange]).build(),
        SpreadsheetApp.newConditionalFormatRule().whenTextContains('Đã đóng').setBackground('#F5F5F4').setFontColor('#78716C').setRanges([statusRange]).build()
      ];
      sheet.setConditionalFormatRules(rules);
    } catch (e) {}
  }
}
