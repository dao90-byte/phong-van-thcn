/**
 * CommandCenterApi.gs (v3.1)
 * API nội bộ tốc độ cao cho Trung tâm Điều khiển (chỉ chạy qua google.script.run trong Google Sheets).
 * - ccLoadSnapshot(): Đọc mỗi tab ĐÚNG 1 LẦN (4 lượt đọc Sheet khi cache nóng), nhúng thẳng vào HTML khi mở
 *   để mở màn hình tức thì, chuyển khách/chuyển giai đoạn 0ms và Copy 1-click tức thì trên trình duyệt.
 * - Các hàm ghi trả về bản ghi đã cập nhật để UI đồng bộ ngay tại chỗ không cần tải lại toàn bộ Sheet.
 */

var CC_CONFIG_KEYS = [
  'zalo_invite_template',
  'zalo_next_stage_template',
  'prompt_preread_s1', 'prompt_eval_s1',
  'prompt_preread_s2', 'prompt_eval_s2',
  'prompt_preread_s3', 'prompt_eval_s3',
  'prompt_preread_s4', 'prompt_eval_s4'
];

function serializeClientForUi_(c, baseUrl) {
  return {
    client_id: c.client_id,
    token: c.token,
    name: c.name,
    field: c.field,
    template: c.template,
    include: c.include,
    exclude: c.exclude,
    branch: c.branch,
    stages_open: c.stages_open,
    stages_locked: c.stages_locked,
    show_probes: c.show_probes,
    intro: c.intro,
    deadline: c.deadline,
    status: c.status,
    consent_at: c.consent_at,
    created_at: c.created_at,
    link: buildClientLink_(c.token, baseUrl)
  };
}

/**
 * Tải toàn bộ dữ liệu Command Center trong ĐÚNG 1 LƯỢT ĐỌC duy nhất (nhúng thẳng vào HTML khi mở).
 */
