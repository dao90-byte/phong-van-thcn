/**
 * app.js
 * Điều khiển giao diện Trang tự phỏng vấn phía khách hàng (GitHub Pages).
 * - Đọc token từ #k= và ẩn khỏi thanh địa chỉ bằng history.replaceState.
 * - Phát hiện Zalo/Messenger In-App Browser để cảnh báo sớm.
 * - Chống mất chữ 2 tầng: localStorage mỗi 1s + đồng bộ server (debounce 5s / nút Lưu) + hàng đợi offline.
 * - Nhắc đóng đinh bằng chứng thông minh theo từng câu (tối đa 1 lần/câu, ít báo động giả).
 * - Tích hợp sẵn Chế độ Demo để kiểm thử mượt mọi màn hình trước khi nối Apps Script.
 */
(function () {
  'use strict';

  var Logic = window.THCNLogic;
  var CFG = window.APP_CONFIG || {};

  var state = {
    token: '',
    isDemo: false,
    demoStageMode: 1,
    session: null,
    activeStage: 1,
    currentIndex: 0,
    responses: {}, // code -> { answer, answer_extra, input_mode, flags, matched_vague, updated_at }
    promptedCodes: {}, // Mỗi câu chỉ hiện nhắc đóng đinh bằng chứng tối đa 1 lần
    pendingQueue: [],
    isFlushing: false,
    isRecording: false,
    recognition: null,
    usedVoiceOnCurrent: false,
    usedTypeOnCurrent: false,
    localDraftTimer: null,
    serverDebounceTimer: null,
    lastSavedHashByCode: {}
  };

  var el = {};

  function $(id) { return document.getElementById(id); }

  function init() {
    cacheDom();
    bindEvents();

    if (CFG.BRAND_NAME) {
      el.brandTitle.textContent = CFG.BRAND_NAME;
      document.title = CFG.BRAND_NAME;
    }

    // 1. Kiểm tra Zalo / Messenger WebView
    var inApp = Logic.detectInAppBrowser(navigator.userAgent);
    if (inApp.isInApp) {
      el.inAppName.textContent = inApp.appName;
      el.inAppBanner.classList.remove('hidden');
    }

    // 2. Lấy token từ #k= (và giữ tạm trong sessionStorage để F5 tải lại không bị mất phiên)
    var parsed = Logic.extractTokenFromLocation(window.location.hash, window.location.search);
    var apiConfigured = Boolean(CFG.API_URL && String(CFG.API_URL).trim());

    if (parsed.isDemo || (!parsed.token && !apiConfigured && CFG.ENABLE_DEMO)) {
      if (!CFG.ENABLE_DEMO && apiConfigured) {
        showError('🔒', 'Liên kết không hợp lệ', 'Vui lòng mở đúng đường link phỏng vấn do nhà tư vấn gửi.');
        return;
      }
      state.isDemo = true;
      el.demoBanner.classList.remove('hidden');
      loadDemoSession(1);
      return;
    }

    var effectiveToken = parsed.token;
    if (!effectiveToken) {
      try {
        effectiveToken = sessionStorage.getItem('thcn_active_token') || '';
      } catch (e) {}
    }

    if (!effectiveToken) {
      showError('🔗', 'Thiếu mã truy cập cá nhân', 'Vui lòng mở đúng đường link riêng có dạng #k=... do nhà tư vấn gửi cho bạn.', CFG.ENABLE_DEMO);
      return;
    }

    if (!apiConfigured) {
      showError('⚙️', 'Chưa cấu hình API_URL', 'Nhà tư vấn chưa dán đường dẫn Google Apps Script Web App vào file docs/config.js.', CFG.ENABLE_DEMO);
      return;
    }

    state.token = effectiveToken;
    try {
      sessionStorage.setItem('thcn_active_token', effectiveToken);
    } catch (e) {}
    // Giấu token khỏi thanh địa chỉ sau khi đã đọc vào bộ nhớ
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      // Bỏ qua trên file://
    }

    loadLiveSession();
  }

  function cacheDom() {
    [
      'inAppBanner', 'inAppName', 'dismissInAppBtn',
      'demoBanner', 'demoStage1Btn', 'demoStage2Btn',
      'appHeader', 'brandTitle', 'syncBadge', 'drawerTrigger', 'progressPillText', 'progressBarFill',
      'viewLoading', 'viewError', 'errorIcon', 'errorTitle', 'errorMessage', 'tryDemoBtn',
      'viewWelcome', 'welcomeStageBadge', 'welcomeGreeting', 'welcomeIntro',
      'welcomeCount', 'welcomeDuration', 'welcomeDeadlineBox', 'welcomeDeadline',
      'consentCheckbox', 'consentText', 'startBtn',
      'viewQuestion', 'qOutputBadge', 'qCodeBadge', 'lockedNotice', 'qTitle',
      'qHintBox', 'qHintText', 'qProbesBox', 'qProbesList',
      'answerInput', 'voiceBtn', 'voiceBtnLabel', 'mobileMicTip', 'wordCountLabel', 'voiceStatus',
      'evidenceBox', 'evidenceReason', 'extraInput', 'skipEvidenceBtn', 'saveEvidenceBtn',
      'savedExtraWrap', 'savedExtraInput',
      'prevBtn', 'skipBtn', 'saveDraftBtn', 'nextBtn',
      'viewBranch', 'branchABtn', 'branchBBtn',
      'viewReview', 'reviewEyebrow', 'reviewTitle', 'reviewSub', 'reviewList', 'backFromReviewBtn', 'submitStageBtn',
      'viewDone', 'doneMessage', 'doneTimestamp', 'reopenReviewBtn',
      'drawerBackdrop', 'questionDrawer', 'drawerSummary', 'closeDrawerBtn', 'drawerBody', 'drawerToReviewBtn'
    ].forEach(function (id) { el[id] = $(id); });
  }

  function bindEvents() {
    el.dismissInAppBtn.addEventListener('click', function () { el.inAppBanner.classList.add('hidden'); });
    el.tryDemoBtn.addEventListener('click', function () {
      state.isDemo = true;
      el.demoBanner.classList.remove('hidden');
      loadDemoSession(1);
    });

    el.demoStage1Btn.addEventListener('click', function () {
      el.demoStage1Btn.classList.add('active');
      el.demoStage2Btn.classList.remove('active');
      loadDemoSession(1);
    });
    el.demoStage2Btn.addEventListener('click', function () {
      el.demoStage2Btn.classList.add('active');
      el.demoStage1Btn.classList.remove('active');
      loadDemoSession(2);
    });

    el.consentCheckbox.addEventListener('change', function () {
      el.startBtn.disabled = !el.consentCheckbox.checked;
    });
    el.startBtn.addEventListener('click', onStartInterview);

    el.answerInput.addEventListener('input', onAnswerInput);
    el.savedExtraInput.addEventListener('input', onSavedExtraInput);

    el.voiceBtn.addEventListener('click', toggleVoiceRecording);
    el.prevBtn.addEventListener('click', onPrevQuestion);
    el.skipBtn.addEventListener('click', onSkipQuestion);
    el.saveDraftBtn.addEventListener('click', function () { persistCurrentAnswer({ forceServer: true }); });
    el.nextBtn.addEventListener('click', onNextQuestion);

    el.skipEvidenceBtn.addEventListener('click', onSkipEvidence);
    el.saveEvidenceBtn.addEventListener('click', onSaveEvidence);

    el.branchABtn.addEventListener('click', function () { chooseBranch('A'); });
    el.branchBBtn.addEventListener('click', function () { chooseBranch('B'); });

    el.backFromReviewBtn.addEventListener('click', function () { openQuestionByIndex(state.currentIndex); });
    el.submitStageBtn.addEventListener('click', onSubmitStage);
    el.reopenReviewBtn.addEventListener('click', openReviewView);

    el.drawerTrigger.addEventListener('click', openDrawer);
    el.closeDrawerBtn.addEventListener('click', closeDrawer);
    el.drawerBackdrop.addEventListener('click', closeDrawer);
    el.drawerToReviewBtn.addEventListener('click', function () {
      closeDrawer();
      openReviewView();
    });

    window.addEventListener('online', function () { flushPendingQueue(); });
    window.addEventListener('offline', function () { setSyncStatus('offline', 'Mất mạng – đang lưu trên máy'); });
  }

  // ==================== NETWORK / API LAYER ====================

  function callApi(action, payload) {
    if (state.isDemo) {
      return handleDemoApi(action, payload);
    }
    return fetch(CFG.API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: action,
        token: state.token,
        payload: payload || {}
      })
    }).then(function (resp) {
      return resp.text().then(function (txt) {
        var data;
        try {
          data = JSON.parse(txt);
        } catch (err) {
          throw new Error('Máy chủ trả về dữ liệu không hợp lệ (có thể quá tải hoặc chưa cấp quyền Web App).');
        }
        if (!data || !data.ok) {
          var e = new Error((data && data.error) || 'Có lỗi xảy ra khi kết nối.');
          e.code = data && data.code;
          throw e;
        }
        return data.data;
      });
    });
  }

  function loadLiveSession() {
    showOnly('viewLoading');
    callApi('getSession', {})
      .then(function (sessionData) {
        hydrateSession(sessionData);
      })
      .catch(function (err) {
        if (err && (err.code === 'NOT_FOUND' || err.code === 'INVALID_TOKEN' || err.code === 'SESSION_CLOSED')) {
          try { sessionStorage.removeItem('thcn_active_token'); } catch (e) {}
        }
        var icon = err.code === 'SESSION_CLOSED' ? '✅' : '🔒';
        var title = err.code === 'SESSION_CLOSED' ? 'Phiên phỏng vấn đã đóng' : 'Không tải được phiên phỏng vấn';
        showError(icon, title, err.message || 'Vui lòng kiểm tra kết nối mạng và tải lại trang.');
      });
  }

  function hydrateSession(sessionData) {
    state.session = sessionData;
    state.activeStage = Logic.determineActiveStage(
      sessionData.client.stages_open,
      sessionData.client.stages_locked
    );

    // Hợp nhất câu trả lời từ server với bản nháp localStorage (ưu tiên bản mới hơn)
    state.responses = {};
    var serverResponses = sessionData.responses || {};
    Object.keys(serverResponses).forEach(function (code) {
      state.responses[code] = Object.assign({}, serverResponses[code]);
      state.lastSavedHashByCode[code] = hashResponse(state.responses[code]);
    });

    restoreLocalDraftsAndQueue();
    setupVoiceAvailability();
    el.appHeader.classList.remove('hidden');
    updateHeaderProgress();

    // Nếu khách đã đồng ý điều khoản trước đó -> đi thẳng vào câu chưa trả lời đầu tiên của giai đoạn đang mở
    if (sessionData.client.has_consented) {
      var startIdx = findFirstUnansweredIndex(state.activeStage);
      openQuestionByIndex(startIdx);
    } else {
      renderWelcomeScreen();
    }

    if (state.pendingQueue.length > 0 && navigator.onLine) {
      flushPendingQueue();
    }
  }

  function findFirstUnansweredIndex(stage) {
    var qs = state.session.questions;
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].stage !== stage) continue;
      var r = state.responses[qs[i].code];
      if (!r || !String(r.answer || '').trim()) {
        return i;
      }
    }
    // Nếu tất cả câu trong giai đoạn đã trả lời -> mở câu đầu của giai đoạn đó
    for (var j = 0; j < qs.length; j++) {
      if (qs[j].stage === stage) return j;
    }
    return 0;
  }

  // ==================== WELCOME & CONSENT ====================

  function renderWelcomeScreen() {
    var client = state.session.client;
    var stageQs = state.session.questions.filter(function (q) { return q.stage === state.activeStage; });
    var minMins = Math.max(10, stageQs.length * 2);
    var maxMins = Math.max(15, stageQs.length * 3);

    el.welcomeStageBadge.textContent = (state.session.stage_titles[state.activeStage] || ('GIAI ĐOẠN ' + state.activeStage)).toUpperCase();
    el.welcomeGreeting.textContent = 'Xin chào ' + (client.name || 'bạn') + ' 👋';
    el.welcomeIntro.textContent = client.intro || 'Cảm ơn bạn đã dành thời gian chuẩn bị dữ kiện trước buổi làm việc trực tiếp.';
    el.welcomeCount.textContent = stageQs.length + ' câu';
    el.welcomeDuration.textContent = minMins + '–' + maxMins + ' phút';
    if (client.deadline) {
      el.welcomeDeadline.textContent = client.deadline;
      el.welcomeDeadlineBox.classList.remove('hidden');
    } else {
      el.welcomeDeadline.textContent = 'Trước buổi gặp 3 ngày';
    }
    el.consentText.textContent = state.session.config.consent_text ||
      'Tôi đồng ý cung cấp thông tin này cho quá trình tư vấn thương hiệu cá nhân và cho phép phân tích bằng AI ở chế độ không huấn luyện mô hình.';
    el.consentCheckbox.checked = false;
    el.startBtn.disabled = true;

    showOnly('viewWelcome');
  }

  function onStartInterview() {
    if (!el.consentCheckbox.checked) return;
    el.startBtn.disabled = true;
    el.startBtn.textContent = 'Đang khởi tạo...';

    callApi('saveConsent', { consent_version: state.session.config.consent_version })
      .then(function () {
        state.session.client.has_consented = true;
        el.startBtn.textContent = 'Bắt đầu trả lời →';
        openQuestionByIndex(findFirstUnansweredIndex(state.activeStage));
      })
      .catch(function (err) {
        el.startBtn.disabled = false;
        el.startBtn.textContent = 'Bắt đầu trả lời →';
        alert(err.message || 'Không thể lưu xác nhận, vui lòng thử lại.');
      });
  }

  // ==================== QUESTION VIEW ====================

  function getCurrentQuestion() {
    if (!state.session || !state.session.questions.length) return null;
    return state.session.questions[state.currentIndex] || null;
  }

  function openQuestionByIndex(index) {
    stopVoiceIfRunning();
    var qs = state.session.questions;
    if (!qs.length) {
      if (state.session.needs_branch_choice) {
        showOnly('viewBranch');
        return;
      }
      showError('📋', 'Chưa có câu hỏi đang mở', 'Nhà tư vấn chưa mở câu hỏi tự điền cho giai đoạn này.');
      return;
    }

    var safeIndex = Math.max(0, Math.min(index, qs.length - 1));
    state.currentIndex = safeIndex;
    var q = qs[safeIndex];
    var resp = state.responses[q.code] || { answer: '', answer_extra: '', input_mode: 'go', flags: [], matched_vague: [] };

    state.usedVoiceOnCurrent = resp.input_mode === 'noi' || resp.input_mode === 'hon_hop';
    state.usedTypeOnCurrent = resp.input_mode === 'go' || resp.input_mode === 'hon_hop';

    el.qOutputBadge.textContent = 'GĐ ' + q.stage + ' · ' + (q.output || 'Phỏng vấn');
    el.qCodeBadge.textContent = q.code;
    el.qTitle.textContent = q.question_self;

    if (q.self_hint) {
      el.qHintText.textContent = q.self_hint;
      el.qHintBox.classList.remove('hidden');
    } else {
      el.qHintBox.classList.add('hidden');
    }

    if (q.probes && q.probes.length > 0) {
      el.qProbesList.innerHTML = q.probes.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('');
      el.qProbesBox.open = false;
      el.qProbesBox.classList.remove('hidden');
    } else {
      el.qProbesBox.classList.add('hidden');
    }

    el.answerInput.value = resp.answer || '';
    el.answerInput.disabled = Boolean(q.locked);
    el.extraInput.value = resp.answer_extra || '';
    el.savedExtraInput.value = resp.answer_extra || '';
    el.savedExtraInput.disabled = Boolean(q.locked);

    el.evidenceBox.classList.add('hidden');
    if (resp.answer_extra) {
      el.savedExtraWrap.classList.remove('hidden');
    } else {
      el.savedExtraWrap.classList.add('hidden');
    }

    if (q.locked) {
      el.lockedNotice.classList.remove('hidden');
      el.skipBtn.classList.add('hidden');
      el.saveDraftBtn.classList.add('hidden');
      el.voiceBtn.classList.add('hidden');
      el.mobileMicTip.classList.add('hidden');
      el.nextBtn.textContent = isLastQuestionInView() ? 'Tới câu hiện tại →' : 'Xem câu tiếp →';
    } else {
      el.lockedNotice.classList.add('hidden');
      el.skipBtn.classList.remove('hidden');
      el.saveDraftBtn.classList.remove('hidden');
      el.mobileMicTip.classList.remove('hidden');
      if (state.speechSupported) el.voiceBtn.classList.remove('hidden');
      var awaitingBranch = state.session.needs_branch_choice && state.activeStage === 2 && !state.session.client.branch;
      el.nextBtn.textContent = (isLastQuestionInView() && !awaitingBranch) ? 'Lưu & Xem lại →' : 'Lưu & Tiếp →';
    }

    el.prevBtn.disabled = (safeIndex === 0);
    updateWordCountDisplay();
    updateHeaderProgress();
    showOnly('viewQuestion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function isLastQuestionInView() {
    return state.currentIndex >= state.session.questions.length - 1;
  }

  function onAnswerInput() {
    state.usedTypeOnCurrent = true;
    updateWordCountDisplay();
    scheduleDualSave();
  }

  function onSavedExtraInput() {
    updateWordCountDisplay();
    scheduleDualSave();
  }

  function updateWordCountDisplay() {
    var combined = el.answerInput.value + ' ' + (el.savedExtraWrap.classList.contains('hidden') ? '' : el.savedExtraInput.value);
    var wc = Logic.countWords(combined);
    el.wordCountLabel.textContent = wc + ' từ';
  }

  function scheduleDualSave() {
    var q = getCurrentQuestion();
    if (!q || q.locked) return;

    clearTimeout(state.localDraftTimer);
    state.localDraftTimer = setTimeout(function () {
      captureCurrentIntoState();
      saveDraftToLocalStorage(q.code);
      updateHeaderProgress();
    }, 600);

    clearTimeout(state.serverDebounceTimer);
    state.serverDebounceTimer = setTimeout(function () {
      persistCurrentAnswer({ forceServer: false });
    }, 5000);
  }

  function captureCurrentIntoState(extraOverrides) {
    var q = getCurrentQuestion();
    if (!q) return null;
    var existing = state.responses[q.code] || {};
    var answer = el.answerInput.value.trim();
    var answerExtra = !el.evidenceBox.classList.contains('hidden')
      ? el.extraInput.value.trim()
      : (!el.savedExtraWrap.classList.contains('hidden') ? el.savedExtraInput.value.trim() : (existing.answer_extra || ''));

    var inputMode = 'go';
    if (state.usedVoiceOnCurrent && state.usedTypeOnCurrent) inputMode = 'hon_hop';
    else if (state.usedVoiceOnCurrent) inputMode = 'noi';

    var evalResult = Logic.evaluateEvidence(q, answer, state.session.config.vague_words);
    var flags = evalResult.flags.slice();
    // Giữ cờ bo_qua_nhac nếu đã bấm bỏ qua trước đó
    if (existing.flags && existing.flags.indexOf('bo_qua_nhac') !== -1 && flags.indexOf('bo_qua_nhac') === -1) {
      flags.push('bo_qua_nhac');
    }
    if (extraOverrides && extraOverrides.addFlag && flags.indexOf(extraOverrides.addFlag) === -1) {
      flags.push(extraOverrides.addFlag);
    }
    // Nếu khách đã nhập chữ thì gỡ cờ lam_sau
    if (answer) {
      flags = flags.filter(function (f) { return f !== 'lam_sau'; });
    }

    var record = {
      code: q.code,
      round: state.session.round,
      stage: q.stage,
      answer: answer,
      answer_extra: answerExtra,
      input_mode: inputMode,
      word_count: Logic.countWords(answer + ' ' + answerExtra),
      flags: flags,
      matched_vague: evalResult.matchedVague,
      updated_at: new Date().toISOString()
    };

    state.responses[q.code] = record;
    return record;
  }

  function persistCurrentAnswer(opts) {
    var q = getCurrentQuestion();
    if (!q || q.locked) return Promise.resolve();

    clearTimeout(state.localDraftTimer);
    clearTimeout(state.serverDebounceTimer);

    var record = captureCurrentIntoState(opts && opts.extraOverrides);
    saveDraftToLocalStorage(q.code);
    updateHeaderProgress();

    // Không đẩy lên server nếu câu hoàn toàn trống và chưa từng có nội dung (trừ khi đánh dấu làm sau)
    if (!record.answer && !record.answer_extra && record.flags.indexOf('lam_sau') === -1) {
      return Promise.resolve();
    }

    var h = hashResponse(record);
    if (!opts.forceServer && state.lastSavedHashByCode[q.code] === h) {
      return Promise.resolve();
    }

    if (!navigator.onLine && !state.isDemo) {
      queueOfflineSave(record);
      return Promise.resolve();
    }

    setSyncStatus('saving', 'Đang lưu...');
    return callApi('saveAnswer', record)
      .then(function (res) {
        state.lastSavedHashByCode[q.code] = h;
        removeDraftFromLocalStorage(q.code);
        state.pendingQueue = Logic.dequeuePendingSave(state.pendingQueue, record.code, record.round);
        saveQueueToLocalStorage();
        setSyncStatus('saved', 'Đã lưu ✓');
        return res;
      })
      .catch(function () {
        queueOfflineSave(record);
      });
  }

  // ==================== NAVIGATION & EVIDENCE PINNING ====================

  function onPrevQuestion() {
    persistCurrentAnswer({ forceServer: false }).finally(function () {
      openQuestionByIndex(state.currentIndex - 1);
    });
  }

  function onSkipQuestion() {
    var q = getCurrentQuestion();
    if (!q || q.locked) return;
    persistCurrentAnswer({ forceServer: false, extraOverrides: { addFlag: 'lam_sau' } }).finally(function () {
      goForwardAfterCurrent();
    });
  }

  function onNextQuestion() {
    stopVoiceIfRunning();
    var q = getCurrentQuestion();
    if (!q) return;

    if (q.locked) {
      goForwardAfterCurrent();
      return;
    }

    var answer = el.answerInput.value.trim();
    var existing = state.responses[q.code] || {};
    var hasExtraAlready = Boolean(existing.answer_extra && existing.answer_extra.trim()) ||
      (!el.savedExtraWrap.classList.contains('hidden') && Boolean(el.savedExtraInput.value.trim()));

    // Kiểm tra đóng đinh bằng chứng (tối đa 1 lần / câu, chỉ khi chưa có bổ sung)
    if (answer && !state.promptedCodes[q.code] && !hasExtraAlready) {
      var check = Logic.evaluateEvidence(q, answer, state.session.config.vague_words);
      if (check.needsPrompt) {
        state.promptedCodes[q.code] = true;
        el.evidenceReason.textContent = check.reason;
        el.extraInput.value = '';
        el.evidenceBox.classList.remove('hidden');
        el.extraInput.focus();
        el.evidenceBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }

    var evidenceOpen = !el.evidenceBox.classList.contains('hidden');
    var extraFromBox = evidenceOpen ? el.extraInput.value.trim() : '';
    if (evidenceOpen && extraFromBox) {
      el.savedExtraInput.value = extraFromBox;
      el.savedExtraWrap.classList.remove('hidden');
    }
    var skippedOpenEvidence = evidenceOpen && !extraFromBox;
    el.evidenceBox.classList.add('hidden');
    persistCurrentAnswer({
      forceServer: true,
      extraOverrides: skippedOpenEvidence ? { addFlag: 'bo_qua_nhac' } : null
    }).finally(function () {
      goForwardAfterCurrent();
    });
  }

  function onSkipEvidence() {
    el.evidenceBox.classList.add('hidden');
    persistCurrentAnswer({ forceServer: true, extraOverrides: { addFlag: 'bo_qua_nhac' } }).finally(function () {
      goForwardAfterCurrent();
    });
  }

  function onSaveEvidence() {
    var extra = el.extraInput.value.trim();
    el.savedExtraInput.value = extra;
    el.evidenceBox.classList.add('hidden');
    if (extra) el.savedExtraWrap.classList.remove('hidden');
    persistCurrentAnswer({
      forceServer: true,
      extraOverrides: extra ? null : { addFlag: 'bo_qua_nhac' }
    }).finally(function () {
      goForwardAfterCurrent();
    });
  }

  function goForwardAfterCurrent() {
    var qs = state.session.questions;
    if (state.currentIndex < qs.length - 1) {
      openQuestionByIndex(state.currentIndex + 1);
      return;
    }

    // Nếu đang ở cuối câu chung GĐ2 mà khách chưa chọn nhánh A/B -> hiện màn chọn nhánh
    if (state.session.needs_branch_choice && state.activeStage === 2 && !state.session.client.branch) {
      showOnly('viewBranch');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    openReviewView();
  }

  function chooseBranch(branch) {
    el.branchABtn.disabled = true;
    el.branchBBtn.disabled = true;
    setSyncStatus('saving', 'Đang mở nhánh ' + branch + '...');

    callApi('setBranch', { branch: branch, round: state.session.round })
      .then(function (updatedSession) {
        el.branchABtn.disabled = false;
        el.branchBBtn.disabled = false;
        setSyncStatus('saved', 'Đã lưu nhánh ' + branch + ' ✓');

        var prevCount = state.session.questions.length;
        state.session = updatedSession;
        // Giữ lại responses cục bộ đang có
        Object.keys(updatedSession.responses || {}).forEach(function (code) {
          if (!state.responses[code]) state.responses[code] = updatedSession.responses[code];
        });
        updateHeaderProgress();

        // Nhảy thẳng sang câu nhánh đầu tiên vừa được mở (ví dụ 2.3.1A hoặc 2.3.2B)
        openQuestionByIndex(Math.min(prevCount, state.session.questions.length - 1));
      })
      .catch(function (err) {
        el.branchABtn.disabled = false;
        el.branchBBtn.disabled = false;
        alert(err.message || 'Không thể lưu nhánh, vui lòng thử lại.');
      });
  }

  // ==================== REVIEW & SUBMIT ====================

  function openReviewView() {
    stopVoiceIfRunning();
    var stage = state.activeStage;
    var stageQs = state.session.questions.filter(function (q) { return q.stage === stage; });
    var progress = Logic.computeStageProgress(state.session.questions, state.responses, stage);
    var isStageLocked = state.session.client.stages_locked.indexOf(stage) !== -1;

    el.reviewEyebrow.textContent = 'XEM LẠI · GIAI ĐOẠN ' + stage;
    el.reviewTitle.textContent = 'Bạn đã trả lời ' + progress.answered + '/' + progress.total + ' câu';
    el.reviewSub.textContent = progress.remaining > 0
      ? 'Còn ' + progress.remaining + ' câu chưa trả lời. Bạn có thể bấm trực tiếp vào bất kỳ câu nào bên dưới để bổ sung, hoặc gửi luôn phần đã chuẩn bị.'
      : 'Tuyệt vời! Bạn đã hoàn thành toàn bộ các câu chuẩn bị. Hãy rà nhanh một lượt rồi bấm Gửi cho chuyên gia.';

    el.reviewList.innerHTML = stageQs.map(function (q) {
      var globalIdx = state.session.questions.indexOf(q);
      var r = state.responses[q.code];
      var hasAns = r && String(r.answer || '').trim();
      var badge = hasAns
        ? '<span class="badge" style="background:var(--success-bg);color:var(--success);">Đã trả lời (' + Logic.countWords(r.answer) + ' từ)</span>'
        : '<span class="badge" style="background:var(--amber-bg);color:var(--amber);">Chưa trả lời</span>';
      var preview = hasAns
        ? '<p class="review-item-a">' + escapeHtml(r.answer) + (r.answer_extra ? '\n[Bổ sung]: ' + escapeHtml(r.answer_extra) : '') + '</p>'
        : '<p class="review-item-a review-empty">Bấm vào đây để trả lời câu này...</p>';

      return '<div class="review-item" data-index="' + globalIdx + '">' +
        '<div class="review-item-head"><span class="code-pill">' + escapeHtml(q.code) + '</span>' + badge + '</div>' +
        '<p class="review-item-q">' + escapeHtml(q.question_self) + '</p>' +
        preview +
        '</div>';
    }).join('');

    Array.prototype.forEach.call(el.reviewList.querySelectorAll('.review-item'), function (node) {
      node.addEventListener('click', function () {
        openQuestionByIndex(parseInt(node.getAttribute('data-index'), 10));
      });
    });

    el.submitStageBtn.disabled = isStageLocked;
    el.submitStageBtn.textContent = isStageLocked ? 'Giai đoạn này đã được khóa' : 'Hoàn tất & Gửi cho chuyên gia ✓';

    showOnly('viewReview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onSubmitStage() {
    el.submitStageBtn.disabled = true;
    el.submitStageBtn.textContent = 'Đang gửi...';

    // Đẩy hết hàng đợi offline trước khi nộp
    flushPendingQueue()
      .then(function () {
        return callApi('submitStage', { stage: state.activeStage, round: state.session.round });
      })
      .then(function (res) {
        el.submitStageBtn.disabled = false;
        el.submitStageBtn.textContent = 'Hoàn tất & Gửi cho chuyên gia ✓';
        el.doneMessage.textContent = 'Cảm ơn ' + (state.session.client.name || 'bạn') + '! Phần chuẩn bị Giai đoạn ' + state.activeStage +
          ' đã được gửi tới ' + (CFG.CONSULTANT_NAME || 'nhà tư vấn') + ' để tổng hợp trước buổi gặp trực tiếp.';
        el.doneTimestamp.textContent = 'Thời điểm ghi nhận: ' + formatTimeVi(res.submitted_at);
        showOnly('viewDone');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        el.submitStageBtn.disabled = false;
        el.submitStageBtn.textContent = 'Hoàn tất & Gửi cho chuyên gia ✓';
        alert(err.message || 'Chưa gửi được xác nhận nộp bài (có thể do mất mạng). Câu trả lời của bạn vẫn an toàn, hãy thử bấm lại.');
      });
  }

  // ==================== DRAWER & PROGRESS ====================

  function updateHeaderProgress() {
    if (!state.session) return;
    var prog = Logic.computeStageProgress(state.session.questions, state.responses, state.activeStage);
    var stageQs = state.session.questions.filter(function (q) { return q.stage === state.activeStage; });
    var curQ = getCurrentQuestion();
    var posInStage = curQ && curQ.stage === state.activeStage ? (stageQs.indexOf(curQ) + 1) : prog.answered;

    el.progressPillText.textContent = 'Câu ' + Math.max(1, posInStage) + '/' + Math.max(1, prog.total) + ' · GĐ ' + state.activeStage;
    el.progressBarFill.style.width = prog.percent + '%';
  }

  function openDrawer() {
    if (!state.session) return;
    var prog = Logic.computeStageProgress(state.session.questions, state.responses, state.activeStage);
    el.drawerSummary.textContent = 'GĐ ' + state.activeStage + ': đã làm ' + prog.answered + '/' + prog.total + ' câu';

    var grouped = {};
    var stages = [];
    state.session.questions.forEach(function (q, idx) {
      if (!grouped[q.stage]) {
        grouped[q.stage] = [];
        stages.push(q.stage);
      }
      grouped[q.stage].push({ q: q, idx: idx });
    });

    el.drawerBody.innerHTML = stages.map(function (s) {
      var locked = state.session.client.stages_locked.indexOf(s) !== -1;
      var header = '<div class="drawer-stage-title">Giai đoạn ' + s + (locked ? ' · 🔒 Chỉ xem' : ' · Đang làm') + '</div>';
      var items = grouped[s].map(function (entry) {
        var r = state.responses[entry.q.code];
        var hasAns = r && String(r.answer || '').trim();
        var isSkipped = !hasAns && r && r.flags && r.flags.indexOf('lam_sau') !== -1;
        var icon = entry.q.locked ? '🔒' : (hasAns ? '✓' : (isSkipped ? '⏳' : '○'));
        var color = hasAns ? 'color:var(--success);font-weight:700;' : (isSkipped ? 'color:var(--amber);' : 'color:var(--ink-muted);');
        var isCurrent = entry.idx === state.currentIndex ? ' current' : '';
        var shortText = entry.q.question_self.length > 74 ? entry.q.question_self.slice(0, 74) + '…' : entry.q.question_self;

        return '<button class="drawer-item' + isCurrent + '" data-idx="' + entry.idx + '" type="button">' +
          '<span class="drawer-status" style="' + color + '">' + icon + '</span>' +
          '<span class="drawer-item-text"><span class="drawer-item-code">' + escapeHtml(entry.q.code) + '</span> ' + escapeHtml(shortText) + '</span>' +
          '</button>';
      }).join('');
      return header + items;
    }).join('');

    Array.prototype.forEach.call(el.drawerBody.querySelectorAll('.drawer-item'), function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        closeDrawer();
        persistCurrentAnswer({ forceServer: false }).finally(function () {
          openQuestionByIndex(idx);
        });
      });
    });

    el.drawerBackdrop.classList.remove('hidden');
    el.questionDrawer.classList.remove('hidden');
  }

  function closeDrawer() {
    el.drawerBackdrop.classList.add('hidden');
    el.questionDrawer.classList.add('hidden');
  }

  // ==================== VOICE (WEB SPEECH API + MOBILE FALLBACK) ====================

  function setupVoiceAvailability() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var inApp = Logic.detectInAppBrowser(navigator.userAgent).isInApp;
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Trên Zalo WebView hoặc iOS thường dễ cắt ngắt -> ưu tiên hướng dẫn micro bàn phím điện thoại
    state.speechSupported = Boolean(SpeechRecognition) && !inApp && !isIOS;
    if (state.speechSupported) {
      el.voiceBtn.classList.remove('hidden');
      el.mobileMicTip.textContent = 'Hoặc dùng nút micro trên bàn phím điện thoại';
    } else {
      el.voiceBtn.classList.add('hidden');
      el.mobileMicTip.textContent = '💡 Mẹo: bấm nút 🎤 micro trên bàn phím điện thoại để nói thành chữ';
    }
  }

  function toggleVoiceRecording() {
    if (!state.speechSupported) return;
    if (state.isRecording) {
      stopVoiceIfRunning();
      return;
    }

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = new SpeechRecognition();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;

    var baseText = el.answerInput.value.trim();
    var finalChunk = '';

    rec.onstart = function () {
      state.isRecording = true;
      state.usedVoiceOnCurrent = true;
      el.voiceBtn.classList.add('recording');
      el.voiceBtnLabel.textContent = 'Dừng ghi giọng nói';
      el.voiceStatus.textContent = 'Đang nghe (tiếng Việt)... Hãy nói tự nhiên, bạn có thể sửa lại chữ sau.';
      el.voiceStatus.classList.remove('hidden');
    };

    rec.onresult = function (event) {
      var interim = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += t + ' ';
        else interim += t;
      }
      var sep = baseText ? ' ' : '';
      el.answerInput.value = (baseText + sep + finalChunk + interim).trim();
      updateWordCountDisplay();
    };

    rec.onerror = function (ev) {
      el.voiceStatus.textContent = 'Không thu được giọng nói (' + ev.error + '). Bạn hãy gõ hoặc dùng nút micro trên bàn phím điện thoại.';
      stopVoiceIfRunning();
    };

    rec.onend = function () {
      state.isRecording = false;
      el.voiceBtn.classList.remove('recording');
      el.voiceBtnLabel.textContent = '🎤 Nói thành chữ';
      scheduleDualSave();
    };

    state.recognition = rec;
    try {
      rec.start();
    } catch (e) {
      stopVoiceIfRunning();
    }
  }

  function stopVoiceIfRunning() {
    if (state.recognition && state.isRecording) {
      try { state.recognition.stop(); } catch (e) {}
    }
    state.isRecording = false;
    el.voiceBtn.classList.remove('recording');
    el.voiceBtnLabel.textContent = '🎤 Nói thành chữ';
  }

  // ==================== LOCAL STORAGE & OFFLINE QUEUE ====================

  function draftStorageKey(code) {
    var cid = state.session ? state.session.client.client_id : 'anon';
    var rd = state.session ? state.session.round : 'R1';
    return 'thcn_draft_' + cid + '_' + rd + '_' + code;
  }

  function queueStorageKey() {
    var cid = state.session ? state.session.client.client_id : 'anon';
    return 'thcn_queue_' + cid;
  }

  function saveDraftToLocalStorage(code) {
    try {
      var rec = state.responses[code];
      if (rec) localStorage.setItem(draftStorageKey(code), JSON.stringify(rec));
    } catch (e) {}
  }

  function removeDraftFromLocalStorage(code) {
    try { localStorage.removeItem(draftStorageKey(code)); } catch (e) {}
  }

  function saveQueueToLocalStorage() {
    try { localStorage.setItem(queueStorageKey(), JSON.stringify(state.pendingQueue)); } catch (e) {}
  }

  function queueOfflineSave(record) {
    state.pendingQueue = Logic.enqueuePendingSave(state.pendingQueue, record);
    saveQueueToLocalStorage();
    setSyncStatus('offline', 'Lưu trên máy (chờ mạng · ' + state.pendingQueue.length + ')');
  }

  function restoreLocalDraftsAndQueue() {
    try {
      var qRaw = localStorage.getItem(queueStorageKey());
      state.pendingQueue = qRaw ? JSON.parse(qRaw) : [];
    } catch (e) {
      state.pendingQueue = [];
    }

    state.session.questions.forEach(function (q) {
      if (q.locked) return;
      try {
        var raw = localStorage.getItem(draftStorageKey(q.code));
        if (!raw) return;
        var draft = JSON.parse(raw);
        var serverRec = state.responses[q.code];
        if (!serverRec || !serverRec.updated_at || (draft.updated_at && draft.updated_at > serverRec.updated_at)) {
          state.responses[q.code] = draft;
        }
      } catch (e) {}
    });
  }

  function flushPendingQueue() {
    if (state.isFlushing || !state.pendingQueue.length || (!navigator.onLine && !state.isDemo)) {
      return Promise.resolve();
    }
    state.isFlushing = true;
    setSyncStatus('saving', 'Đang đồng bộ ' + state.pendingQueue.length + ' câu...');

    var items = state.pendingQueue.slice();
    var chain = Promise.resolve();
    items.forEach(function (rec) {
      chain = chain.then(function () {
        return callApi('saveAnswer', rec).then(function () {
          state.lastSavedHashByCode[rec.code] = hashResponse(rec);
          removeDraftFromLocalStorage(rec.code);
          state.pendingQueue = Logic.dequeuePendingSave(state.pendingQueue, rec.code, rec.round);
          saveQueueToLocalStorage();
        });
      });
    });

    return chain.then(function () {
      state.isFlushing = false;
      setSyncStatus('saved', 'Đã đồng bộ tất cả ✓');
    }).catch(function () {
      state.isFlushing = false;
      setSyncStatus('offline', 'Chờ mạng (' + state.pendingQueue.length + ' câu)');
    });
  }

  // ==================== UTILITIES ====================

  function setSyncStatus(kind, text) {
    el.syncBadge.className = 'sync-badge sync-' + kind;
    el.syncBadge.textContent = text;
  }

  function showOnly(viewId) {
    ['viewLoading', 'viewError', 'viewWelcome', 'viewQuestion', 'viewBranch', 'viewReview', 'viewDone'].forEach(function (id) {
      el[id].classList.toggle('hidden', id !== viewId);
    });
  }

  function showError(icon, title, message, showDemoCta) {
    el.appHeader.classList.add('hidden');
    el.errorIcon.textContent = icon;
    el.errorTitle.textContent = title;
    el.errorMessage.textContent = message;
    el.tryDemoBtn.classList.toggle('hidden', !showDemoCta);
    showOnly('viewError');
  }

  function hashResponse(r) {
    return JSON.stringify([r.answer || '', r.answer_extra || '', r.input_mode || '', r.flags || []]);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatTimeVi(iso) {
    try {
      return new Date(iso).toLocaleString('vi-VN');
    } catch (e) {
      return iso || '';
    }
  }

  // ==================== BUILT-IN DEMO MODE ====================

  var demoStore = {
    branch: '',
    consented: false,
    responses: {
      '1.1.5': { code: '1.1.5', stage: 1, answer: 'Khoảng 4 giờ/tuần vào sáng thứ 7. Hiện có 1 bạn trợ lý thiết kế hình ảnh bán thời gian.', answer_extra: '', input_mode: 'go', flags: [], matched_vague: [], updated_at: '2026-11-23T08:00:00.000Z' },
      '1.4.1': { code: '1.4.1', stage: 1, answer: 'https://facebook.com/dr.minhanh\nhttps://linkedin.com/in/minhanh-dental', answer_extra: '', input_mode: 'go', flags: [], matched_vague: [], updated_at: '2026-11-23T08:05:00.000Z' }
    }
  };

  function buildDemoSessionData(stageMode) {
    var s1Questions = [
      { code: '1.1.2', stage: 1, group: '1.1', order: 2, mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản', question_self: 'Nếu trong 12 tháng tới bạn vẫn giữ nguyên cách làm hiện tại (chưa xây thương hiệu cá nhân trong lĩnh vực Nha khoa thẩm mỹ), công việc hoặc doanh nghiệp của bạn có thể bỏ lỡ những cơ hội cụ thể nào?', self_hint: 'Hãy ước lượng cụ thể bằng con số: khoảng doanh thu bị bỏ lỡ, số lượng khách hàng mới/tháng hoặc cơ hội hợp tác.', probes: [], min_words: 20, check_vague: true, locked: stageMode === 2 },
      { code: '1.1.3', stage: 1, group: '1.1', order: 3, mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản', question_self: 'Sau 6–12 tháng tới, kết quả cụ thể nào sẽ khiến Minh Anh khẳng định việc đầu tư xây dựng thương hiệu cá nhân lần này là thành công?', self_hint: 'Nêu con số mục tiêu rõ ràng. Buổi gặp trực tiếp ta sẽ chốt 1 ưu tiên số 1.', probes: [], min_words: 15, check_vague: true, locked: stageMode === 2 },
      { code: '1.1.4', stage: 1, group: '1.1', order: 4, mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản', question_self: 'Có ranh giới, chủ đề đời tư hoặc kiểu xuất hiện nào bạn tuyệt đối KHÔNG muốn đánh đổi để đổi lấy tương tác hay sự nổi tiếng?', self_hint: 'Ví dụ: không lộ mặt gia đình, không tranh luận drama ngành, bảo mật tên khách hàng.', probes: [], min_words: 15, check_vague: false, locked: stageMode === 2 },
      { code: '1.1.5', stage: 1, group: '1.1', order: 5, mode: 'self', branch: '', output: 'Bản đồ hiện trạng & rào cản', question_self: 'Mỗi tuần (tính cả tuần bận nhất 3 tháng qua), bạn có thể dành chắc chắn bao nhiêu giờ cho việc chia sẻ chất liệu/ghi hình, và hiện có ai hỗ trợ?', self_hint: 'Trả lời sát lịch thực tế, không cần viết dài.', probes: [], min_words: 8, check_vague: false, locked: stageMode === 2 },
      { code: '1.2.2', stage: 1, group: '1.2', order: 7, mode: 'self', branch: '', output: 'Hồ sơ năng lực', question_self: 'Khi người quen, khách hàng hoặc đồng nghiệp gặp rắc rối, họ hay tìm đến Minh Anh để nhờ gỡ rối việc gì nhất? Hãy trích dẫn 1–2 tin nhắn gần nhất.', self_hint: 'Copy-paste nguyên văn 1–2 tin nhắn Zalo gần đây (hoặc tóm tắt 1 dòng rồi gửi ảnh chụp qua Zalo).', probes: [], min_words: 15, check_vague: false, locked: stageMode === 2 },
      { code: '1.3.1', stage: 1, group: '1.3', order: 10, mode: 'self', branch: '', output: 'Kho bằng chứng thô', question_self: 'Liệt kê 3–5 kết quả đo lường được rõ nhất mà bạn đã tạo ra cho bản thân, tổ chức hoặc khách hàng trong lĩnh vực Nha khoa thẩm mỹ.', self_hint: 'Nêu rõ số Trước -> Sau (%, doanh thu, tỷ lệ hài lòng...).', probes: [], min_words: 15, check_vague: true, locked: stageMode === 2 },
      { code: '1.3.2', stage: 1, group: '1.3', order: 11, mode: 'hybrid', branch: '', output: 'Kho bằng chứng thô', question_self: 'Hãy tóm tắt 2–3 ca khách hàng tiêu biểu nhất theo mạch: 1) Bế tắc ban đầu -> 2) Giải pháp của bạn -> 3) Thay đổi sau đó.', self_hint: 'Chỉ cần gạch đầu dòng rõ tình huống thật (có thể ẩn tên khách).', probes: [], min_words: 40, check_vague: true, locked: stageMode === 2 },
      { code: '1.3.3', stage: 1, group: '1.3', order: 12, mode: 'self', branch: '', output: 'Kho bằng chứng thô', question_self: 'Kiểm kê các bằng chứng xã hội bạn đang có (bài báo, giải thưởng, diễn giả, nhận xét công khai, người giới thiệu uy tín).', self_hint: 'Gạch đầu dòng kèm link nếu có.', probes: [], min_words: 10, check_vague: false, locked: stageMode === 2 },
      { code: '1.4.1', stage: 1, group: '1.4', order: 13, mode: 'self', branch: '', output: 'Bản đồ hiện trạng & rào cản', question_self: 'Dán đường link các trang cá nhân / kênh công việc bạn đang dùng (Facebook, LinkedIn, TikTok, Website...) để chuyên gia chạy bài Test 5 giây.', self_hint: 'Mỗi link 1 dòng (không cần giải thích dài).', probes: [], min_words: 0, check_vague: false, locked: stageMode === 2 }
    ];

    var s2Common = [
      { code: '2.1.1', stage: 2, group: '2.1', order: 16, mode: 'hybrid', branch: '', output: 'Chân dung khách hàng', question_self: 'Chọn trước 1–2 nhóm khách hàng bạn muốn ưu tiên phục vụ nhất (vừa có nỗi đau cấp bách, vừa sẵn sàng chi trả).', self_hint: 'Mô tả cụ thể vai trò/ngành/quy mô. Các câu 2.1.2 và 2.1.3 sẽ xoay quanh nhóm này.', probes: [], min_words: 15, check_vague: true, locked: false },
      { code: '2.1.2', stage: 2, group: '2.1', order: 17, mode: 'self', branch: '', output: 'Chân dung khách hàng', question_self: 'Với nhóm khách bạn vừa nêu ở 2.1.1: họ ở hoàn cảnh nào khi đi tìm giải pháp và câu hỏi nghi ngờ đầu tiên họ hay đặt ra là gì?', self_hint: 'Kể trải nghiệm mất tiền oan trước đây của họ hoặc dán câu hỏi khách hay thắc mắc.', probes: [], min_words: 20, check_vague: true, locked: false },
      { code: '2.1.3', stage: 2, group: '2.1', order: 18, mode: 'self', branch: '', output: 'Chân dung khách hàng', question_self: 'Nhóm khách ở 2.1.1 thường tìm thông tin ở đâu (tên cụ thể các group Facebook, kênh YouTube, podcast, báo ngành, người ảnh hưởng)?', self_hint: 'Ghi càng cụ thể tên kênh/group càng tốt.', probes: [], min_words: 10, check_vague: false, locked: false },
      { code: '2.2.1', stage: 2, group: '2.2', order: 19, mode: 'hybrid', branch: '', output: 'Tuyên bố định vị', question_self: 'Liệt kê tên 3 đối thủ nổi bật nhất cùng tệp khách, và nêu điểm khác biệt trong quy trình/cách làm của Minh Anh (không tính giá rẻ).', self_hint: 'Ghi tên 3 đối thủ + 1–2 điểm khác biệt cốt lõi.', probes: [], min_words: 25, check_vague: true, locked: false },
      { code: '2.2.2', stage: 2, group: '2.2', order: 20, mode: 'self', branch: '', output: 'Tuyên bố định vị', question_self: 'Trong ngành Nha khoa thẩm mỹ, kiểu làm thương hiệu cá nhân nào khiến bạn phản cảm nhất và bạn tuyệt đối không muốn bị gắn mác nào?', self_hint: 'Nói thẳng quan điểm thật của bạn.', probes: [], min_words: 15, check_vague: false, locked: false }
    ];

    var s2BranchA = [
      { code: '2.3.1A', stage: 2, group: '2.3', order: 22, mode: 'self', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi', question_self: 'Liệt kê sản phẩm/dịch vụ kèm khoảng giá, biên lợi nhuận ước tính, gói dễ chốt nhất và gói không muốn đẩy mạnh nữa.', self_hint: 'Gạch đầu dòng ngắn gọn từng gói dịch vụ.', probes: [], min_words: 10, check_vague: false, locked: false },
      { code: '2.3.2A', stage: 2, group: '2.3', order: 23, mode: 'hybrid', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi', question_self: 'Có khoảng cách nào giữa lời hứa thương hiệu cá nhân của bạn và trải nghiệm thực tế của đội ngũ không?', self_hint: 'Chia sẻ thật các điểm khách hay góp ý.', probes: [], min_words: 20, check_vague: true, locked: false },
      { code: '2.3.3A', stage: 2, group: '2.3', order: 24, mode: 'hybrid', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi', question_self: 'Năng lực tối đa hiện tại mỗi tháng là bao nhiêu khách? Nếu tăng thêm 20–30 khách, khâu nào sẽ gãy đầu tiên?', self_hint: 'Nêu con số tối đa và khâu phụ thuộc vào bạn nhất.', probes: [], min_words: 20, check_vague: true, locked: false }
    ];

    var s2BranchB = [
      { code: '2.3.2B', stage: 2, group: '2.3', order: 26, mode: 'self', branch: 'B', output: 'Cấu trúc sản phẩm & phễu chuyển đổi', question_self: 'Đã từng có ai trả tiền cho lời khuyên/sự hỗ trợ của bạn chưa? Nếu tuần tới mở gói thử nghiệm, bạn sẽ mời đích danh 5 ai đầu tiên?', self_hint: 'Liệt kê cụ thể các lần đã nhận tiền (hoặc "Chưa") và 5 người có thể mời.', probes: [], min_words: 10, check_vague: false, locked: false }
    ];

    var questions = s1Questions.slice();
    if (stageMode === 2) {
      questions = questions.concat(s2Common);
      if (demoStore.branch === 'A') questions = questions.concat(s2BranchA);
      if (demoStore.branch === 'B') questions = questions.concat(s2BranchB);
    }

    return {
      client: {
        client_id: 'DEMO01',
        name: 'Minh Anh',
        field: 'Nha khoa thẩm mỹ',
        branch: demoStore.branch,
        stages_open: stageMode === 2 ? [1, 2] : [1],
        stages_locked: stageMode === 2 ? [1] : [],
        intro: 'Chào Minh Anh, đây là bảng chuẩn bị dữ kiện trước buổi làm việc xây dựng thương hiệu cá nhân trong lĩnh vực Nha khoa thẩm mỹ. Mọi câu trả lời sẽ được tự động lưu nháp để bạn điền dần khi rảnh.',
        deadline: '28/11/2026',
        has_consented: demoStore.consented
      },
      round: 'R1',
      needs_branch_choice: stageMode === 2 && !demoStore.branch,
      stage_titles: {
        1: 'Giai đoạn 1: Khai thác thông tin & Chẩn đoán hiện trạng',
        2: 'Giai đoạn 2: Định vị chiến lược & Kiến trúc kinh doanh'
      },
      questions: questions,
      responses: Object.assign({}, demoStore.responses),
      submitted_stages: {},
      config: {
        vague_words: ['rất tận tâm', 'khách rất thích', 'rất hài lòng', 'chất lượng cao', 'uy tín', 'chuyên nghiệp', 'tận tình', 'hiệu quả cao'],
        consent_version: 'v1.0',
        consent_text: 'Tôi đồng ý cung cấp thông tin này cho quá trình tư vấn thương hiệu cá nhân. Dữ liệu chỉ phục vụ cho dự án của tôi và có thể được chuyên gia phân tích bằng công cụ AI ở chế độ không huấn luyện mô hình.'
      }
    };
  }

  function loadDemoSession(stageMode) {
    state.demoStageMode = stageMode;
    if (stageMode === 2) demoStore.consented = true;
    hydrateSession(buildDemoSessionData(stageMode));
  }

  function handleDemoApi(action, payload) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (action === 'saveConsent') {
          demoStore.consented = true;
          resolve({ consent_at: new Date().toISOString() });
        } else if (action === 'setBranch') {
          demoStore.branch = payload.branch;
          resolve(buildDemoSessionData(state.demoStageMode));
        } else if (action === 'saveAnswer') {
          demoStore.responses[payload.code] = Object.assign({}, payload);
          resolve({ code: payload.code, updated_at: new Date().toISOString() });
        } else if (action === 'submitStage') {
          resolve({ stage: payload.stage, submitted_at: new Date().toISOString() });
        } else {
          resolve(buildDemoSessionData(state.demoStageMode));
        }
      }, 180);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
