/**
 * test_client_logic.js
 * Kiểm thử đơn vị cho docs/logic.js bằng JavaScriptCore (jsc).
 * Lệnh chạy: /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/test_client_logic.js
 */

load('docs/logic.js');
var Logic = THCNLogic;

var passed = 0;
var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    print('❌ FAIL: ' + msg);
  } else {
    passed++;
    print('✅ PASS: ' + msg);
  }
}

// 1. Detect Zalo / Messenger In-App Browser
assert(Logic.detectInAppBrowser('Mozilla/5.0 (iPhone) Zalo/24.10.01').isInApp === true &&
  Logic.detectInAppBrowser('Mozilla/5.0 (iPhone) Zalo/24.10.01').appName === 'Zalo',
  'Phát hiện chính xác Zalo In-App Browser');
assert(Logic.detectInAppBrowser('Mozilla/5.0 FBAN/MessengerForiOS').appName === 'Facebook / Messenger',
  'Phát hiện chính xác Facebook / Messenger WebView');
assert(Logic.detectInAppBrowser('Mozilla/5.0 (Macintosh) Chrome/130.0.0.0 Safari/537.36').isInApp === false,
  'Không báo nhầm trên Chrome thường');

// 2. Token Extraction (#k= priority + #demo + ?k= fallback)
var t1 = Logic.extractTokenFromLocation('#k=AbCdEf123456789012345678', '');
assert(t1.token === 'AbCdEf123456789012345678' && !t1.isDemo && !t1.fromQuery, 'Đọc token chuẩn từ #k=');
var t2 = Logic.extractTokenFromLocation('#demo', '');
assert(t2.isDemo === true, 'Nhận diện chế độ #demo');
var t3 = Logic.extractTokenFromLocation('', '?k=LegacyToken12345');
assert(t3.token === 'LegacyToken12345' && t3.fromQuery === true, 'Hỗ trợ fallback nếu mở link ?k= cũ');

// 2b. Root URL auto-routing to Command Center (admin.html)
assert(Logic.shouldRedirectToAdmin('', '', '') === true,
  'Mở thẳng trang chủ (không có token) -> chuyển ngay sang Trung tâm Điều khiển');
assert(Logic.shouldRedirectToAdmin('#k=AbCdEf123456789012345678', '', '') === false,
  'Khách mở link #k=... -> ở lại trang phỏng vấn, không chuyển sang admin');
assert(Logic.shouldRedirectToAdmin('', '?k=LegacyToken12345', '') === false,
  'Khách mở link ?k=... -> ở lại trang phỏng vấn, không chuyển sang admin');
assert(Logic.shouldRedirectToAdmin('', '', 'SavedSessionToken12345') === false,
  'Khách bấm F5 tải lại khi đã có sessionStorage token -> giữ nguyên phiên phỏng vấn');

// 3. Evidence Pinning False-Positive Prevention Tests (các case chốt trong bản v2!)
var vagueWords = ['rất tận tâm', 'khách rất thích', 'chuyên nghiệp', 'uy tín', 'chất lượng cao'];

// Case 1.4.1: Dán 2 link (min_words: 0, check_vague: false) -> KHÔNG báo ngắn
var r141 = Logic.evaluateEvidence({ min_words: 0, check_vague: false }, 'https://fb.com/a\nhttps://linkedin.com/in/a', vagueWords);
assert(r141.needsPrompt === false && r141.flags.length === 0,
  '1.4.1 (dán 2 link) KHÔNG báo lỗi ngan');

// Case 1.1.5: Quỹ thời gian 13 từ (min_words: 8, check_vague: false) -> KHÔNG báo ngắn
var r115 = Logic.evaluateEvidence({ min_words: 8, check_vague: false }, '4 giờ/tuần vào sáng thứ 7, làm một mình có 1 trợ lý', vagueWords);
assert(r115.needsPrompt === false,
  '1.1.5 (13 từ rõ ràng) KHÔNG báo lỗi ngan');

// Case 1.2.2: Tin nhắn khách khen có từ "rất tận tâm" (check_vague: false) -> KHÔNG báo mơ hồ
var r122 = Logic.evaluateEvidence({ min_words: 15, check_vague: false },
  'Khách nhắn: Em làm việc rất tận tâm và chuyên nghiệp, lần nào anh gặp sự cố cũng gọi em đầu tiên để nhờ xử lý', vagueWords);
assert(r122.needsPrompt === false,
  '1.2.2 (trích tin nhắn có "rất tận tâm") KHÔNG báo mơ hồ oan');

// Case 2.2.2: Định vị loại trừ có từ phủ định "chuyên nghiệp" (check_vague: false) -> KHÔNG báo mơ hồ
var r222 = Logic.evaluateEvidence({ min_words: 15, check_vague: false },
  'Tôi tuyệt đối không muốn bị gắn mác kiểu chuyên gia hô khẩu hiệu thiếu chuyên nghiệp và hay lùa gà trên mạng xã hội', vagueWords);
assert(r222.needsPrompt === false,
  '2.2.2 (câu phủ định chứa "chuyên nghiệp") KHÔNG báo mơ hồ oan');

// Case 1.3.1: Nói chung chung không có số liệu (min_words: 15, check_vague: true) -> BÁO ĐÚNG ngan + mo_ho
var r131Bad = Logic.evaluateEvidence({ min_words: 15, check_vague: true }, 'Tôi làm việc rất tận tâm nên khách rất thích', vagueWords);
assert(r131Bad.needsPrompt === true &&
  r131Bad.flags.indexOf('ngan') !== -1 &&
  r131Bad.flags.indexOf('mo_ho') !== -1 &&
  r131Bad.matchedVague.length === 2,
  '1.3.1 chung chung, không số liệu -> bắt đúng cờ ngan + mo_ho và lưu đủ 2 cụm từ matchedVague');

