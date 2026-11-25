/**
 * Core.gs (v3)
 * Nền tảng lõi: Schema 7 tab + Dashboard, 3 vùng màu tab trực quan,
 * đọc/ghi an toàn theo tên header dòng 1, tách chuỗi bằng '|' (chống lỗi locale VN),
 * sinh token 24 ký tự SHA-256, thoát thẻ XML chống prompt injection, cache & rate-limit.
 */

var TABS = {
  DASHBOARD: 'Dashboard',
  QUESTIONS: 'Questions',
  TEMPLATES: 'Templates',
  CONFIG: 'Config',
  CLIENTS: 'Clients',
  RESPONSES: 'Responses',
  LIVE_NOTES: 'LiveNotes',
  STAGE_REVIEWS: 'StageReviews'
};

// Thứ tự & màu sắc 3 vùng tab khoa học trong Google Sheets
var TAB_ORDER = [
  TABS.DASHBOARD,
  TABS.QUESTIONS,
  TABS.TEMPLATES,
  TABS.CONFIG,
  TABS.CLIENTS,
  TABS.RESPONSES,
  TABS.LIVE_NOTES,
  TABS.STAGE_REVIEWS
];

var TAB_COLORS = {
  Dashboard: '#0F5257',     // Vùng 1: Vận hành hằng ngày (Xanh ngọc)
  Questions: '#B45309',     // Vùng 2: Cấu hình nghiệp vụ (Hổ phách)
  Templates: '#B45309',
  Config: '#B45309',
  Clients: '#78716C',       // Vùng 3: Kho dữ liệu thô (Xám)
  Responses: '#78716C',
  LiveNotes: '#78716C',
  StageReviews: '#78716C'
};

var SCHEMAS = {
  Questions: [
    'code', 'stage', 'group', 'order', 'active', 'mode', 'branch', 'output',
    'question_live', 'question_self', 'self_hint', 'hidden_goal', 'probes',
    'min_words', 'check_vague'
  ],
  Templates: [
    'template_id', 'default_branch', 'codes', 'description'
  ],
  Clients: [
    'client_id', 'token', 'name', 'field', 'template', 'include', 'exclude',
    'branch', 'stages_open', 'stages_locked', 'show_probes', 'intro',
    'deadline', 'status', 'consent_at', 'consent_version', 'created_at'
  ],
  Responses: [
    'client_id', 'round', 'stage', 'code', 'answer', 'answer_extra',
    'input_mode', 'word_count', 'flags', 'matched_vague', 'updated_at'
  ],
  LiveNotes: [
    'client_id', 'round', 'stage', 'code', 'tag', 'note', 'created_at'
  ],
  StageReviews: [
    'client_id', 'round', 'stage', 'submitted_at',
    'check_1', 'check_2', 'check_3', 'check_4',
    'review_note', 'approved_summary'
  ],
  Config: [
    'key', 'value', 'note'
  ]
};

// Các cột bắt buộc format Plain Text ('@') để Google Sheets không tự ép kiểu số/ngày tháng
var PLAIN_TEXT_COLUMNS = {
  Questions: ['code', 'group', 'branch', 'probes'],
  Templates: ['template_id', 'default_branch', 'codes'],
  Clients: ['client_id', 'token', 'template', 'include', 'exclude', 'branch', 'stages_open', 'stages_locked', 'deadline', 'consent_at', 'consent_version', 'created_at'],
  Responses: ['client_id', 'round', 'code', 'flags', 'matched_vague', 'updated_at'],
  LiveNotes: ['client_id', 'round', 'code', 'tag', 'created_at'],
  StageReviews: ['client_id', 'round', 'submitted_at'],
  Config: ['key', 'value']
};

var DEFAULT_ROUND = 'R1';
var CACHE_TTL_SECONDS = 300;
var CACHE_KEYS = {
  STATIC_BUNDLE: 'thcn_static_bundle_v3'
};

var PROP_KEYS = {
  WEB_APP_URL: 'THCN_CLIENT_APP_URL',
  BACKUP_FOLDER_ID: 'THCN_BACKUP_FOLDER_ID'
};

