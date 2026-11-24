/**
 * ALL_IN_ONE_Code.gs — Bản gộp 1 file duy nhất (tương đương toàn bộ 12 file trong thư mục gas/).
 * Chỉ cần dán toàn bộ file này vào Code.gs (hoặc Mã.gs) trong Google Apps Script -> bấm Lưu (Cmd+S).
 */

var EMBEDDED_DIALOGS_ = {
  "DialogCreateClient": "<!DOCTYPE html>\n<html>\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; font-size: 13px; color: #1c1917; margin: 0; padding: 14px; background: #faf9f6; }\n    label { display: block; font-weight: 600; margin: 10px 0 4px; color: #292524; }\n    input, select, textarea { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #d6d3d1; border-radius: 6px; font-size: 13px; font-family: inherit; background: #fff; }\n    textarea { min-height: 76px; resize: vertical; }\n    .row { display: flex; gap: 10px; }\n    .row > div { flex: 1; }\n    .btn { margin-top: 14px; padding: 10px 14px; border: none; border-radius: 6px; background: #0f5257; color: #fff; font-weight: 600; cursor: pointer; width: 100%; font-size: 13px; }\n    .btn:disabled { opacity: 0.6; cursor: wait; }\n    .btn-secondary { background: #44403c; margin-top: 8px; }\n    .result { display: none; margin-top: 14px; padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; }\n    .link-box { word-break: break-all; font-family: monospace; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #d1fae5; margin: 6px 0; font-size: 12px; }\n    .warn { color: #b45309; font-size: 12px; margin-top: 6px; }\n    .err { color: #b91c1c; font-size: 12px; margin-top: 8px; }\n  </style>\n</head>\n<body>\n  <div id=\"formWrap\">\n    <div class=\"row\">\n      <div>\n        <label>Tên khách hàng *</label>\n        <input id=\"name\" placeholder=\"VD: Nguyễn Minh Anh\" autofocus>\n      </div>\n      <div>\n        <label>Lĩnh vực chuyên môn</label>\n        <input id=\"field\" placeholder=\"VD: Nha khoa thẩm mỹ\">\n      </div>\n    </div>\n\n    <div class=\"row\">\n      <div>\n        <label>Bộ câu hỏi (Template)</label>\n        <select id=\"template\"></select>\n      </div>\n      <div>\n        <label>Hạn hoàn thành (tuỳ chọn)</label>\n        <input id=\"deadline\" placeholder=\"VD: 28/11/2026\">\n      </div>\n    </div>\n\n    <label>Lời chào riêng (để trống sẽ dùng mẫu mặc định có {name}, {field})</label>\n    <textarea id=\"intro\" placeholder=\"Chào {name}, ...\"></textarea>\n\n    <button id=\"submitBtn\" class=\"btn\" onclick=\"createClient()\">Tạo khách &amp; Sinh mã link</button>\n    <div id=\"errBox\" class=\"err\"></div>\n  </div>\n\n  <div id=\"resultBox\" class=\"result\">\n    <strong>✅ Đã tạo khách <span id=\"resId\"></span></strong>\n    <div style=\"margin-top:4px;font-size:12px;\">Nhánh mặc định: <b id=\"resBranch\"></b></div>\n    <div id=\"resLink\" class=\"link-box\"></div>\n    <button class=\"btn\" onclick=\"copyLink()\">📋 Copy đường link gửi khách</button>\n    <div id=\"noUrlWarn\" class=\"warn\" style=\"display:none;\">\n      ⚠️ Bạn chưa cài đặt URL GitHub Pages. Hãy vào menu <b>⚙️ Tư vấn THCN → Cài đặt URL trang khách</b> để lần sau tự ghép link đầy đủ.\n    </div>\n    <button class=\"btn btn-secondary\" onclick=\"google.script.host.close()\">Đóng</button>\n  </div>\n\n  <script>\n    var createdLink = '';\n    google.script.run.withSuccessHandler(function (data) {\n      var sel = document.getElementById('template');\n      data.templates.forEach(function (t) {\n        var opt = document.createElement('option');\n        opt.value = t.template_id;\n        opt.textContent = t.template_id + ' – ' + t.description;\n        sel.appendChild(opt);\n      });\n    }).adminGetInitData();\n\n    function createClient() {\n      var err = document.getElementById('errBox');\n      err.textContent = '';\n      var btn = document.getElementById('submitBtn');\n      btn.disabled = true;\n      btn.textContent = 'Đang tạo...';\n\n      google.script.run\n        .withSuccessHandler(function (res) {\n          createdLink = res.link;\n          document.getElementById('formWrap').style.display = 'none';\n          document.getElementById('resultBox').style.display = 'block';\n          document.getElementById('resId').textContent = res.client_id;\n          document.getElementById('resBranch').textContent = res.branch || 'Khách tự chọn ở GĐ2';\n          document.getElementById('resLink').textContent = res.link;\n          if (!res.hasBaseUrl) document.getElementById('noUrlWarn').style.display = 'block';\n        })\n        .withFailureHandler(function (e) {\n          btn.disabled = false;\n          btn.textContent = 'Tạo khách & Sinh mã link';\n          err.textContent = e.message || String(e);\n        })\n        .adminCreateClient({\n          name: document.getElementById('name').value,\n          field: document.getElementById('field').value,\n          template: document.getElementById('template').value,\n          deadline: document.getElementById('deadline').value,\n          intro: document.getElementById('intro').value\n        });\n    }\n\n    function copyLink() {\n      navigator.clipboard.writeText(createdLink).then(function () {\n        alert('Đã copy link vào bộ nhớ tạm!');\n      });\n    }\n  </script>\n</body>\n</html>\n",
  "DialogManageStages": "<!DOCTYPE html>\n<html>\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; font-size: 13px; color: #1c1917; margin: 0; padding: 14px; background: #faf9f6; }\n    label.title { display: block; font-weight: 600; margin: 12px 0 6px; }\n    select { width: 100%; padding: 8px; border: 1px solid #d6d3d1; border-radius: 6px; background: #fff; font-size: 13px; }\n    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #fff; padding: 10px; border: 1px solid #e7e5e4; border-radius: 8px; }\n    .chk { display: flex; align-items: center; gap: 6px; font-weight: 500; cursor: pointer; }\n    .btn { margin-top: 14px; padding: 10px 14px; border: none; border-radius: 6px; background: #0f5257; color: #fff; font-weight: 600; cursor: pointer; width: 100%; }\n    .btn:disabled { opacity: 0.6; }\n    .note { font-size: 12px; color: #57534e; margin-top: 4px; }\n    .msg { margin-top: 10px; font-size: 12px; color: #047857; font-weight: 600; }\n    .err { margin-top: 10px; font-size: 12px; color: #b91c1c; }\n  </style>\n</head>\n<body>\n  <label class=\"title\">Chọn khách hàng</label>\n  <select id=\"clientSelect\" onchange=\"renderClient()\"></select>\n\n  <label class=\"title\">Giai đoạn ĐƯỢC MỞ (khách nhìn thấy trên link)</label>\n  <div class=\"grid\">\n    <label class=\"chk\"><input type=\"checkbox\" id=\"open1\" value=\"1\"> Giai đoạn 1 (Discovery)</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"open2\" value=\"2\"> Giai đoạn 2 (Định vị)</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"open3\" value=\"3\"> Giai đoạn 3 (Nội dung)</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"open4\" value=\"4\"> Giai đoạn 4 (Đo lường)</label>\n  </div>\n\n  <label class=\"title\">Giai đoạn ĐÃ KHÓA (chỉ xem lại, không cho sửa)</label>\n  <div class=\"grid\">\n    <label class=\"chk\"><input type=\"checkbox\" id=\"lock1\" value=\"1\"> Khóa GĐ 1</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"lock2\" value=\"2\"> Khóa GĐ 2</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"lock3\" value=\"3\"> Khóa GĐ 3</label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"lock4\" value=\"4\"> Khóa GĐ 4</label>\n  </div>\n  <div class=\"note\">Mẹo: Khi mở GĐ2, nên tích \"Khóa GĐ 1\" để bảo toàn dữ liệu GĐ1 đã nghiệm thu.</div>\n\n  <div style=\"display:flex; gap:10px;\">\n    <div style=\"flex:1;\">\n      <label class=\"title\">Nhánh kinh doanh</label>\n      <select id=\"branchSelect\">\n        <option value=\"\">(Trống – khách tự chọn)</option>\n        <option value=\"A\">Nhánh A (Đã có KD)</option>\n        <option value=\"B\">Nhánh B (Chưa có KD)</option>\n      </select>\n    </div>\n    <div style=\"flex:1;\">\n      <label class=\"title\">Trạng thái link</label>\n      <select id=\"statusSelect\">\n        <option value=\"active\">Đang mở (active)</option>\n        <option value=\"closed\">Đã đóng link (closed)</option>\n      </select>\n    </div>\n  </div>\n\n  <button id=\"saveBtn\" class=\"btn\" onclick=\"saveChanges()\">Lưu cấu hình giai đoạn</button>\n  <div id=\"msgBox\" class=\"msg\"></div>\n  <div id=\"errBox\" class=\"err\"></div>\n\n  <script>\n    var clientsMap = {};\n    google.script.run.withSuccessHandler(function (data) {\n      var sel = document.getElementById('clientSelect');\n      data.clients.forEach(function (c) {\n        clientsMap[c.client_id] = c;\n        var opt = document.createElement('option');\n        opt.value = c.client_id;\n        opt.textContent = c.client_id + ' – ' + c.name + ' (' + (c.status === 'closed' ? 'đã đóng' : 'mở GĐ ' + c.stages_open.join(',')) + ')';\n        sel.appendChild(opt);\n      });\n      renderClient();\n    }).adminGetInitData();\n\n    function renderClient() {\n      var cid = document.getElementById('clientSelect').value;\n      var c = clientsMap[cid];\n      if (!c) return;\n      [1, 2, 3, 4].forEach(function (s) {\n        document.getElementById('open' + s).checked = c.stages_open.indexOf(s) !== -1;\n        document.getElementById('lock' + s).checked = c.stages_locked.indexOf(s) !== -1;\n      });\n      document.getElementById('branchSelect').value = c.branch || '';\n      document.getElementById('statusSelect').value = c.status || 'active';\n      document.getElementById('msgBox').textContent = '';\n      document.getElementById('errBox').textContent = '';\n    }\n\n    function saveChanges() {\n      var cid = document.getElementById('clientSelect').value;\n      if (!cid) return;\n      var openArr = [1, 2, 3, 4].filter(function (s) { return document.getElementById('open' + s).checked; });\n      var lockArr = [1, 2, 3, 4].filter(function (s) { return document.getElementById('lock' + s).checked; });\n      var btn = document.getElementById('saveBtn');\n      btn.disabled = true;\n      btn.textContent = 'Đang lưu...';\n\n      google.script.run\n        .withSuccessHandler(function (res) {\n          btn.disabled = false;\n          btn.textContent = 'Lưu cấu hình giai đoạn';\n          clientsMap[cid].stages_open = openArr;\n          clientsMap[cid].stages_locked = lockArr;\n          clientsMap[cid].branch = res.branch;\n          clientsMap[cid].status = res.status;\n          document.getElementById('msgBox').textContent = '✅ Đã cập nhật! Mở: [' + (res.stages_open || 'trống') + '] | Khóa: [' + (res.stages_locked || 'trống') + ']';\n        })\n        .withFailureHandler(function (e) {\n          btn.disabled = false;\n          btn.textContent = 'Lưu cấu hình giai đoạn';\n          document.getElementById('errBox').textContent = e.message || String(e);\n        })\n        .adminUpdateClientStages({\n          client_id: cid,\n          stages_open: openArr,\n          stages_locked: lockArr,\n          branch: document.getElementById('branchSelect').value,\n          status: document.getElementById('statusSelect').value\n        });\n    }\n  </script>\n</body>\n</html>\n",
  "DialogLiveNotes": "<!DOCTYPE html>\n<html>\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; font-size: 13px; color: #1c1917; margin: 0; padding: 14px; background: #faf9f6; }\n    .row { display: flex; gap: 8px; }\n    .row > div { flex: 1; }\n    label { display: block; font-weight: 600; margin: 10px 0 4px; }\n    select, input, textarea { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #d6d3d1; border-radius: 6px; background: #fff; font-size: 13px; font-family: inherit; }\n    textarea { min-height: 150px; resize: vertical; line-height: 1.5; }\n    .tabs { display: flex; gap: 6px; margin-top: 10px; }\n    .tab-btn { flex: 1; padding: 8px; border: 1px solid #d6d3d1; border-radius: 6px; background: #fff; cursor: pointer; font-weight: 600; font-size: 12px; }\n    .tab-btn.active { background: #0f5257; color: #fff; border-color: #0f5257; }\n    .btn { margin-top: 12px; padding: 10px; border: none; border-radius: 6px; background: #0f5257; color: #fff; font-weight: 600; cursor: pointer; width: 100%; }\n    .hint { font-size: 12px; color: #57534e; margin: 4px 0 6px; }\n    .existing { margin-top: 14px; background: #fff; border: 1px solid #e7e5e4; border-radius: 6px; padding: 10px; max-height: 140px; overflow-y: auto; font-size: 12px; }\n    .msg { color: #047857; font-weight: 600; margin-top: 8px; font-size: 12px; }\n  </style>\n</head>\n<body>\n  <div class=\"row\">\n    <div style=\"flex:2;\">\n      <label>Khách hàng</label>\n      <select id=\"clientSelect\" onchange=\"loadExisting()\"></select>\n    </div>\n    <div>\n      <label>Giai đoạn</label>\n      <select id=\"stageSelect\" onchange=\"onStageChange()\">\n        <option value=\"1\">Giai đoạn 1</option>\n        <option value=\"2\">Giai đoạn 2</option>\n        <option value=\"3\">Giai đoạn 3</option>\n        <option value=\"4\">Giai đoạn 4</option>\n      </select>\n    </div>\n    <div>\n      <label>Đợt (round)</label>\n      <input id=\"roundInput\" value=\"R1\" onchange=\"loadExisting()\">\n    </div>\n  </div>\n\n  <div class=\"tabs\">\n    <button id=\"tabRaw\" class=\"tab-btn active\" onclick=\"setMode('raw')\">📄 Ghi chú tự do / Dán Transcript (RAW)</button>\n    <button id=\"tabCoded\" class=\"tab-btn\" onclick=\"setMode('coded')\">🏷️ Gắn theo mã câu (f: / a: / g:)</button>\n  </div>\n\n  <div id=\"codeWrap\" style=\"display:none;\">\n    <label>Chọn mã câu hỏi</label>\n    <select id=\"codeSelect\"></select>\n  </div>\n\n  <label>Nội dung buổi trực tiếp</label>\n  <div id=\"modeHint\" class=\"hint\">Dán thẳng ghi chú thô hoặc transcript buổi họp. LLM sẽ tự ánh xạ về mã câu và gắn thẻ [F]/[A]/[G] khi xuất Bản đánh giá.</div>\n  <textarea id=\"noteText\" placeholder=\"Nhập hoặc dán ghi chú...\"></textarea>\n\n  <button id=\"saveBtn\" class=\"btn\" onclick=\"saveNotes()\">💾 Lưu ghi chú vào LiveNotes</button>\n  <div id=\"msgBox\" class=\"msg\"></div>\n\n  <div class=\"existing\">\n    <strong>Ghi chú đã lưu cho giai đoạn này:</strong>\n    <div id=\"existingList\" style=\"margin-top:6px;color:#57534e;\">Đang tải...</div>\n  </div>\n\n  <script>\n    var allQuestions = [];\n    var currentMode = 'raw';\n\n    google.script.run.withSuccessHandler(function (data) {\n      allQuestions = data.questions;\n      var sel = document.getElementById('clientSelect');\n      data.clients.forEach(function (c) {\n        var opt = document.createElement('option');\n        opt.value = c.client_id;\n        opt.textContent = c.client_id + ' – ' + c.name;\n        sel.appendChild(opt);\n      });\n      onStageChange();\n    }).adminGetInitData();\n\n    function setMode(m) {\n      currentMode = m;\n      document.getElementById('tabRaw').className = 'tab-btn' + (m === 'raw' ? ' active' : '');\n      document.getElementById('tabCoded').className = 'tab-btn' + (m === 'coded' ? ' active' : '');\n      document.getElementById('codeWrap').style.display = m === 'coded' ? 'block' : 'none';\n      document.getElementById('modeHint').textContent = m === 'raw'\n        ? 'Dán thẳng ghi chú thô hoặc transcript buổi họp. LLM sẽ tự ánh xạ về mã câu và gắn thẻ [F]/[A]/[G] khi xuất Bản đánh giá.'\n        : 'Mỗi dòng 1 ý. Có thể gõ đầu dòng f: (Sự thật), a: (Giả định), g: (Mục tiêu). Ví dụ: \"f: Đã từ chối hợp đồng 200tr vì lệch giá trị\".';\n    }\n\n    function onStageChange() {\n      var s = parseInt(document.getElementById('stageSelect').value, 10);\n      var sel = document.getElementById('codeSelect');\n      sel.innerHTML = '';\n      allQuestions.filter(function (q) { return q.stage === s; }).forEach(function (q) {\n        var opt = document.createElement('option');\n        opt.value = q.code;\n        opt.textContent = '[' + q.mode + '] ' + q.label;\n        sel.appendChild(opt);\n      });\n      loadExisting();\n    }\n\n    function loadExisting() {\n      var cid = document.getElementById('clientSelect').value;\n      if (!cid) return;\n      google.script.run.withSuccessHandler(function (notes) {\n        var box = document.getElementById('existingList');\n        if (!notes.length) {\n          box.textContent = '(Chưa có ghi chú nào)';\n          return;\n        }\n        box.innerHTML = notes.map(function (n) {\n          var preview = n.note.length > 140 ? n.note.slice(0, 140) + '…' : n.note;\n          return '<div style=\"margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed #e7e5e4;\">' +\n            '<b>[' + n.code + ' / ' + n.tag + ']</b> ' + escapeHtml(preview) + '</div>';\n        }).join('');\n      }).adminGetLiveNotes(cid, document.getElementById('stageSelect').value, document.getElementById('roundInput').value);\n    }\n\n    function saveNotes() {\n      var btn = document.getElementById('saveBtn');\n      btn.disabled = true;\n      btn.textContent = 'Đang lưu...';\n      document.getElementById('msgBox').textContent = '';\n\n      google.script.run\n        .withSuccessHandler(function (res) {\n          btn.disabled = false;\n          btn.textContent = '💾 Lưu ghi chú vào LiveNotes';\n          document.getElementById('noteText').value = '';\n          document.getElementById('msgBox').textContent = '✅ Đã lưu ' + res.added + ' mục ghi chú.';\n          loadExisting();\n        })\n        .withFailureHandler(function (e) {\n          btn.disabled = false;\n          btn.textContent = '💾 Lưu ghi chú vào LiveNotes';\n          alert(e.message || String(e));\n        })\n        .adminSaveLiveNotes({\n          client_id: document.getElementById('clientSelect').value,\n          stage: document.getElementById('stageSelect').value,\n          round: document.getElementById('roundInput').value,\n          mode: currentMode,\n          code: currentMode === 'raw' ? 'RAW' : document.getElementById('codeSelect').value,\n          text: document.getElementById('noteText').value\n        });\n    }\n\n    function escapeHtml(s) {\n      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n    }\n  </script>\n</body>\n</html>\n",
  "DialogExport": "<!DOCTYPE html>\n<html>\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; font-size: 13px; color: #1c1917; margin: 0; padding: 14px; background: #faf9f6; }\n    .row { display: flex; gap: 8px; align-items: end; }\n    .row > div { flex: 1; }\n    label { display: block; font-weight: 600; margin: 8px 0 4px; }\n    select, input { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #d6d3d1; border-radius: 6px; background: #fff; font-size: 13px; }\n    .chk-row { display: flex; align-items: center; gap: 8px; margin: 10px 0; font-size: 12px; color: #44403c; }\n    .chk-row input { width: auto; }\n    textarea { width: 100%; box-sizing: border-box; height: 340px; padding: 10px; border: 1px solid #d6d3d1; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: #fff; line-height: 1.45; }\n    .actions { display: flex; gap: 8px; margin-top: 10px; }\n    .btn { flex: 1; padding: 10px 14px; border: none; border-radius: 6px; background: #0f5257; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px; }\n    .btn-copy { background: #1c1917; }\n    .btn:disabled { opacity: 0.6; }\n    .meta { font-size: 12px; color: #57534e; margin: 6px 0; }\n  </style>\n</head>\n<body>\n  <div class=\"row\">\n    <div style=\"flex:2;\">\n      <label>Khách hàng</label>\n      <select id=\"clientSelect\"></select>\n    </div>\n    <div>\n      <label>Giai đoạn</label>\n      <select id=\"stageSelect\">\n        <option value=\"1\">Giai đoạn 1</option>\n        <option value=\"2\">Giai đoạn 2</option>\n        <option value=\"3\">Giai đoạn 3</option>\n        <option value=\"4\">Giai đoạn 4</option>\n      </select>\n    </div>\n    <div>\n      <label>Đợt (round)</label>\n      <input id=\"roundInput\" value=\"R1\">\n    </div>\n  </div>\n\n  <label class=\"chk-row\">\n    <input type=\"checkbox\" id=\"anonChk\">\n    <span>Ẩn tên khách (thay bằng mã client_id – nhớ tự rà thêm link 1.4.1 nếu cần ẩn danh tuyệt đối)</span>\n  </label>\n\n  <div class=\"actions\" style=\"margin-top:0;margin-bottom:8px;\">\n    <button id=\"genBtn\" class=\"btn\" onclick=\"generate()\">⚡ Dựng bản Markdown</button>\n    <button id=\"copyBtn\" class=\"btn btn-copy\" onclick=\"copyOutput()\" disabled>📋 Copy 1-click để dán LLM</button>\n  </div>\n\n  <div id=\"metaBox\" class=\"meta\">Chọn khách và bấm \"Dựng bản Markdown\".</div>\n  <textarea id=\"output\" readonly placeholder=\"Nội dung Markdown tổng hợp sẽ xuất hiện ở đây...\"></textarea>\n\n  <script>\n    var EXPORT_TYPE = '<?= exportType ?>';\n\n    google.script.run.withSuccessHandler(function (data) {\n      var sel = document.getElementById('clientSelect');\n      data.clients.forEach(function (c) {\n        var opt = document.createElement('option');\n        opt.value = c.client_id;\n        opt.textContent = c.client_id + ' – ' + c.name + ' (' + c.field + ')';\n        sel.appendChild(opt);\n      });\n    }).adminGetInitData();\n\n    function generate() {\n      var cid = document.getElementById('clientSelect').value;\n      if (!cid) return;\n      var genBtn = document.getElementById('genBtn');\n      genBtn.disabled = true;\n      genBtn.textContent = 'Đang dựng...';\n      document.getElementById('metaBox').textContent = 'Đang gom dữ liệu từ Sheet...';\n\n      google.script.run\n        .withSuccessHandler(function (res) {\n          genBtn.disabled = false;\n          genBtn.textContent = '⚡ Dựng bản Markdown';\n          document.getElementById('output').value = res.markdown;\n          document.getElementById('copyBtn').disabled = false;\n          document.getElementById('metaBox').textContent = '✅ Sẵn sàng (' + res.charCount.toLocaleString() + ' ký tự). Bấm Copy rồi dán thẳng vào ChatGPT / Claude / Gemini.';\n        })\n        .withFailureHandler(function (e) {\n          genBtn.disabled = false;\n          genBtn.textContent = '⚡ Dựng bản Markdown';\n          document.getElementById('metaBox').textContent = '❌ Lỗi: ' + (e.message || String(e));\n        })\n        .adminGenerateExport({\n          client_id: cid,\n          stage: document.getElementById('stageSelect').value,\n          round: document.getElementById('roundInput').value,\n          export_type: EXPORT_TYPE,\n          anonymize: document.getElementById('anonChk').checked\n        });\n    }\n\n    function copyOutput() {\n      var text = document.getElementById('output').value;\n      if (!text) return;\n      navigator.clipboard.writeText(text).then(function () {\n        var btn = document.getElementById('copyBtn');\n        btn.textContent = '✅ Đã copy! Dán vào LLM ngay';\n        setTimeout(function () { btn.textContent = '📋 Copy 1-click để dán LLM'; }, 2500);\n      });\n    }\n  </script>\n</body>\n</html>\n",
  "DialogStageSummary": "<!DOCTYPE html>\n<html>\n<head>\n  <base target=\"_top\">\n  <meta charset=\"utf-8\">\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif; font-size: 13px; color: #1c1917; margin: 0; padding: 14px; background: #faf9f6; }\n    .row { display: flex; gap: 8px; }\n    .row > div { flex: 1; }\n    label.title { display: block; font-weight: 600; margin: 10px 0 4px; }\n    select, input, textarea { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #d6d3d1; border-radius: 6px; background: #fff; font-size: 13px; font-family: inherit; }\n    .chk-box { background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px; }\n    .chk { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; cursor: pointer; line-height: 1.4; }\n    .chk input { width: auto; margin-top: 2px; }\n    textarea { min-height: 110px; resize: vertical; }\n    .btn { margin-top: 12px; padding: 10px; border: none; border-radius: 6px; background: #0f5257; color: #fff; font-weight: 600; cursor: pointer; width: 100%; }\n    .msg { margin-top: 8px; font-size: 12px; color: #047857; font-weight: 600; }\n    .sub-badge { font-size: 12px; color: #57534e; margin-top: 6px; }\n  </style>\n</head>\n<body>\n  <div class=\"row\">\n    <div style=\"flex:2;\">\n      <label class=\"title\">Khách hàng</label>\n      <select id=\"clientSelect\" onchange=\"loadReview()\"></select>\n    </div>\n    <div>\n      <label class=\"title\">Giai đoạn</label>\n      <select id=\"stageSelect\" onchange=\"loadReview()\">\n        <option value=\"1\">Giai đoạn 1</option>\n        <option value=\"2\">Giai đoạn 2</option>\n        <option value=\"3\">Giai đoạn 3</option>\n        <option value=\"4\">Giai đoạn 4</option>\n      </select>\n    </div>\n    <div>\n      <label class=\"title\">Đợt</label>\n      <input id=\"roundInput\" value=\"R1\" onchange=\"loadReview()\">\n    </div>\n  </div>\n  <div id=\"submittedInfo\" class=\"sub-badge\"></div>\n\n  <label class=\"title\">4 mục nghiệm thu giai đoạn</label>\n  <div class=\"chk-box\">\n    <label class=\"chk\"><input type=\"checkbox\" id=\"c1\"><span id=\"l1\"></span></label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"c2\"><span id=\"l2\"></span></label>\n    <label class=\"chk\"><input type=\"checkbox\" id=\"c3\"><span id=\"l3\"></span></label>\n    <label class=\"chk\" style=\"margin-bottom:0;\"><input type=\"checkbox\" id=\"c4\"><span id=\"l4\"></span></label>\n  </div>\n\n  <label class=\"title\">Nhận xét của nhà tư vấn</label>\n  <textarea id=\"reviewNote\" style=\"min-height:60px;\" placeholder=\"Ghi nhận điểm chưa đạt hoặc cần làm rõ thêm...\"></textarea>\n\n  <label class=\"title\">Tóm tắt chốt giai đoạn (approved_summary – tự động đính kèm sang GĐ sau)</label>\n  <textarea id=\"approvedSummary\" placeholder=\"Dán khối TÓM TẮT CHỐT GĐ1/GĐ2 (8–10 gạch đầu dòng) từ LLM sau khi bạn đã kiểm duyệt...\"></textarea>\n\n  <button id=\"saveBtn\" class=\"btn\" onclick=\"saveReview()\">💾 Lưu nghiệm thu &amp; Tóm tắt</button>\n  <div id=\"msgBox\" class=\"msg\"></div>\n\n  <script>\n    var checklistLabels = {};\n    google.script.run.withSuccessHandler(function (data) {\n      checklistLabels = data.checklistLabels;\n      var sel = document.getElementById('clientSelect');\n      data.clients.forEach(function (c) {\n        var opt = document.createElement('option');\n        opt.value = c.client_id;\n        opt.textContent = c.client_id + ' – ' + c.name;\n        sel.appendChild(opt);\n      });\n      loadReview();\n    }).adminGetInitData();\n\n    function loadReview() {\n      var cid = document.getElementById('clientSelect').value;\n      var stage = document.getElementById('stageSelect').value;\n      var labels = checklistLabels[stage] || checklistLabels['2'] || [];\n      for (var i = 0; i < 4; i++) {\n        document.getElementById('l' + (i + 1)).textContent = 'Mục ' + (i + 1) + ': ' + (labels[i] || '');\n      }\n      if (!cid) return;\n      document.getElementById('msgBox').textContent = '';\n\n      google.script.run.withSuccessHandler(function (r) {\n        document.getElementById('submittedInfo').textContent = r.submitted_at\n          ? '✅ Khách đã bấm nộp bài lúc: ' + r.submitted_at\n          : '⏳ Khách chưa bấm nút Hoàn tất nộp bài cho giai đoạn này.';\n        document.getElementById('c1').checked = !!r.check_1;\n        document.getElementById('c2').checked = !!r.check_2;\n        document.getElementById('c3').checked = !!r.check_3;\n        document.getElementById('c4').checked = !!r.check_4;\n        document.getElementById('reviewNote').value = r.review_note || '';\n        document.getElementById('approvedSummary').value = r.approved_summary || '';\n      }).adminGetStageReview(cid, stage, document.getElementById('roundInput').value);\n    }\n\n    function saveReview() {\n      var btn = document.getElementById('saveBtn');\n      btn.disabled = true;\n      btn.textContent = 'Đang lưu...';\n      google.script.run\n        .withSuccessHandler(function () {\n          btn.disabled = false;\n          btn.textContent = '💾 Lưu nghiệm thu & Tóm tắt';\n          document.getElementById('msgBox').textContent = '✅ Đã lưu vào StageReviews! Tóm tắt này sẽ tự động nối vào bản xuất của giai đoạn sau.';\n        })\n        .withFailureHandler(function (e) {\n          btn.disabled = false;\n          btn.textContent = '💾 Lưu nghiệm thu & Tóm tắt';\n          alert(e.message || String(e));\n        })\n        .adminSaveStageReview({\n          client_id: document.getElementById('clientSelect').value,\n          stage: document.getElementById('stageSelect').value,\n          round: document.getElementById('roundInput').value,\n          check_1: document.getElementById('c1').checked,\n          check_2: document.getElementById('c2').checked,\n          check_3: document.getElementById('c3').checked,\n          check_4: document.getElementById('c4').checked,\n          review_note: document.getElementById('reviewNote').value,\n          approved_summary: document.getElementById('approvedSummary').value\n        });\n    }\n  </script>\n</body>\n</html>\n"
};

