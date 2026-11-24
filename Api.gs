/**
 * Api.gs
 * Endpoint công khai duy nhất của Google Apps Script Web App.
 * - Chỉ phục vụ 5 action phía khách hàng (KHÔNG có bất kỳ API quản trị nào trên internet).
 * - 100% đi qua doPost với Content-Type: text/plain (JSON body) để tránh CORS preflight
 *   và tuyệt đối không đặt token lên URL query string.
 */

function doGet() {
  return jsonResponse_({
    ok: true,
    data: {
      service: 'THCN Interview Client API',
      version: '2.0',
      note: 'Sử dụng POST text/plain với JSON payload.'
    }
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, code: 'EMPTY_BODY', error: 'Thiếu nội dung yêu cầu.' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse_({ ok: false, code: 'INVALID_JSON', error: 'Dữ liệu JSON không hợp lệ.' });
    }

    var action = String(body.action || '').trim();
    var token = String(body.token || '').trim();
    var payload = body.payload || {};

    var result = dispatchClientAction_(action, token, payload);
    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      code: 'SERVER_ERROR',
      error: err && err.message ? err.message : 'Lỗi máy chủ không xác định.'
    });
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm điều phối trung tâm (tách riêng để dễ kiểm thử tự động không cần HTTP).
 */
function dispatchClientAction_(action, token, payload) {
  if (!token || token.length < 8) {
    recordBadTokenAttempt_();
    return { ok: false, code: 'INVALID_TOKEN', error: 'Liên kết phỏng vấn không hợp lệ.' };
  }

  if (isRateLimited_()) {
    return { ok: false, code: 'RATE_LIMITED', error: 'Hệ thống đang tạm giới hạn truy cập. Vui lòng thử lại sau 1 phút.' };
  }

  var client = findClientByToken_(token);
  if (!client) {
    recordBadTokenAttempt_();
    return { ok: false, code: 'NOT_FOUND', error: 'Không tìm thấy hồ sơ phỏng vấn. Vui lòng kiểm tra lại đường link.' };
  }

  if (String(client.status || '').trim().toLowerCase() === 'closed') {
    return { ok: false, code: 'SESSION_CLOSED', error: 'Phiên phỏng vấn này đã đóng. Nếu anh/chị cần mở lại, vui lòng nhắn cho chuyên gia.' };
  }

  switch (action) {
    case 'getSession':
      return handleGetSession_(client, payload);
    case 'saveConsent':
      return handleSaveConsent_(client, payload);
    case 'setBranch':
      return handleSetBranch_(client, payload);
    case 'saveAnswer':
      return handleSaveAnswer_(client, payload);
    case 'submitStage':
      return handleSubmitStage_(client, payload);
    default:
      return { ok: false, code: 'UNKNOWN_ACTION', error: 'Hành động không được hỗ trợ.' };
  }
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
 * - options.includeLive: true cho Export/Admin, FALSE (mặc định) cho trang khách.
 * - options.stageFilter: số giai đoạn cụ thể (vd: 1 hoặc 2), nếu bỏ trống sẽ lọc theo stages_open.
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
        // Chưa chọn nhánh -> tạm chưa hiện câu nhánh A/B; đánh dấu để UI hỏi chọn nhánh trước 2.3
        needsBranchChoice = true;
        return;
      }
      if (q.branch !== effectiveBranch) {
        return;
      }
    }

    matched.push(q);
  });

  // Chỉ yêu cầu chọn nhánh nếu template của khách thực sự có cả 2 nhánh A & B trong giai đoạn mở
  if (!effectiveBranch && !(hasBranchA && hasBranchB)) {
    needsBranchChoice = false;
  }

  return {
    questions: matched,
    effectiveBranch: effectiveBranch,
    needsBranchChoice: needsBranchChoice
  };
}

/**
 * Action 1: getSession
 * TUYỆT ĐỐI KHÔNG trả về hidden_goal, question_live hay các câu mode = 'live'.
 */