var STAGE_TITLES = {
  1: 'Giai đoạn 1',
  2: 'Giai đoạn 2',
  3: 'Giai đoạn 3',
  4: 'Giai đoạn 4'
};

var STAGE_CHECKLIST_LABELS = {
  1: [
    'Tách bạch rõ Sự thật [F] và Giả định [A]',
    'Đủ bằng chứng cứng (Hard Proof) cho năng lực lõi (1.2.x, 1.3.x)',
    'Làm rõ Khoảng trống định vị (1.4.x) và Ranh giới/Vùng cấm (1.1.4)',
    'Chốt KPI ưu tiên duy nhất (1.1.3) và Quỹ thời gian thực tế (1.1.5)'
  ],
  2: [
    'Đã tách bạch sự thật và giả định cần kiểm chứng thị trường',
    'Đã tìm thấy "Mỏ neo khác biệt" (Năng lực lõi + Nỗi đau + Góc nhìn)',
    'Đã khớp nối rõ ràng với dòng tiền / sản phẩm / quy trình chốt đơn',
    'Kế hoạch vừa sức vận hành theo quỹ thời gian câu 1.1.5'
  ],
  3: [
    'Trụ cột nội dung gắn trực tiếp với nỗi đau & góc nhìn khác biệt',
    'Kho Case study 3C và câu chuyện đủ độ chân thực, không vượt vùng cấm',
    'Trải nghiệm thử (Lead Magnet) dẫn mượt về sản phẩm cốt lõi',
    'Định dạng & kênh phân phối vừa sức quỹ thời gian 1.1.5'
  ],
  4: [
    'Đo lường được chất lượng nhận diện (tỷ lệ đúng tệp mục tiêu)',
    'Khoanh vùng được điểm nghẽn chuyển đổi ở khâu chốt sales',
    'Đã tái phân bổ nguồn lực theo nguyên lý 80/20',
    'Có bước tiến rõ về tài sản trí tuệ (IP) / tầm ảnh hưởng ngành'
  ]
};

function getActiveSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function parsePipeList_(raw) {
  if (raw === null || raw === undefined) return [];
  var str = String(raw).trim();
  if (!str) return [];
  return str
    .split(/[|\n]+/)
    .map(function (item) { return item.trim(); })
    .filter(function (item) { return item.length > 0; });
}

function parseStageList_(raw) {
  var parts = parsePipeList_(raw);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var num = parseInt(parts[i], 10);
    if (!isNaN(num) && out.indexOf(num) === -1) {
      out.push(num);
    }
  }
  out.sort(function (a, b) { return a - b; });
  return out;
}

function toBool_(val) {
  if (val === true) return true;
  if (val === false || val === null || val === undefined) return false;
  var s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES' || s === 'CO' || s === 'CÓ';
}

function readTabAsObjects_(sheetName) {
  var ss = getActiveSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Không tìm thấy tab: ' + sheetName + '. Hãy chạy mục "Nâng cấp / Kiểm tra cấu trúc Sheet" trong menu.');
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var rowArr = values[r];
    var hasAny = false;
    var obj = { _rowIndex: r + 1 };
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      if (!key) continue;
      var val = rowArr[c];
      if (val !== '' && val !== null && val !== undefined) hasAny = true;
      obj[key] = val;
    }
    if (hasAny) rows.push(obj);
  }
  return rows;
}

function getTabHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { headers: [], map: {} };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h).trim();
  });
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[headers[i]] = i;
  }
  return { headers: headers, map: map };
}