// ==================== Config.gs ====================
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

// ==================== SeedData.gs ====================
/**
 * SeedData.gs
 * Dữ liệu chuẩn theo biểu mẫu MECE 4 giai đoạn (đầy đủ 26 câu GĐ1-2 + 13 câu GĐ3-4 sẵn sàng mở rộng),
 * 3 bộ Template, và các tham số/prompt đánh giá chuẩn trong tab Config.
 */

function getSeedQuestions_() {
  return [
    // ==================== GIAI ĐOẠN 1 (15 câu: 6 live, 4 hybrid, 5 self) ====================
    {
      code: '1.1.1', stage: 1, group: '1.1', order: 1, active: true,
      mode: 'live', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Sự kiện hoặc bước ngoặt nào khiến bạn quyết định phải xây dựng thương hiệu cá nhân ngay lúc này mà không phải 6 tháng nữa?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Đo lường mức độ cấp bách (Urgency) và nỗi đau thực sự đằng sau quyết định thuê tư vấn.',
      probes: 'Có phải gần đây bạn vừa mất một cơ hội lớn vào tay một người kém chuyên môn hơn nhưng nổi tiếng hơn không?|Nếu trì hoãn thêm 6 tháng, điều tệ nhất gì sẽ xảy ra?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.1.2', stage: 1, group: '1.1', order: 2, active: true,
      mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Nếu không làm thương hiệu cá nhân trong 1 năm tới, công việc/doanh nghiệp của bạn sẽ mất đi cơ hội cụ thể nào?',
      question_self: 'Nếu trong 12 tháng tới bạn vẫn giữ nguyên cách làm hiện tại (chưa xây thương hiệu cá nhân trong lĩnh vực {field}), công việc hoặc doanh nghiệp của bạn có thể bỏ lỡ những cơ hội cụ thể nào?',
      self_hint: 'Hãy ước lượng cụ thể bằng con số nếu có: khoảng doanh thu bị bỏ lỡ, số lượng khách hàng mới/tháng, cơ hội hợp tác hoặc vị thế cạnh tranh.',
      hidden_goal: 'Chuyển hóa mong muốn mơ hồ thành "chi phí cơ hội" đo lường được.',
      probes: 'Bạn có thể ước tính khoảng doanh thu hoặc số lượng khách hàng bị bỏ lỡ nếu chỉ dựa vào kênh truyền thống hiện tại?',
      min_words: 20, check_vague: true
    },
    {
      code: '1.1.3', stage: 1, group: '1.1', order: 3, active: true,
      mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Sau 6–12 tháng, kết quả cụ thể nào sẽ khiến bạn khẳng định việc đầu tư này thành công?',
      question_self: 'Sau 6–12 tháng tới, kết quả cụ thể nào sẽ khiến {name} khẳng định việc đầu tư xây dựng thương hiệu cá nhân lần này là thành công?',
      self_hint: 'Gợi ý: nêu con số mục tiêu rõ ràng (số khách hàng, mức doanh thu, lời mời hợp tác hoặc mức độ nhận diện). Ở buổi gặp trực tiếp, chúng ta sẽ cùng chốt 1 ưu tiên số 1.',
      hidden_goal: 'Chốt KPI kỳ vọng (Nhận diện vs. Uy tín vs. Doanh thu) để tránh lệch pha nghiệm thu.',
      probes: 'Nếu chỉ được chọn MỘT trong ba: nhiều người biết tới, được đồng nghiệp nể trọng, hay có thêm khách hàng trả tiền cao — bạn chọn cái nào?',
      min_words: 15, check_vague: true
    },
    {
      code: '1.1.4', stage: 1, group: '1.1', order: 4, active: true,
      mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Có điều gì bạn tuyệt đối không muốn đánh đổi để đổi lấy sự nổi tiếng hoặc lượng tương tác?',
      question_self: 'Có ranh giới, chủ đề đời tư hoặc kiểu xuất hiện nào bạn tuyệt đối KHÔNG muốn đánh đổi để đổi lấy tương tác hay sự nổi tiếng?',
      self_hint: 'Ví dụ: không lộ mặt gia đình/con cái, không tranh luận drama ngành, ngại quay video lộ mặt, hoặc nguyên tắc bảo mật tên khách hàng.',
      hidden_goal: 'Xác định vùng an toàn tâm lý và ranh giới đạo đức/đời tư của client.',
      probes: 'Bạn có ngại xuất hiện trước ống kính không?|Bạn phản ứng thế nào nếu có bình luận trái chiều hoặc công kích cá nhân?',
      min_words: 15, check_vague: false
    },
    {
      code: '1.1.5', stage: 1, group: '1.1', order: 5, active: true,
      mode: 'self', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Mỗi tuần bạn có thể cam kết chính xác bao nhiêu giờ trực tiếp cho việc chia sẻ chất liệu/ghi hình, và đội ngũ hỗ trợ hiện có là gì?',
      question_self: 'Mỗi tuần (tính cả những tuần bận rộn nhất trong 3 tháng qua), bạn có thể dành chắc chắn bao nhiêu giờ cho việc chia sẻ chất liệu/ghi hình, và hiện có ai hỗ trợ bạn (trợ lý, viết bài, quay dựng...)?',
      self_hint: 'Chỉ cần trả lời thật sát lịch làm việc thực tế, ví dụ: "3 giờ/tuần vào sáng thứ 7; hiện làm một mình và có 1 bạn thiết kế freelance".',
      hidden_goal: 'Đánh giá tính khả thi vận hành (Operational Feasibility) để chọn định dạng nội dung vừa sức.',
      probes: 'Trong 3 tháng qua, tuần bận rộn nhất của bạn diễn ra như thế nào? Lúc đó bạn có giữ được lịch trình này không?',
      min_words: 8, check_vague: false
    },
    {
      code: '1.2.1', stage: 1, group: '1.2', order: 6, active: true,
      mode: 'live', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Trong suốt quá trình làm nghề, vấn đề hóc búa nào bạn giải quyết tốt hơn phần lớn đồng nghiệp cùng lĩnh vực?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Tìm ra "Vũ khí sắc bén nhất" (Unfair Advantage) thay vì liệt kê kỹ năng chung chung.',
      probes: 'Tại sao người khác thường bó tay hoặc làm hỏng ở bước đó, còn bạn thì xử lý được?|Bí quyết nằm ở công cụ, quy trình hay kinh nghiệm xương máu nào?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.2.2', stage: 1, group: '1.2', order: 7, active: true,
      mode: 'self', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Khi người quen hoặc đồng nghiệp gặp khó khăn, họ thường tìm đến bạn để nhờ tư vấn hoặc "cứu nguy" về việc gì nhất?',
      question_self: 'Khi người quen, khách hàng hoặc đồng nghiệp gặp rắc rối, họ hay tìm đến {name} để nhờ gỡ rối việc gì nhất? Hãy trích dẫn 1–2 tin nhắn/cuộc gọi gần nhất.',
      self_hint: 'Mẹo hay nhất: mở Zalo/Messenger, copy-paste nguyên văn 1–2 câu hỏi gần đây người khác nhắn nhờ bạn. Nếu dài, bạn chỉ cần ghi tóm tắt 1 dòng rồi gửi ảnh chụp màn hình qua Zalo cho nhà tư vấn.',
      hidden_goal: 'Khai thác định vị tự nhiên mà thị trường đang ngầm công nhận.',
      probes: 'Hãy kể lại cuộc gọi hoặc tin nhắn gần nhất mà ai đó nhờ bạn gỡ rối. Họ đã hỏi chính xác câu gì?',
      min_words: 15, check_vague: false
    },
    {
      code: '1.2.3', stage: 1, group: '1.2', order: 8, active: true,
      mode: 'live', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Đâu là thất bại hoặc sai lầm nghề nghiệp lớn nhất từng buộc bạn phải thay đổi hoàn toàn cách tư duy/làm việc?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Khai thác chất liệu câu chuyện chân thực (Authenticity) và chiều sâu bài học nghề nghiệp.',
      probes: 'Cái giá phải trả lúc đó là gì?|Sau cú ngã đó, nguyên tắc làm việc của bạn đã thay đổi khác đi như thế nào?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.2.4', stage: 1, group: '1.2', order: 9, active: true,
      mode: 'live', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Có giá trị hay nguyên tắc làm nghề nào bạn sẵn sàng từ chối khách hàng/cơ hội lớn nếu bị vi phạm?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Xác định "Xương sống giá trị" để tạo sự khác biệt và thu hút đúng tệp khách hàng đồng điệu.',
      probes: 'Bạn đã từng từ chối một hợp đồng/khách hàng nào vì lý do này chưa? Kể lại tình huống đó.',
      min_words: 0, check_vague: false
    },
    {
      code: '1.3.1', stage: 1, group: '1.3', order: 10, active: true,
      mode: 'self', branch: '', output: 'Kho bằng chứng thô',
      question_live: 'Bạn đã tạo ra những kết quả đo lường được nào cho bản thân, tổ chức hoặc khách hàng?',
      question_self: 'Liệt kê 3–5 kết quả đo lường được rõ nhất mà bạn đã tạo ra cho bản thân, tổ chức hoặc khách hàng trong lĩnh vực {field}.',
      self_hint: 'Càng có con số Trước -> Sau (%, doanh thu, chi phí tiết kiệm, thời gian rút ngắn...) càng tốt. Bạn có thể dán kèm link tài liệu/Drive hoặc ghi chú "(có ảnh báo cáo gửi Zalo)".',
      hidden_goal: 'Thu thập dữ liệu định lượng cứng (Hard Proof) để làm đòn bẩy niềm tin.',
      probes: 'Con số trước và sau khi có sự tham gia của bạn thay đổi cụ thể bao nhiêu % hoặc bao nhiêu tiền?|Có tài liệu, ảnh chụp hay báo cáo nào lưu lại không?',
      min_words: 15, check_vague: true
    },
    {
      code: '1.3.2', stage: 1, group: '1.3', order: 11, active: true,
      mode: 'hybrid', branch: '', output: 'Kho bằng chứng thô',
      question_live: 'Hãy kể 2–3 trường hợp khách hàng/dự án tiêu biểu nhất theo mạch: Bế tắc -> Giải pháp -> Thay đổi.',
      question_self: 'Hãy tóm tắt 2–3 khách hàng hoặc dự án tiêu biểu nhất bạn từng xử lý theo đúng khung 3 bước:\n1) Bế tắc ban đầu của họ\n2) Giải pháp bạn đã làm\n3) Kết quả thay đổi sau đó.',
      self_hint: 'Không cần viết văn hoa; chỉ cần gạch đầu dòng rõ tình huống thật (có thể ẩn tên khách thành "Khách A - ngành X"). Buổi gặp trực tiếp ta sẽ chọn 1 ca mạnh nhất để đào sâu.',
      hidden_goal: 'Xây dựng kho Case Study 3C chuẩn mực.',
      probes: 'Khách hàng đó đã từng thử cách nào khác trước khi tìm đến bạn mà không hiệu quả?|Điều gì khiến họ bất ngờ nhất trong quá trình làm việc với bạn?',
      min_words: 40, check_vague: true
    },
    {
      code: '1.3.3', stage: 1, group: '1.3', order: 12, active: true,
      mode: 'self', branch: '', output: 'Kho bằng chứng thô',
      question_live: 'Bạn đã có những bằng chứng xã hội nào (lời chứng thực, báo chí, lời mời diễn giả, sự giới thiệu từ người uy tín)?',
      question_self: 'Kiểm kê các bằng chứng xã hội bạn đang có: bài báo, giải thưởng, lời mời diễn giả, chứng chỉ, nhận xét công khai, hoặc đối tác/khách hàng uy tín sẵn sàng giới thiệu bạn.',
      self_hint: 'Liệt kê gạch đầu dòng kèm link (nếu có). Ghi chú thêm nếu có 1–2 khách hàng cũ sẵn sàng viết nhận xét/quay clip ngắn cho bạn trong tuần này.',
      hidden_goal: 'Kiểm kê vốn tín nhiệm xã hội (Social Proof) hiện có.',
      probes: 'Trong số các khách hàng cũ, ai là người sẵn sàng quay video hoặc viết một đoạn nhận xét công khai cho bạn ngay tuần này?',
      min_words: 10, check_vague: false
    },
    {
      code: '1.4.1', stage: 1, group: '1.4', order: 13, active: true,
      mode: 'self', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Một người lạ vào trang cá nhân của bạn trong 5 giây đầu tiên có hiểu ngay bạn giải quyết vấn đề gì cho ai không?',
      question_self: 'Hãy dán đường link các trang cá nhân / kênh công việc bạn đang dùng (Facebook, LinkedIn, TikTok, YouTube, Website...) để nhà tư vấn chạy bài kiểm tra 5 giây trước buổi gặp.',
      self_hint: 'Chỉ cần dán các link đang hoạt động (mỗi link 1 dòng). Nếu chưa có kênh nào, ghi "Chưa có kênh công khai".',
      hidden_goal: 'Kiểm toán khả năng nhận diện (Biết) ở điểm chạm đầu tiên.',
      probes: 'Nếu tôi đưa link Facebook/LinkedIn của bạn cho 5 người bạn của tôi, họ sẽ đoán bạn đang làm nghề gì?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.4.2', stage: 1, group: '1.4', order: 14, active: true,
      mode: 'live', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Có điểm nào trong cách xuất hiện hiện tại khiến bạn cảm thấy đang phải "gồng" hoặc cố trở thành người khác?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Phát hiện sự đứt gãy trong Tam giác niềm tin (cạnh Chân thực).',
      probes: 'Dạng bài viết hoặc cách nói chuyện nào khiến bạn cảm thấy mệt mỏi, gượng gạo nhất mỗi khi đăng lên?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.4.3', stage: 1, group: '1.4', order: 15, active: true,
      mode: 'live', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Sự chênh lệch lớn nhất giữa năng lực thực tế của bạn và những gì thị trường đang nhìn thấy ở bạn là gì?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Xác định "Khoảng trống định vị" (Positioning Gap) cần lấp đầy.',
      probes: 'Điều gì bạn làm rất giỏi ở ngoài đời nhưng trên mạng xã hội tuyệt nhiên chưa ai biết tới?',
      min_words: 0, check_vague: false
    },

    // ==================== GIAI ĐOẠN 2 (11 câu: 2 live, 4 hybrid, 5 self) ====================
    {
      code: '2.1.1', stage: 2, group: '2.1', order: 16, active: true,
      mode: 'hybrid', branch: '', output: 'Chân dung khách hàng',
      question_live: 'Trong số những người bạn có thể giúp, nhóm khách hàng nào vừa có nỗi đau cấp bách nhất, vừa có khả năng chi trả tương xứng?',
      question_self: 'Trong tất cả những nhóm người bạn có thể giúp bằng chuyên môn {field}, hãy chọn trước 1–2 nhóm khách hàng bạn muốn ưu tiên phục vụ nhất (vừa có vấn đề cấp bách, vừa sẵn sàng chi trả).',
      self_hint: 'Mô tả cụ thể vai trò/ngành/quy mô của họ (ví dụ: "Chủ phòng khám nha khoa 1–3 cơ sở doanh thu 500tr–2 tỷ/tháng" thay vì "chủ doanh nghiệp"). Các câu 2.1.2, 2.1.3 tiếp theo sẽ xoay quanh chính nhóm này.',
      hidden_goal: 'Thu hẹp tệp khách hàng mục tiêu, tránh bẫy "phục vụ tất cả mọi người".',
      probes: 'Ai là người sẵn sàng trả tiền ngay trong vòng 1 tuần nếu bạn giải quyết được vấn đề cho họ?|Nhóm khách hàng nào khiến bạn tốn nhiều công sức chăm sóc nhất nhưng lại trả phí thấp nhất?',
      min_words: 15, check_vague: true
    },
    {
      code: '2.1.2', stage: 2, group: '2.1', order: 17, active: true,
      mode: 'self', branch: '', output: 'Chân dung khách hàng',
      question_live: 'Họ đang ở trong hoàn cảnh nào khi bắt đầu tìm kiếm giải pháp? Điều gì khiến họ nghi ngờ khi chọn chuyên gia?',
      question_self: 'Với chính nhóm khách hàng bạn vừa nêu ở câu trước: họ thường rơi vào tình huống nào khi bắt đầu đi tìm giải pháp, và câu hỏi nghi ngờ đầu tiên họ hay đặt ra là gì?',
      self_hint: 'Gợi ý: kể lại những lần họ từng mất tiền oan với giải pháp khác, hoặc dán nguyên văn những câu băn khoăn khách hay hỏi bạn trước khi xuống tiền.',
      hidden_goal: 'Khai thác tâm lý mua hàng (Buyer Psychology) và rào cản niềm tin.',
      probes: 'Họ đã từng bị "mất tiền oan" hoặc thất vọng với những giải pháp/chuyên gia nào trước đây?|Câu hỏi nghi ngờ đầu tiên họ thường đặt ra cho bạn là gì?',
      min_words: 20, check_vague: true
    },
    {
      code: '2.1.3', stage: 2, group: '2.1', order: 18, active: true,
      mode: 'self', branch: '', output: 'Chân dung khách hàng',
      question_live: 'Khi gặp vấn đề đó, họ thường tìm kiếm thông tin, hỏi ý kiến hoặc theo dõi ai trên các nền tảng?',
      question_self: 'Nhóm khách hàng bạn nêu ở 2.1.1 thường tìm thông tin ở đâu (tên cụ thể các hội nhóm Facebook, kênh YouTube, podcast, báo ngành, sự kiện hoặc người ảnh hưởng họ theo dõi)?',
      self_hint: 'Càng ghi tên cụ thể (ví dụ tên group, tên kênh, tên cộng đồng) càng giúp thiết kế bản đồ phân phối chính xác.',
      hidden_goal: 'Xác định bản đồ kênh phân phối và hệ sinh thái ảnh hưởng của khách hàng.',
      probes: 'Họ đọc báo/group nào, nghe podcast gì, hay thường hỏi ý kiến ai trong công ty trước khi ra quyết định?',
      min_words: 10, check_vague: false
    },
    {
      code: '2.2.1', stage: 2, group: '2.2', order: 19, active: true,
      mode: 'hybrid', branch: '', output: 'Tuyên bố định vị',
      question_live: 'Cách tiếp cận hoặc quy trình giải quyết vấn đề của bạn có điểm gì khác biệt so với cách làm phổ biến trên thị trường?',
      question_self: 'Hãy liệt kê tên 3 đối thủ hoặc chuyên gia nổi bật cùng phục vụ nhóm khách hàng của bạn, và nêu rõ điểm khác biệt trong quy trình/cách tiếp cận của {name} (không tính yếu tố giá rẻ).',
      self_hint: 'Ghi tên cụ thể 3 đối thủ/chuyên gia (hoặc 3 nhóm giải pháp phổ biến) + 1–2 điểm cách làm của bạn đi ngược hoặc sâu hơn họ.',
      hidden_goal: 'Tìm ra góc cạnh sắc bén (Edge) để tạo lợi thế cạnh tranh không thể sao chép.',
      probes: 'Nếu đặt dịch vụ của bạn cạnh 3 đối thủ lớn nhất, lý do duy nhất khiến khách hàng chọn bạn (không phải vì giá rẻ) là gì?',
      min_words: 25, check_vague: true
    },
    {
      code: '2.2.2', stage: 2, group: '2.2', order: 20, active: true,
      mode: 'self', branch: '', output: 'Tuyên bố định vị',
      question_live: 'Bạn tuyệt đối không muốn thương hiệu cá nhân của mình bị gắn với nhãn mác hay định kiến nào?',
      question_self: 'Trong ngành {field}, kiểu người làm thương hiệu cá nhân nào khiến bạn cảm thấy phản cảm nhất, và bạn tuyệt đối không muốn bị gắn nhãn mác nào?',
      self_hint: 'Cứ nói thẳng quan điểm thật của bạn — đây là chất liệu cực mạnh để định hình bản sắc không bị nhạt nhòa.',
      hidden_goal: 'Thiết lập "Định vị loại trừ" (Anti-positioning) để định hình phong cách sắc nét.',
      probes: 'Trong ngành của bạn, kiểu người làm thương hiệu cá nhân nào khiến bạn cảm thấy phản cảm nhất? Vì sao?',
      min_words: 15, check_vague: false
    },
    {
      code: '2.2.3', stage: 2, group: '2.2', order: 21, active: true,
      mode: 'live', branch: '', output: 'Tuyên bố định vị',
      question_live: 'Nếu khách hàng chỉ nhớ duy nhất một câu về giá trị bạn mang lại cho họ, bạn muốn đó là câu gì?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Cô đọng tuyên bố định vị (Positioning Statement) thành thông điệp neo giữ.',
      probes: 'Hãy thử nói câu đó theo ngôn ngữ đời thường của khách hàng, không dùng bất kỳ thuật ngữ chuyên ngành nào.',
      min_words: 0, check_vague: false
    },
    {
      code: '2.3.1A', stage: 2, group: '2.3', order: 22, active: true,
      mode: 'self', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Sản phẩm/dịch vụ nào đang mang lại biên lợi nhuận tốt nhất và gắn trực tiếp với chuyên môn của bạn?',
      question_self: 'Liệt kê các sản phẩm/dịch vụ bạn đang bán kèm khoảng giá, biên lợi nhuận (ước lượng %), sản phẩm nào dễ chốt nhất khi khách đã tin, và sản phẩm nào bạn không muốn đẩy mạnh nữa.',
      self_hint: 'Ví dụ gạch đầu dòng: "Gói tư vấn 1-1: 30tr, biên ~70%, dễ chốt nhất | Gói vận hành thuê ngoài: 15tr/tháng, biên thấp, không muốn đẩy".',
      hidden_goal: 'Gắn thương hiệu cá nhân vào "con gà đẻ trứng vàng" thay vì quảng bá dàn trải.',
      probes: 'Sản phẩm nào dễ chốt sales nhất khi khách hàng đã tin tưởng bạn?|Có sản phẩm nào bạn đang bán nhưng thực chất không muốn đẩy mạnh nữa không?',
      min_words: 10, check_vague: false
    },
    {
      code: '2.3.2A', stage: 2, group: '2.3', order: 23, active: true,
      mode: 'hybrid', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Có khoảng cách nào giữa lời hứa thương hiệu cá nhân của bạn và trải nghiệm thực tế của đội ngũ?',
      question_self: 'Khi khách hàng tìm đến vì uy tín của {name} nhưng người trực tiếp triển khai là đội ngũ (hoặc quy trình hiện tại), từng có phàn nàn hay khoảng cách nào giữa kỳ vọng và thực tế chưa?',
      self_hint: 'Chia sẻ thật các điểm khách hay góp ý (tốc độ phản hồi, chất lượng nhân sự phụ trách, khâu hậu mãi...). Nếu bạn tự làm 100%, hãy nêu điểm nào trong quy trình hiện khiến bạn chưa hài lòng nhất.',
      hidden_goal: 'Ngăn ngừa rủi ro "thương hiệu cá nhân kéo khách về, vận hành đuổi khách đi".',
      probes: 'Khi khách hàng đến vì tên tuổi của bạn nhưng người trực tiếp làm là nhân viên, họ có phàn nàn gì không?',
      min_words: 20, check_vague: true
    },
    {
      code: '2.3.3A', stage: 2, group: '2.3', order: 24, active: true,
      mode: 'hybrid', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Nếu tháng sau thương hiệu cá nhân mang về thêm 20–30 khách hàng chất lượng, quy trình của bạn có xử lý kịp không?',
      question_self: 'Hiện tại mỗi tháng bạn/đội ngũ phục vụ tối đa được bao nhiêu khách hàng? Nếu tháng sau có thêm 20–30 khách hỏi mua, khâu nào sẽ bị quá tải đầu tiên (tư vấn chốt đơn hay triển khai dịch vụ)?',
      self_hint: 'Nêu rõ con số năng lực tối đa hiện tại (vd: "tối đa 5 khách/tháng") và bước nào hiện đang phụ thuộc hoàn toàn vào thời gian của chính bạn.',
      hidden_goal: 'Kiểm tra điểm nghẽn năng lực cung ứng (Delivery Bottleneck).',
      probes: 'Khâu nào sẽ bị gãy đầu tiên nếu lượng khách tăng gấp đôi: khâu tư vấn chốt đơn hay khâu triển khai dịch vụ?',
      min_words: 20, check_vague: true
    },
    {
      code: '2.3.1B', stage: 2, group: '2.3', order: 25, active: true,
      mode: 'live', branch: 'B', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Bạn muốn chuyển hóa chuyên môn này thành hình thức tạo thu nhập nào trong 6 tháng tới?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Định hướng mô hình kiếm tiền khả thi (Tư vấn 1-1, Đào tạo, Dịch vụ, Sản phẩm số).',
      probes: 'Với quỹ thời gian hiện tại, hình thức nào giúp bạn tạo ra dòng tiền đầu tiên nhanh nhất mà không cần đầu tư vốn lớn?',
      min_words: 0, check_vague: false
    },
    {
      code: '2.3.2B', stage: 2, group: '2.3', order: 26, active: true,
      mode: 'self', branch: 'B', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Đã có ai từng sẵn sàng trả tiền cho lời khuyên/sự hỗ trợ của bạn chưa?',
      question_self: 'Đã từng có ai trả tiền cho lời khuyên/sự hỗ trợ của bạn trong lĩnh vực {field} chưa (kể cụ thể gói gì, bao nhiêu tiền)? Nếu tuần tới mở gói thử nghiệm cho 5 người đầu tiên, bạn sẽ nhắn mời đích danh những ai?',
      self_hint: 'Liệt kê cụ thể các lần đã nhận tiền (hoặc ghi "Chưa") và danh sách 5 kiểu người/tên gọi tắt trong mối quan hệ hiện có bạn có thể mời thử nghiệm ngay.',
      hidden_goal: 'Kiểm chứng tín hiệu thị trường (Market Validation) trước khi xây nội dung.',
      probes: 'Nếu tuần tới bạn mở một gói tư vấn/dịch vụ thử nghiệm cho 5 người đầu tiên, bạn sẽ mời ai?',
      min_words: 10, check_vague: false
    },

    // ==================== GIAI ĐOẠN 3 (7 câu – sẵn sàng mở qua stages_open) ====================
    {
      code: '3.1.1', stage: 3, group: '3.1', order: 27, active: true,
      mode: 'self', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: '5–10 câu hỏi khách hàng luôn hỏi bạn trước khi mua hàng, và 3–5 sai lầm phổ biến nhất khiến họ tự làm nhưng thất bại là gì?',
      question_self: 'Liệt kê 5–10 câu hỏi khách hàng cứ hỏi đi hỏi lại trước khi làm việc với bạn, và 3–5 sai lầm phổ biến nhất khiến họ tự làm nhưng hỏng.',
      self_hint: 'Càng giữ nguyên câu chữ thực tế của khách càng tốt — đây sẽ là kho chủ đề nội dung chuyên môn dùng trong nhiều tháng.',
      hidden_goal: 'Xây dựng kho chủ đề chuyên môn (Educational Pillars) đánh trúng nhu cầu tìm kiếm thực.',
      probes: 'Câu hỏi nào bạn phải giải thích đi giải thích lại cho khách hàng mới đến mức phát chán?|Sai lầm nào của khách hàng khiến bạn tốn nhiều công sức sửa chữa nhất?',
      min_words: 20, check_vague: false
    },
    {
      code: '3.1.2', stage: 3, group: '3.1', order: 28, active: true,
      mode: 'hybrid', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: 'Trong ngành của bạn, quan điểm phổ biến nào đang khiến khách hàng hiểu sai hoặc hành động sai?',
      question_self: 'Trong ngành {field}, có 2–3 lời khuyên sáo rỗng hoặc quan điểm phổ biến nào đang tràn lan trên mạng mà bạn thấy sai hoặc gây hại cho khách hàng? Bằng chứng thực tế của bạn là gì?',
      self_hint: 'Viết theo mẫu: "Nhiều người hay khuyên [X] -> Thực tế mình gặp [Y] dẫn đến hậu quả [Z]".',
      hidden_goal: 'Xây dựng tuyến bài góc nhìn sắc bén (Thought-provoking / Contrarian Content).',
      probes: 'Lời khuyên sáo rỗng nào đang tràn lan trên mạng về lĩnh vực của bạn mà bạn thấy rất vô lý?|Bạn có bằng chứng thực tế nào để chứng minh điều ngược lại?',
      min_words: 20, check_vague: true
    },
    {
      code: '3.1.3', stage: 3, group: '3.1', order: 29, active: true,
      mode: 'hybrid', branch: '', output: 'Thư viện Case study 3C',
      question_live: 'Những khía cạnh đời sống, hậu trường làm việc hoặc câu chuyện vượt khó nào bạn sẵn sàng chia sẻ (và đâu là vùng cấm)?',
      question_self: 'Ngoài chuyên môn, những góc hậu trường công việc, sở thích cá nhân hoặc bài học đời sống nào bạn thấy thoải mái chia sẻ để khán giả thấy con người thật của mình?',
      self_hint: 'Gợi ý: đồng nghiệp thân thiết thường nhận xét tính cách ngoài đời của bạn có điểm gì thú vị khác lúc làm việc?',
      hidden_goal: 'Xây dựng tuyến bài kết nối cảm xúc (Empathy & Lifestyle) có kiểm soát.',
      probes: 'Đồng nghiệp thân thiết thường nhận xét tính cách ngoài đời của bạn có điểm gì thú vị/khác biệt so với lúc làm việc?',
      min_words: 15, check_vague: false
    },
    {
      code: '3.2.1', stage: 3, group: '3.2', order: 30, active: true,
      mode: 'hybrid', branch: '', output: 'Kịch bản trải nghiệm thử',
      question_live: 'Bạn có thể đóng gói một công cụ, checklist, tài liệu mẫu hoặc buổi chia sẻ ngắn nào giúp khách hàng đạt một kết quả nhỏ ngay lập tức?',
      question_self: 'Trong các file mẫu, checklist, bảng tính hay quy trình nội bộ bạn đang dùng hàng ngày, có công cụ nào tách ra tặng khách hàng là họ áp dụng thấy kết quả ngay được không?',
      self_hint: 'Liệt kê 2–3 tài sản có sẵn trên máy tính/Drive của bạn.',
      hidden_goal: 'Thiết kế tài sản trải nghiệm thử (Lead Magnet / Productized Experience).',
      probes: 'Trong bộ công cụ nội bộ bạn đang dùng hàng ngày, có mẫu biểu hay quy trình nào tách ra tặng khách hàng là họ dùng được ngay không?',
      min_words: 15, check_vague: false
    },
    {
      code: '3.2.2', stage: 3, group: '3.2', order: 31, active: true,
      mode: 'live', branch: '', output: 'Kịch bản trải nghiệm thử',
      question_live: 'Trải nghiệm thử đó giúp khách hàng kiểm chứng được tư duy làm việc của bạn như thế nào trước khi chi tiền cho gói lớn?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Đảm bảo trải nghiệm thử liên kết chặt chẽ với sản phẩm cốt lõi (không tặng quà lệch tệp).',
      probes: 'Sau khi dùng xong tài liệu/buổi chia sẻ này, khách hàng sẽ nhận ra họ còn thiếu mảnh ghép lớn nào mà chỉ dịch vụ chính của bạn mới giải quyết được?',
      min_words: 0, check_vague: false
    },
    {
      code: '3.3.1', stage: 3, group: '3.3', order: 32, active: true,
      mode: 'self', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: 'Giữa viết lách, nói trước ống kính, đối thoại (podcast) hay trình bày trực tiếp (webinar), hình thức nào giúp bạn bộc lộ sự sắc bén tự nhiên nhất?',
      question_self: 'Khi cần giải thích một vấn đề phức tạp cho bạn bè/khách hàng, bạn thích nhất hình thức nào: viết bài, nói trước ống kính, trò chuyện kiểu podcast, hay trình bày/vẽ bảng trực tiếp?',
      self_hint: 'Xếp hạng từ hình thức bạn thấy tự nhiên nhất đến hình thức khiến bạn ngại nhất.',
      hidden_goal: 'Chọn định dạng sản xuất nội dung tối ưu hóa thế mạnh biểu đạt của client.',
      probes: 'Khi giải thích một vấn đề phức tạp cho bạn bè, bạn thích viết email dài, gửi tin nhắn thoại, hay vẽ ra giấy rồi nói?',
      min_words: 10, check_vague: false
    },
    {
      code: '3.3.2', stage: 3, group: '3.3', order: 33, active: true,
      mode: 'live', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: 'Đâu là 1 kênh chính để xây chiều sâu và 1–2 kênh phụ để lan tỏa phù hợp với tệp khách hàng và quỹ thời gian của bạn?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Tránh dàn trải nguồn lực đa kênh ngay từ đầu.',
      probes: 'Nếu chỉ được duy trì đều đặn 2 bài/tuần trên một nền tảng duy nhất trong 6 tháng, bạn chọn nền tảng nào?',
      min_words: 0, check_vague: false
    },

    // ==================== GIAI ĐOẠN 4 (6 câu – lặp theo quý bằng cột round) ====================
    {
      code: '4.1.1', stage: 4, group: '4.1', order: 34, active: true,
      mode: 'self', branch: '', output: 'Báo cáo chỉ số Nhận diện – Tin tưởng – Doanh thu',
      question_live: 'Những người mới tiếp cận có mô tả đúng chuyên môn của bạn không? Nội dung nào đang thu hút đúng tệp khách hàng mục tiêu nhất?',
      question_self: 'Trong 10 người mới nhắn tin/kết nối với bạn tháng qua, có bao nhiêu người đúng chân dung khách hàng mục tiêu? Họ thường nhắc tới bài viết hoặc video cụ thể nào của bạn?',
      self_hint: 'Ghi tỷ lệ cụ thể (ví dụ "6/10 người đúng tệp") và dán tiêu đề/link 2–3 bài viết kéo về nhiều tin nhắn đúng tệp nhất.',
      hidden_goal: 'Đo lường chất lượng nhận diện (Quality of Reach) thay vì chạy theo lượt thích ảo.',
      probes: 'Trong 10 người nhắn tin cho bạn tháng qua, có bao nhiêu người đúng chân dung khách hàng mục tiêu?|Họ nhắc đến bài viết/video cụ thể nào của bạn?',
      min_words: 15, check_vague: true
    },
    {
      code: '4.1.2', stage: 4, group: '4.1', order: 35, active: true,
      mode: 'self', branch: '', output: 'Báo cáo chỉ số Nhận diện – Tin tưởng – Doanh thu',
      question_live: 'Khách hàng có chủ động đặt vấn đề dựa trên nội dung bạn chia sẻ không? Băn khoăn nào vẫn lặp lại nhiều nhất ở khâu chốt sales?',
      question_self: 'Trong quý vừa qua, tỷ lệ khách chủ động hỏi mua từ nội dung của bạn là bao nhiêu, và 2–3 lý do từ chối phổ biến nhất ở khâu chốt đơn là gì (giá, chưa tin kết quả, chưa đúng thời điểm...)?',
      self_hint: 'Ghi con số số lượng lead/đơn chốt được và nguyên văn lý do từ chối gặp nhiều nhất.',
      hidden_goal: 'Phát hiện điểm nghẽn trong phễu niềm tin để bổ sung nội dung phá vỡ rào cản.',
      probes: 'Lý do từ chối phổ biến nhất của những khách hàng tiềm năng gần đây là gì: giá cao, chưa tin kết quả, hay chưa đúng thời điểm?',
      min_words: 15, check_vague: true
    },
    {
      code: '4.1.3', stage: 4, group: '4.1', order: 36, active: true,
      mode: 'hybrid', branch: '', output: 'Báo cáo chỉ số Nhận diện – Tin tưởng – Doanh thu',
      question_live: 'Hoạt động nào đang tạo ra khách hàng/cơ hội chất lượng nhất, và hoạt động nào đang ngốn thời gian nhưng không ra chuyển đổi?',
      question_self: 'Nhìn lại quý vừa qua, 20% hoạt động nào mang lại nhiều cơ hội/doanh thu nhất, và hoạt động nào đang tốn nhiều giờ nhất nhưng không tạo ra chuyển đổi?',
      self_hint: 'Ghi rõ kênh/định dạng hiệu quả nhất và phần bạn muốn cắt bỏ ở quý tới.',
      hidden_goal: 'Tái phân bổ nguồn lực theo nguyên lý 80/20.',
      probes: 'Nếu phải cắt bỏ 50% khối lượng công việc làm nội dung hiện tại để giữ lại phần hiệu quả nhất, bạn sẽ giữ lại phần nào?',
      min_words: 15, check_vague: true
    },
    {
      code: '4.2.1', stage: 4, group: '4.2', order: 37, active: true,
      mode: 'live', branch: '', output: 'Lộ trình Thought Leadership',
      question_live: 'Từ những ca thành công thực tế đã tích lũy, bạn đã đúc kết được mô hình, công thức hoặc hệ thống tư duy mang tên riêng chưa?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Đóng gói tài sản trí tuệ (Intellectual Property) để nâng cấp lên tầng Thought Leadership.',
      probes: 'Nếu phải đặt tên cho quy trình 3–5 bước mà bạn luôn áp dụng thành công cho khách hàng, bạn sẽ gọi tên nó là gì?',
      min_words: 0, check_vague: false
    },
    {
      code: '4.2.2', stage: 4, group: '4.2', order: 38, active: true,
      mode: 'self', branch: '', output: 'Lộ trình Thought Leadership',
      question_live: 'Đã có đồng nghiệp, học viên hoặc khách hàng nào bắt đầu trích dẫn và áp dụng phương pháp của bạn vào công việc của họ chưa?',
      question_self: 'Đã có đồng nghiệp, học viên hay khách hàng nào trích dẫn lại thuật ngữ, bài viết hoặc áp dụng cách làm của bạn chưa? Hãy ghi lại các dẫn chứng cụ thể.',
      self_hint: 'Liệt kê ví dụ/link bài chia sẻ lại hoặc ghi "Chưa có rõ rệt" nếu mới ở quý đầu.',
      hidden_goal: 'Kiểm chứng mức độ lan tỏa tư tưởng (Thought Leadership Validation).',
      probes: 'Có thuật ngữ, câu nói hay cách làm nào do bạn khởi xướng đang được mọi người trong ngành nhắc lại không?',
      min_words: 10, check_vague: false
    },
    {
      code: '4.2.3', stage: 4, group: '4.2', order: 39, active: true,
      mode: 'live', branch: '', output: 'Lộ trình Thought Leadership',
      question_live: 'Ở giai đoạn tiếp theo, bạn muốn dẫn dắt cộng đồng trong ngách của mình thay đổi một thói quen hay tiêu chuẩn nghề nghiệp nào?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Định hình tầm nhìn dẫn dắt dài hạn (Category Design / Movement).',
      probes: '5 năm nữa, khi nhắc đến tên bạn trong ngành này, bạn muốn người ta nói bạn đã thay đổi điều gì cho thị trường?',
      min_words: 0, check_vague: false
    }
  ];
}