function ccLoadSnapshot() {
  var snap = readWorkbookSnapshot_();
  var bundle = snap.bundle;

  var configSubset = {};
  CC_CONFIG_KEYS.forEach(function (k) {
    if (bundle.config[k] !== undefined) configSubset[k] = bundle.config[k];
  });

  var responsesByClient = {};
  snap.responses.forEach(function (r) {
    var cid = String(r.client_id || '').trim();
    var code = String(r.code || '').trim();
    if (!cid || !code) return;
    if (!responsesByClient[cid]) responsesByClient[cid] = [];
    responsesByClient[cid].push({
      round: String(r.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND,
      stage: parseInt(r.stage, 10) || 1,
      code: code,
      answer: String(r.answer || ''),
      answer_extra: String(r.answer_extra || ''),
      input_mode: String(r.input_mode || 'go'),
      word_count: parseInt(r.word_count, 10) || 0,
      flags: parsePipeList_(r.flags),
      matched_vague: parsePipeList_(r.matched_vague),
      updated_at: String(r.updated_at || '')
    });
  });

  var notesByClient = {};
  snap.liveNotes.forEach(function (n) {
    var cid = String(n.client_id || '').trim();
    if (!cid) return;
    if (!notesByClient[cid]) notesByClient[cid] = [];
    notesByClient[cid].push({
      round: String(n.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND,
      stage: parseInt(n.stage, 10) || 1,
      code: String(n.code || 'RAW').trim() || 'RAW',
      tag: String(n.tag || 'RAW').trim().toUpperCase() || 'RAW',
      note: String(n.note || ''),
      created_at: String(n.created_at || '')
    });
  });

  var reviewsByClient = {};
  snap.stageReviews.forEach(function (sr) {
    var cid = String(sr.client_id || '').trim();
    if (!cid) return;
    if (!reviewsByClient[cid]) reviewsByClient[cid] = [];
    reviewsByClient[cid].push({
      round: String(sr.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND,
      stage: parseInt(sr.stage, 10) || 1,
      submitted_at: String(sr.submitted_at || '').trim(),
      check_1: toBool_(sr.check_1),
      check_2: toBool_(sr.check_2),
      check_3: toBool_(sr.check_3),
      check_4: toBool_(sr.check_4),
      review_note: String(sr.review_note || ''),
      approved_summary: String(sr.approved_summary || '')
    });
  });

  var clients = snap.clients.map(function (c) {
    return serializeClientForUi_(c, snap.baseUrl);
  });

  var activeQuestions = bundle.questions.filter(function (q) { return q.active; });

  return {
    baseUrl: snap.baseUrl,
    clients: clients,
    questions: activeQuestions,
    templates: bundle.templates,
    config: configSubset,
    responsesByClient: responsesByClient,
    notesByClient: notesByClient,
    reviewsByClient: reviewsByClient,
    checklistLabels: STAGE_CHECKLIST_LABELS,
    loadedAt: nowIso_()
  };
}

/**
 * Tương thích ngược & dùng cho kiểm thử: đọc 1 lượt duy nhất qua readWorkbookSnapshot_().
 */
function ccBootstrap() {
  var snap = readWorkbookSnapshot_();
  var bundle = snap.bundle;

  var respByClient = {};
  snap.responses.forEach(function (r) {
    var cid = String(r.client_id || '').trim();
    if (!cid) return;
    if (!respByClient[cid]) respByClient[cid] = [];
    respByClient[cid].push(r);
  });

  var revByClient = {};
  snap.stageReviews.forEach(function (sr) {
    var cid = String(sr.client_id || '').trim();
    if (!cid) return;
    if (!revByClient[cid]) revByClient[cid] = {};
    var st = parseInt(sr.stage, 10) || 1;
    if (String(sr.submitted_at || '').trim()) {
      revByClient[cid][st] = String(sr.submitted_at).trim();
    }
  });

  var clients = snap.clients.map(function (c) {
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
      link: buildClientLink_(c.token, snap.baseUrl)
    };
  });

  var priority = { submitted: 0, in_progress: 1, not_started: 2, closed: 3 };
  clients.sort(function (a, b) {
    if (priority[a.badge] !== priority[b.badge]) return priority[a.badge] - priority[b.badge];
    if (a.latest_update !== b.latest_update) return a.latest_update < b.latest_update ? 1 : -1;
    return a.client_id < b.client_id ? 1 : -1;
  });

  var templates = Object.keys(bundle.templates).map(function (id) { return bundle.templates[id]; });

  return {
    baseUrl: snap.baseUrl,
    clients: clients,
    templates: templates,
    checklistLabels: STAGE_CHECKLIST_LABELS
  };
}

/**
 * Tải trọn gói Workspace 1 khách trong ĐÚNG 1 LƯỢT ĐỌC (dùng chung snapshot & ctx cho cả 4 bản xuất).
 */
function ccGetClientWorkspace(clientId, stage, round, anonymize) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var anon = Boolean(anonymize);
  var snap = readWorkbookSnapshot_();
  var ctx = collectClientStageData_(clientId, stageNum, roundStr, snap);
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
      link: buildClientLink_(client.token, snap.baseUrl)
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
    preloadedCopy: {
      cleanAnswers: buildCleanAnswersText_(client.client_id, stageNum, roundStr, { anonymize: anon, ctx: ctx }),
      allStagesAnswers: buildAllStagesAnswersText_(client.client_id, roundStr, { anonymize: anon, snapshot: snap }),
      prereadLlm: buildPrereadMarkdown_(client.client_id, stageNum, roundStr, { anonymize: anon, ctx: ctx }),
      evalLlm: buildEvalMarkdown_(client.client_id, stageNum, roundStr, { anonymize: anon, ctx: ctx }),
      zaloInvite: buildZaloMessage_(client, 'invite', nextStage, ctx.bundle.config, snap.baseUrl),
      zaloNextStage: buildZaloMessage_(client, 'next_stage', nextStage, ctx.bundle.config, snap.baseUrl)
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

  var baseUrl = getClientAppBaseUrl_();
  var token = generateSecureToken_(24);
  var defaultIntro = String((input && input.intro) || '').trim() ||
    'Chào anh/chị, đây là bảng chuẩn bị dữ kiện trước buổi làm việc xây dựng thương hiệu cá nhân trong lĩnh vực {field}. Anh/chị có thể gõ hoặc dùng micro trên bàn phím điện thoại để trả lời tự nhiên nhất.';

  var record;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var clientId = generateNextClientId_();
    record = {
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
    appendRowByHeader_(TABS.CLIENTS, record);
  } finally {
    lock.releaseLock();
  }

  var normalized = normalizeClient_(record);
  var uiClient = serializeClientForUi_(normalized, baseUrl);
  return {
    client_id: normalized.client_id,
    token: token,
    branch: record.branch,
    link: uiClient.link,
    hasBaseUrl: Boolean(baseUrl),
    zaloInvite: buildZaloMessage_(normalized, 'invite', 2, bundle.config, baseUrl),
    client: uiClient
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

  var updated = findClientById_(clientId);
  return {
    ok: true,
    client_id: clientId,
    client: updated ? serializeClientForUi_(updated, getClientAppBaseUrl_()) : null
  };
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

  return {
    added: rowsToAdd.length,
    notes: rowsToAdd.map(function (n) {
      return {
        round: n.round,
        stage: n.stage,
        code: n.code,
        tag: n.tag,
        note: n.note,
        created_at: n.created_at
      };
    })
  };
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

  return { ok: true, review: record };
}

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
  var baseUrl = getClientAppBaseUrl_();
  return {
    ok: true,
    locked_stage: stageNum,
    opened_stage: stageNum < 4 ? nextStage : null,
    stages_open: newOpen,
    stages_locked: newLocked,
    review: reviewRecord,
    zaloNextStage: buildZaloMessage_(client, 'next_stage', nextStage, bundle.config, baseUrl)
  };
}