function upsertRowByHeader_(sheetName, recordObj, matchFn) {
  var ss = getActiveSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Không tìm thấy tab: ' + sheetName);

  var info = getTabHeaders_(sheet);
  var headers = info.headers;
  var lastRow = sheet.getLastRow();
  var targetRowIndex = -1;
  var existingRowValues = null;

  if (lastRow >= 2 && typeof matchFn === 'function') {
    var allValues = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (var r = 0; r < allValues.length; r++) {
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        obj[headers[c]] = allValues[r][c];
      }
      if (matchFn(obj)) {
        targetRowIndex = r + 2;
        existingRowValues = allValues[r];
        break;
      }
    }
  }

  var rowToWrite = [];
  for (var i = 0; i < headers.length; i++) {
    var colName = headers[i];
    if (Object.prototype.hasOwnProperty.call(recordObj, colName)) {
      rowToWrite.push(recordObj[colName]);
    } else if (existingRowValues) {
      rowToWrite.push(existingRowValues[i]);
    } else {
      rowToWrite.push('');
    }
  }

  var plainCols = PLAIN_TEXT_COLUMNS[sheetName] || [];
  if (targetRowIndex > 0) {
    var updateRange = sheet.getRange(targetRowIndex, 1, 1, headers.length);
    updateRange.setValues([rowToWrite]);
    SpreadsheetApp.flush();
    return { action: 'updated', rowIndex: targetRowIndex };
  } else {
    var newRowIndex = Math.max(lastRow + 1, 2);
    var insertRange = sheet.getRange(newRowIndex, 1, 1, headers.length);
    applyPlainTextToRowRange_(insertRange, headers, plainCols);
    insertRange.setValues([rowToWrite]);
    SpreadsheetApp.flush();
    return { action: 'inserted', rowIndex: newRowIndex };
  }
}

function applyPlainTextToRowRange_(rowRange, headers, plainCols) {
  if (!plainCols || plainCols.length === 0) return;
  var sheet = rowRange.getSheet();
  var rowNum = rowRange.getRow();
  var colIndices = [];
  for (var c = 0; c < headers.length; c++) {
    if (plainCols.indexOf(headers[c]) !== -1) {
      colIndices.push(c + 1);
    }
  }
  if (colIndices.length === 0) return;

  // Gộp 1 lần + flush trong try để bắt lỗi typed column ngay tại chỗ (tránh lỗi bị dồn sang lần đọc/ghi kế tiếp)
  try {
    for (var i = 0; i < colIndices.length; i++) {
      sheet.getRange(rowNum, colIndices[i]).setNumberFormat('@');
    }
    SpreadsheetApp.flush();
  } catch (e) {
    // Fallback từng cột: giữ '@' cho các cột thường và bỏ qua an toàn cột typed column (Table / Dropdown / Date / Checkbox)
    for (var j = 0; j < colIndices.length; j++) {
      try {
        sheet.getRange(rowNum, colIndices[j]).setNumberFormat('@');
        SpreadsheetApp.flush();
      } catch (e2) {}
    }
  }
}

function appendRowByHeader_(sheetName, recordObj) {
  return upsertRowByHeader_(sheetName, recordObj, null);
}

function getStaticBundle_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEYS.STATIC_BUNDLE);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  var questions = readTabAsObjects_(TABS.QUESTIONS).map(function (q) {
    return {
      code: String(q.code || '').trim(),
      stage: parseInt(q.stage, 10) || 1,
      group: String(q.group || '').trim(),
      order: parseInt(q.order, 10) || 0,
      active: toBool_(q.active),
      mode: String(q.mode || 'self').trim().toLowerCase(),
      branch: String(q.branch || '').trim().toUpperCase(),
      output: String(q.output || '').trim(),
      question_live: String(q.question_live || '').trim(),
      question_self: String(q.question_self || '').trim(),
      self_hint: String(q.self_hint || '').trim(),
      hidden_goal: String(q.hidden_goal || '').trim(),
      probes: parsePipeList_(q.probes),
      min_words: parseInt(q.min_words, 10) || 0,
      check_vague: toBool_(q.check_vague)
    };
  });
  questions.sort(function (a, b) {
    if (a.stage !== b.stage) return a.stage - b.stage;
    return a.order - b.order;
  });

  var templatesMap = {};
  readTabAsObjects_(TABS.TEMPLATES).forEach(function (t) {
    var id = String(t.template_id || '').trim();
    if (!id) return;
    templatesMap[id] = {
      template_id: id,
      default_branch: String(t.default_branch || '').trim().toUpperCase(),
      codes: parsePipeList_(t.codes),
      description: String(t.description || '').trim()
    };
  });

  var configMap = {};
  readTabAsObjects_(TABS.CONFIG).forEach(function (c) {
    var k = String(c.key || '').trim();
    if (k) configMap[k] = String(c.value === undefined || c.value === null ? '' : c.value);
  });

  var bundle = {
    questions: questions,
    templates: templatesMap,
    config: configMap
  };

  try {
    var serialized = JSON.stringify(bundle);
    if (serialized.length < 95000) {
      cache.put(CACHE_KEYS.STATIC_BUNDLE, serialized, CACHE_TTL_SECONDS);
    }
  } catch (e) {}
  return bundle;
}

