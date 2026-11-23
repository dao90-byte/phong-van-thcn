/**
 * Config.gs
 * Hằng số, định nghĩa schema 7 tab, helper đọc/ghi theo tên header (chống lệch cột),
 * tách chuỗi bằng '|' (chống lỗi locale VN ép '1,2' -> 1.2), thoát thẻ XML chống prompt injection,
 * sinh token 24 ký tự an toàn, cache & rate-limit nhẹ.
 */

var TABS = {
  QUESTIONS: 'Questions',
  TEMPLATES: 'Templates',
  CLIENTS: 'Clients',
  RESPONSES: 'Responses',
  LIVE_NOTES: 'LiveNotes',
  STAGE_REVIEWS: 'StageReviews',
  CONFIG: 'Config',
  DASHBOARD: 'Dashboard'
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

// Các cột bắt buộc format Plain Text ('@') để Sheets không tự ép kiểu số/ngày tháng
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
var CACHE_TTL_SECONDS = 300; // 5 phút; có thể xóa ngay bằng Custom Menu Clear Cache
var CACHE_KEYS = {
  STATIC_BUNDLE: 'thcn_static_bundle_v2'
};

var PROP_KEYS = {
  WEB_APP_URL: 'THCN_CLIENT_APP_URL',
  BACKUP_FOLDER_ID: 'THCN_BACKUP_FOLDER_ID'
};

var STAGE_TITLES = {
  1: 'Giai đoạn 1: Khai thác thông tin & Chẩn đoán hiện trạng',
  2: 'Giai đoạn 2: Định vị chiến lược & Kiến trúc kinh doanh',
  3: 'Giai đoạn 3: Thiết kế hệ thống nội dung & Tài sản chuyển đổi',
  4: 'Giai đoạn 4: Đo lường, tối ưu & Phát triển tầm ảnh hưởng'
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

/**
 * Lấy Spreadsheet đang gắn với Apps Script.
 */
function getActiveSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Tách danh sách lưu bằng dấu '|' (hỗ trợ cả fallback dấu phẩy nếu lỡ nhập tay).
 * Không bao giờ để số 1.2 lọt qua vì chuẩn luôn lưu Text dùng '|'.
 */
function parsePipeList_(raw) {
  if (raw === null || raw === undefined) return [];
  var str = String(raw).trim();
  if (!str) return [];
  return str
    .split(/[|\n]+/)
    .map(function (item) { return item.trim(); })
    .filter(function (item) { return item.length > 0; });
}

/**
 * Chuẩn hóa danh sách giai đoạn (vd: "1|2" -> [1, 2]).
 */
function parseStageList_(raw) {
  var parts = parsePipeList_(raw);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var num = parseInt(parts[i], 10);
    if (!isNaN(num) && out.indexOf(num) === -1) {
      out.push(num);
    }
  }
  return out;
}

/**
 * Chuyển đổi an toàn giá trị boolean từ ô Sheets.
 */
function toBool_(val) {
  if (val === true) return true;
  if (val === false || val === null || val === undefined) return false;
  var s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES' || s === 'CO' || s === 'CÓ';
}

/**
 * Đọc toàn bộ 1 tab thành mảng object ánh xạ theo tên cột dòng 1.
 * Kèm theo `_rowIndex` (1-based) để cập nhật chính xác từng dòng.
 */
function readTabAsObjects_(sheetName) {
  var ss = getActiveSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Không tìm thấy tab: ' + sheetName + '. Hãy chạy mục "Khởi tạo Sheet" trong menu.');
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return [];
  }
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
      if (val !== '' && val !== null && val !== undefined) {
        hasAny = true;
      }
      obj[key] = val;
    }
    if (hasAny) {
      rows.push(obj);
    }
  }
  return rows;
}

/**
 * Lấy bản đồ header -> chỉ số cột (0-based) và danh sách headers của tab.
 */
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