function getSeedTemplates_() {
  var commonCodes = [
    '1.1.1', '1.1.2', '1.1.3', '1.1.4', '1.1.5',
    '1.2.1', '1.2.2', '1.2.3', '1.2.4',
    '1.3.1', '1.3.2', '1.3.3',
    '1.4.1', '1.4.2', '1.4.3',
    '2.1.1', '2.1.2', '2.1.3',
    '2.2.1', '2.2.2', '2.2.3'
  ];
  var branchACodes = ['2.3.1A', '2.3.2A', '2.3.3A'];
  var branchBCodes = ['2.3.1B', '2.3.2B'];
  var stage34Codes = [
    '3.1.1', '3.1.2', '3.1.3', '3.2.1', '3.2.2', '3.3.1', '3.3.2',
    '4.1.1', '4.1.2', '4.1.3', '4.2.1', '4.2.2', '4.2.3'
  ];

  return [
    {
      template_id: 'chuyen-gia-co-KD',
      default_branch: 'A',
      codes: commonCodes.concat(branchACodes, stage34Codes).join('|'),
      description: 'Người đã có sản phẩm/dịch vụ đang bán (cố định nhánh A)'
    },
    {
      template_id: 'moi-bat-dau',
      default_branch: 'B',
      codes: commonCodes.concat(branchBCodes, stage34Codes).join('|'),
      description: 'Người chưa có mô hình kinh doanh riêng (cố định nhánh B)'
    },
    {
      template_id: 'chuan',
      default_branch: '',
      codes: commonCodes.concat(branchACodes, branchBCodes, stage34Codes).join('|'),
      description: 'Bộ đầy đủ – để khách tự chọn nhánh A/B trước mục 2.3'
    }
  ];
}

