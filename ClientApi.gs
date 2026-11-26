/**
 * ClientApi.gs (v3)
 * Endpoint công khai duy nhất của Google Apps Script Web App (phía khách hàng).
 * - Chỉ phục vụ 5 action phía khách (doPost text/plain JSON), không phơi API quản trị ra internet.
 * - Tự động gửi Email thông báo (kèm toàn bộ câu trả lời sạch) tới chuyên gia ngay khi khách bấm Nộp bài.
 */

function doGet() {
  return jsonResponse_({
    ok: true,
    data: {
      service: 'THCN Interview API',
      version: '4.0',
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
    var payload = body.payload || {};

    if (action.indexOf('admin:') === 0) {
      var adminPin = String(body.admin_pin || '').trim();
      return jsonResponse_(dispatchAdminAction_(action.slice(6), adminPin, payload));
    }

    var token = String(body.token || '').trim();
    return jsonResponse_(dispatchClientAction_(action, token, payload));
  } catch (err) {
    return jsonResponse_({
      ok: false,
      code: 'SERVER_ERROR',
      error: err && err.message ? err.message : 'Lỗi máy chủ không xác định.'
    });
  }
}

function dispatchAdminAction_(adminAction, adminPin, payload) {
  if (isAdminRateLimited_()) {
    return { ok: false, code: 'RATE_LIMITED', error: 'Nhập sai mã PIN quá nhiều lần. Anh/chị vui lòng thử lại sau 5 phút.' };
  }

  if (!hasAdminPin_()) {
    return {
      ok: false,
      code: 'ADMIN_PIN_NOT_SET',
      error: 'Chưa cài đặt mã PIN Trung tâm Web. Anh/chị mở Google Sheet → menu ⚙️ Tư vấn THCN → Quản trị hệ thống → Đặt mã PIN Trung tâm Web (chỉ cần cài 1 lần).'
    };
  }

  if (!adminPin || !verifyAdminPin_(adminPin)) {
    recordBadAdminAttempt_();
    return { ok: false, code: 'INVALID_PIN', error: 'Mã PIN không đúng. Anh/chị vui lòng kiểm tra lại.' };
  }

  try {
    switch (adminAction) {
      case 'ccLoadSnapshot':
        return { ok: true, data: ccLoadSnapshot() };
      case 'ccCreateClient':
        return { ok: true, data: ccCreateClient(payload) };
      case 'ccUpdateClient':
        return { ok: true, data: ccUpdateClient(payload) };
      case 'ccSaveResponse':
        return { ok: true, data: ccSaveResponse(payload) };
      case 'ccSaveLiveNotes':
        return { ok: true, data: ccSaveLiveNotes(payload) };
      case 'ccSaveStageReview':
        return { ok: true, data: ccSaveStageReview(payload) };
      case 'ccCompleteAndOpenNextStage':
        return { ok: true, data: ccCompleteAndOpenNextStage(payload) };
      default:
        return { ok: false, code: 'UNKNOWN_ADMIN_ACTION', error: 'Hành động quản trị không được hỗ trợ.' };
    }
  } catch (err) {
    return {
      ok: false,
      code: 'ADMIN_ERROR',
      error: err && err.message ? err.message : 'Lỗi xử lý thao tác quản trị.'
    };
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function dispatchClientAction_(action, token, payload) {
  if (!token || token.length < 8) {
    recordBadTokenAttempt_();
    return { ok: false, code: 'INVALID_TOKEN', error: 'Liên kết phỏng vấn không hợp lệ.' };
  }

  if (isRateLimited_()) {
    return { ok: false, code: 'RATE_LIMITED', error: 'Hệ thống đang tạm giới hạn truy cập. Anh/chị vui lòng thử lại sau 1 phút.' };
  }

  var client = findClientByToken_(token);
  if (!client) {
    recordBadTokenAttempt_();
    return { ok: false, code: 'NOT_FOUND', error: 'Không tìm thấy hồ sơ phỏng vấn. Anh/chị vui lòng kiểm tra lại đường link.' };
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

function handleGetSession_(client, payload) {
  var round = String((payload && payload.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var bundle = getStaticBundle_();
  var resolved = resolveClientQuestions_(client, bundle, { includeLive: false });

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

  var submittedStages = {};
  var approvedSummaries = [];
  readTabAsObjects_(TABS.STAGE_REVIEWS).forEach(function (sr) {
    if (String(sr.client_id || '').trim() !== client.client_id) return;
    var rowRound = String(sr.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    var stNum = parseInt(sr.stage, 10) || 1;
    if (rowRound === round && String(sr.submitted_at || '').trim()) {
      submittedStages[String(stNum)] = String(sr.submitted_at).trim();
    }
    var sumTxt = String(sr.approved_summary || '').trim();
    if (sumTxt && client.stages_locked.indexOf(stNum) !== -1) {
      approvedSummaries.push({ stage: stNum, round: rowRound, summary: sumTxt });
    }
  });
  approvedSummaries.sort(function (a, b) { return a.stage - b.stage; });

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
      approved_summaries: approvedSummaries,
      config: {
        vague_words: parsePipeList_(bundle.config.vague_words),
        consent_version: currentConsentVersion,
        consent_text: bundle.config.consent_text || ''
      }
    }
  };
}

function handleSaveConsent_(client, payload) {
  var bundle = getStaticBundle_();
  var version = String((payload && payload.consent_version) || bundle.config.consent_version || 'v1.0').trim();
  var ts = nowIso_();

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang bận, anh/chị vui lòng thử lại sau vài giây.' };
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

  return { ok: true, data: { consent_at: ts, consent_version: version } };
}

function handleSetBranch_(client, payload) {
  var branch = String((payload && payload.branch) || '').trim().toUpperCase();
  if (branch !== 'A' && branch !== 'B') {
    return { ok: false, code: 'INVALID_BRANCH', error: 'Nhánh không hợp lệ (chỉ nhận A hoặc B).' };
  }

  if (client.stages_locked.indexOf(2) !== -1) {
    return { ok: false, code: 'STAGE_LOCKED', error: 'Giai đoạn 2 đã được khóa, không thể thay đổi nhánh.' };
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang bận, anh/chị vui lòng thử lại.' };
  }
  try {
    upsertRowByHeader_(TABS.CLIENTS, { branch: branch }, function (row) {
      return String(row.client_id || '').trim() === client.client_id;
    });
  } finally {
    lock.releaseLock();
  }

  client.branch = branch;
  return handleGetSession_(client, payload);
}

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
    return { ok: false, code: 'STAGE_LOCKED', error: 'Phần này đã được khóa, chỉ được xem lại.' };
  }

  var answer = String(payload.answer === undefined || payload.answer === null ? '' : payload.answer).trim();
  var answerExtra = String(payload.answer_extra === undefined || payload.answer_extra === null ? '' : payload.answer_extra).trim();
  var inputMode = String(payload.input_mode || 'go').trim().toLowerCase();
  if (['go', 'noi', 'hon_hop'].indexOf(inputMode) === -1) inputMode = 'go';

  var flagsArr = Array.isArray(payload.flags) ? payload.flags : parsePipeList_(payload.flags);
  var matchedVagueArr = Array.isArray(payload.matched_vague) ? payload.matched_vague : parsePipeList_(payload.matched_vague);
  var wordCount = countWords_(answer + (answerExtra ? ' ' + answerExtra : ''));
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
    data: { code: code, round: round, word_count: wordCount, updated_at: ts }
  };
}

function handleSubmitStage_(client, payload) {
  var stage = parseInt(payload && payload.stage, 10);
  var round = String((payload && payload.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;

  if (isNaN(stage) || client.stages_open.indexOf(stage) === -1) {
    return { ok: false, code: 'INVALID_STAGE', error: 'Giai đoạn nộp bài không hợp lệ.' };
  }
  if (client.stages_locked.indexOf(stage) !== -1) {
    return { ok: false, code: 'STAGE_LOCKED', error: 'Phần này đã được khóa.' };
  }

  var ts = nowIso_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, code: 'LOCK_TIMEOUT', error: 'Hệ thống đang bận, anh/chị vui lòng bấm gửi lại.' };
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

  // Tự động gửi Email thông báo + toàn bộ câu trả lời sạch về cho chuyên gia (không làm gián đoạn nộp bài nếu lỗi quota)
  var emailSent = false;
  try {
    emailSent = sendSubmitNotificationEmail_(client, stage, round);
  } catch (mailErr) {
    emailSent = false;
  }

  return {
    ok: true,
    data: { stage: stage, round: round, submitted_at: ts, email_notified: emailSent }
  };
}

function sendSubmitNotificationEmail_(client, stage, round) {
  var bundle = getStaticBundle_();
  var shouldNotify = bundle.config.notify_email_on_submit === undefined
    ? true
    : toBool_(bundle.config.notify_email_on_submit);
  if (!shouldNotify) return false;
  if (typeof MailApp === 'undefined' || typeof MailApp.sendEmail !== 'function') return false;

  var ownerEmail = '';
  try {
    ownerEmail = Session.getEffectiveUser().getEmail();
  } catch (e) {}
  if (!ownerEmail) return false;

  var ssUrl = '';
  try {
    ssUrl = getActiveSpreadsheet_().getUrl();
  } catch (e) {}

  var cleanText = buildCleanAnswersText_(client.client_id, stage, round, { anonymize: false });
  var subject = '[THCN] Khách ' + client.name + ' (' + client.client_id + ') đã hoàn thành Giai đoạn ' + stage;
  var body = [
    'Khách hàng ' + client.name + ' (' + client.client_id + ' – ' + (client.field || 'Chưa rõ') + ') vừa bấm Hoàn tất & Gửi bài cho Giai đoạn ' + stage + '.',
    ssUrl ? ('Mở Sheet & Trung tâm Điều khiển: ' + ssUrl) : '',
    '',
    '============================================================',
    cleanText
  ].join('\n');

  MailApp.sendEmail(ownerEmail, subject, body);
  return true;
}