/**
 * Upsert 1 dòng vào tab theo hàm matchFn(rowObj) dựa hoàn toàn vào tên header.
 * Trả về { action: 'inserted'|'updated', rowIndex: number }.
 */
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
    applyPlainTextToRowRange_(updateRange, headers, plainCols);
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

/**
 * Đảm bảo các cột khóa có format Plain Text ('@') trước khi ghi giá trị.
 */
function applyPlainTextToRowRange_(rowRange, headers, plainCols) {
  if (!plainCols || plainCols.length === 0) return;
  var sheet = rowRange.getSheet();
  var rowNum = rowRange.getRow();
  for (var c = 0; c < headers.length; c++) {
    if (plainCols.indexOf(headers[c]) !== -1) {
      sheet.getRange(rowNum, c + 1).setNumberFormat('@');
    }
  }
}

/**
 * Chèn thêm 1 dòng mới vào cuối tab theo tên header (append-only).
 */
function appendRowByHeader_(sheetName, recordObj) {
  return upsertRowByHeader_(sheetName, recordObj, null);
}

/**
 * Đọc Questions, Templates, Config có dùng CacheService (5 phút) để giảm thời gian đọc Sheet.
 */
function getStaticBundle_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEYS.STATIC_BUNDLE);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Fallback đọc lại từ Sheet nếu cache lỗi
    }
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
  } catch (e) {
    // Bỏ qua lỗi vượt kích thước cache
  }
  return bundle;
}

/**
 * Xóa bộ nhớ đệm cấu hình ngay lập tức (gọi từ Custom Menu hoặc sau khi Setup).
 */
function clearStaticCache_() {
  var cache = CacheService.getScriptCache();
  cache.remove(CACHE_KEYS.STATIC_BUNDLE);
}

/**
 * Sinh token 24 ký tự URL-safe có entropy cao bằng SHA-256 trên 2 UUID + thời gian.
 */
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

/**
 * Thoát các chuỗi thẻ đóng giống XML (vd: '</du_lieu>') trong dữ liệu do khách nhập
 * nhằm chống prompt injection khi xuất Markdown cho LLM.
 */
function escapeXmlTags_(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/<\s*\//g, '<\\/');
}

/**
 * Định dạng đoạn văn thành Markdown blockquote sạch sẽ, an toàn với nhiều dòng.
 */
function toBlockquote_(text) {
  var safe = escapeXmlTags_(text).trim();
  if (!safe) return '> *(chưa có nội dung)*';
  return safe
    .split(/\r?\n/)
    .map(function (line) { return '> ' + line; })
    .join('\n');
}

/**
 * Thay biến {name}, {field} trong văn bản câu hỏi / lời chào.
 */
function interpolateVars_(text, client) {
  if (!text) return '';
  return String(text)
    .replace(/\{name\}/g, String(client.name || 'bạn'))
    .replace(/\{field\}/g, String(client.field || 'lĩnh vực của bạn'));
}

/**
 * Đếm số từ (tương thích tiếng Việt Unicode).
 */
function countWords_(text) {
  if (!text) return 0;
  var cleaned = String(text).trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * Rate-limit nhẹ cho các request sai token (chống dò brute-force).
 */
function isRateLimited_() {
  var cache = CacheService.getScriptCache();
  var bucket = 'thcn_bad_token_' + Math.floor(Date.now() / 60000);
  var count = parseInt(cache.get(bucket) || '0', 10);
  return count >= 20;
}

function recordBadTokenAttempt_() {
  var cache = CacheService.getScriptCache();
  var bucket = 'thcn_bad_token_' + Math.floor(Date.now() / 60000);
  var count = parseInt(cache.get(bucket) || '0', 10) + 1;
  cache.put(bucket, String(count), 120);
}

/**
 * Trả về ISO timestamp theo múi giờ Việt Nam (hoặc chuẩn ISO UTC).
 */
function nowIso_() {
  return new Date().toISOString();
}