function getSeedConfig_() {
  return [
    {
      key: 'vague_words',
      value: 'rất tận tâm|khách rất thích|rất hài lòng|chất lượng cao|uy tín|chuyên nghiệp|tận tình|nhiệt tình|khá tốt|rất tốt|hiệu quả cao|nhiều khách hàng|nhiều năm kinh nghiệm|giá cả hợp lý|độc đáo',
      note: 'Danh sách từ ngữ chung chung ngăn bằng dấu | (chỉ kiểm tra ở câu có check_vague = TRUE và chưa có số liệu/trích dẫn)'
    },
    {
      key: 'consent_version',
      value: 'v1.0',
      note: 'Phiên bản điều khoản bảo mật dữ liệu & sử dụng AI'
    },
    {
      key: 'consent_text',
      value: 'Tôi đồng ý cung cấp thông tin này cho quá trình tư vấn thương hiệu cá nhân. Dữ liệu chỉ phục vụ cho dự án tư vấn của tôi và có thể được chuyên gia đưa vào công cụ AI (ở chế độ không dùng dữ liệu để huấn luyện mô hình) nhằm tổng hợp và phân tích.',
      note: 'Nội dung ô tick đồng ý ở màn chào'
    },
    {
      key: 'prompt_preread_s1',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Chỉ dựa trên <du_lieu> (các câu khách tự điền trước Buổi 1):',
        '1. Tóm tắt nhanh chân dung hiện tại của khách trong 5 gạch đầu dòng (tách rõ điều đã có bằng chứng [F] và điều mới là tự nhận định [A]).',
        '2. Chỉ ra 3–5 điểm còn chung chung, mâu thuẫn hoặc thiếu bằng chứng cứng (đặc biệt chú ý các câu có cờ hệ thống hoặc câu 1.1.2, 1.3.1, 1.3.2).',
        '3. Với các câu live (1.1.1, 1.2.1, 1.2.3, 1.2.4, 1.4.2, 1.4.3) và câu hybrid cần chốt, gợi ý 1–2 câu hỏi đào sâu sắc bén được cá nhân hóa từ chính dữ liệu khách đã viết.',
        '4. Gợi ý 1 case study tiềm năng nhất trong 1.3.2 để ưu tiên đào sâu trong buổi gặp.',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đọc trước Giai đoạn 1'
    },
    {
      key: 'prompt_eval_s1',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Chỉ dựa trên <du_lieu> (bao gồm cả ghi chú thô/transcript nếu có) và <checklist_nha_tu_van>:',
        '1. Ánh xạ các ý trong phần Ghi chú thô/Transcript về đúng mã câu (nếu có), sau đó tách từng ý theo thẻ [F] Sự thật / [A] Giả định / [G] Mục tiêu, luôn giữ mã câu khi trích.',
        '2. Gom toàn bộ dữ liệu theo 3 đầu ra cốt lõi GĐ1: Bản đồ hiện trạng & rào cản; Hồ sơ năng lực; Kho bằng chứng thô.',
        '3. Chấm 4 tiêu chí nghiệm thu GĐ1 (Đạt / Chưa đạt + lý do ngắn):',
        '   - Tiêu chí 1: Đã tách bạch rõ Sự thật [F] và Giả định [A] chưa?',
        '   - Tiêu chí 2: Đã có đủ bằng chứng cứng (Hard Proof) cho năng lực lõi (1.2.x, 1.3.x) chưa?',
        '   - Tiêu chí 3: Đã xác định rõ Khoảng trống định vị (1.4.x) và Ranh giới/Vùng cấm (1.1.4) chưa?',
        '   - Tiêu chí 4: Đã chốt KPI ưu tiên duy nhất (1.1.3) và Quỹ thời gian thực tế (1.1.5) chưa?',
        '4. Nêu tối đa 3 lỗ hổng cần hỏi bổ sung trước khi sang GĐ2.',
        '5. Viết một khối "TÓM TẮT CHỐT GĐ1" (tối đa 10 gạch đầu dòng: KPI chốt 1.1.3, quỹ thời gian & đội ngũ 1.1.5, vùng cấm 1.1.4, vũ khí sắc bén 1.2.1, 2–3 bằng chứng mạnh nhất 1.3.x, khoảng trống định vị 1.4.3) để lưu làm ngữ cảnh cho GĐ2.',
        'Không suy diễn ngoài dữ liệu; câu nói thành chữ có thể sai chính tả, hãy hiểu theo ngữ cảnh.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đánh giá Giai đoạn 1'
    },
    {
      key: 'prompt_preread_s2',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Đọc <tom_tat_gd_truoc> kết hợp với <du_lieu> GĐ2:',
        '1. Kiểm tra tính nhất quán giữa nhóm khách mục tiêu giả định ở 2.1.1 với năng lực lõi & bằng chứng ở GĐ1: có chỗ nào "với quá tầm" hoặc "lệch tệp" không?',
        '2. Soi các câu trả lời 2.1.2, 2.1.3, 2.2.1, 2.3.x để chỉ ra điểm khách đang giả định thiếu căn cứ hoặc nói giảm (đặc biệt ở 2.3.2A, 2.3.3A hoặc 2.3.2B).',
        '3. Chuẩn bị 5–7 câu hỏi phản biện sắc bén cho buổi Workshop GĐ2 nhằm: (a) ép thu hẹp tệp 2.1.1, (b) tìm góc cạnh khác biệt ở 2.2.1, (c) chuẩn bị chất liệu chốt câu định vị duy nhất 2.2.3 và mô hình dòng tiền 2.3.x.',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đọc trước Giai đoạn 2'
    },
    {
      key: 'prompt_eval_s2',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc>, <du_lieu> GĐ2 và <checklist_nha_tu_van>:',
        '1. Ánh xạ ghi chú thô/transcript về mã câu (nếu có), tách ý theo [F] Sự thật / [A] Giả định / [G] Mục tiêu, giữ nguyên mã câu.',
        '2. Gom toàn bộ dữ liệu theo 3 đầu ra cốt lõi GĐ2: Chân dung khách hàng; Tuyên bố định vị; Cấu trúc sản phẩm & Phễu chuyển đổi.',
        '3. Chấm ĐỦ 4 MỤC NGHIỆM THU CHUẨN (Đạt / Chưa đạt + lý do cụ thể):',
        '   - Mục 1 (Tách bạch sự thật & giả định): Những nhận định nào về khách hàng/thị trường (2.1.x, 2.2.x) vẫn là giả định cần kiểm chứng thêm?',
        '   - Mục 2 (Mỏ neo khác biệt): Đã có điểm giao thoa rõ ràng giữa Năng lực lõi GĐ1 + Nỗi đau cấp bách 2.1.1 + Góc nhìn khác biệt 2.2.1/2.2.3 chưa?',
        '   - Mục 3 (Khớp nối dòng tiền): Đã rõ thương hiệu cá nhân dẫn về sản phẩm/mô hình thu nhập nào (2.3.x), mức giá/quy trình chốt đơn và điểm nghẽn cung ứng chưa?',
        '   - Mục 4 (Vừa sức vận hành): Kiến trúc định vị và kế hoạch chuyển đổi có nằm gọn trong quỹ thời gian & đội ngũ thực tế ở câu 1.1.5 (trong <tom_tat_gd_truoc>) không?',
        '4. Kết luận: 3 điều cần làm rõ nhất trước khi viết Đề xuất Chiến lược (Strategy Proposal), kèm khối "TÓM TẮT CHỐT GĐ2" (tối đa 10 gạch đầu dòng) để làm ngữ cảnh cho GĐ3.',
        'Không suy diễn ngoài dữ liệu; câu nói thành chữ có thể sai chính tả, hãy hiểu theo ngữ cảnh.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đánh giá Giai đoạn 2 (đủ 4 mục checklist gốc)'
    },
    {
      key: 'prompt_preread_s3',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc> (GĐ1–2) và <du_lieu> GĐ3:',
        '1. Đánh giá kho câu hỏi/sai lầm ở 3.1.1 và góc nhìn phản biện ở 3.1.2: chủ đề nào chạm đúng nỗi đau tệp khách hàng mục tiêu nhất?',
        '2. Rà soát đề xuất tài sản trải nghiệm thử ở 3.2.1 có khớp với sản phẩm cốt lõi ở GĐ2 không.',
        '3. Đề xuất 3–5 câu hỏi đồng sáng tạo cho buổi Workshop GĐ3 nhằm chốt định dạng (3.3.1), 1 kênh chính (3.3.2) vừa sức với quỹ thời gian 1.1.5.',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đọc trước Giai đoạn 3'
    },
    {
      key: 'prompt_eval_s3',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc>, <du_lieu> GĐ3 và <checklist_nha_tu_van>:',
        '1. Tổng hợp 3 đầu ra cốt lõi GĐ3: Trụ cột nội dung (Pillars); Thư viện Case study 3C & chất liệu cảm xúc; Kịch bản trải nghiệm thử (Lead Magnet).',
        '2. Đối chiếu lịch xuất bản & định dạng (3.3.1, 3.3.2) với quỹ thời gian 1.1.5 và vùng cấm 1.1.4 để cảnh báo nguy cơ đứt gãy vận hành.',
        '3. Viết khối "TÓM TẮT CHỐT GĐ3" (tối đa 10 gạch đầu dòng) làm chuẩn đối chiếu cho GĐ4.',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đánh giá Giai đoạn 3'
    },
    {
      key: 'prompt_preread_s4',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Đọc <tom_tat_gd_truoc> và số liệu rà soát quý trong <du_lieu> GĐ4:',
        '1. So sánh tỷ lệ đúng tệp (4.1.1) và lý do từ chối (4.1.2) với định vị & phễu đã chốt ở GĐ2.',
        '2. Đề xuất 3–5 câu hỏi trọng tâm cho buổi họp rà soát quý nhằm cắt bỏ 50% hoạt động kém hiệu quả (4.1.3) và đóng gói tài sản trí tuệ riêng (4.2.1).',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đọc trước Giai đoạn 4 (Rà soát quý)'
    },
    {
      key: 'prompt_eval_s4',
      value: [
        'Bạn là chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc>, <du_lieu> GĐ4 và <checklist_nha_tu_van>:',
        '1. Lập Báo cáo Nhận diện – Tin tưởng – Doanh thu của quý này theo thẻ [F]/[A]/[G].',
        '2. Chỉ rõ phương án tái phân bổ nguồn lực theo nguyên lý 80/20 cho quý tới.',
        '3. Đề xuất bước tiếp theo cho Lộ trình Thought Leadership (4.2.1–4.2.3) và viết khối "TÓM TẮT CHỐT QUÝ" (8–10 gạch đầu dòng).',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đánh giá Giai đoạn 4 (Rà soát quý)'
    }
  ];
}

// ==================== Setup.gs ====================
/**
 * Setup.gs
 * Khởi tạo tự động 7 tab chuẩn + tab Dashboard theo dõi tiến độ (công thức thuần, không gây lock).
 * Chạy an toàn nhiều lần (idempotent): không ghi đè dữ liệu khách hàng đã có.
 */

function setupWorkbook() {
  var ss = getActiveSpreadsheet_();
  var summary = [];

  var orderedTabs = [
    TABS.CLIENTS,
    TABS.QUESTIONS,
    TABS.TEMPLATES,
    TABS.RESPONSES,
    TABS.LIVE_NOTES,
    TABS.STAGE_REVIEWS,
    TABS.CONFIG
  ];

  orderedTabs.forEach(function (tabName) {
    var created = ensureTabWithSchema_(ss, tabName, SCHEMAS[tabName]);
    summary.push(tabName + (created ? ' (tạo mới)' : ' (đã kiểm tra)'));
  });

  // Nạp dữ liệu mẫu cho Questions, Templates, Config nếu thiếu mã
  var qAdded = seedMissingRows_(TABS.QUESTIONS, getSeedQuestions_(), 'code');
  var tAdded = seedMissingRows_(TABS.TEMPLATES, getSeedTemplates_(), 'template_id');
  var cAdded = seedMissingRows_(TABS.CONFIG, getSeedConfig_(), 'key');

  // Áp dụng Plain Text ('@') cho toàn bộ cột khóa ở các tab
  orderedTabs.forEach(function (tabName) {
    formatPlainTextColumns_(ss.getSheetByName(tabName), tabName);
  });

  // Checkbox cho Questions (active, check_vague) và StageReviews (check_1..check_4)
  applyCheckboxColumn_(ss.getSheetByName(TABS.QUESTIONS), 'active');
  applyCheckboxColumn_(ss.getSheetByName(TABS.QUESTIONS), 'check_vague');
  ['check_1', 'check_2', 'check_3', 'check_4'].forEach(function (col) {
    applyCheckboxColumn_(ss.getSheetByName(TABS.STAGE_REVIEWS), col);
  });

  // Cảnh báo sửa tay (Protected Range warning-only) cho tab Responses
  protectResponsesWarningOnly_(ss.getSheetByName(TABS.RESPONSES));

  // Tạo tab Dashboard xem tiến độ bằng công thức Sheets (không chạm vào LockService)
  ensureDashboardTab_(ss);

  // Xóa Sheet1 mặc định nếu còn trống
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {
      // Bỏ qua nếu không xóa được
    }
  }

  clearStaticCache_();

  return {
    tabs: summary,
    questionsAdded: qAdded,
    templatesAdded: tAdded,
    configAdded: cAdded
  };
}

