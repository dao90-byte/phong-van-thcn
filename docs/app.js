/**
 * app.js
 * Điều khiển giao diện Trang tự phỏng vấn phía khách hàng (GitHub Pages).
 * - Đọc token từ #k= (lưu tạm sessionStorage để F5 không mất phiên) và ẩn khỏi thanh địa chỉ.
 * - Phát hiện Zalo/Messenger In-App Browser để cảnh báo sớm.
 * - Lưu lạc quan (optimistic): chuyển câu tức thì (0ms), đẩy server chạy nền theo hàng đợi tuần tự + chống mất chữ localStorage.
 * - Nút nói thành chữ cho cả ô trả lời chính lẫn ô dẫn chứng bổ sung.
 * - Điều hướng thông minh từ màn Xem lại: hoàn thành câu chưa trả lời sẽ chuyển thẳng sang câu chưa trả lời kế tiếp hoặc quay về màn Xem lại.
 */
(function () {
  'use strict';

  var Logic = window.THCNLogic;
  var CFG = window.APP_CONFIG || {};

  var state = {
    token: '',
    session: null,
    activeStage: 1,
    currentIndex: 0,
    returnToReviewMode: false,
    openedUnansweredFromReview: false,
    responses: {}, // code -> { answer, answer_extra, input_mode, flags, matched_vague, updated_at }
    promptedCodes: {}, // Mỗi câu chỉ hiện nhắc đóng đinh bằng chứng tối đa 1 lần
    pendingQueue: [],
    isFlushing: false,
    syncChain: Promise.resolve(),
    inFlightCount: 0,
    speechSupported: false,
    activeVoiceTarget: null, // { input, btn, label }
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

    var effectiveToken = parsed.token;
    if (!effectiveToken) {
      try {
        effectiveToken = sessionStorage.getItem('thcn_active_token') || '';
      } catch (e) {}
    }

    if (!effectiveToken) {
      showError('🔗', 'Thiếu mã truy cập cá nhân', 'Anh/chị vui lòng mở đúng đường link riêng có dạng #k=... do chuyên gia gửi.');
      return;
    }

    if (!apiConfigured) {
      showError('⚙️', 'Chưa cấu hình API_URL', 'Chuyên gia chưa dán đường dẫn Google Apps Script Web App vào file docs/config.js.');
      return;
    }

    state.token = effectiveToken;
    try {
      sessionStorage.setItem('thcn_active_token', effectiveToken);
    } catch (e) {}
    // Giấu token khỏi thanh địa chỉ sau khi đã đọc vào bộ nhớ
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}

    loadLiveSession();
  }

  function cacheDom() {
    [
      'inAppBanner', 'inAppName', 'dismissInAppBtn',
      'appHeader', 'brandTitle', 'syncBadge', 'drawerTrigger', 'progressPillText', 'progressBarFill',
      'viewLoading', 'viewError', 'errorIcon', 'errorTitle', 'errorMessage',
      'viewWelcome', 'welcomeGreeting', 'welcomeIntro',
      'welcomeCount', 'welcomeDuration', 'welcomeDeadlineBox', 'welcomeDeadline',
      'consentCheckbox', 'consentText', 'startBtn',
      'viewQuestion', 'qCodeBadge', 'lockedNotice', 'qTitle',
      'qHintBox', 'qHintText', 'qProbesBox', 'qProbesList',
      'answerInput', 'voiceBtn', 'voiceBtnLabel', 'mobileMicTip', 'wordCountLabel', 'voiceStatus',
      'evidenceBox', 'evidenceReason', 'extraInput', 'extraVoiceBtn', 'extraVoiceBtnLabel', 'extraMobileMicTip',
      'skipEvidenceBtn', 'saveEvidenceBtn',
      'savedExtraWrap', 'savedExtraInput', 'savedExtraToolbar', 'savedExtraVoiceBtn', 'savedExtraVoiceBtnLabel',
      'prevBtn', 'skipBtn', 'nextBtn',
      'viewBranch', 'branchABtn', 'branchBBtn',
      'viewReview', 'reviewEyebrow', 'reviewTitle', 'reviewSub', 'reviewList', 'backFromReviewBtn', 'submitStageBtn',
      'viewDone', 'doneMessage', 'doneTimestamp', 'reopenReviewBtn',
      'drawerBackdrop', 'questionDrawer', 'drawerSummary', 'closeDrawerBtn', 'drawerBody', 'drawerToReviewBtn'
    ].forEach(function (id) { el[id] = $(id); });
  }

  function bindEvents() {
    el.dismissInAppBtn.addEventListener('click', function () { el.inAppBanner.classList.add('hidden'); });

    el.consentCheckbox.addEventListener('change', function () {
      el.startBtn.disabled = !el.consentCheckbox.checked;
    });
    el.startBtn.addEventListener('click', onStartInterview);

    el.answerInput.addEventListener('input', onAnswerInput);
    el.savedExtraInput.addEventListener('input', onSavedExtraInput);

    el.voiceBtn.addEventListener('click', function () {
      toggleVoiceFor(el.answerInput, el.voiceBtn, el.voiceBtnLabel);
    });
    el.extraVoiceBtn.addEventListener('click', function () {
      toggleVoiceFor(el.extraInput, el.extraVoiceBtn, el.extraVoiceBtnLabel);
    });
    el.savedExtraVoiceBtn.addEventListener('click', function () {
      toggleVoiceFor(el.savedExtraInput, el.savedExtraVoiceBtn, el.savedExtraVoiceBtnLabel);
    });

    el.prevBtn.addEventListener('click', onPrevQuestion);
    el.skipBtn.addEventListener('click', onSkipQuestion);
    el.nextBtn.addEventListener('click', onNextQuestion);

    el.skipEvidenceBtn.addEventListener('click', onSkipEvidence);
    el.saveEvidenceBtn.addEventListener('click', onSaveEvidence);

    el.branchABtn.addEventListener('click', function () { chooseBranch('A'); });
    el.branchBBtn.addEventListener('click', function () { chooseBranch('B'); });

    el.backFromReviewBtn.addEventListener('click', function () {
      state.returnToReviewMode = false;
      state.openedUnansweredFromReview = false;
      openQuestionByIndex(state.currentIndex);
    });
    el.submitStageBtn.addEventListener('click', onSubmitStage);
    el.reopenReviewBtn.addEventListener('click', openReviewView);

    el.drawerTrigger.addEventListener('click', openDrawer);
    el.closeDrawerBtn.addEventListener('click', closeDrawer);
    el.drawerBackdrop.addEventListener('click', closeDrawer);
    el.drawerToReviewBtn.addEventListener('click', function () {
      closeDrawer();
      persistCurrentAnswer({ forceServer: false });
      openReviewView();
    });

    window.addEventListener('online', function () { flushPendingQueue(); });
    window.addEventListener('offline', function () { setSyncStatus('offline', 'Mất mạng – đang lưu trên máy'); });
  }

  // ==================== NETWORK / API LAYER ====================

  function callApi(action, payload) {
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
        showError(icon, title, err.message || 'Anh/chị vui lòng kiểm tra kết nối mạng và tải lại trang.');
      });
  }

  function hydrateSession(sessionData) {
    state.session = sessionData;
    state.activeStage = Logic.determineActiveStage(
      sessionData.client.stages_open,
      sessionData.client.stages_locked
    );
    state.returnToReviewMode = false;
    state.openedUnansweredFromReview = false;

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

    el.welcomeGreeting.textContent = 'Xin chào ' + (client.name || 'anh/chị') + ' 👋';
    el.welcomeIntro.textContent = client.intro || 'Cảm ơn anh/chị đã dành thời gian chuẩn bị dữ kiện trước buổi làm việc trực tiếp.';
    el.welcomeCount.textContent = stageQs.length + ' câu';
    el.welcomeDuration.textContent = minMins + '–' + maxMins + ' phút';
    if (client.deadline) {
      el.welcomeDeadline.textContent = client.deadline;
      el.welcomeDeadlineBox.classList.remove('hidden');
    } else {
      el.welcomeDeadline.textContent = 'Trước buổi gặp 3 ngày';
    }
    el.consentText.textContent = state.session.config.consent_text ||
      'Tôi đồng ý cung cấp thông tin này cho quá trình tư vấn thương hiệu cá nhân. Dữ liệu chỉ phục vụ cho dự án tư vấn của tôi.';
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
        alert(err.message || 'Không thể lưu xác nhận, anh/chị vui lòng thử lại.');
      });
  }

  // ==================== QUESTION VIEW ====================

  function getCurrentQuestion() {
    if (!state.session || !state.session.questions.length) return null;
    return state.session.questions[state.currentIndex] || null;
  }

  function openQuestionByIndex(index) {
    stopVoiceIfRunning();
    el.voiceStatus.classList.add('hidden');
    var qs = state.session.questions;
    if (!qs.length) {
      if (state.session.needs_branch_choice) {
        showOnly('viewBranch');
        return;
      }
      showError('📋', 'Chưa có câu hỏi đang mở', 'Chuyên gia chưa mở câu hỏi tự điền cho phiên này.');
      return;
    }

    var safeIndex = Math.max(0, Math.min(index, qs.length - 1));
    state.currentIndex = safeIndex;
    var q = qs[safeIndex];
    var resp = state.responses[q.code] || { answer: '', answer_extra: '', input_mode: 'go', flags: [], matched_vague: [] };

    state.usedVoiceOnCurrent = resp.input_mode === 'noi' || resp.input_mode === 'hon_hop';
    state.usedTypeOnCurrent = resp.input_mode === 'go' || resp.input_mode === 'hon_hop';

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
      el.savedExtraToolbar.classList.toggle('hidden', Boolean(q.locked) || !state.speechSupported);
    } else {
      el.savedExtraWrap.classList.add('hidden');
    }

    if (q.locked) {
      el.lockedNotice.classList.remove('hidden');
      el.skipBtn.classList.add('hidden');
      el.voiceBtn.classList.add('hidden');
      el.mobileMicTip.classList.add('hidden');
      el.prevBtn.textContent = state.returnToReviewMode ? '← Về trang xem lại' : '← Câu trước';
      el.prevBtn.disabled = !state.returnToReviewMode && safeIndex === 0;
      el.nextBtn.textContent = isLastQuestionInView() ? 'Tới câu hiện tại →' : 'Xem câu tiếp →';
    } else {
      el.lockedNotice.classList.add('hidden');
      el.skipBtn.classList.remove('hidden');
      el.mobileMicTip.classList.remove('hidden');
      if (state.speechSupported) {
        el.voiceBtn.classList.remove('hidden');
        el.extraVoiceBtn.classList.remove('hidden');
        el.savedExtraVoiceBtn.classList.remove('hidden');
      }
      el.prevBtn.textContent = state.returnToReviewMode ? '← Về trang xem lại' : '← Câu trước';
      el.prevBtn.disabled = !state.returnToReviewMode && safeIndex === 0;
      el.nextBtn.textContent = getNextButtonLabel();
    }

    updateWordCountDisplay();
    updateHeaderProgress();
    showOnly('viewQuestion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getNextButtonLabel() {
    var target = computeNextTarget();
    if (state.returnToReviewMode) {
      return target.type === 'question' ? 'Lưu & Tới câu chưa làm →' : 'Lưu & Về trang xem lại ✓';
    }
    if (target.type === 'review') return 'Lưu & Xem lại →';
    return 'Lưu & Tiếp →';
  }

  function computeNextTarget() {
    return Logic.findNextNavigationTarget({
      questions: state.session ? state.session.questions : [],
      responses: state.responses,
      currentIndex: state.currentIndex,
      activeStage: state.activeStage,
      returnToReviewMode: state.returnToReviewMode,
      openedUnansweredFromReview: state.openedUnansweredFromReview,
      needsBranchChoice: Boolean(state.session && state.session.needs_branch_choice),
      hasBranch: Boolean(state.session && state.session.client && state.session.client.branch)
    });
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
    if (existing.flags && existing.flags.indexOf('bo_qua_nhac') !== -1 && flags.indexOf('bo_qua_nhac') === -1) {
      flags.push('bo_qua_nhac');
    }
    if (extraOverrides && extraOverrides.addFlag && flags.indexOf(extraOverrides.addFlag) === -1) {
      flags.push(extraOverrides.addFlag);
    }
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

  /**
   * Lưu lạc quan (Optimistic Save):
   * - Ghi ngay vào state + localStorage (0ms) để UI chuyển trang không bị trễ.
   * - Đẩy tác vụ gửi server vào chuỗi tuần tự chạy nền (`state.syncChain`).
   */
  function persistCurrentAnswer(opts) {
    var options = opts || {};
    var q = getCurrentQuestion();
    if (!q || q.locked) return Promise.resolve();

    clearTimeout(state.localDraftTimer);
    clearTimeout(state.serverDebounceTimer);

    var record = captureCurrentIntoState(options.extraOverrides);
    saveDraftToLocalStorage(q.code);
    updateHeaderProgress();

    if (!record.answer && !record.answer_extra && record.flags.indexOf('lam_sau') === -1) {
      return Promise.resolve();
    }

    var h = hashResponse(record);
    if (!options.forceServer && state.lastSavedHashByCode[q.code] === h) {
      return Promise.resolve();
    }

    if (!navigator.onLine) {
      queueOfflineSave(record);
      return Promise.resolve();
    }

    // Chạy nền tuần tự để không chặn chuyển màn hình và giảm xung đột LockService
    var snapshot = Object.assign({}, record);
    state.inFlightCount++;
    setSyncStatus('saving', 'Đang lưu...');

    state.syncChain = state.syncChain.then(function () {
      return callApi('saveAnswer', snapshot)
        .then(function () {
          state.lastSavedHashByCode[snapshot.code] = h;
          // Chỉ xóa nháp local nếu không có bản mới hơn vừa gõ sau đó
          var latest = state.responses[snapshot.code];
          if (!latest || hashResponse(latest) === h) {
            removeDraftFromLocalStorage(snapshot.code);
          }
          state.pendingQueue = Logic.dequeuePendingSave(state.pendingQueue, snapshot.code, snapshot.round);
          saveQueueToLocalStorage();
        })
        .catch(function () {
          queueOfflineSave(snapshot);
        })
        .finally(function () {
          state.inFlightCount = Math.max(0, state.inFlightCount - 1);
          if (state.inFlightCount === 0 && state.pendingQueue.length === 0) {
            setSyncStatus('saved', 'Đã lưu ✓');
          }
        });
    });

    return state.syncChain;
  }

  // ==================== NAVIGATION & EVIDENCE PINNING ====================

  function onPrevQuestion() {
    persistCurrentAnswer({ forceServer: false });
    if (state.returnToReviewMode) {
      openReviewView();
      return;
    }
    openQuestionByIndex(state.currentIndex - 1);
  }

  function onSkipQuestion() {
    var q = getCurrentQuestion();
    if (!q || q.locked) return;
    persistCurrentAnswer({ forceServer: false, extraOverrides: { addFlag: 'lam_sau' } });
    goForwardAfterCurrent();
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
        // Lưu nền luôn câu trả lời chính trong lúc anh/chị đọc nhắc bằng chứng
        persistCurrentAnswer({ forceServer: false });
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

    // Lưu chạy nền (0ms lag) và chuyển ngay sang đích tiếp theo
    persistCurrentAnswer({
      forceServer: true,
      extraOverrides: skippedOpenEvidence ? { addFlag: 'bo_qua_nhac' } : null
    });
    goForwardAfterCurrent();
  }

  function onSkipEvidence() {
    stopVoiceIfRunning();
    el.evidenceBox.classList.add('hidden');
    // Chuyển trang tức thì (không chờ mạng), đồng bộ cờ bo_qua_nhac chạy nền
    persistCurrentAnswer({ forceServer: true, extraOverrides: { addFlag: 'bo_qua_nhac' } });
    goForwardAfterCurrent();
  }

  function onSaveEvidence() {
    stopVoiceIfRunning();
    var extra = el.extraInput.value.trim();
    el.savedExtraInput.value = extra;
    el.evidenceBox.classList.add('hidden');
    if (extra) el.savedExtraWrap.classList.remove('hidden');
    // Chuyển trang tức thì (0ms), đồng bộ câu trả lời + bổ sung chạy nền
    persistCurrentAnswer({
      forceServer: true,
      extraOverrides: extra ? null : { addFlag: 'bo_qua_nhac' }
    });
    goForwardAfterCurrent();
  }

  function goForwardAfterCurrent() {
    var target = computeNextTarget();
    if (target.type === 'question') {
      openQuestionByIndex(target.index);
      return;
    }
    if (target.type === 'branch') {
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
        state.returnToReviewMode = false;
        state.openedUnansweredFromReview = false;
        Object.keys(updatedSession.responses || {}).forEach(function (code) {
          if (!state.responses[code]) state.responses[code] = updatedSession.responses[code];
        });
        updateHeaderProgress();

        openQuestionByIndex(Math.min(prevCount, state.session.questions.length - 1));
      })
      .catch(function (err) {
        el.branchABtn.disabled = false;
        el.branchBBtn.disabled = false;
        alert(err.message || 'Không thể lưu nhánh, anh/chị vui lòng thử lại.');
      });
  }

  // ==================== REVIEW & SUBMIT ====================

  function openReviewView() {
    stopVoiceIfRunning();
    state.returnToReviewMode = false;
    state.openedUnansweredFromReview = false;

    var stage = state.activeStage;
    var stageQs = state.session.questions.filter(function (q) { return q.stage === stage; });
    var progress = Logic.computeStageProgress(state.session.questions, state.responses, stage);
    var isStageLocked = state.session.client.stages_locked.indexOf(stage) !== -1;

    el.reviewEyebrow.textContent = 'XEM LẠI TRƯỚC KHI GỬI';
    el.reviewTitle.textContent = 'Anh/chị đã trả lời ' + progress.answered + '/' + progress.total + ' câu';
    el.reviewSub.textContent = progress.remaining > 0
      ? 'Còn ' + progress.remaining + ' câu chưa trả lời. Anh/chị có thể bấm trực tiếp vào bất kỳ câu nào bên dưới để bổ sung, hoặc gửi luôn phần đã chuẩn bị.'
      : 'Tuyệt vời! Anh/chị đã hoàn thành toàn bộ các câu chuẩn bị. Hãy rà nhanh một lượt rồi bấm Gửi cho chuyên gia.';

    el.reviewList.innerHTML = stageQs.map(function (q) {
      var globalIdx = state.session.questions.indexOf(q);
      var r = state.responses[q.code];
      var hasAns = Boolean(r && String(r.answer || '').trim());
      var badge = hasAns
        ? '<span class="badge" style="background:var(--success-bg);color:var(--success);">Đã trả lời (' + Logic.countWords(r.answer) + ' từ)</span>'
        : '<span class="badge" style="background:var(--amber-bg);color:var(--amber);">Chưa trả lời</span>';
      var preview = hasAns
        ? '<p class="review-item-a">' + escapeHtml(r.answer) + (r.answer_extra ? '\n[Bổ sung]: ' + escapeHtml(r.answer_extra) : '') + '</p>'
        : '<p class="review-item-a review-empty">Bấm vào đây để trả lời câu này...</p>';

      return '<div class="review-item" data-index="' + globalIdx + '" data-unanswered="' + (hasAns ? '0' : '1') + '">' +
        '<div class="review-item-head"><span class="code-pill">' + escapeHtml(q.code) + '</span>' + badge + '</div>' +
        '<p class="review-item-q">' + escapeHtml(q.question_self) + '</p>' +
        preview +
        '</div>';
    }).join('');

    Array.prototype.forEach.call(el.reviewList.querySelectorAll('.review-item'), function (node) {
      node.addEventListener('click', function () {
        state.returnToReviewMode = true;
        state.openedUnansweredFromReview = node.getAttribute('data-unanswered') === '1';
        openQuestionByIndex(parseInt(node.getAttribute('data-index'), 10));
      });
    });

    el.submitStageBtn.disabled = isStageLocked;
    el.submitStageBtn.textContent = isStageLocked ? 'Phần này đã được khóa' : 'Hoàn tất & Gửi cho chuyên gia ✓';

    showOnly('viewReview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onSubmitStage() {
    el.submitStageBtn.disabled = true;
    el.submitStageBtn.textContent = 'Đang gửi...';

    // Đợi toàn bộ lưu chạy nền + hàng đợi offline hoàn tất trước khi nộp bài
    state.syncChain
      .then(function () { return flushPendingQueue(); })
      .then(function () {
        return callApi('submitStage', { stage: state.activeStage, round: state.session.round });
      })
      .then(function (res) {
        el.submitStageBtn.disabled = false;
        el.submitStageBtn.textContent = 'Hoàn tất & Gửi cho chuyên gia ✓';
        el.doneMessage.textContent = 'Cảm ơn ' + (state.session.client.name || 'anh/chị') + '! Phần chuẩn bị đã được gửi tới ' +
          (CFG.CONSULTANT_NAME || 'chuyên gia tư vấn') + ' để tổng hợp trước buổi gặp trực tiếp.';
        el.doneTimestamp.textContent = 'Thời điểm ghi nhận: ' + formatTimeVi(res.submitted_at);
        showOnly('viewDone');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        el.submitStageBtn.disabled = false;
        el.submitStageBtn.textContent = 'Hoàn tất & Gửi cho chuyên gia ✓';
        alert(err.message || 'Chưa gửi được xác nhận nộp bài (có thể do mất mạng). Câu trả lời của anh/chị vẫn an toàn, hãy thử bấm lại.');
      });
  }

  // ==================== DRAWER & PROGRESS ====================

  function updateHeaderProgress() {
    if (!state.session) return;
    var prog = Logic.computeStageProgress(state.session.questions, state.responses, state.activeStage);
    var stageQs = state.session.questions.filter(function (q) { return q.stage === state.activeStage; });
    var curQ = getCurrentQuestion();
    var posInStage = curQ && curQ.stage === state.activeStage ? (stageQs.indexOf(curQ) + 1) : Math.max(1, prog.answered);

    el.progressPillText.textContent = 'Câu ' + Math.max(1, posInStage) + '/' + Math.max(1, prog.total);
    el.progressBarFill.style.width = prog.percent + '%';
  }

  function openDrawer() {
    if (!state.session) return;
    var prog = Logic.computeStageProgress(state.session.questions, state.responses, state.activeStage);
    el.drawerSummary.textContent = 'Đã làm ' + prog.answered + '/' + prog.total + ' câu';

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
      var header = stages.length > 1
        ? '<div class="drawer-stage-title">Phần ' + s + (locked ? ' · 🔒 Chỉ xem' : '') + '</div>'
        : '';
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
        state.returnToReviewMode = false;
        state.openedUnansweredFromReview = false;
        persistCurrentAnswer({ forceServer: false });
        openQuestionByIndex(idx);
      });
    });

    el.drawerBackdrop.classList.remove('hidden');
    el.questionDrawer.classList.remove('hidden');
  }

  function closeDrawer() {
    el.drawerBackdrop.classList.add('hidden');
    el.questionDrawer.classList.add('hidden');
  }

  // ==================== VOICE (WEB SPEECH API CHO CẢ Ô CHÍNH & Ô DẪN CHỨNG) ====================

  function setupVoiceAvailability() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var inApp = Logic.detectInAppBrowser(navigator.userAgent).isInApp;
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    state.speechSupported = Boolean(SpeechRecognition) && !inApp && !isIOS;
    if (state.speechSupported) {
      el.voiceBtn.classList.remove('hidden');
      el.extraVoiceBtn.classList.remove('hidden');
      el.savedExtraVoiceBtn.classList.remove('hidden');
      el.mobileMicTip.textContent = 'Hoặc dùng nút micro trên bàn phím điện thoại';
      el.extraMobileMicTip.textContent = 'Hoặc dùng micro trên bàn phím điện thoại';
    } else {
      el.voiceBtn.classList.add('hidden');
      el.extraVoiceBtn.classList.add('hidden');
      el.savedExtraVoiceBtn.classList.add('hidden');
      el.mobileMicTip.textContent = '💡 Mẹo: bấm nút 🎤 micro trên bàn phím điện thoại để nói thành chữ';
      el.extraMobileMicTip.textContent = '💡 Có thể dùng nút 🎤 micro trên bàn phím điện thoại để đọc nhanh';
    }
  }

  function toggleVoiceFor(targetInput, targetBtn, targetLabel) {
    if (!state.speechSupported) return;

    // Nếu đang ghi ở chính nút này -> dừng lại
    if (state.activeVoiceTarget && state.activeVoiceTarget.btn === targetBtn) {
      stopVoiceIfRunning();
      return;
    }

    // Nếu đang ghi ở ô khác -> dừng ô kia trước rồi bắt đầu ô mới
    if (state.activeVoiceTarget) {
      stopVoiceIfRunning();
    }

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = new SpeechRecognition();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;

    var baseText = targetInput.value.trim();
    var finalChunk = '';

    rec.onstart = function () {
      state.activeVoiceTarget = { input: targetInput, btn: targetBtn, label: targetLabel };
      state.usedVoiceOnCurrent = true;
      targetBtn.classList.add('recording');
      targetLabel.textContent = 'Dừng ghi giọng nói';
      el.voiceStatus.classList.add('hidden');
    };

    rec.onresult = function (event) {
      var interim = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += t + ' ';
        else interim += t;
      }
      var sep = baseText ? ' ' : '';
      targetInput.value = (baseText + sep + finalChunk + interim).trim();
      updateWordCountDisplay();
    };

    rec.onerror = function (ev) {
      el.voiceStatus.textContent = 'Không thu được giọng nói (' + ev.error + '). Anh/chị hãy gõ hoặc dùng nút micro trên bàn phím điện thoại.';
      el.voiceStatus.classList.remove('hidden');
      stopVoiceIfRunning();
    };

    rec.onend = function () {
      resetVoiceButtonState();
      if (targetInput === el.answerInput || targetInput === el.savedExtraInput) {
        scheduleDualSave();
      }
    };

    state.recognition = rec;
    try {
      rec.start();
    } catch (e) {
      stopVoiceIfRunning();
    }
  }

  function resetVoiceButtonState() {
    if (state.activeVoiceTarget) {
      state.activeVoiceTarget.btn.classList.remove('recording');
      state.activeVoiceTarget.label.textContent = '🎤 Nói thành chữ';
      state.activeVoiceTarget = null;
    }
  }

  function stopVoiceIfRunning() {
    if (state.recognition && state.activeVoiceTarget) {
      try { state.recognition.stop(); } catch (e) {}
    }
    resetVoiceButtonState();
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
    if (state.isFlushing || !state.pendingQueue.length || !navigator.onLine) {
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

  function showError(icon, title, message) {
    el.appHeader.classList.add('hidden');
    el.errorIcon.textContent = icon;
    el.errorTitle.textContent = title;
    el.errorMessage.textContent = message;
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

  document.addEventListener('DOMContentLoaded', init);
})();
