/**
 * Export.gs
 * Dựng Bản đọc trước (Pre-read) và Bản đánh giá (Eval) dạng Markdown sạch cho LLM.
 * - Tự động lọc theo đúng nhánh hiện tại của khách (không lẫn nhánh cũ nếu khách từng đổi).
 * - Tự động escape thẻ XML đóng ('</' -> '<\/') trong nội dung khách để chống prompt injection.
 * - Tự động chèn <tom_tat_gd_truoc> (kèm câu neo 1.1.3 & 1.1.5) khi xuất từ GĐ2 trở đi.
 * - Hỗ trợ cả ghi chú gắn mã câu lẫn ghi chú thô / transcript buổi họp (code = 'RAW').
 */

function buildMarkdownExport_(clientId, stage, round, exportType, options) {
  var opts = options || {};
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var anonymize = !!opts.anonymize;

  var client = findClientById_(clientId);
  if (!client) {
    throw new Error('Không tìm thấy khách hàng: ' + clientId);
  }

  var bundle = getStaticBundle_();
  var resolved = resolveClientQuestions_(client, bundle, {
    includeLive: true,
    stageFilter: stageNum
  });

  // Gom Responses của khách cho giai đoạn & đợt này
  var allClientResponses = {};
  var stageResponses = {};
  readTabAsObjects_(TABS.RESPONSES).forEach(function (r) {
    if (String(r.client_id || '').trim() !== client.client_id) return;
    var rRound = String(r.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    var code = String(r.code || '').trim();
    if (!code) return;
    if (rRound === DEFAULT_ROUND || rRound === roundStr) {
      allClientResponses[code] = r;
    }
    if (rRound === roundStr && parseInt(r.stage, 10) === stageNum) {
      stageResponses[code] = r;
    }
  });

  // Gom LiveNotes của khách cho giai đoạn & đợt này
  var notesByCode = {};
  var rawNotes = [];
  readTabAsObjects_(TABS.LIVE_NOTES).forEach(function (n) {
    if (String(n.client_id || '').trim() !== client.client_id) return;
    var nRound = String(n.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    if (nRound !== roundStr) return;
    if (parseInt(n.stage, 10) !== stageNum) return;
    var code = String(n.code || '').trim().toUpperCase();
    if (!code || code === 'RAW') {
      rawNotes.push(n);
    } else {
      if (!notesByCode[code]) notesByCode[code] = [];
      notesByCode[code].push(n);
    }
  });

  // Gom StageReviews của khách (cả giai đoạn hiện tại và các giai đoạn trước)
  var currentReview = null;
  var previousReviews = [];
  readTabAsObjects_(TABS.STAGE_REVIEWS).forEach(function (sr) {
    if (String(sr.client_id || '').trim() !== client.client_id) return;
    var srStage = parseInt(sr.stage, 10);
    var srRound = String(sr.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    if (srStage === stageNum && srRound === roundStr) {
      currentReview = sr;
    } else if (srStage < stageNum) {
      previousReviews.push({ stage: srStage, round: srRound, review: sr });
    }
  });
  previousReviews.sort(function (a, b) { return a.stage - b.stage; });

  // Thống kê câu tự điền & cách nhập
  var selfEligible = resolved.questions.filter(function (q) { return q.mode !== 'live'; });
  var doneCount = 0;
  var voiceCount = 0;
  var typeCount = 0;
  selfEligible.forEach(function (q) {
    var resp = stageResponses[q.code];
    if (resp && String(resp.answer || '').trim()) {
      doneCount++;
      var mode = String(resp.input_mode || 'go').toLowerCase();
      if (mode === 'noi' || mode === 'hon_hop') voiceCount++;
      else typeCount++;
    }
  });

  var displayName = anonymize ? client.client_id : client.name + ' (' + client.client_id + ')';
  var today = new Date().toISOString().slice(0, 10);
  var submittedLabel = (currentReview && String(currentReview.submitted_at || '').trim())
    ? String(currentReview.submitted_at).trim()
    : 'Chưa bấm nộp (đang nháp)';

  var lines = [];
  lines.push('# HỒ SƠ PHỎNG VẤN – ' + displayName);
  lines.push('- Lĩnh vực: ' + (client.field || 'Chưa rõ') + ' | Nhánh: ' + (resolved.effectiveBranch || 'Chưa chọn') + ' | Đợt: ' + roundStr);
  lines.push('- Giai đoạn: ' + stageNum + ' | Ngày xuất: ' + today);
  lines.push('- Tự điền: ' + doneCount + '/' + selfEligible.length + ' câu | Trạng thái nộp: ' + submittedLabel);
  lines.push('- Cách nhập: ' + voiceCount + ' câu nói thành chữ (có thể còn lỗi nhận dạng giọng nói), ' + typeCount + ' câu gõ');
  if (anonymize) {
    lines.push('- Lưu ý quyền riêng tư: Đã thay tên khách bằng mã `' + client.client_id + '`. Nhà tư vấn vui lòng rà thêm link hồ sơ (1.4.1) hoặc tên riêng trong câu trả lời nếu cần ẩn danh tuyệt đối.');
  }
  lines.push('');

  // Nếu từ Giai đoạn 2 trở đi: tự động chèn <tom_tat_gd_truoc> + dữ kiện neo 1.1.3 & 1.1.5
  if (stageNum >= 2) {
    lines.push('<tom_tat_gd_truoc>');
    var hasSummary = false;
    previousReviews.forEach(function (item) {
      var sum = String(item.review.approved_summary || '').trim();
      if (sum) {
        hasSummary = true;
        lines.push('## Tóm tắt đã chốt – Giai đoạn ' + item.stage + ' (' + item.round + ')');
        lines.push(escapeXmlTags_(sum));
        lines.push('');
      }
    });
    if (!hasSummary) {
      lines.push('*(Chưa lưu `approved_summary` của giai đoạn trước trong tab StageReviews.)*');
      lines.push('');
    }
    // Luôn đính kèm dữ kiện neo từ GĐ1 (1.1.3 KPI & 1.1.5 Quỹ thời gian/đội ngũ) để đối chiếu mục 4 checklist
    var anchorCodes = ['1.1.3', '1.1.5'];
    lines.push('## Dữ kiện neo từ Giai đoạn 1 (để đối chiếu tính khả thi)');
    anchorCodes.forEach(function (ac) {
      var ans = allClientResponses[ac];
      if (ans && String(ans.answer || '').trim()) {
        lines.push('- [' + ac + ']: ' + escapeXmlTags_(String(ans.answer).trim()) +
          (ans.answer_extra ? ' | Bổ sung: ' + escapeXmlTags_(String(ans.answer_extra).trim()) : ''));
      } else {
        lines.push('- [' + ac + ']: *(chưa có dữ liệu tự điền)*');
      }
    });
    lines.push('</tom_tat_gd_truoc>');
    lines.push('');
  }

  // Nhóm câu hỏi theo đầu ra cốt lõi MECE (`output`)
  var outputOrder = [];
  var byOutput = {};
  resolved.questions.forEach(function (q) {
    var outName = q.output || 'Khác';
    if (!byOutput[outName]) {
      byOutput[outName] = [];
      outputOrder.push(outName);
    }
    byOutput[outName].push(q);
  });

  lines.push('<du_lieu>');
  outputOrder.forEach(function (outName) {
    lines.push('## Đầu ra: ' + outName);
    lines.push('');

    byOutput[outName].forEach(function (q) {
      var modeLabel = q.mode === 'live' ? 'trực tiếp' : (q.mode === 'hybrid' ? 'nháp + chốt trực tiếp' : 'tự điền');
      var resp = stageResponses[q.code];
      var inputTag = resp ? ' – ' + (resp.input_mode || 'go') : '';

      var interpClient = anonymize ? { name: client.client_id, field: client.field } : client;
      lines.push('### [' + q.code + '] (' + modeLabel + inputTag + ')');
      lines.push('- Câu hỏi: ' + interpolateVars_(q.question_live || q.question_self, interpClient));
      if (q.hidden_goal) {
        lines.push('- Mục tiêu khai thác: ' + q.hidden_goal);
      }

      if (q.mode !== 'live') {
        if (resp && String(resp.answer || '').trim()) {
          lines.push('- Trả lời tự điền:');
          lines.push(toBlockquote_(resp.answer));
          if (String(resp.answer_extra || '').trim()) {
            lines.push('- Bổ sung sau nhắc bằng chứng:');
            lines.push(toBlockquote_(resp.answer_extra));
          }
          var flags = parsePipeList_(resp.flags);
          var matchedVague = parsePipeList_(resp.matched_vague);
          if (flags.length > 0) {
            var flagDesc = flags.join(', ');
            if (matchedVague.length > 0) {
              flagDesc += ' ("' + escapeXmlTags_(matchedVague.join(' | ')) + '")';
            }
            lines.push('- Cờ hệ thống: ' + flagDesc);
          }
        } else {
          lines.push('- Trả lời tự điền: *(khách chưa trả lời)*');
        }
      } else if (exportType === 'preread') {
        lines.push('- Ghi chú chuẩn bị: *(câu hỏi trực tiếp – chưa hỏi khách)*');
        if (q.probes && q.probes.length > 0) {
          lines.push('- Gợi ý câu đào sâu gốc: ' + q.probes.join(' | '));
        }
      }

      // Trong Bản đánh giá: đính kèm ghi chú buổi trực tiếp gắn theo mã câu
      if (exportType === 'eval') {
        var qNotes = notesByCode[q.code.toUpperCase()] || [];
        if (qNotes.length > 0) {
          lines.push('- Ghi chú buổi gặp trực tiếp:');
          qNotes.forEach(function (n) {
            var t = String(n.tag || 'RAW').trim().toUpperCase();
            lines.push('  - [' + t + '] ' + escapeXmlTags_(String(n.note || '').trim()));
          });
        }
      }

      lines.push('');
    });
  });

  // Trong Bản đánh giá: bổ sung khối Ghi chú thô / Transcript chưa gắn mã câu
  if (exportType === 'eval' && rawNotes.length > 0) {
    lines.push('## Ghi chú thô / Transcript buổi gặp trực tiếp (chưa phân mã câu)');
    rawNotes.forEach(function (n, idx) {
      lines.push('### Ghi chú thô #' + (idx + 1) + (n.created_at ? ' (' + n.created_at + ')' : ''));
      lines.push(toBlockquote_(n.note));
      lines.push('');
    });
  }
  lines.push('</du_lieu>');
  lines.push('');

  // Checklist nhà tư vấn (chỉ có ý nghĩa ở Bản đánh giá)
  if (exportType === 'eval') {
    lines.push('<checklist_nha_tu_van>');
    var labels = STAGE_CHECKLIST_LABELS[stageNum] || STAGE_CHECKLIST_LABELS[2];
    for (var i = 0; i < 4; i++) {
      var passed = currentReview ? toBool_(currentReview['check_' + (i + 1)]) : false;
      lines.push('- Mục ' + (i + 1) + ' (' + labels[i] + '): ' + (currentReview ? (passed ? 'Đạt' : 'Chưa đạt') : 'Chưa chấm'));
    }
    if (currentReview && String(currentReview.review_note || '').trim()) {
      lines.push('- Nhận xét nhà tư vấn: ' + escapeXmlTags_(String(currentReview.review_note).trim()));
    }
    lines.push('</checklist_nha_tu_van>');
    lines.push('');
  }

  // Lời nhắc nhiệm vụ cho LLM từ Config
  var promptKey = (exportType === 'preread' ? 'prompt_preread_s' : 'prompt_eval_s') + stageNum;
  var promptText = bundle.config[promptKey] || bundle.config['prompt_' + exportType + '_s1'] || '';
  lines.push('<nhiem_vu>');
  lines.push(promptText.trim());
  lines.push('</nhiem_vu>');

  return lines.join('\n');
}

function buildPrereadMarkdown_(clientId, stage, round, options) {
  return buildMarkdownExport_(clientId, stage, round, 'preread', options);
}

function buildEvalMarkdown_(clientId, stage, round, options) {
  return buildMarkdownExport_(clientId, stage, round, 'eval', options);
}