function ensureTabWithSchema_(ss, tabName, expectedHeaders) {
  var sheet = ss.getSheetByName(tabName);
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    created = true;
  }

  var lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  } else {
    // Bổ sung các cột mới nếu sheet cũ thiếu, không làm xáo trộn cột đang có
    var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
      return String(h).trim();
    });
    var missing = expectedHeaders.filter(function (h) {
      return currentHeaders.indexOf(h) === -1;
    });
    if (missing.length > 0) {
      sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
    }
  }

  // Trang trí nhẹ dòng tiêu đề & cố định dòng 1
  var totalCols = Math.max(sheet.getLastColumn(), expectedHeaders.length);
  var headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0F5257');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  return created;
}

function seedMissingRows_(tabName, items, uniqueKey) {
  var existing = readTabAsObjects_(tabName);
  var existingKeys = {};
  existing.forEach(function (row) {
    var k = String(row[uniqueKey] || '').trim();
    if (k) existingKeys[k] = true;
  });

  var added = 0;
  items.forEach(function (item) {
    var k = String(item[uniqueKey] || '').trim();
    if (!k || existingKeys[k]) return;
    appendRowByHeader_(tabName, item);
    existingKeys[k] = true;
    added++;
  });
  return added;
}

function formatPlainTextColumns_(sheet, tabName) {
  if (!sheet) return;
  var plainCols = PLAIN_TEXT_COLUMNS[tabName] || [];
  if (plainCols.length === 0) return;

  var info = getTabHeaders_(sheet);
  var maxRows = Math.max(sheet.getMaxRows(), 200);
  plainCols.forEach(function (colName) {
    if (Object.prototype.hasOwnProperty.call(info.map, colName)) {
      var colIdx = info.map[colName] + 1;
      sheet.getRange(2, colIdx, maxRows - 1, 1).setNumberFormat('@');
    }
  });
}