function handleGetSession_(client, payload) {
  var round = String((payload && payload.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var bundle = getStaticBundle_();
  var resolved = resolveClientQuestions_(client, bundle, { includeLive: false });

  // Chỉ gửi đúng trường an toàn cho trình duyệt khách
  var safeQuestions = resolved.questions.map(function (q) {
    return {
      code: q.code,
      stage: q.stage,
      group: q.group,
      order: q.order,
      mode: q.mode,
      branch: q.branch,
      output: q.output,
      question_self: interpolateVars_(q.question_self || q.question_live, client),
      self_hint: interpolateVars_(q.self_hint, client),
      probes: client.show_probes ? q.probes : [],
      min_words: q.min_words,
      check_vague: q.check_vague,
      locked: client.stages_locked.indexOf(q.stage) !== -1
    };
  });

  // Đọc các câu trả lời đã lưu của riêng khách này & đúng đợt round
  var responsesMap = {};
  var allowedCodes = {};
  safeQuestions.forEach(function (q) { allowedCodes[q.code] = true; });

  readTabAsObjects_(TABS.RESPONSES).forEach(function (r) {
    if (String(r.client_id || '').trim() !== client.client_id) return;
    var rowRound = String(r.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    if (rowRound !== round) return;
    var code = String(r.code || '').trim();
    if (!allowedCodes[code]) return;
    responsesMap[code] = {
      code: code,
      stage: parseInt(r.stage, 10) || 1,
      answer: String(r.answer || ''),
      answer_extra: String(r.answer_extra || ''),
      input_mode: String(r.input_mode || 'go'),
      word_count: parseInt(r.word_count, 10) || 0,
      flags: parsePipeList_(r.flags),
      matched_vague: parsePipeList_(r.matched_vague),
      updated_at: String(r.updated_at || '')
    };
  });

  // Trạng thái đã nộp bài từng giai đoạn từ StageReviews
  var submittedStages = {};
  readTabAsObjects_(TABS.STAGE_REVIEWS).forEach(function (sr) {
    if (String(sr.client_id || '').trim() !== client.client_id) return;
    var rowRound = String(sr.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    if (rowRound !== round) return;
    if (String(sr.submitted_at || '').trim()) {
      submittedStages[String(parseInt(sr.stage, 10))] = String(sr.submitted_at).trim();
    }
  });

  var currentConsentVersion = bundle.config.consent_version || 'v1.0';
  var hasConsented = Boolean(client.consent_at) && client.consent_version === currentConsentVersion;

  return {
    ok: true,
    data: {
      client: {
        client_id: client.client_id,
        name: client.name,
        field: client.field,
        branch: resolved.effectiveBranch,
        stages_open: client.stages_open,
        stages_locked: client.stages_locked,
        intro: interpolateVars_(client.intro, client),
        deadline: client.deadline,
        has_consented: hasConsented,
        consent_at: client.consent_at
      },
      round: round,
      needs_branch_choice: resolved.needsBranchChoice,
      stage_titles: STAGE_TITLES,
      questions: safeQuestions,
      responses: responsesMap,
      submitted_stages: submittedStages,
      config: {
        vague_words: parsePipeList_(bundle.config.vague_words),
        consent_version: currentConsentVersion,
        consent_text: bundle.config.consent_text || ''
      }
    }
  };
}

/**
 * Action 2: saveConsent
 * Ghi thời điểm và phiên bản điều khoản khách đã đồng ý.
 */
function handleSaveConsent_(client, payload) {
  var bundle = getStaticBundle_();
  var version = String((payload && payload.consent_version) || bundle.config.consent_version || 'v1.0').trim();
  var ts = nowIso_();

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang bận, vui lòng thử lại sau vài giây.' };
  }
  try {
    upsertRowByHeader_(TABS.CLIENTS, {
      consent_at: ts,
      consent_version: version
    }, function (row) {
      return String(row.client_id || '').trim() === client.client_id;
    });
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    data: { consent_at: ts, consent_version: version }
  };
}

/**
 * Action 3: setBranch
 * Lưu nhánh A hoặc B khi khách chọn trước câu 2.3 và trả về luôn session đã cập nhật.
 */
function handleSetBranch_(client, payload) {
  var branch = String((payload && payload.branch) || '').trim().toUpperCase();
  if (branch !== 'A' && branch !== 'B') {
    return { ok: false, code: 'INVALID_BRANCH', error: 'Nhánh không hợp lệ (chỉ nhận A hoặc B).' };
  }

  // Nếu Giai đoạn 2 đã bị khóa thì không cho đổi nhánh
  if (client.stages_locked.indexOf(2) !== -1) {
    return { ok: false, code: 'STAGE_LOCKED', error: 'Giai đoạn 2 đã được khóa, không thể thay đổi nhánh.' };
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang bận, vui lòng thử lại.' };
  }
  try {
    upsertRowByHeader_(TABS.CLIENTS, {
      branch: branch
    }, function (row) {
      return String(row.client_id || '').trim() === client.client_id;
    });
  } finally {
    lock.releaseLock();
  }

  client.branch = branch;
  return handleGetSession_(client, payload);
}

/**
 * Action 4: saveAnswer
 * Upsert câu trả lời vào tab Responses theo khóa (client_id, round, code).
 * KHÔNG đụng vào tab Clients để giữ LockService cực ngắn và tránh xung đột.
 */
function handleSaveAnswer_(client, payload) {
  var code = String((payload && payload.code) || '').trim();
  var round = String((payload && payload.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  if (!code) {
    return { ok: false, code: 'MISSING_CODE', error: 'Thiếu mã câu hỏi.' };
  }

  var bundle = getStaticBundle_();
  var resolved = resolveClientQuestions_(client, bundle, { includeLive: false });
  var targetQuestion = null;
  for (var i = 0; i < resolved.questions.length; i++) {
    if (resolved.questions[i].code === code) {
      targetQuestion = resolved.questions[i];
      break;
    }
  }

  if (!targetQuestion) {
    return { ok: false, code: 'FORBIDDEN_QUESTION', error: 'Câu hỏi này không thuộc phiên phỏng vấn hiện tại.' };
  }

  if (client.stages_locked.indexOf(targetQuestion.stage) !== -1) {
    return { ok: false, code: 'STAGE_LOCKED', error: 'Giai đoạn ' + targetQuestion.stage + ' đã khóa, chỉ được xem lại.' };
  }

  var answer = String(payload.answer === undefined || payload.answer === null ? '' : payload.answer).trim();
  var answerExtra = String(payload.answer_extra === undefined || payload.answer_extra === null ? '' : payload.answer_extra).trim();
  var inputMode = String(payload.input_mode || 'go').trim().toLowerCase();
  if (['go', 'noi', 'hon_hop'].indexOf(inputMode) === -1) {
    inputMode = 'go';
  }

  var flagsArr = Array.isArray(payload.flags) ? payload.flags : parsePipeList_(payload.flags);
  var matchedVagueArr = Array.isArray(payload.matched_vague) ? payload.matched_vague : parsePipeList_(payload.matched_vague);
  var combinedText = answer + (answerExtra ? ' ' + answerExtra : '');
  var wordCount = countWords_(combinedText);
  var ts = nowIso_();

  var record = {
    client_id: client.client_id,
    round: round,
    stage: targetQuestion.stage,
    code: code,
    answer: answer,
    answer_extra: answerExtra,
    input_mode: inputMode,
    word_count: wordCount,
    flags: flagsArr.join('|'),
    matched_vague: matchedVagueArr.join('|'),
    updated_at: ts
  };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang xử lý nhiều yêu cầu, câu trả lời được giữ trên máy và sẽ tự gửi lại.' };
  }
  try {
    upsertRowByHeader_(TABS.RESPONSES, record, function (row) {
      return String(row.client_id || '').trim() === client.client_id &&
        (String(row.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === round &&
        String(row.code || '').trim() === code;
    });
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    data: {
      code: code,
      round: round,
      word_count: wordCount,
      updated_at: ts
    }
  };
}

/**
 * Action 5: submitStage
 * Ghi nhận thời điểm khách hoàn tất nộp bài cho một giai đoạn vào StageReviews.
 */
function handleSubmitStage_(client, payload) {
  var stage = parseInt(payload && payload.stage, 10);
  var round = String((payload && payload.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;

  if (isNaN(stage) || client.stages_open.indexOf(stage) === -1) {
    return { ok: false, code: 'INVALID_STAGE', error: 'Giai đoạn nộp bài không hợp lệ.' };
  }

  if (client.stages_locked.indexOf(stage) !== -1) {
    return { ok: false, code: 'STAGE_LOCKED', error: 'Giai đoạn này đã được khóa.' };
  }

  var ts = nowIso_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang bận, vui lòng bấm gửi lại.' };
  }
  try {
    upsertRowByHeader_(TABS.STAGE_REVIEWS, {
      client_id: client.client_id,
      round: round,
      stage: stage,
      submitted_at: ts
    }, function (row) {
      return String(row.client_id || '').trim() === client.client_id &&
        (String(row.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === round &&
        parseInt(row.stage, 10) === stage;
    });
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    data: { stage: stage, round: round, submitted_at: ts }
  };
}
