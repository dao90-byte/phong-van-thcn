/**
 * ExportEngine.gs (v3.1)
 * Động cơ xuất 1-Click tốc độ cao (đọc Sheet tối đa 1 lượt qua snapshot/ctx dùng chung):
 * 1. buildCleanAnswersText_    : Toàn bộ câu trả lời sạch của 1 giai đoạn (dán đẹp vào Notion, Word, Docs, Zalo, AI)
 * 2. buildAllStagesAnswersText_: Tổng hợp xuyên suốt các giai đoạn đã mở hoặc đã có dữ liệu
 * 3. buildPrereadMarkdown_     : Bản đọc trước chuẩn hóa cho AI (kèm câu live & prompt_preread)
 * 4. buildEvalMarkdown_        : Bản đánh giá chuẩn hóa cho AI (kèm LiveNotes, RAW transcript, <tom_tat_gd_truoc>, checklist & prompt_eval)
 * 5. buildZaloMessage_         : Tin nhắn mẫu Zalo 1-click Copy khi mời khách mới hoặc báo mở giai đoạn mới.
 */

function collectClientStageData_(clientId, stage, round, snapshot) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var snap = snapshot || readWorkbookSnapshot_();
  var cid = String(clientId || '').trim();

  var client = snap.clientMap[cid] || null;
  if (!client) throw new Error('Không tìm thấy khách hàng: ' + clientId);

  var bundle = snap.bundle;
  var resolved = resolveClientQuestions_(client, bundle, {
    includeLive: true,
    stageFilter: stageNum
  });

  var allClientResponses = {};
  var stageResponses = {};
  snap.responses.forEach(function (r) {
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

  var notesByCode = {};
  var rawNotes = [];
  snap.liveNotes.forEach(function (n) {
    if (String(n.client_id || '').trim() !== client.client_id) return;
    var nRound = String(n.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
    if (nRound !== roundStr) return;
    if (parseInt(n.stage, 10) !== stageNum) return;
    var code = String(n.code || '').trim().toUpperCase();
    var tag = String(n.tag || '').trim().toUpperCase();
    if (code === 'PREP' || tag === 'PREP') return;
    if (!code || code === 'RAW') {
      rawNotes.push(n);
    } else {
      if (!notesByCode[code]) notesByCode[code] = [];
      notesByCode[code].push(n);
    }
  });

  var currentReview = null;
  var previousReviews = [];
  snap.stageReviews.forEach(function (sr) {
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

  var selfEligible = resolved.questions.filter(function (q) { return q.mode !== 'live'; });
  var doneCount = 0;
  var voiceCount = 0;
  var typeCount = 0;
  var flagCount = 0;
  selfEligible.forEach(function (q) {
    var resp = stageResponses[q.code];
    if (resp && String(resp.answer || '').trim()) {
      doneCount++;
      var mode = String(resp.input_mode || 'go').toLowerCase();
      if (mode === 'noi' || mode === 'hon_hop') voiceCount++;
      else typeCount++;
    }
    if (resp && parsePipeList_(resp.flags).length > 0) {
      flagCount++;
    }
  });

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

  return {
    client: client,
    baseUrl: snap.baseUrl,
    stageNum: stageNum,
    roundStr: roundStr,
    bundle: bundle,
    resolved: resolved,
    allClientResponses: allClientResponses,
    stageResponses: stageResponses,
    notesByCode: notesByCode,
    rawNotes: rawNotes,
    currentReview: currentReview,
    previousReviews: previousReviews,
    selfEligible: selfEligible,
    doneCount: doneCount,
    voiceCount: voiceCount,
    typeCount: typeCount,
    flagCount: flagCount,
    outputOrder: outputOrder,
    byOutput: byOutput
  };
}

function buildCleanAnswersText_(clientId, stage, round, options) {
  var opts = options || {};
  var anonymize = !!opts.anonymize;
  var ctx = opts.ctx || collectClientStageData_(clientId, stage, round, opts.snapshot);
  var client = ctx.client;
  var displayName = anonymize ? client.client_id : (client.name + ' (' + client.client_id + ')');
  var today = new Date().toISOString().slice(0, 10);
  var interpClient = anonymize ? { name: client.client_id, field: client.field } : client;
  var submittedLabel = (ctx.currentReview && String(ctx.currentReview.submitted_at || '').trim())
    ? String(ctx.currentReview.submitted_at).trim().slice(0, 16).replace('T', ' ')
    : 'Chưa bấm nộp (đang nháp)';

  var lines = [];
  lines.push('HỒ SƠ CÂU TRẢ LỜI KHÁCH HÀNG – ' + displayName);
  lines.push('Lĩnh vực: ' + (client.field || 'Chưa rõ') + ' | Nhánh: ' + (ctx.resolved.effectiveBranch || 'Chưa chọn') + ' | Giai đoạn ' + ctx.stageNum + ' (' + ctx.roundStr + ')');
  lines.push('Tiến độ tự điền: ' + ctx.doneCount + '/' + ctx.selfEligible.length + ' câu | Nộp bài: ' + submittedLabel + ' | Xuất ngày: ' + today);
  lines.push('');

  ctx.outputOrder.forEach(function (outName) {
    var exportQs = ctx.byOutput[outName].filter(function (q) {
      if (q.mode !== 'live') return true;
      var lr = ctx.stageResponses[q.code];
      return Boolean(lr && String(lr.answer || '').trim());
    });
    if (exportQs.length === 0) return;

    lines.push('════════════════════════════════════════');
    lines.push('ĐẦU RA: ' + outName.toUpperCase());
    lines.push('════════════════════════════════════════');
    lines.push('');

    exportQs.forEach(function (q) {
      var resp = ctx.stageResponses[q.code];
      var qText = interpolateVars_(q.mode === 'live' ? (q.question_live || q.question_self) : (q.question_self || q.question_live), interpClient);
      lines.push('[' + q.code + ']' + (q.mode === 'live' ? ' (Trực tiếp)' : '') + ' ' + qText);

      if (resp && String(resp.answer || '').trim()) {
        lines.push('Trả lời: ' + String(resp.answer).trim());
        if (String(resp.answer_extra || '').trim()) {
          lines.push('Dẫn chứng bổ sung: ' + String(resp.answer_extra).trim());
        }
        var flags = parsePipeList_(resp.flags);
        var matchedVague = parsePipeList_(resp.matched_vague);
        if (flags.length > 0) {
          lines.push('Lưu ý: ' + flags.join(', ') + (matchedVague.length ? ' ("' + matchedVague.join(' | ') + '")' : ''));
        }
      } else {
        lines.push('Trả lời: (Chưa trả lời)');
      }
      lines.push('');
    });
  });

  var hasCodedNotes = Object.keys(ctx.notesByCode).length > 0;
  if (hasCodedNotes || ctx.rawNotes.length > 0) {
    lines.push('════════════════════════════════════════');
    lines.push('GHI CHÚ BUỔI GẶP TRỰC TIẾP');
    lines.push('════════════════════════════════════════');
    Object.keys(ctx.notesByCode).forEach(function (code) {
      lines.push('[' + code + ']');
      ctx.notesByCode[code].forEach(function (n) {
        lines.push('- [' + String(n.tag || 'RAW').toUpperCase() + '] ' + String(n.note || '').trim());
      });
    });
    ctx.rawNotes.forEach(function (n, idx) {
      lines.push('Ghi chú thô #' + (idx + 1) + ':');
      lines.push(String(n.note || '').trim());
    });
    lines.push('');
  }

  return lines.join('\n').trim();
}

function buildAllStagesAnswersText_(clientId, round, options) {
  var opts = options || {};
  var snap = opts.snapshot || readWorkbookSnapshot_();
  var client = snap.clientMap[String(clientId || '').trim()] || null;
  if (!client) throw new Error('Không tìm thấy khách hàng: ' + clientId);

  var stagesToInclude = client.stages_open.slice();
  if (stagesToInclude.length === 0) stagesToInclude = [1];

  var blocks = [];
  stagesToInclude.forEach(function (s) {
    blocks.push(buildCleanAnswersText_(client.client_id, s, round, {
      anonymize: !!opts.anonymize,
      snapshot: snap
    }));
  });
  return blocks.join('\n\n============================================================\n\n');
}

function buildMarkdownExport_(clientId, stage, round, exportType, options) {
  var opts = options || {};
  var anonymize = !!opts.anonymize;
  var ctx = opts.ctx || collectClientStageData_(clientId, stage, round, opts.snapshot);
  var client = ctx.client;
  var displayName = anonymize ? client.client_id : client.name + ' (' + client.client_id + ')';
  var today = new Date().toISOString().slice(0, 10);
  var submittedLabel = (ctx.currentReview && String(ctx.currentReview.submitted_at || '').trim())
    ? String(ctx.currentReview.submitted_at).trim()
    : 'Chưa bấm nộp (đang nháp)';

  var lines = [];
  lines.push('# HỒ SƠ PHỎNG VẤN – ' + displayName);
  lines.push('- Lĩnh vực: ' + (client.field || 'Chưa rõ') + ' | Nhánh: ' + (ctx.resolved.effectiveBranch || 'Chưa chọn') + ' | Đợt: ' + ctx.roundStr);
  lines.push('- Giai đoạn: ' + ctx.stageNum + ' | Ngày xuất: ' + today);
  lines.push('- Tự điền: ' + ctx.doneCount + '/' + ctx.selfEligible.length + ' câu | Trạng thái nộp: ' + submittedLabel);
  lines.push('- Cách nhập: ' + ctx.voiceCount + ' câu nói thành chữ (có thể còn lỗi nhận dạng giọng nói), ' + ctx.typeCount + ' câu gõ');
  if (anonymize) {
    lines.push('- Lưu ý quyền riêng tư: Đã thay tên khách bằng mã `' + client.client_id + '`. Chuyên gia vui lòng rà thêm link hồ sơ (1.4.1) hoặc tên riêng trong câu trả lời nếu cần ẩn danh tuyệt đối.');
  }
  lines.push('');

  if (ctx.stageNum >= 2) {
    lines.push('<tom_tat_gd_truoc>');
    var hasSummary = false;
    ctx.previousReviews.forEach(function (item) {
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
    var anchorCodes = ['1.1.3', '1.1.5'];
    lines.push('## Dữ kiện neo từ Giai đoạn 1 (để đối chiếu tính khả thi)');
    anchorCodes.forEach(function (ac) {
      var ans = ctx.allClientResponses[ac];
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

  lines.push('<du_lieu>');
  ctx.outputOrder.forEach(function (outName) {
    lines.push('## Đầu ra: ' + outName);
    lines.push('');

    ctx.byOutput[outName].forEach(function (q) {
      var modeLabel = q.mode === 'live' ? 'trực tiếp' : (q.mode === 'hybrid' ? 'nháp + chốt trực tiếp' : 'tự điền');
      var resp = ctx.stageResponses[q.code];
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
      } else if (resp && String(resp.answer || '').trim()) {
        lines.push('- Trả lời phỏng vấn trực tiếp:');
        lines.push(toBlockquote_(resp.answer));
        if (String(resp.answer_extra || '').trim()) {
          lines.push('- Dẫn chứng bổ sung:');
          lines.push(toBlockquote_(resp.answer_extra));
        }
      } else if (exportType === 'preread') {
        lines.push('- Ghi chú chuẩn bị: *(câu hỏi trực tiếp – chưa hỏi khách)*');
        if (q.probes && q.probes.length > 0) {
          lines.push('- Gợi ý câu đào sâu gốc: ' + q.probes.join(' | '));
        }
      }

      if (exportType === 'eval') {
        var qNotes = ctx.notesByCode[q.code.toUpperCase()] || [];
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

  if (exportType === 'eval' && ctx.rawNotes.length > 0) {
    lines.push('## Ghi chú thô / Transcript buổi gặp trực tiếp (chưa phân mã câu)');
    ctx.rawNotes.forEach(function (n, idx) {
      lines.push('### Ghi chú thô #' + (idx + 1) + (n.created_at ? ' (' + n.created_at + ')' : ''));
      lines.push(toBlockquote_(n.note));
      lines.push('');
    });
  }
  lines.push('</du_lieu>');
  lines.push('');

  if (exportType === 'eval') {
    lines.push('<checklist_nha_tu_van>');
    var labels = STAGE_CHECKLIST_LABELS[ctx.stageNum] || STAGE_CHECKLIST_LABELS[2];
    for (var i = 0; i < 4; i++) {
      var passed = ctx.currentReview ? toBool_(ctx.currentReview['check_' + (i + 1)]) : false;
      lines.push('- Mục ' + (i + 1) + ' (' + labels[i] + '): ' + (ctx.currentReview ? (passed ? 'Đạt' : 'Chưa đạt') : 'Chưa chấm'));
    }
    if (ctx.currentReview && String(ctx.currentReview.review_note || '').trim()) {
      lines.push('- Nhận xét chuyên gia: ' + escapeXmlTags_(String(ctx.currentReview.review_note).trim()));
    }
    lines.push('</checklist_nha_tu_van>');
    lines.push('');
  }

  var promptKey = (exportType === 'preread' ? 'prompt_preread_s' : 'prompt_eval_s') + ctx.stageNum;
  var promptText = ctx.bundle.config[promptKey] || ctx.bundle.config['prompt_' + exportType + '_s1'] || '';
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

function buildZaloMessage_(client, kind, nextStage, configMap, preloadedBaseUrl) {
  var cfg = configMap || {};
  var link = buildClientLink_(client.token, preloadedBaseUrl);
  var deadlineLine = client.deadline ? ('Hạn hoàn thành dự kiến: ' + client.deadline + '.\n') : '';

  var tpl = kind === 'next_stage'
    ? (cfg.zalo_next_stage_template || 'Chào anh/chị {name},\n\nPhần chuẩn bị cho Giai đoạn {next_stage} đã được mở sẵn trên đường link cũ:\n{link}\n\nAnh/chị mở lại đường link này để điền tiếp trước buổi làm việc sắp tới nhé!')
    : (cfg.zalo_invite_template || 'Chào anh/chị {name},\n\nGửi anh/chị đường link chuẩn bị dữ kiện trước buổi làm việc xây dựng thương hiệu cá nhân:\n{link}\n\n{deadline_line}Anh/chị có thể điền dần khi rảnh và nên mở bằng Safari/Chrome để dùng giọng nói mượt nhất nhé!');

  return String(tpl)
    .replace(/\{name\}/g, client.name || '')
    .replace(/\{field\}/g, client.field || '')
    .replace(/\{link\}/g, link)
    .replace(/\{deadline_line\}/g, deadlineLine)
    .replace(/\{next_stage\}/g, String(nextStage || 2));
}