function applyCheckboxColumn_(sheet, colName) {
  if (!sheet || typeof SpreadsheetApp.newDataValidation !== 'function') return;
  var info = getTabHeaders_(sheet);
  if (!Object.prototype.hasOwnProperty.call(info.map, colName)) return;
  var colIdx = info.map[colName] + 1;
  var lastRow = Math.max(sheet.getLastRow(), 2);
  try {
    var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    sheet.getRange(2, colIdx, Math.max(lastRow - 1, 50), 1).setDataValidation(rule);
  } catch (e) {
    // Bỏ qua trong môi trường mock không hỗ trợ DataValidation
  }
}

function protectResponsesWarningOnly_(sheet) {
  if (!sheet || typeof sheet.protect !== 'function') return;
  try {
    var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    var alreadyProtected = existing.some(function (p) {
      return p.getDescription() === 'THCN_RESPONSES_GUARD';
    });
    if (!alreadyProtected) {
      var protection = sheet.protect().setDescription('THCN_RESPONSES_GUARD');
      protection.setWarningOnly(true);
    }
  } catch (e) {
    // Bỏ qua trong môi trường không hỗ trợ protection
  }
}

function ensureDashboardTab_(ss) {
  var sheet = ss.getSheetByName(TABS.DASHBOARD);
  if (!sheet) {
    sheet = ss.insertSheet(TABS.DASHBOARD);
  }
  if (sheet.getLastRow() > 0) return; // Không ghi đè nếu nhà tư vấn đã tùy biến Dashboard

  var headers = [
    'client_id', 'Tên khách', 'Lĩnh vực', 'Nhánh', 'GĐ đang mở', 'Trạng thái',
    'Số câu đã trả lời', 'Số câu có cờ', 'Đã nộp GĐ1?', 'Đã nộp GĐ2?', 'Lần trả lời gần nhất'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1C1917').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  // Công thức động lấy danh sách khách từ tab Clients (dòng 2 -> 100)
  var formulas = [];
  for (var r = 2; r <= 51; r++) {
    formulas.push([
      '=IF(Clients!A' + r + '="","",Clients!A' + r + ')',
      '=IF(A' + r + '="","",Clients!C' + r + ')',
      '=IF(A' + r + '="","",Clients!D' + r + ')',
      '=IF(A' + r + '="","",Clients!H' + r + ')',
      '=IF(A' + r + '="","",Clients!I' + r + ')',
      '=IF(A' + r + '="","",Clients!N' + r + ')',
      '=IF(A' + r + '="","",COUNTIFS(Responses!$A$2:$A,A' + r + ',Responses!$E$2:$E,"<>"))',
      '=IF(A' + r + '="","",COUNTIFS(Responses!$A$2:$A,A' + r + ',Responses!$I$2:$I,"<>"))',
      '=IF(A' + r + '="","",IF(COUNTIFS(StageReviews!$A$2:$A,A' + r + ',StageReviews!$C$2:$C,1,StageReviews!$D$2:$D,"<>")>0,"Đã nộp","Chưa"))',
      '=IF(A' + r + '="","",IF(COUNTIFS(StageReviews!$A$2:$A,A' + r + ',StageReviews!$C$2:$C,2,StageReviews!$D$2:$D,"<>")>0,"Đã nộp","Chưa"))',
      '=IF(A' + r + '="","",IFERROR(INDEX(SORT(FILTER(Responses!$K$2:$K,Responses!$A$2:$A=A' + r + '),1,FALSE),1),""))'
    ]);
  }
  sheet.getRange(2, 1, formulas.length, headers.length).setFormulas(formulas);
}

// ==================== Api.gs ====================
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
    return { ok: false, code: 'SESSION_CLOSED', error: 'Phiên phỏng vấn này đã đóng. Nếu bạn cần mở lại, vui lòng nhắn cho nhà tư vấn.' };
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

// ==================== Export.gs ====================
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
  lines.push('- Giai đoạn: ' + stageNum + ' (' + (STAGE_TITLES[stageNum] || '') + ') | Ngày xuất: ' + today);
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

// ==================== Backup.gs ====================
/**
 * Backup.gs
 * Tự động sao lưu toàn bộ file Google Sheets mỗi Chủ nhật vào thư mục Backup_THCN trên Drive,
 * giữ 8 bản sao lưu gần nhất. Chi phí: 0đ.
 */

var BACKUP_FOLDER_NAME = 'Backup_THCN';
var BACKUP_KEEP_COUNT = 8;

function runWeeklyBackup() {
  var ss = getActiveSpreadsheet_();
  var props = PropertiesService.getScriptProperties();
  var folder = getOrCreateBackupFolder_(props);

  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd_HHmm');
  var backupName = ss.getName() + '_BACKUP_' + stamp;
  var sourceFile = DriveApp.getFileById(ss.getId());
  var copied = sourceFile.makeCopy(backupName, folder);

  pruneOldBackups_(folder, BACKUP_KEEP_COUNT);

  return {
    fileId: copied.getId(),
    fileName: backupName,
    folderName: folder.getName()
  };
}

function getOrCreateBackupFolder_(props) {
  var folderId = props.getProperty(PROP_KEYS.BACKUP_FOLDER_ID);
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // Thư mục đã bị xóa, tạo mới bên dưới
    }
  }
  var iter = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  var folder = iter.hasNext() ? iter.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
  props.setProperty(PROP_KEYS.BACKUP_FOLDER_ID, folder.getId());
  return folder;
}

