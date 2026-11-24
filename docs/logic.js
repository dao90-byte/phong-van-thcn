/**
 * logic.js
 * Module nghiệp vụ thuần phía trình duyệt (tách biệt DOM để chạy kiểm thử tự động bằng JS engine).
 * Bao gồm: nhận diện Zalo/FB WebView, tách token từ #k=, đếm từ tiếng Việt,
 * kiểm tra đóng đinh bằng chứng theo từng câu (có ngoại lệ số liệu/trích dẫn),
 * điều hướng thông minh từ màn Xem lại, và quản lý hàng đợi lưu offline.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.THCNLogic = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Nhận diện trình duyệt nhúng trong Zalo, Facebook Messenger, Instagram, Line.
   */
  function detectInAppBrowser(userAgent) {
    var ua = String(userAgent || '');
    if (/Zalo/i.test(ua)) return { isInApp: true, appName: 'Zalo' };
    if (/FBAN|FBAV|Messenger/i.test(ua)) return { isInApp: true, appName: 'Facebook / Messenger' };
    if (/Instagram/i.test(ua)) return { isInApp: true, appName: 'Instagram' };
    if (/Line\//i.test(ua)) return { isInApp: true, appName: 'LINE' };
    return { isInApp: false, appName: '' };
  }

  /**
   * Đọc token an toàn từ hash fragment (#k=...) hoặc fallback (?k=... nếu lỡ dùng link cũ).
   * Trả về { token, isDemo, fromQuery }.
   */
  function extractTokenFromLocation(hashStr, searchStr) {
    var hash = String(hashStr || '').replace(/^#/, '');
    var search = String(searchStr || '').replace(/^\?/, '');

    if (hash === 'demo' || hash.indexOf('demo=1') !== -1) {
      return { token: '', isDemo: true, fromQuery: false };
    }

    var hashParams = parseSimpleParams(hash);
    if (hashParams.k) {
      return { token: hashParams.k.trim(), isDemo: false, fromQuery: false };
    }

    var queryParams = parseSimpleParams(search);
    if (queryParams.k) {
      return { token: queryParams.k.trim(), isDemo: false, fromQuery: true };
    }

    return { token: '', isDemo: false, fromQuery: false };
  }

  function parseSimpleParams(str) {
    var out = {};
    if (!str) return out;
    str.split('&').forEach(function (pair) {
      var idx = pair.indexOf('=');
      if (idx === -1) return;
      var k = decodeURIComponent(pair.slice(0, idx).trim());
      var v = decodeURIComponent(pair.slice(idx + 1).trim());
      if (k) out[k] = v;
    });
    return out;
  }

  /**
   * Đếm số từ chính xác cho văn bản tiếng Việt.
   */
  function countWords(text) {
    if (!text) return 0;
    var s = String(text).trim();
    if (!s) return 0;
    return s.split(/\s+/).filter(Boolean).length;
  }

  /**
   * Kiểm tra câu trả lời đã chứa chữ số định lượng hoặc trích dẫn nguyên văn chưa.
   */
  function hasHardEvidenceSignal(text) {
    var s = String(text || '');
    var hasNumber = /\d+/.test(s);
    var hasQuote = /["“”'«»]/.test(s);
    return hasNumber || hasQuote;
  }

  /**
   * Đánh giá đóng đinh bằng chứng cho 1 câu hỏi cụ thể theo cấu hình riêng của câu đó.
   * - question: { min_words, check_vague }
   * - answer: string
   * - vagueWords: string[]
   * Trả về { needsPrompt, flags, matchedVague, wordCount, reason }.
   */
  function evaluateEvidence(question, answer, vagueWords) {
    var text = String(answer || '').trim();
    var wc = countWords(text);
    var minWords = Number(question && question.min_words) || 0;
    var checkVague = Boolean(question && question.check_vague);
    var flags = [];
    var matchedVague = [];

    if (!text) {
      return {
        needsPrompt: false,
        flags: [],
        matchedVague: [],
        wordCount: 0,
        reason: ''
      };
    }

    if (minWords > 0 && wc < minWords) {
      flags.push('ngan');
    }

    if (checkVague && Array.isArray(vagueWords) && vagueWords.length > 0) {
      // Ngoại lệ: nếu anh/chị đã đưa số liệu cụ thể hoặc trích dẫn nguyên văn -> không báo động giả
      if (!hasHardEvidenceSignal(text)) {
        var lower = text.toLowerCase();
        for (var i = 0; i < vagueWords.length; i++) {
          var phrase = String(vagueWords[i] || '').trim();
          if (!phrase) continue;
          if (lower.indexOf(phrase.toLowerCase()) !== -1) {
            matchedVague.push(phrase);
          }
        }
        if (matchedVague.length > 0) {
          flags.push('mo_ho');
        }
      }
    }

    var reason = '';
    if (flags.indexOf('mo_ho') !== -1 && flags.indexOf('ngan') !== -1) {
      reason = 'Câu trả lời hơi ngắn và có cụm từ còn khá chung chung ("' + matchedVague.slice(0, 2).join('", "') + '").';
    } else if (flags.indexOf('mo_ho') !== -1) {
      reason = 'Câu trả lời có cụm từ khá chung chung ("' + matchedVague.slice(0, 2).join('", "') + '").';
    } else if (flags.indexOf('ngan') !== -1) {
      reason = 'Câu trả lời hiện khá ngắn (' + wc + ' từ) nên có thể còn thiếu bối cảnh.';
    }

    return {
      needsPrompt: flags.length > 0,
      flags: flags,
      matchedVague: matchedVague,
      wordCount: wc,
      reason: reason
    };
  }

  /**
   * Tính tiến độ riêng cho giai đoạn đang làm (activeStage) để thanh tiến độ luôn khớp mẫu số.
   */
  function computeStageProgress(questions, responsesMap, activeStage) {
    var stageQs = (questions || []).filter(function (q) { return q.stage === activeStage; });
    var answered = 0;
    var skipped = 0;
    stageQs.forEach(function (q) {
      var r = responsesMap && responsesMap[q.code];
      if (r && String(r.answer || '').trim()) {
        answered++;
      } else if (r && Array.isArray(r.flags) && r.flags.indexOf('lam_sau') !== -1) {
        skipped++;
      }
    });
    return {
      total: stageQs.length,
      answered: answered,
      skipped: skipped,
      remaining: Math.max(stageQs.length - answered, 0),
      percent: stageQs.length > 0 ? Math.round((answered / stageQs.length) * 100) : 0
    };
  }

  /**
   * Chọn giai đoạn hoạt động mặc định: ưu tiên giai đoạn cao nhất đang mở và chưa bị khóa.
   */
  function determineActiveStage(stagesOpen, stagesLocked) {
    var open = Array.isArray(stagesOpen) ? stagesOpen.slice() : [1];
    var locked = Array.isArray(stagesLocked) ? stagesLocked : [];
    var unlocked = open.filter(function (s) { return locked.indexOf(s) === -1; });
    if (unlocked.length > 0) {
      return Math.max.apply(null, unlocked);
    }
    return open.length > 0 ? Math.max.apply(null, open) : 1;
  }

  /**
   * Tìm chỉ số câu hỏi chưa trả lời kế tiếp trong cùng activeStage (quét vòng tròn, loại trừ excludeIndex).
   */
  function findNextUnansweredIndex(questions, responses, activeStage, excludeIndex) {
    var list = Array.isArray(questions) ? questions : [];
    var len = list.length;
    if (!len) return -1;
    var start = typeof excludeIndex === 'number' ? excludeIndex : -1;
    for (var offset = 1; offset <= len; offset++) {
      var idx = (start + offset) % len;
      if (idx === excludeIndex) continue;
      var q = list[idx];
      if (!q || q.stage !== activeStage || q.locked) continue;
      var r = responses && responses[q.code];
      if (!r || !String(r.answer || '').trim()) {
        return idx;
      }
    }
    return -1;
  }

  /**
   * Xác định bước điều hướng kế tiếp:
   * - Khi đang mở câu từ màn Xem lại:
   *   + Nếu mở câu chưa trả lời: nhảy thẳng sang câu chưa trả lời tiếp theo; hết câu chưa trả lời thì quay về màn Xem lại.
   *   + Nếu mở câu đã trả lời (để sửa): quay thẳng về màn Xem lại.
   * - Khi đi tuần tự bình thường: sang câu kế tiếp, hoặc màn chọn nhánh (nếu cần), hoặc màn Xem lại.
   */
  function findNextNavigationTarget(opts) {
    var questions = (opts && opts.questions) || [];
    var responses = (opts && opts.responses) || {};
    var currentIndex = Number(opts && opts.currentIndex) || 0;
    var activeStage = Number(opts && opts.activeStage) || 1;
    var returnToReviewMode = Boolean(opts && opts.returnToReviewMode);
    var openedUnansweredFromReview = Boolean(opts && opts.openedUnansweredFromReview);
    var needsBranchChoice = Boolean(opts && opts.needsBranchChoice);
    var hasBranch = Boolean(opts && opts.hasBranch);

    if (returnToReviewMode) {
      if (openedUnansweredFromReview) {
        var nextUnanswered = findNextUnansweredIndex(questions, responses, activeStage, currentIndex);
        if (nextUnanswered !== -1) {
          return { type: 'question', index: nextUnanswered };
        }
      }
      if (needsBranchChoice && activeStage === 2 && !hasBranch) {
        return { type: 'branch' };
      }
      return { type: 'review' };
    }

    if (currentIndex < questions.length - 1) {
      return { type: 'question', index: currentIndex + 1 };
    }
    if (needsBranchChoice && activeStage === 2 && !hasBranch) {
      return { type: 'branch' };
    }
    return { type: 'review' };
  }

  /**
   * Quản lý hàng đợi đồng bộ offline (pure array helpers).
   */
  function enqueuePendingSave(queue, item) {
    var list = Array.isArray(queue) ? queue.slice() : [];
    var filtered = list.filter(function (q) {
      return !(q.code === item.code && q.round === item.round);
    });
    filtered.push(item);
    return filtered;
  }

  function dequeuePendingSave(queue, code, round) {
    return (Array.isArray(queue) ? queue : []).filter(function (q) {
      return !(q.code === code && q.round === round);
    });
  }

  return {
    detectInAppBrowser: detectInAppBrowser,
    extractTokenFromLocation: extractTokenFromLocation,
    countWords: countWords,
    hasHardEvidenceSignal: hasHardEvidenceSignal,
    evaluateEvidence: evaluateEvidence,
    computeStageProgress: computeStageProgress,
    determineActiveStage: determineActiveStage,
    findNextUnansweredIndex: findNextUnansweredIndex,
    findNextNavigationTarget: findNextNavigationTarget,
    enqueuePendingSave: enqueuePendingSave,
    dequeuePendingSave: dequeuePendingSave
  };
}));
