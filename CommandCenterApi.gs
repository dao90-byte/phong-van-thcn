/**
 * CommandCenterApi.gs (v3)
 * API nội bộ (chỉ gọi từ google.script.run trong Google Sheets — bảo mật 100% qua tài khoản Google của chuyên gia).
 * Cung cấp đầy đủ thao tác cho Trung tâm Điều khiển 1 cửa (CommandCenter.html):
 * - Danh sách khách kèm tiến độ thực, cờ cảnh báo, trạng thái nộp bài
 * - Tải trọn gói Workspace của 1 khách + dựng sẵn toàn bộ 4 gói 1-Click Copy (0ms trên UI)
 * - Tạo khách mới, cập nhật hồ sơ, lưu ghi chú Live, chấm checklist
 * - Tự động hóa 1 chạm: Chốt giai đoạn hiện tại & Mở giai đoạn tiếp theo
 */

function ccBootstrap() {
  var bundle = getStaticBundle_();
  var rawClients = readTabAsObjects_(TABS.CLIENTS).map(normalizeClient_);
  var allResponses = readTabAsObjects_(TABS.RESPONSES);
  var allReviews = readTabAsObjects_(TABS.STAGE_REVIEWS);

  // Lập chỉ mục Responses & StageReviews theo client_id để tính tiến độ cực nhanh (O(n))
  var respByClient = {};
  allResponses.forEach(function (r) {
    var cid = String(r.client_id || '').trim();
    if (!cid) return;
    if (!respByClient[cid]) respByClient[cid] = [];
    respByClient[cid].push(r);
  });

  var revByClient = {};
  allReviews.forEach(function (sr) {
    var cid = String(sr.client_id || '').trim();
    if (!cid) return;
    if (!revByClient[cid]) revByClient[cid] = {};
    var st = parseInt(sr.stage, 10) || 1;
    if (String(sr.submitted_at || '').trim()) {
      revByClient[cid][st] = String(sr.submitted_at).trim();
    }
  });

  var clients = rawClients.map(function (c) {
    var unlocked = c.stages_open.filter(function (s) { return c.stages_locked.indexOf(s) === -1; });
    var activeStage = unlocked.length > 0
      ? Math.max.apply(null, unlocked)
      : (c.stages_open.length > 0 ? Math.max.apply(null, c.stages_open) : 1);

    var resolved = resolveClientQuestions_(c, bundle, { includeLive: false, stageFilter: activeStage });
    var allowedMap = {};
    resolved.questions.forEach(function (q) { allowedMap[q.code] = true; });

    var cResps = respByClient[c.client_id] || [];
    var answeredActive = 0;
    var flagsActive = 0;
    var latestUpdate = '';

    cResps.forEach(function (r) {
      var code = String(r.code || '').trim();
      var upd = String(r.updated_at || '').trim();
      if (upd && upd > latestUpdate) latestUpdate = upd;
      if (allowedMap[code]) {
        if (String(r.answer || '').trim()) answeredActive++;
        if (parsePipeList_(r.flags).length > 0) flagsActive++;
      }
    });

    var submittedMap = revByClient[c.client_id] || {};
    var isSubmittedActive = Boolean(submittedMap[activeStage]);
    var badge = 'not_started';
    if (c.status === 'closed') badge = 'closed';
    else if (isSubmittedActive) badge = 'submitted';
    else if (answeredActive > 0) badge = 'in_progress';

    return {
      client_id: c.client_id,
      name: c.name,
      field: c.field,
      template: c.template,
      branch: resolved.effectiveBranch,
      stages_open: c.stages_open,
      stages_locked: c.stages_locked,
      active_stage: activeStage,
      status: c.status,
      deadline: c.deadline,
      answered: answeredActive,
      total: resolved.questions.length,
      flags: flagsActive,
      submitted_stages: submittedMap,
      badge: badge,
      latest_update: latestUpdate,
      link: buildClientLink_(c.token)
    };
  });

  // Ưu tiên đưa khách mới nộp hoặc đang làm lên trên, khách đóng xuống cuối
  var priority = { submitted: 0, in_progress: 1, not_started: 2, closed: 3 };
  clients.sort(function (a, b) {
    if (priority[a.badge] !== priority[b.badge]) return priority[a.badge] - priority[b.badge];
    if (a.latest_update !== b.latest_update) return a.latest_update < b.latest_update ? 1 : -1;
    return a.client_id < b.client_id ? 1 : -1;
  });

  var templates = Object.keys(bundle.templates).map(function (id) { return bundle.templates[id]; });

  return {
    baseUrl: getClientAppBaseUrl_(),
    clients: clients,
    templates: templates,
    checklistLabels: STAGE_CHECKLIST_LABELS
  };
}