function pruneOldBackups_(folder, keepCount) {
  var files = [];
  var iter = folder.getFiles();
  while (iter.hasNext()) {
    var f = iter.next();
    files.push({ file: f, created: f.getDateCreated().getTime() });
  }
  files.sort(function (a, b) { return b.created - a.created; });
  for (var i = keepCount; i < files.length; i++) {
    files[i].file.setTrashed(true);
  }
}

function installWeeklyBackupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'runWeeklyBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('runWeeklyBackup')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
}

// ==================== AdminMenu.gs ====================
/**
 * AdminMenu.gs
 * Giao diện quản trị tích hợp trực tiếp trong Google Sheets (thay thế hoàn toàn admin.html).
 * - Bảo mật trực tiếp bằng tài khoản Google (2FA) của nhà tư vấn.
 * - Không cần admin_key, không phơi API quản trị ra internet.
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Tư vấn THCN')
    .addItem('➕ Tạo khách mới & Lấy link', 'menuOpenCreateClient')
    .addItem('🔓 Mở / Khóa giai đoạn khách', 'menuOpenManageStages')
    .addSeparator()
    .addItem('📝 Nhập ghi chú / Transcript buổi họp', 'menuOpenLiveNotes')
    .addItem('💾 Chấm Checklist & Lưu Tóm tắt GĐ', 'menuOpenStageSummary')
    .addSeparator()
    .addItem('📋 Xuất Bản đọc trước (Pre-read)', 'menuOpenExportPreread')
    .addItem('📋 Xuất Bản đánh giá (Eval)', 'menuOpenExportEval')
    .addSeparator()
    .addItem('🔗 Cài đặt URL trang khách (GitHub Pages)', 'menuSetClientAppUrl')
    .addItem('🔄 Làm mới bộ nhớ đệm (Clear Cache)', 'menuClearCache')
    .addItem('🚀 Khởi tạo / Kiểm tra Sheet 7 tab', 'menuRunSetup')
    .addItem('☁️ Bật sao lưu tự động hàng tuần', 'menuInstallBackup')
    .addToUi();
}

function menuRunSetup() {
  var ui = SpreadsheetApp.getUi();
  var res = setupWorkbook();
  ui.alert(
    'Khởi tạo hoàn tất',
    'Đã kiểm tra/tạo 7 tab + Dashboard.\n' +
    '- Câu hỏi thêm mới: ' + res.questionsAdded + '\n' +
    '- Template thêm mới: ' + res.templatesAdded + '\n' +
    '- Cấu hình thêm mới: ' + res.configAdded,
    ui.ButtonSet.OK
  );
}

function menuClearCache() {
  clearStaticCache_();
  SpreadsheetApp.getActiveSpreadsheet().toast('Đã xóa bộ nhớ đệm. Thay đổi trong Questions/Templates/Config có hiệu lực ngay.', '⚙️ Tư vấn THCN', 4);
}

function menuSetClientAppUrl() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var current = props.getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var res = ui.prompt(
    'Cài đặt đường dẫn trang khách hàng (GitHub Pages)',
    'Nhập URL gốc (ví dụ: https://tenban.github.io/phong-van-thcn/)\nHiện tại: ' + (current || '(chưa cài đặt)'),
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    var url = String(res.getResponseText() || '').trim();
    if (url && url.slice(-1) !== '/') url += '/';
    props.setProperty(PROP_KEYS.WEB_APP_URL, url);
    SpreadsheetApp.getActiveSpreadsheet().toast('Đã lưu URL trang khách: ' + url, '⚙️ Tư vấn THCN', 4);
  }
}

function menuInstallBackup() {
  installWeeklyBackupTrigger();
  var sample = runWeeklyBackup();
  SpreadsheetApp.getUi().alert(
    'Đã bật sao lưu tự động',
    'Hệ thống sẽ tự sao lưu file Sheet vào 02:00 sáng Chủ nhật hàng tuần trong thư mục "' + sample.folderName + '" (giữ 8 bản gần nhất).\n\nĐã tạo sẵn bản sao lưu đầu tiên: ' + sample.fileName,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function menuOpenCreateClient() {
  var html = HtmlService.createHtmlOutput(EMBEDDED_DIALOGS_['DialogCreateClient'])
    .setWidth(520)
    .setHeight(540);
  SpreadsheetApp.getUi().showModalDialog(html, '➕ Tạo khách hàng mới');
}

function menuOpenManageStages() {
  var html = HtmlService.createHtmlOutput(EMBEDDED_DIALOGS_['DialogManageStages'])
    .setWidth(520)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, '🔓 Mở / Khóa giai đoạn & Trạng thái');
}

function menuOpenLiveNotes() {
  var html = HtmlService.createHtmlOutput(EMBEDDED_DIALOGS_['DialogLiveNotes'])
    .setWidth(620)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '📝 Ghi chú / Transcript buổi trực tiếp');
}

function menuOpenStageSummary() {
  var html = HtmlService.createHtmlOutput(EMBEDDED_DIALOGS_['DialogStageSummary'])
    .setWidth(600)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '💾 Chấm Checklist & Lưu Tóm tắt Giai đoạn');
}

function menuOpenExportPreread() {
  openExportDialog_('preread', '📋 Xuất Bản đọc trước (Pre-read cho LLM)');
}

function menuOpenExportEval() {
  openExportDialog_('eval', '📋 Xuất Bản đánh giá (Eval cho LLM)');
}

function openExportDialog_(exportType, title) {
  var rawHtml = EMBEDDED_DIALOGS_['DialogExport'].replace('<?= exportType ?>', exportType);
  var html = HtmlService.createHtmlOutput(rawHtml).setWidth(700).setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}

// ==================== SERVER FUNCTIONS CHO CÁC MODAL DIALOG ====================

function adminGetInitData() {
  var bundle = getStaticBundle_();
  var clients = readTabAsObjects_(TABS.CLIENTS).map(normalizeClient_);
  var baseUrl = PropertiesService.getScriptProperties().getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var templates = Object.keys(bundle.templates).map(function (id) {
    return bundle.templates[id];
  });
  var questions = bundle.questions.map(function (q) {
    return { code: q.code, stage: q.stage, mode: q.mode, label: q.code + ' – ' + (q.question_live || q.question_self).slice(0, 65) };
  });

  return {
    baseUrl: baseUrl,
    clients: clients,
    templates: templates,
    questions: questions,
    checklistLabels: STAGE_CHECKLIST_LABELS
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

function adminCreateClient(input) {
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
    'Chào {name}, đây là bảng chuẩn bị dữ kiện trước buổi làm việc xây dựng thương hiệu cá nhân trong lĩnh vực {field}. Bạn có thể gõ hoặc dùng micro trên bàn phím điện thoại để trả lời tự nhiên nhất.';

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

  var baseUrl = PropertiesService.getScriptProperties().getProperty(PROP_KEYS.WEB_APP_URL) || '';
  var fullLink = baseUrl ? (baseUrl + '#k=' + token) : ('#k=' + token);

  return {
    client_id: clientId,
    token: token,
    branch: record.branch,
    link: fullLink,
    hasBaseUrl: Boolean(baseUrl)
  };
}

function adminUpdateClientStages(input) {
  var clientId = String((input && input.client_id) || '').trim();
  if (!clientId) throw new Error('Thiếu mã khách hàng.');

  var openArr = Array.isArray(input.stages_open) ? input.stages_open : parseStageList_(input.stages_open);
  var lockedArr = Array.isArray(input.stages_locked) ? input.stages_locked : parseStageList_(input.stages_locked);
  var status = String(input.status || 'active').trim().toLowerCase() === 'closed' ? 'closed' : 'active';
  var branch = String(input.branch || '').trim().toUpperCase();
  if (branch !== 'A' && branch !== 'B') branch = '';

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    upsertRowByHeader_(TABS.CLIENTS, {
      stages_open: openArr.join('|'),
      stages_locked: lockedArr.join('|'),
      status: status,
      branch: branch
    }, function (row) {
      return String(row.client_id || '').trim() === clientId;
    });
  } finally {
    lock.releaseLock();
  }

  return {
    client_id: clientId,
    stages_open: openArr.join('|'),
    stages_locked: lockedArr.join('|'),
    status: status,
    branch: branch
  };
}

function adminGetLiveNotes(clientId, stage, round) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  return readTabAsObjects_(TABS.LIVE_NOTES).filter(function (n) {
    return String(n.client_id || '').trim() === String(clientId).trim() &&
      parseInt(n.stage, 10) === stageNum &&
      (String(n.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === roundStr;
  }).map(function (n) {
    return {
      code: String(n.code || 'RAW'),
      tag: String(n.tag || 'RAW'),
      note: String(n.note || ''),
      created_at: String(n.created_at || '')
    };
  });
}

function adminSaveLiveNotes(input) {
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
    // Tách từng dòng có tiền tố tùy chọn f: / a: / g:
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

function adminGetStageReview(clientId, stage, round) {
  var stageNum = parseInt(stage, 10) || 1;
  var roundStr = String(round || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var rows = readTabAsObjects_(TABS.STAGE_REVIEWS);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.client_id || '').trim() === String(clientId).trim() &&
      parseInt(r.stage, 10) === stageNum &&
      (String(r.round || DEFAULT_ROUND).trim() || DEFAULT_ROUND) === roundStr) {
      return {
        submitted_at: String(r.submitted_at || ''),
        check_1: toBool_(r.check_1),
        check_2: toBool_(r.check_2),
        check_3: toBool_(r.check_3),
        check_4: toBool_(r.check_4),
        review_note: String(r.review_note || ''),
        approved_summary: String(r.approved_summary || '')
      };
    }
  }
  return {
    submitted_at: '',
    check_1: false, check_2: false, check_3: false, check_4: false,
    review_note: '', approved_summary: ''
  };
}

function adminSaveStageReview(input) {
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

function adminGenerateExport(input) {
  var clientId = String((input && input.client_id) || '').trim();
  var stageNum = parseInt(input && input.stage, 10) || 1;
  var roundStr = String((input && input.round) || DEFAULT_ROUND).trim() || DEFAULT_ROUND;
  var exportType = String((input && input.export_type) || 'preread').trim();
  var anonymize = Boolean(input && input.anonymize);

  var markdown = exportType === 'eval'
    ? buildEvalMarkdown_(clientId, stageNum, roundStr, { anonymize: anonymize })
    : buildPrereadMarkdown_(clientId, stageNum, roundStr, { anonymize: anonymize });

  return { markdown: markdown, charCount: markdown.length };
}