function clearStaticCache_() {
  CacheService.getScriptCache().remove(CACHE_KEYS.STATIC_BUNDLE);
}

function generateSecureToken_(length) {
  var len = length || 24;
  var seed = Utilities.getUuid() + '|' + Utilities.getUuid() + '|' + Date.now() + '|' + Math.random();
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed);
  var b64 = Utilities.base64EncodeWebSafe(digest).replace(/[=_-]/g, '');
  while (b64.length < len) {
    var extra = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + b64);
    b64 += Utilities.base64EncodeWebSafe(extra).replace(/[=_-]/g, '');
  }
  return b64.substring(0, len);
}

function escapeXmlTags_(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/<\s*\//g, '<\\/');
}

function toBlockquote_(text) {
  var safe = escapeXmlTags_(text).trim();
  if (!safe) return '> *(chưa có nội dung)*';
  return safe
    .split(/\r?\n/)
    .map(function (line) { return '> ' + line; })
    .join('\n');
}

function interpolateVars_(text, client) {
  if (!text) return '';
  return String(text)
    .replace(/\{name\}/g, 'anh/chị')
    .replace(/\{field\}/g, String((client && client.field) || 'lĩnh vực của anh/chị'));
}

function countWords_(text) {
  if (!text) return 0;
  var cleaned = String(text).trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function isRateLimited_() {
  var cache = CacheService.getScriptCache();
  var bucket = 'thcn_bad_token_' + Math.floor(Date.now() / 60000);
  return parseInt(cache.get(bucket) || '0', 10) >= 20;
}

function recordBadTokenAttempt_() {
  var cache = CacheService.getScriptCache();
  var bucket = 'thcn_bad_token_' + Math.floor(Date.now() / 60000);
  var count = parseInt(cache.get(bucket) || '0', 10) + 1;
  cache.put(bucket, String(count), 120);
}

function nowIso_() {
  return new Date().toISOString();
}

function findClientByToken_(token) {
  var clients = readTabAsObjects_(TABS.CLIENTS);
  for (var i = 0; i < clients.length; i++) {
    if (String(clients[i].token || '').trim() === token) {
      return normalizeClient_(clients[i]);
    }
  }
  return null;
}

function findClientById_(clientId) {
  var clients = readTabAsObjects_(TABS.CLIENTS);
  for (var i = 0; i < clients.length; i++) {
    if (String(clients[i].client_id || '').trim() === String(clientId).trim()) {
      return normalizeClient_(clients[i]);
    }
  }
  return null;
}

function normalizeClient_(raw) {
  return {
    _rowIndex: raw._rowIndex,
    client_id: String(raw.client_id || '').trim(),
    token: String(raw.token || '').trim(),
    name: String(raw.name || '').trim(),
    field: String(raw.field || '').trim(),
    template: String(raw.template || 'chuan').trim(),
    include: parsePipeList_(raw.include),
    exclude: parsePipeList_(raw.exclude),
    branch: String(raw.branch || '').trim().toUpperCase(),
    stages_open: parseStageList_(raw.stages_open),
    stages_locked: parseStageList_(raw.stages_locked),
    show_probes: toBool_(raw.show_probes),
    intro: String(raw.intro || '').trim(),
    deadline: String(raw.deadline || '').trim(),
    status: String(raw.status || 'active').trim().toLowerCase(),
    consent_at: String(raw.consent_at || '').trim(),
    consent_version: String(raw.consent_version || '').trim(),
    created_at: String(raw.created_at || '').trim()
  };
}

/**
 * Lọc danh sách câu hỏi áp dụng cho 1 khách cụ thể.
 * - options.includeLive: true cho Export/CommandCenter, FALSE (mặc định) cho trang khách.
 * - options.stageFilter: số giai đoạn cụ thể (1..4), bỏ trống sẽ lọc theo stages_open.
 */
function resolveClientQuestions_(client, bundle, options) {
  var opts = options || {};
  var includeLive = !!opts.includeLive;
  var stageFilter = opts.stageFilter ? parseInt(opts.stageFilter, 10) : null;

  var tpl = bundle.templates[client.template] || bundle.templates['chuan'] || { codes: [], default_branch: '' };
  var codeSet = {};
  tpl.codes.forEach(function (c) { codeSet[c] = true; });
  client.include.forEach(function (c) { codeSet[c] = true; });
  client.exclude.forEach(function (c) { delete codeSet[c]; });

  var effectiveBranch = client.branch || tpl.default_branch || '';
  var openStages = stageFilter ? [stageFilter] : client.stages_open;
  var needsBranchChoice = false;
  var hasBranchA = false;
  var hasBranchB = false;

  var matched = [];
  bundle.questions.forEach(function (q) {
    if (!q.active) return;
    if (!codeSet[q.code]) return;
    if (openStages.indexOf(q.stage) === -1) return;
    if (!includeLive && q.mode === 'live') return;

    if (q.branch === 'A') hasBranchA = true;
    if (q.branch === 'B') hasBranchB = true;

    if (q.branch) {
      if (!effectiveBranch) {
        needsBranchChoice = true;
        return;
      }
      if (q.branch !== effectiveBranch) return;
    }

    matched.push(q);
  });

  if (!effectiveBranch && !(hasBranchA && hasBranchB)) {
    needsBranchChoice = false;
  }

  return {
    questions: matched,
    effectiveBranch: effectiveBranch,
    needsBranchChoice: needsBranchChoice
  };
}

function getClientAppBaseUrl_() {
  return PropertiesService.getScriptProperties().getProperty(PROP_KEYS.WEB_APP_URL) || '';
}

function buildClientLink_(token, preloadedBaseUrl) {
  var baseUrl = (preloadedBaseUrl !== undefined && preloadedBaseUrl !== null)
    ? String(preloadedBaseUrl)
    : getClientAppBaseUrl_();
  return baseUrl ? (baseUrl + '#k=' + token) : ('#k=' + token);
}

/**
 * Đọc trọn bộ dữ liệu vận hành trong ĐÚNG 1 LƯỢT DUY NHẤT (1 lần/tab) để tránh lặp RPC Google Sheets.
 * - Questions/Templates/Config lấy từ CacheService (0 lượt đọc Sheet khi cache nóng)
 * - Clients/Responses/LiveNotes/StageReviews đọc đúng 1 lần mỗi tab.
 */
function readWorkbookSnapshot_() {
  var bundle = getStaticBundle_();
  var baseUrl = getClientAppBaseUrl_();
  var clients = readTabAsObjects_(TABS.CLIENTS).map(normalizeClient_);
  var responses = readTabAsObjects_(TABS.RESPONSES);
  var liveNotes = readTabAsObjects_(TABS.LIVE_NOTES);
  var stageReviews = readTabAsObjects_(TABS.STAGE_REVIEWS);

  var clientMap = {};
  clients.forEach(function (c) {
    if (c.client_id) clientMap[c.client_id] = c;
  });

  return {
    bundle: bundle,
    baseUrl: baseUrl,
    clients: clients,
    clientMap: clientMap,
    responses: responses,
    liveNotes: liveNotes,
    stageReviews: stageReviews
  };
}

/**
 * Chuyển đối tượng thành chuỗi JSON an toàn để nhúng trực tiếp vào thẻ <script type="application/json">.
 */
function safeJsonForHtml_(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