/**
 * Tải trọn gói Workspace cho 1 khách + 1 giai đoạn, dựng sẵn toàn bộ 4 gói 1-Click Copy (0ms).
 */
function ccGetClientWorkspace(clientId, stage, round, anonymize) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var anon = Boolean(anonymize);
  var ctx = collectClientStageData_(clientId, stageNum, roundStr);
  var client = ctx.client;

  var groups = ctx.outputOrder.map(function (outName) {
    var items = ctx.byOutput[outName].map(function (q) {
      var r = ctx.stageResponses[q.code] || null;
      return {
        code: q.code,
        mode: q.mode,
        question: interpolateVars_(q.question_self || q.question_live, client),
        question_live: interpolateVars_(q.question_live, client),
        hidden_goal: q.hidden_goal,
        answer: r ? String(r.answer || '') : '',
        answer_extra: r ? String(r.answer_extra || '') : '',
        input_mode: r ? String(r.input_mode || 'go') : '',
        word_count: r ? (parseInt(r.word_count, 10) || 0) : 0,
        flags: r ? parsePipeList_(r.flags) : [],
        matched_vague: r ? parsePipeList_(r.matched_vague) : [],
        updated_at: r ? String(r.updated_at || '') : ''
      };
    });
    return { output: outName, items: items };
  });

  var notesList = [];
  ctx.rawNotes.forEach(function (n) {
    notesList.push({ code: 'RAW', tag: 'RAW', note: String(n.note || ''), created_at: String(n.created_at || '') });
  });
  Object.keys(ctx.notesByCode).forEach(function (code) {
    ctx.notesByCode[code].forEach(function (n) {
      notesList.push({
        code: code,
        tag: String(n.tag || 'RAW').toUpperCase(),
        note: String(n.note || ''),
        created_at: String(n.created_at || '')
      });
    });
  });

  var review = ctx.currentReview ? {
    submitted_at: String(ctx.currentReview.submitted_at || ''),
    check_1: toBool_(ctx.currentReview.check_1),
    check_2: toBool_(ctx.currentReview.check_2),
    check_3: toBool_(ctx.currentReview.check_3),
    check_4: toBool_(ctx.currentReview.check_4),
    review_note: String(ctx.currentReview.review_note || ''),
    approved_summary: String(ctx.currentReview.approved_summary || '')
  } : {
    submitted_at: '',
    check_1: false, check_2: false, check_3: false, check_4: false,
    review_note: '', approved_summary: ''
  };

  var stageQuestionsBrief = ctx.resolved.questions.map(function (q) {
    return {
      code: q.code,
      mode: q.mode,
      label: q.code + ' [' + q.mode + '] – ' + interpolateVars_(q.question_live || q.question_self, client).slice(0, 62)
    };
  });

  var nextStage = Math.min(stageNum + 1, 4);

  return {
    client: {
      client_id: client.client_id,
      name: client.name,
      field: client.field,
      template: client.template,
      branch: ctx.resolved.effectiveBranch,
      include: client.include.join('|'),
      exclude: client.exclude.join('|'),
      stages_open: client.stages_open,
      stages_locked: client.stages_locked,
      show_probes: client.show_probes,
      intro: client.intro,
      deadline: client.deadline,
      status: client.status,
      consent_at: client.consent_at,
      link: buildClientLink_(client.token)
    },
    stage: stageNum,
    round: roundStr,
    stats: {
      done: ctx.doneCount,
      total: ctx.selfEligible.length,
      flags: ctx.flagCount,
      voice: ctx.voiceCount,
      type: ctx.typeCount
    },
    groups: groups,
    stageQuestions: stageQuestionsBrief,
    liveNotes: notesList,
    review: review,
    checklistLabels: STAGE_CHECKLIST_LABELS[stageNum] || STAGE_CHECKLIST_LABELS[2],
    // Dựng sẵn toàn bộ nội dung Copy -> 0ms khi bấm 1 nút trên UI!
    preloadedCopy: {
      cleanAnswers: buildCleanAnswersText_(client.client_id, stageNum, roundStr, { anonymize: anon }),
      allStagesAnswers: buildAllStagesAnswersText_(client.client_id, roundStr, { anonymize: anon }),
      prereadLlm: buildPrereadMarkdown_(client.client_id, stageNum, roundStr, { anonymize: anon }),
      evalLlm: buildEvalMarkdown_(client.client_id, stageNum, roundStr, { anonymize: anon }),
      zaloInvite: buildZaloMessage_(client, 'invite', nextStage, ctx.bundle.config),
      zaloNextStage: buildZaloMessage_(client, 'next_stage', nextStage, ctx.bundle.config)
    }
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

function ccCreateClient(input) {
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

  var normalized = normalizeClient_(record);
  return {
    client_id: clientId,
    token: token,
    branch: record.branch,
    link: buildClientLink_(token),
    hasBaseUrl: Boolean(getClientAppBaseUrl_()),
    zaloInvite: buildZaloMessage_(normalized, 'invite', 2, bundle.config)
  };
}

function ccUpdateClient(input) {
  var clientId = String((input && input.client_id) || '').trim();
  if (!clientId) throw new Error('Thiếu mã khách hàng.');

  var patch = {};
  if (input.name !== undefined) patch.name = String(input.name).trim();
  if (input.field !== undefined) patch.field = String(input.field).trim();
  if (input.deadline !== undefined) patch.deadline = String(input.deadline).trim();
  if (input.intro !== undefined) patch.intro = String(input.intro).trim();
  if (input.include !== undefined) patch.include = parsePipeList_(input.include).join('|');
  if (input.exclude !== undefined) patch.exclude = parsePipeList_(input.exclude).join('|');
  if (input.show_probes !== undefined) patch.show_probes = Boolean(input.show_probes);
  if (input.branch !== undefined) {
    var b = String(input.branch || '').trim().toUpperCase();
    patch.branch = (b === 'A' || b === 'B') ? b : '';
  }
  if (input.stages_open !== undefined) {
    var openArr = Array.isArray(input.stages_open) ? input.stages_open : parseStageList_(input.stages_open);
    patch.stages_open = openArr.join('|');
  }
  if (input.stages_locked !== undefined) {
    var lockArr = Array.isArray(input.stages_locked) ? input.stages_locked : parseStageList_(input.stages_locked);
    patch.stages_locked = lockArr.join('|');
  }
  if (input.status !== undefined) {
    patch.status = String(input.status).trim().toLowerCase() === 'closed' ? 'closed' : 'active';
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    upsertRowByHeader_(TABS.CLIENTS, patch, function (row) {
      return String(row.client_id || '').trim() === clientId;
    });
  } finally {
    lock.releaseLock();
  }

  return { ok: true, client_id: clientId };
}

function ccSaveLiveNotes(input) {
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

function ccSaveStageReview(input) {
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

/**
 * TỰ ĐỘNG HÓA 1 CHẠM: Chốt giai đoạn hiện tại & Mở giai đoạn tiếp theo
 * - Lưu 4 mục checklist + nhận xét + approved_summary vào StageReviews
 * - Khóa giai đoạn hiện tại (stages_locked) thành chỉ đọc
 * - Mở giai đoạn tiếp theo (stages_open) ngay trên cùng link cũ
 * - Trả về mẫu tin nhắn Zalo sẵn sàng copy 1-click để gửi khách
 */
function ccCompleteAndOpenNextStage(input) {
  var clientId = String((input && input.client_id) || '').trim();
  var stageNum = parseInt(input && input.stage, 10) || 1;
  var roundStr = String((input && input.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  if (!clientId) throw new Error('Thiếu mã khách hàng.');

  var client = findClientById_(clientId);
  if (!client) throw new Error('Không tìm thấy khách hàng: ' + clientId);

  var nextStage = stageNum < 4 ? (stageNum + 1) : 4;
  var newOpen = client.stages_open.slice();
  if (newOpen.indexOf(stageNum) === -1) newOpen.push(stageNum);
  if (stageNum < 4 && newOpen.indexOf(nextStage) === -1) newOpen.push(nextStage);
  newOpen.sort(function (a, b) { return a - b; });

  var newLocked = client.stages_locked.slice();
  if (newLocked.indexOf(stageNum) === -1) newLocked.push(stageNum);
  newLocked.sort(function (a, b) { return a - b; });

  var reviewRecord = {
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
    upsertRowByHeader_(TABS.STAGE_REVIEWS, reviewRecord, function (row) {
      return String(row.client_id || '').trim() === clientId &&
        parseInt(row.stage, 10) === stageNum &&
        (String(row.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === roundStr;
    });
    upsertRowByHeader_(TABS.CLIENTS, {
      stages_open: newOpen.join('|'),
      stages_locked: newLocked.join('|')
    }, function (row) {
      return String(row.client_id || '').trim() === clientId;
    });
  } finally {
    lock.releaseLock();
  }

  var bundle = getStaticBundle_();
  return {
    ok: true,
    locked_stage: stageNum,
    opened_stage: stageNum < 4 ? nextStage : null,
    stages_open: newOpen,
    stages_locked: newLocked,
    zaloNextStage: buildZaloMessage_(client, 'next_stage', nextStage, bundle.config)
  };
}
