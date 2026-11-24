/**
 * AdminMenu.gs
 * Giao diện quản trị tích hợp trực tiếp trong Google Sheets (thay thế hoàn toàn admin.html).
 * - Bảo mật trực tiếp bằng tài khoản Google (2FA) của nhà tư vấn.
 * - Không cần admin_key, không phơi API quản trị ra internet.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Tư vấn THCN')
    .addItem('➕ Tạo khách mới & Lấy link', 'menuOpenCreateClient')
    .addItem('🔓 Mở / Khóa giai đoạn khách', 'menuOpenManageStages')
    .addSeparator()
    .addItem('📝 Nhập ghi chú / Transcript buổi họp', 'menuOpenLiveNotes')
    .addItem('💾 Chấm Checklist & Lưu Tóm tắt GĐ', 'menuOpenStageSummary')
    .addSeparator()
    .addItem('📋 Xuất Bản đọc trước (Pre-read)', 'menuOpenExportPreread')
    .addItem('📋 Xuất Bản đánh giá (Eval)', 'menuOpenExportEval')
    .addSeparator()
    .addItem('🔗 Cài đặt URL trang khách (GitHub Pages)', 'menuSetClientAppUrl')
    .addItem('🔄 Làm mới bộ nhớ đệm (Clear Cache)', 'menuClearCache')
    .addItem('🚀 Khởi tạo / Kiểm tra Sheet 7 tab', 'menuRunSetup')
    .addItem('☁️ Bật sao lưu tự động hàng tuần', 'menuInstallBackup')
    .addToUi();
}

function menuRunSetup() {
  var ui = SpreadsheetApp.getUi();
  var res = setupWorkbook();
  ui.alert(
    'Khởi tạo hoàn tất',
    'Đã kiểm tra/tạo 7 tab + Dashboard.\n' +
    '- Câu hỏi thêm mới: ' + res.questionsAdded + '\n' +
    '- Template thêm mới: ' + res.templatesAdded + '\n' +
    '- Cấu hình thêm mới: ' + res.configAdded,
    ui.ButtonSet.OK
  );
}

function menuClearCache() {
  clearStaticCache_();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã xóa bộ nhớ đệm. Thay đổi trong Questions/Templates/Config có hiệu lực ngay.', '⚙️ Tư vấn THCN', 4);
}

function menuSetClientAppUrl() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var current = props.getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var res = ui.prompt(
    'Cài đặt đường dẫn trang khách hàng (GitHub Pages)',
    'Nhập URL gốc (ví dụ: https://tenban.github.io/phong-van-thcn/)\nHiện tại: ' + (current || '(chưa cài đặt)'),
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    var url = String(res.getResponseText() || '').trim();
    if (url && url.slice(-1) !== '/') url += '/';
    props.setProperty(PROP_KEYS.WEB_APP_URL, url);
    SpreadsheetApp.getActiveSpreadsheet().toast('Đã lưu URL trang khách: ' + url, '⚙️ Tư vấn THCN', 4);
  }
}

function menuInstallBackup() {
  installWeeklyBackupTrigger();
  var sample = runWeeklyBackup();
  SpreadsheetApp.getUi().alert(
    'Đã bật sao lưu tự động',
    'Hệ thống sẽ tự sao lưu file Sheet vào 02:00 sáng Chủ nhật hàng tuần trong thư mục "' + sample.folderName + '" (giữ 8 bản gần nhất).\n\nĐã tạo sẵn bản sao lưu đầu tiên: ' + sample.fileName,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuOpenCreateClient() {
  var html = HtmlService.createHtmlOutputFromFile('DialogCreateClient')
    .setWidth(520)
    .setHeight(540);
  SpreadsheetApp.getUi().showModalDialog(html, '➕ Tạo khách hàng mới');
}

function menuOpenManageStages() {
  var html = HtmlService.createHtmlOutputFromFile('DialogManageStages')
    .setWidth(520)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, '🔓 Mở / Khóa giai đoạn & Trạng thái');
}

function menuOpenLiveNotes() {
  var html = HtmlService.createHtmlOutputFromFile('DialogLiveNotes')
    .setWidth(620)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '📝 Ghi chú / Transcript buổi trực tiếp');
}

function menuOpenStageSummary() {
  var html = HtmlService.createHtmlOutputFromFile('DialogStageSummary')
    .setWidth(600)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '💾 Chấm Checklist & Lưu Tóm tắt Giai đoạn');
}

function menuOpenExportPreread() {
  openExportDialog_('preread', '📋 Xuất Bản đọc trước (Pre-read cho LLM)');
}

function menuOpenExportEval() {
  openExportDialog_('eval', '📋 Xuất Bản đánh giá (Eval cho LLM)');
}

function openExportDialog_(exportType, title) {
  var tpl = HtmlService.createTemplateFromFile('DialogExport');
  tpl.exportType = exportType;
  var html = tpl.evaluate().setWidth(700).setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}

// ==================== SERVER FUNCTIONS CHO CÁC MODAL DIALOG ====================

function adminGetInitData() {
  var bundle = getStaticBundle_();
  var clients = readTabAsObjects_(TABS.CLIENTS).map(normalizeClient_);
  var baseUrl = PropertiesService.getScriptProperties().getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var templates = Object.keys(bundle.templates).map(function (id) {
    return bundle.templates[id];
  });
  var questions = bundle.questions.map(function (q) {
    return { code: q.code, stage: q.stage, mode: q.mode, label: q.code + ' – ' + (q.question_live || q.question_self).slice(0, 65) };
  });

  return {
    baseUrl: baseUrl,
    clients: clients,
    templates: templates,
    questions: questions,
    checklistLabels: STAGE_CHECKLIST_LABELS
  };
}

function generateNextClientId_() {
  var clients = readTabAsObjects_(TABS.CLIENTS);
  var maxNum = 0;
  clients.forEach(function (c) {
    var m = String(c.client_id || '').match(/(\d+)$/);
    if (m) {
      var n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  var next = maxNum + 1;
  return 'C' + (next < 10 ? '00' : (next < 100 ? '0' : '')) + next;
}

function adminCreateClient(input) {
  var name = String((input && input.name) || '').trim();
  var field = String((input && input.field) || '').trim();
  var templateId = String((input && input.template) || 'chuan').trim();
  if (!name) throw new Error('Vui lòng nhập tên khách hàng.');

  var bundle = getStaticBundle_();
  var tpl = bundle.templates[templateId];
  if (!tpl) throw new Error('Template không tồn tại: ' + templateId);

  var clientId = generateNextClientId_();
  var token = generateSecureToken_(24);
  var defaultIntro = String((input && input.intro) || '').trim() ||
    'Chào anh/chị, đây là bảng chuẩn bị dữ kiện trước buổi làm việc xây dựng thương hiệu cá nhân trong lĩnh vực {field}. Anh/chị có thể gõ hoặc dùng micro trên bàn phím điện thoại để trả lời tự nhiên nhất.';

  var record = {
    client_id: clientId,
    token: token,
    name: name,
    field: field,
    template: templateId,
    include: '',
    exclude: '',
    branch: tpl.default_branch || '',
    stages_open: String((input && input.stages_open) || '1').trim(),
    stages_locked: '',
    show_probes: false,
    intro: defaultIntro,
    deadline: String((input && input.deadline) || '').trim(),
    status: 'active',
    consent_at: '',
    consent_version: '',
    created_at: nowIso_()
  };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    appendRowByHeader_(TABS.CLIENTS, record);
  } finally {
    lock.releaseLock();
  }

  var baseUrl = PropertiesService.getScriptProperties().getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var fullLink = baseUrl ? (baseUrl + '#k=' + token) : ('#k=' + token);

  return {
    client_id: clientId,
    token: token,
    branch: record.branch,
    link: fullLink,
    hasBaseUrl: Boolean(baseUrl)
  };
}

function adminUpdateClientStages(input) {
  var clientId = String((input && input.client_id) || '').trim();
  if (!clientId) throw new Error('Thiếu mã khách hàng.');

  var openArr = Array.isArray(input.stages_open) ? input.stages_open : parseStageList_(input.stages_open);
  var lockedArr = Array.isArray(input.stages_locked) ? input.stages_locked : parseStageList_(input.stages_locked);
  var status = String(input.status || 'active').trim().toLowerCase() === 'closed' ? 'closed' : 'active';
  var branch = String(input.branch || '').trim().toUpperCase();
  if (branch !== 'A' && branch !== 'B') branch = '';

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    upsertRowByHeader_(TABS.CLIENTS, {
      stages_open: openArr.join('|'),
      stages_locked: lockedArr.join('|'),
      status: status,
      branch: branch
    }, function (row) {
      return String(row.client_id || '').trim() === clientId;
    });
  } finally {
    lock.releaseLock();
  }

  return {
    client_id: clientId,
    stages_open: openArr.join('|'),
    stages_locked: lockedArr.join('|'),
    status: status,
    branch: branch
  };
}

function adminGetLiveNotes(clientId, stage, round) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  return readTabAsObjects_(TABS.LIVE_NOTES).filter(function (n) {
    return String(n.client_id || '').trim() === String(clientId).trim() &&
      parseInt(n.stage, 10) === stageNum &&
      (String(n.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === roundStr;
  }).map(function (n) {
    return {
      code: String(n.code || 'RAW'),
      tag: String(n.tag || 'RAW'),
      note: String(n.note || ''),
      created_at: String(n.created_at || '')
    };
  });
}

function adminSaveLiveNotes(input) {
  var clientId = String((input && input.client_id) || '').trim();
  var stageNum = parseInt(input && input.stage, 10) || 1;
  var roundStr = String((input && input.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var mode = String((input && input.mode) || 'raw').trim();
  var text = String((input && input.text) || '').trim();
  var code = String((input && input.code) || 'RAW').trim();

  if (!clientId) throw new Error('Vui lòng chọn khách hàng.');
  if (!text) throw new Error('Vui lòng nhập nội dung ghi chú.');

  var rowsToAdd = [];
  var ts = nowIso_();

  if (mode === 'raw' || code.toUpperCase() === 'RAW') {
    rowsToAdd.push({
      client_id: clientId,
      round: roundStr,
      stage: stageNum,
      code: 'RAW',
      tag: 'RAW',
      note: text,
      created_at: ts
    });
  } else {
    // Tách từng dòng có tiền tố tùy chọn f: / a: / g:
    var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    lines.forEach(function (line) {
      var tag = 'RAW';
      var content = line;
      var m = line.match(/^([fagFAG])\s*[:：]\s*(.+)$/);
      if (m) {
        tag = m[1].toUpperCase();
        content = m[2].trim();
      }
      rowsToAdd.push({
        client_id: clientId,
        round: roundStr,
        stage: stageNum,
        code: code,
        tag: tag,
        note: content,
        created_at: ts
      });
    });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    rowsToAdd.forEach(function (rec) {
      appendRowByHeader_(TABS.LIVE_NOTES, rec);
    });
  } finally {
    lock.releaseLock();
  }

  return { added: rowsToAdd.length };
}

function adminGetStageReview(clientId, stage, round) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var rows = readTabAsObjects_(TABS.STAGE_REVIEWS);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.client_id || '').trim() === String(clientId).trim() &&
      parseInt(r.stage, 10) === stageNum &&
      (String(r.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === roundStr) {
      return {
        submitted_at: String(r.submitted_at || ''),
        check_1: toBool_(r.check_1),
        check_2: toBool_(r.check_2),
        check_3: toBool_(r.check_3),
        check_4: toBool_(r.check_4),
        review_note: String(r.review_note || ''),
        approved_summary: String(r.approved_summary || '')
      };
    }
  }
  return {
    submitted_at: '',
    check_1: false, check_2: false, check_3: false, check_4: false,
    review_note: '', approved_summary: ''
  };
}

function adminSaveStageReview(input) {
  var clientId = String((input && input.client_id) || '').trim();
  var stageNum = parseInt(input && input.stage, 10) || 1;
  var roundStr = String((input && input.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  if (!clientId) throw new Error('Vui lòng chọn khách hàng.');

  var record = {
    client_id: clientId,
    round: roundStr,
    stage: stageNum,
    check_1: Boolean(input.check_1),
    check_2: Boolean(input.check_2),
    check_3: Boolean(input.check_3),
    check_4: Boolean(input.check_4),
    review_note: String(input.review_note || '').trim(),
    approved_summary: String(input.approved_summary || '').trim()
  };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    upsertRowByHeader_(TABS.STAGE_REVIEWS, record, function (row) {
      return String(row.client_id || '').trim() === clientId &&
        parseInt(row.stage, 10) === stageNum &&
        (String(row.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === roundStr;
    });
  } finally {
    lock.releaseLock();
  }

  return { ok: true };
}

function adminGenerateExport(input) {
  var clientId = String((input && input.client_id) || '').trim();
  var stageNum = parseInt(input && input.stage, 10) || 1;
  var roundStr = String((input && input.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var exportType = String((input && input.export_type) || 'preread').trim();
  var anonymize = Boolean(input && input.anonymize);

  var markdown = exportType === 'eval'
    ? buildEvalMarkdown_(clientId, stageNum, roundStr, { anonymize: anonymize })
    : buildPrereadMarkdown_(clientId, stageNum, roundStr, { anonymize: anonymize });

  return { markdown: markdown, charCount: markdown.length };
}