// Case 1.3.1: Có từ "rất tận tâm" NHƯNG đã kèm số liệu cứng "40%" và đủ dài -> ngoại lệ số liệu hoạt động!
var r131Num = Logic.evaluateEvidence({ min_words: 15, check_vague: true },
  'Nhờ quy trình chăm sóc rất tận tâm nên phòng khám tăng 40% doanh thu trong 6 tháng qua và giữ chân được 120 khách cũ', vagueWords);
assert(r131Num.needsPrompt === false,
  '1.3.1 có cụm từ mơ hồ nhưng đã kèm con số định lượng (40%, 6 tháng, 120 khách) -> không làm phiền khách');

// Case 1.3.1: Có từ "uy tín" NHƯNG có dấu ngoặc kép trích dẫn nguyên văn -> ngoại lệ trích dẫn hoạt động!
var r131Quote = Logic.evaluateEvidence({ min_words: 15, check_vague: true },
  'Giám đốc công ty đối tác từng nhận xét công khai: "Đây là đơn vị uy tín nhất chúng tôi từng hợp tác trong ngành này"', vagueWords);
assert(r131Quote.needsPrompt === false,
  '1.3.1 có dấu ngoặc kép trích dẫn nguyên văn -> không báo mơ hồ oan');

// 4. Progress & Active Stage
assert(Logic.determineActiveStage([1, 2], [1]) === 2, 'Ưu tiên giai đoạn cao nhất đang mở và chưa khóa (GĐ2)');
assert(Logic.determineActiveStage([1], [1]) === 1, 'Nếu tất cả giai đoạn đều khóa vẫn trả về giai đoạn cao nhất');

var prog = Logic.computeStageProgress(
  [{ code: '1.1.2', stage: 1 }, { code: '1.1.3', stage: 1 }, { code: '2.1.1', stage: 2 }],
  { '1.1.2': { answer: 'ok' }, '1.1.3': { answer: '', flags: ['lam_sau'] } },
  1
);
assert(prog.total === 2 && prog.answered === 1 && prog.skipped === 1 && prog.percent === 50,
  'Tính tiến độ chính xác theo từng giai đoạn (1/2 = 50%, 1 làm sau)');

// 5. Offline Queue Dedup
var q = [];
q = Logic.enqueuePendingSave(q, { code: '1.1.2', round: 'R1', answer: 'v1' });
q = Logic.enqueuePendingSave(q, { code: '1.1.2', round: 'R1', answer: 'v2' });
q = Logic.enqueuePendingSave(q, { code: '1.1.3', round: 'R1', answer: 'a' });
assert(q.length === 2 && q[1].answer === 'a' && q[0].answer === 'v2',
  'Hàng đợi offline khử trùng theo (code, round), giữ bản mới nhất');
q = Logic.dequeuePendingSave(q, '1.1.2', 'R1');
assert(q.length === 1 && q[0].code === '1.1.3', 'dequeuePendingSave xóa đúng mục đã đồng bộ');

// 6. Smart Navigation from Review screen
var navQs = [
  { code: '1.1.2', stage: 1, locked: false },
  { code: '1.1.3', stage: 1, locked: false },
  { code: '1.1.4', stage: 1, locked: false },
  { code: '1.1.5', stage: 1, locked: false }
];
var navResp = {
  '1.1.2': { answer: 'đã trả lời' },
  '1.1.4': { answer: 'đã trả lời' }
};
// Mở câu chưa làm 1.1.3 (idx 1) từ màn Xem lại -> nhảy thẳng sang câu chưa làm kế tiếp 1.1.5 (idx 3), bỏ qua 1.1.4 đã làm!
var tNextUnans = Logic.findNextNavigationTarget({
  questions: navQs,
  responses: navResp,
  currentIndex: 1,
  activeStage: 1,
  returnToReviewMode: true,
  openedUnansweredFromReview: true
});
assert(tNextUnans.type === 'question' && tNextUnans.index === 3,
  'Từ màn Xem lại: xong câu chưa trả lời 1.1.3 -> nhảy thẳng sang câu chưa trả lời kế tiếp 1.1.5 (bỏ qua 1.1.4 đã làm)');

// Sau khi làm xong cả 1.1.3 và 1.1.5 -> không còn câu chưa làm nào -> quay thẳng về Review!
navResp['1.1.3'] = { answer: 'vừa điền' };
navResp['1.1.5'] = { answer: 'vừa điền' };
var tBackReview = Logic.findNextNavigationTarget({
  questions: navQs,
  responses: navResp,
  currentIndex: 3,
  activeStage: 1,
  returnToReviewMode: true,
  openedUnansweredFromReview: true
});
assert(tBackReview.type === 'review',
  'Từ màn Xem lại: xong câu chưa trả lời cuối cùng -> quay thẳng về màn Xem lại');

// Nếu mở câu ĐÃ trả lời (1.1.2) từ màn Xem lại để sửa trong khi 1.1.5 vẫn trống -> quay thẳng về Review!
delete navResp['1.1.5'];
var tEditAnswered = Logic.findNextNavigationTarget({
  questions: navQs,
  responses: navResp,
  currentIndex: 0,
  activeStage: 1,
  returnToReviewMode: true,
  openedUnansweredFromReview: false
});
assert(tEditAnswered.type === 'review',
  'Từ màn Xem lại: sửa câu đã trả lời 1.1.2 -> quay thẳng về màn Xem lại');

print('\n==============================');
print('CLIENT LOGIC TESTS: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  throw new Error('Client logic test suite failed with ' + failed + ' failures');
}
