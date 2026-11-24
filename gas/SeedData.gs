/**
 * SeedData.gs
 * Dữ liệu chuẩn theo biểu mẫu MECE 4 giai đoạn (đầy đủ 26 câu GĐ1-2 + 13 câu GĐ3-4 sẵn sàng mở rộng),
 * 3 bộ Template, và các tham số/prompt đánh giá chuẩn trong tab Config.
 * Danh xưng thống nhất: anh/chị.
 */

function getSeedQuestions_() {
  return [
    // ==================== GIAI ĐOẠN 1 (15 câu: 6 live, 4 hybrid, 5 self) ====================
    {
      code: '1.1.1', stage: 1, group: '1.1', order: 1, active: true,
      mode: 'live', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Sự kiện hoặc bước ngoặt nào khiến anh/chị quyết định phải xây dựng thương hiệu cá nhân ngay lúc này mà không phải 6 tháng nữa?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Đo lường mức độ cấp bách (Urgency) và nỗi đau thực sự đằng sau quyết định thuê tư vấn.',
      probes: 'Có phải gần đây anh/chị vừa mất một cơ hội lớn vào tay một người kém chuyên môn hơn nhưng nổi tiếng hơn không?|Nếu trì hoãn thêm 6 tháng, điều tệ nhất gì sẽ xảy ra?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.1.2', stage: 1, group: '1.1', order: 2, active: true,
      mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Nếu không làm thương hiệu cá nhân trong 1 năm tới, công việc/doanh nghiệp của anh/chị sẽ mất đi cơ hội cụ thể nào?',
      question_self: 'Nếu trong 12 tháng tới anh/chị vẫn giữ nguyên cách làm hiện tại (chưa xây thương hiệu cá nhân trong lĩnh vực {field}), công việc hoặc doanh nghiệp của anh/chị có thể bỏ lỡ những cơ hội cụ thể nào?',
      self_hint: 'Anh/chị hãy ước lượng cụ thể bằng con số nếu có: khoảng doanh thu bị bỏ lỡ, số lượng khách hàng mới/tháng, cơ hội hợp tác hoặc vị thế cạnh tranh.',
      hidden_goal: 'Chuyển hóa mong muốn mơ hồ thành "chi phí cơ hội" đo lường được.',
      probes: 'Anh/chị có thể ước tính khoảng doanh thu hoặc số lượng khách hàng bị bỏ lỡ nếu chỉ dựa vào kênh truyền thống hiện tại?',
      min_words: 20, check_vague: true
    },
    {
      code: '1.1.3', stage: 1, group: '1.1', order: 3, active: true,
      mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Sau 6–12 tháng, kết quả cụ thể nào sẽ khiến anh/chị khẳng định việc đầu tư này thành công?',
      question_self: 'Sau 6–12 tháng tới, kết quả cụ thể nào sẽ khiến anh/chị khẳng định việc đầu tư xây dựng thương hiệu cá nhân lần này là thành công?',
      self_hint: 'Gợi ý: nêu con số mục tiêu rõ ràng (số khách hàng, mức doanh thu, lời mời hợp tác hoặc mức độ nhận diện). Ở buổi gặp trực tiếp, chúng ta sẽ cùng chốt 1 ưu tiên số 1.',
      hidden_goal: 'Chốt KPI kỳ vọng (Nhận diện vs. Uy tín vs. Doanh thu) để tránh lệch pha nghiệm thu.',
      probes: 'Nếu chỉ được chọn MỘT trong ba: nhiều người biết tới, được đồng nghiệp nể trọng, hay có thêm khách hàng trả tiền cao — anh/chị chọn cái nào?',
      min_words: 15, check_vague: true
    },
    {
      code: '1.1.4', stage: 1, group: '1.1', order: 4, active: true,
      mode: 'hybrid', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Có điều gì anh/chị tuyệt đối không muốn đánh đổi để đổi lấy sự nổi tiếng hoặc lượng tương tác?',
      question_self: 'Có ranh giới, chủ đề đời tư hoặc kiểu xuất hiện nào anh/chị tuyệt đối KHÔNG muốn đánh đổi để đổi lấy tương tác hay sự nổi tiếng?',
      self_hint: 'Ví dụ: không lộ mặt gia đình/con cái, không tranh luận drama ngành, ngại quay video lộ mặt, hoặc nguyên tắc bảo mật tên khách hàng.',
      hidden_goal: 'Xác định vùng an toàn tâm lý và ranh giới đạo đức/đời tư của client.',
      probes: 'Anh/chị có ngại xuất hiện trước ống kính không?|Anh/chị phản ứng thế nào nếu có bình luận trái chiều hoặc công kích cá nhân?',
      min_words: 15, check_vague: false
    },
    {
      code: '1.1.5', stage: 1, group: '1.1', order: 5, active: true,
      mode: 'self', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Mỗi tuần anh/chị có thể cam kết chính xác bao nhiêu giờ trực tiếp cho việc chia sẻ chất liệu/ghi hình, và đội ngũ hỗ trợ hiện có là gì?',
      question_self: 'Mỗi tuần (tính cả những tuần bận rộn nhất trong 3 tháng qua), anh/chị có thể dành chắc chắn bao nhiêu giờ cho việc chia sẻ chất liệu/ghi hình, và hiện có ai hỗ trợ anh/chị (trợ lý, viết bài, quay dựng...)?',
      self_hint: 'Anh/chị chỉ cần trả lời thật sát lịch làm việc thực tế, ví dụ: "3 giờ/tuần vào sáng thứ 7; hiện làm một mình và có 1 nhân sự thiết kế freelance".',
      hidden_goal: 'Đánh giá tính khả thi vận hành (Operational Feasibility) để chọn định dạng nội dung vừa sức.',
      probes: 'Trong 3 tháng qua, tuần bận rộn nhất của anh/chị diễn ra như thế nào? Lúc đó anh/chị có giữ được lịch trình này không?',
      min_words: 8, check_vague: false
    },
    {
      code: '1.2.1', stage: 1, group: '1.2', order: 6, active: true,
      mode: 'live', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Trong suốt quá trình làm nghề, vấn đề hóc búa nào anh/chị giải quyết tốt hơn phần lớn đồng nghiệp cùng lĩnh vực?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Tìm ra "Vũ khí sắc bén nhất" (Unfair Advantage) thay vì liệt kê kỹ năng chung chung.',
      probes: 'Tại sao người khác thường bó tay hoặc làm hỏng ở bước đó, còn anh/chị thì xử lý được?|Bí quyết nằm ở công cụ, quy trình hay kinh nghiệm xương máu nào?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.2.2', stage: 1, group: '1.2', order: 7, active: true,
      mode: 'self', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Khi người quen hoặc đồng nghiệp gặp khó khăn, họ thường tìm đến anh/chị để nhờ tư vấn hoặc "cứu nguy" về việc gì nhất?',
      question_self: 'Khi người quen, khách hàng hoặc đồng nghiệp gặp rắc rối, họ hay tìm đến anh/chị để nhờ gỡ rối việc gì nhất? Anh/chị hãy trích dẫn 1–2 tin nhắn/cuộc gọi gần nhất.',
      self_hint: 'Mẹo hay nhất: mở Zalo/Messenger, copy-paste nguyên văn 1–2 câu hỏi gần đây người khác nhắn nhờ anh/chị.',
      hidden_goal: 'Khai thác định vị tự nhiên mà thị trường đang ngầm công nhận.',
      probes: 'Anh/chị hãy kể lại cuộc gọi hoặc tin nhắn gần nhất mà ai đó nhờ anh/chị gỡ rối. Họ đã hỏi chính xác câu gì?',
      min_words: 15, check_vague: false
    },
    {
      code: '1.2.3', stage: 1, group: '1.2', order: 8, active: true,
      mode: 'live', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Đâu là thất bại hoặc sai lầm nghề nghiệp lớn nhất từng buộc anh/chị phải thay đổi hoàn toàn cách tư duy/làm việc?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Khai thác chất liệu câu chuyện chân thực (Authenticity) và chiều sâu bài học nghề nghiệp.',
      probes: 'Cái giá phải trả lúc đó là gì?|Sau cú ngã đó, nguyên tắc làm việc của anh/chị đã thay đổi khác đi như thế nào?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.2.4', stage: 1, group: '1.2', order: 9, active: true,
      mode: 'live', branch: '', output: 'Hồ sơ năng lực',
      question_live: 'Có giá trị hay nguyên tắc làm nghề nào anh/chị sẵn sàng từ chối khách hàng/cơ hội lớn nếu bị vi phạm?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Xác định "Xương sống giá trị" để tạo sự khác biệt và thu hút đúng tệp khách hàng đồng điệu.',
      probes: 'Anh/chị đã từng từ chối một hợp đồng/khách hàng nào vì lý do này chưa? Kể lại tình huống đó.',
      min_words: 0, check_vague: false
    },
    {
      code: '1.3.1', stage: 1, group: '1.3', order: 10, active: true,
      mode: 'self', branch: '', output: 'Kho bằng chứng thô',
      question_live: 'Anh/chị đã tạo ra những kết quả đo lường được nào cho bản thân, tổ chức hoặc khách hàng?',
      question_self: 'Anh/chị hãy liệt kê 3–5 kết quả đo lường được rõ nhất đã tạo ra cho bản thân, tổ chức hoặc khách hàng trong lĩnh vực {field}.',
      self_hint: 'Càng có con số Trước -> Sau (%, doanh thu, chi phí tiết kiệm, thời gian rút ngắn...) càng tốt. Anh/chị có thể dán kèm link tài liệu/Drive nếu có.',
      hidden_goal: 'Thu thập dữ liệu định lượng cứng (Hard Proof) để làm đòn bẩy niềm tin.',
      probes: 'Con số trước và sau khi có sự tham gia của anh/chị thay đổi cụ thể bao nhiêu % hoặc bao nhiêu tiền?|Có tài liệu, ảnh chụp hay báo cáo nào lưu lại không?',
      min_words: 15, check_vague: true
    },
    {
      code: '1.3.2', stage: 1, group: '1.3', order: 11, active: true,
      mode: 'hybrid', branch: '', output: 'Kho bằng chứng thô',
      question_live: 'Anh/chị hãy kể 2–3 trường hợp khách hàng/dự án tiêu biểu nhất theo mạch: Bế tắc -> Giải pháp -> Thay đổi.',
      question_self: 'Anh/chị hãy tóm tắt 2–3 khách hàng hoặc dự án tiêu biểu nhất từng xử lý theo đúng khung 3 bước:\n1) Bế tắc ban đầu của họ\n2) Giải pháp anh/chị đã làm\n3) Kết quả thay đổi sau đó.',
      self_hint: 'Không cần viết văn hoa; anh/chị chỉ cần gạch đầu dòng rõ tình huống thật (có thể ẩn tên khách thành "Khách A - ngành X"). Buổi gặp trực tiếp ta sẽ chọn 1 ca mạnh nhất để đào sâu.',
      hidden_goal: 'Xây dựng kho Case Study 3C chuẩn mực.',
      probes: 'Khách hàng đó đã từng thử cách nào khác trước khi tìm đến anh/chị mà không hiệu quả?|Điều gì khiến họ bất ngờ nhất trong quá trình làm việc với anh/chị?',
      min_words: 40, check_vague: true
    },
    {
      code: '1.3.3', stage: 1, group: '1.3', order: 12, active: true,
      mode: 'self', branch: '', output: 'Kho bằng chứng thô',
      question_live: 'Anh/chị đã có những bằng chứng xã hội nào (lời chứng thực, báo chí, lời mời diễn giả, sự giới thiệu từ người uy tín)?',
      question_self: 'Anh/chị hãy kiểm kê các bằng chứng xã hội đang có: bài báo, giải thưởng, lời mời diễn giả, chứng chỉ, nhận xét công khai, hoặc đối tác/khách hàng uy tín sẵn sàng giới thiệu anh/chị.',
      self_hint: 'Liệt kê gạch đầu dòng kèm link (nếu có). Ghi chú thêm nếu có 1–2 khách hàng cũ sẵn sàng viết nhận xét/quay clip ngắn cho anh/chị trong tuần này.',
      hidden_goal: 'Kiểm kê vốn tín nhiệm xã hội (Social Proof) hiện có.',
      probes: 'Trong số các khách hàng cũ, ai là người sẵn sàng quay video hoặc viết một đoạn nhận xét công khai cho anh/chị ngay tuần này?',
      min_words: 10, check_vague: false
    },
    {
      code: '1.4.1', stage: 1, group: '1.4', order: 13, active: true,
      mode: 'self', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Một người lạ vào trang cá nhân của anh/chị trong 5 giây đầu tiên có hiểu ngay anh/chị giải quyết vấn đề gì cho ai không?',
      question_self: 'Anh/chị hãy dán đường link các trang cá nhân / kênh công việc đang dùng (Facebook, LinkedIn, TikTok, YouTube, Website...) để chuyên gia chạy bài kiểm tra 5 giây trước buổi gặp.',
      self_hint: 'Anh/chị chỉ cần dán các link đang hoạt động (mỗi link 1 dòng). Nếu chưa có kênh nào, ghi "Chưa có kênh công khai".',
      hidden_goal: 'Kiểm toán khả năng nhận diện (Biết) ở điểm chạm đầu tiên.',
      probes: 'Nếu đưa link Facebook/LinkedIn của anh/chị cho 5 người lạ, họ sẽ đoán anh/chị đang làm nghề gì?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.4.2', stage: 1, group: '1.4', order: 14, active: true,
      mode: 'live', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Có điểm nào trong cách xuất hiện hiện tại khiến anh/chị cảm thấy đang phải "gồng" hoặc cố trở thành người khác?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Phát hiện sự đứt gãy trong Tam giác niềm tin (cạnh Chân thực).',
      probes: 'Dạng bài viết hoặc cách nói chuyện nào khiến anh/chị cảm thấy mệt mỏi, gượng gạo nhất mỗi khi đăng lên?',
      min_words: 0, check_vague: false
    },
    {
      code: '1.4.3', stage: 1, group: '1.4', order: 15, active: true,
      mode: 'live', branch: '', output: 'Bản đồ hiện trạng & rào cản',
      question_live: 'Sự chênh lệch lớn nhất giữa năng lực thực tế của anh/chị và những gì thị trường đang nhìn thấy ở anh/chị là gì?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Xác định "Khoảng trống định vị" (Positioning Gap) cần lấp đầy.',
      probes: 'Điều gì anh/chị làm rất giỏi ở ngoài đời nhưng trên mạng xã hội tuyệt nhiên chưa ai biết tới?',
      min_words: 0, check_vague: false
    },

    // ==================== GIAI ĐOẠN 2 (11 câu: 2 live, 4 hybrid, 5 self) ====================
    {
      code: '2.1.1', stage: 2, group: '2.1', order: 16, active: true,
      mode: 'hybrid', branch: '', output: 'Chân dung khách hàng',
      question_live: 'Trong số những người anh/chị có thể giúp, nhóm khách hàng nào vừa có nỗi đau cấp bách nhất, vừa có khả năng chi trả tương xứng?',
      question_self: 'Trong tất cả những nhóm người anh/chị có thể giúp bằng chuyên môn {field}, anh/chị hãy chọn trước 1–2 nhóm khách hàng muốn ưu tiên phục vụ nhất (vừa có vấn đề cấp bách, vừa sẵn sàng chi trả).',
      self_hint: 'Mô tả cụ thể vai trò/ngành/quy mô của họ (ví dụ: "Chủ phòng khám nha khoa 1–3 cơ sở doanh thu 500tr–2 tỷ/tháng" thay vì "chủ doanh nghiệp"). Các câu 2.1.2, 2.1.3 tiếp theo sẽ xoay quanh chính nhóm này.',
      hidden_goal: 'Thu hẹp tệp khách hàng mục tiêu, tránh bẫy "phục vụ tất cả mọi người".',
      probes: 'Ai là người sẵn sàng trả tiền ngay trong vòng 1 tuần nếu anh/chị giải quyết được vấn đề cho họ?|Nhóm khách hàng nào khiến anh/chị tốn nhiều công sức chăm sóc nhất nhưng lại trả phí thấp nhất?',
      min_words: 15, check_vague: true
    },
    {
      code: '2.1.2', stage: 2, group: '2.1', order: 17, active: true,
      mode: 'self', branch: '', output: 'Chân dung khách hàng',
      question_live: 'Họ đang ở trong hoàn cảnh nào khi bắt đầu tìm kiếm giải pháp? Điều gì khiến họ nghi ngờ khi chọn chuyên gia?',
      question_self: 'Với chính nhóm khách hàng anh/chị vừa nêu ở câu trước: họ thường rơi vào tình huống nào khi bắt đầu đi tìm giải pháp, và câu hỏi nghi ngờ đầu tiên họ hay đặt ra là gì?',
      self_hint: 'Gợi ý: kể lại những lần họ từng mất tiền oan với giải pháp khác, hoặc dán nguyên văn những câu băn khoăn khách hay hỏi anh/chị trước khi xuống tiền.',
      hidden_goal: 'Khai thác tâm lý mua hàng (Buyer Psychology) và rào cản niềm tin.',
      probes: 'Họ đã từng bị "mất tiền oan" hoặc thất vọng với những giải pháp/chuyên gia nào trước đây?|Câu hỏi nghi ngờ đầu tiên họ thường đặt ra cho anh/chị là gì?',
      min_words: 20, check_vague: true
    },
    {
      code: '2.1.3', stage: 2, group: '2.1', order: 18, active: true,
      mode: 'self', branch: '', output: 'Chân dung khách hàng',
      question_live: 'Khi gặp vấn đề đó, họ thường tìm kiếm thông tin, hỏi ý kiến hoặc theo dõi ai trên các nền tảng?',
      question_self: 'Nhóm khách hàng anh/chị nêu ở 2.1.1 thường tìm thông tin ở đâu (tên cụ thể các hội nhóm Facebook, kênh YouTube, podcast, báo ngành, sự kiện hoặc người ảnh hưởng họ theo dõi)?',
      self_hint: 'Càng ghi tên cụ thể (ví dụ tên group, tên kênh, tên cộng đồng) càng giúp thiết kế bản đồ phân phối chính xác.',
      hidden_goal: 'Xác định bản đồ kênh phân phối và hệ sinh thái ảnh hưởng của khách hàng.',
      probes: 'Họ đọc báo/group nào, nghe podcast gì, hay thường hỏi ý kiến ai trong công ty trước khi ra quyết định?',
      min_words: 10, check_vague: false
    },
    {
      code: '2.2.1', stage: 2, group: '2.2', order: 19, active: true,
      mode: 'hybrid', branch: '', output: 'Tuyên bố định vị',
      question_live: 'Cách tiếp cận hoặc quy trình giải quyết vấn đề của anh/chị có điểm gì khác biệt so với cách làm phổ biến trên thị trường?',
      question_self: 'Anh/chị hãy liệt kê tên 3 đối thủ hoặc chuyên gia nổi bật cùng phục vụ nhóm khách hàng của anh/chị, và nêu rõ điểm khác biệt trong quy trình/cách tiếp cận của anh/chị (không tính yếu tố giá rẻ).',
      self_hint: 'Ghi tên cụ thể 3 đối thủ/chuyên gia (hoặc 3 nhóm giải pháp phổ biến) + 1–2 điểm cách làm của anh/chị đi ngược hoặc sâu hơn họ.',
      hidden_goal: 'Tìm ra góc cạnh sắc bén (Edge) để tạo lợi thế cạnh tranh không thể sao chép.',
      probes: 'Nếu đặt dịch vụ của anh/chị cạnh 3 đối thủ lớn nhất, lý do duy nhất khiến khách hàng chọn anh/chị (không phải vì giá rẻ) là gì?',
      min_words: 25, check_vague: true
    },
    {
      code: '2.2.2', stage: 2, group: '2.2', order: 20, active: true,
      mode: 'self', branch: '', output: 'Tuyên bố định vị',
      question_live: 'Anh/chị tuyệt đối không muốn thương hiệu cá nhân của mình bị gắn với nhãn mác hay định kiến nào?',
      question_self: 'Trong ngành {field}, kiểu người làm thương hiệu cá nhân nào khiến anh/chị cảm thấy phản cảm nhất, và anh/chị tuyệt đối không muốn bị gắn nhãn mác nào?',
      self_hint: 'Anh/chị cứ nói thẳng quan điểm thật của mình — đây là chất liệu cực mạnh để định hình bản sắc không bị nhạt nhòa.',
      hidden_goal: 'Thiết lập "Định vị loại trừ" (Anti-positioning) để định hình phong cách sắc nét.',
      probes: 'Trong ngành của anh/chị, kiểu người làm thương hiệu cá nhân nào khiến anh/chị cảm thấy phản cảm nhất? Vì sao?',
      min_words: 15, check_vague: false
    },
    {
      code: '2.2.3', stage: 2, group: '2.2', order: 21, active: true,
      mode: 'live', branch: '', output: 'Tuyên bố định vị',
      question_live: 'Nếu khách hàng chỉ nhớ duy nhất một câu về giá trị anh/chị mang lại cho họ, anh/chị muốn đó là câu gì?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Cô đọng tuyên bố định vị (Positioning Statement) thành thông điệp neo giữ.',
      probes: 'Anh/chị hãy thử nói câu đó theo ngôn ngữ đời thường của khách hàng, không dùng bất kỳ thuật ngữ chuyên ngành nào.',
      min_words: 0, check_vague: false
    },
    {
      code: '2.3.1A', stage: 2, group: '2.3', order: 22, active: true,
      mode: 'self', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Sản phẩm/dịch vụ nào đang mang lại biên lợi nhuận tốt nhất và gắn trực tiếp với chuyên môn của anh/chị?',
      question_self: 'Anh/chị hãy liệt kê các sản phẩm/dịch vụ đang bán kèm khoảng giá, biên lợi nhuận (ước lượng %), sản phẩm nào dễ chốt nhất khi khách đã tin, và sản phẩm nào anh/chị không muốn đẩy mạnh nữa.',
      self_hint: 'Ví dụ gạch đầu dòng: "Gói tư vấn 1-1: 30tr, biên ~70%, dễ chốt nhất | Gói vận hành thuê ngoài: 15tr/tháng, biên thấp, không muốn đẩy".',
      hidden_goal: 'Gắn thương hiệu cá nhân vào "con gà đẻ trứng vàng" thay vì quảng bá dàn trải.',
      probes: 'Sản phẩm nào dễ chốt sales nhất khi khách hàng đã tin tưởng anh/chị?|Có sản phẩm nào anh/chị đang bán nhưng thực chất không muốn đẩy mạnh nữa không?',
      min_words: 10, check_vague: false
    },
    {
      code: '2.3.2A', stage: 2, group: '2.3', order: 23, active: true,
      mode: 'hybrid', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Có khoảng cách nào giữa lời hứa thương hiệu cá nhân của anh/chị và trải nghiệm thực tế của đội ngũ?',
      question_self: 'Khi khách hàng tìm đến vì uy tín của anh/chị nhưng người trực tiếp triển khai là đội ngũ (hoặc quy trình hiện tại), từng có phàn nàn hay khoảng cách nào giữa kỳ vọng và thực tế chưa?',
      self_hint: 'Chia sẻ thật các điểm khách hay góp ý (tốc độ phản hồi, chất lượng nhân sự phụ trách, khâu hậu mãi...). Nếu anh/chị tự làm 100%, hãy nêu điểm nào trong quy trình hiện khiến anh/chị chưa hài lòng nhất.',
      hidden_goal: 'Ngăn ngừa rủi ro "thương hiệu cá nhân kéo khách về, vận hành đuổi khách đi".',
      probes: 'Khi khách hàng đến vì tên tuổi của anh/chị nhưng người trực tiếp làm là nhân viên, họ có phàn nàn gì không?',
      min_words: 20, check_vague: true
    },
    {
      code: '2.3.3A', stage: 2, group: '2.3', order: 24, active: true,
      mode: 'hybrid', branch: 'A', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Nếu tháng sau thương hiệu cá nhân mang về thêm 20–30 khách hàng chất lượng, quy trình của anh/chị có xử lý kịp không?',
      question_self: 'Hiện tại mỗi tháng anh/chị hoặc đội ngũ phục vụ tối đa được bao nhiêu khách hàng? Nếu tháng sau có thêm 20–30 khách hỏi mua, khâu nào sẽ bị quá tải đầu tiên (tư vấn chốt đơn hay triển khai dịch vụ)?',
      self_hint: 'Nêu rõ con số năng lực tối đa hiện tại (vd: "tối đa 5 khách/tháng") và bước nào hiện đang phụ thuộc hoàn toàn vào thời gian của chính anh/chị.',
      hidden_goal: 'Kiểm tra điểm nghẽn năng lực cung ứng (Delivery Bottleneck).',
      probes: 'Khâu nào sẽ bị gãy đầu tiên nếu lượng khách tăng gấp đôi: khâu tư vấn chốt đơn hay khâu triển khai dịch vụ?',
      min_words: 20, check_vague: true
    },
    {
      code: '2.3.1B', stage: 2, group: '2.3', order: 25, active: true,
      mode: 'live', branch: 'B', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Anh/chị muốn chuyển hóa chuyên môn này thành hình thức tạo thu nhập nào trong 6 tháng tới?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Định hướng mô hình kiếm tiền khả thi (Tư vấn 1-1, Đào tạo, Dịch vụ, Sản phẩm số).',
      probes: 'Với quỹ thời gian hiện tại, hình thức nào giúp anh/chị tạo ra dòng tiền đầu tiên nhanh nhất mà không cần đầu tư vốn lớn?',
      min_words: 0, check_vague: false
    },
    {
      code: '2.3.2B', stage: 2, group: '2.3', order: 26, active: true,
      mode: 'self', branch: 'B', output: 'Cấu trúc sản phẩm & phễu chuyển đổi',
      question_live: 'Đã có ai từng sẵn sàng trả tiền cho lời khuyên/sự hỗ trợ của anh/chị chưa?',
      question_self: 'Đã từng có ai trả tiền cho lời khuyên/sự hỗ trợ của anh/chị trong lĩnh vực {field} chưa (kể cụ thể gói gì, bao nhiêu tiền)? Nếu tuần tới mở gói thử nghiệm cho 5 người đầu tiên, anh/chị sẽ nhắn mời đích danh những ai?',
      self_hint: 'Liệt kê cụ thể các lần đã nhận tiền (hoặc ghi "Chưa") và danh sách 5 kiểu người/tên gọi tắt trong mối quan hệ hiện có anh/chị có thể mời thử nghiệm ngay.',
      hidden_goal: 'Kiểm chứng tín hiệu thị trường (Market Validation) trước khi xây nội dung.',
      probes: 'Nếu tuần tới anh/chị mở một gói tư vấn/dịch vụ thử nghiệm cho 5 người đầu tiên, anh/chị sẽ mời ai?',
      min_words: 10, check_vague: false
    },

    // ==================== GIAI ĐOẠN 3 (7 câu – sẵn sàng mở qua stages_open) ====================
    {
      code: '3.1.1', stage: 3, group: '3.1', order: 27, active: true,
      mode: 'self', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: '5–10 câu hỏi khách hàng luôn hỏi anh/chị trước khi mua hàng, và 3–5 sai lầm phổ biến nhất khiến họ tự làm nhưng thất bại là gì?',
      question_self: 'Anh/chị hãy liệt kê 5–10 câu hỏi khách hàng cứ hỏi đi hỏi lại trước khi làm việc với anh/chị, và 3–5 sai lầm phổ biến nhất khiến họ tự làm nhưng hỏng.',
      self_hint: 'Càng giữ nguyên câu chữ thực tế của khách càng tốt — đây sẽ là kho chủ đề nội dung chuyên môn dùng trong nhiều tháng.',
      hidden_goal: 'Xây dựng kho chủ đề chuyên môn (Educational Pillars) đánh trúng nhu cầu tìm kiếm thực.',
      probes: 'Câu hỏi nào anh/chị phải giải thích đi giải thích lại cho khách hàng mới đến mức phát chán?|Sai lầm nào của khách hàng khiến anh/chị tốn nhiều công sức sửa chữa nhất?',
      min_words: 20, check_vague: false
    },
    {
      code: '3.1.2', stage: 3, group: '3.1', order: 28, active: true,
      mode: 'hybrid', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: 'Trong ngành của anh/chị, quan điểm phổ biến nào đang khiến khách hàng hiểu sai hoặc hành động sai?',
      question_self: 'Trong ngành {field}, có 2–3 lời khuyên sáo rỗng hoặc quan điểm phổ biến nào đang tràn lan trên mạng mà anh/chị thấy sai hoặc gây hại cho khách hàng? Bằng chứng thực tế của anh/chị là gì?',
      self_hint: 'Viết theo mẫu: "Nhiều người hay khuyên [X] -> Thực tế mình gặp [Y] dẫn đến hậu quả [Z]".',
      hidden_goal: 'Xây dựng tuyến bài góc nhìn sắc bén (Thought-provoking / Contrarian Content).',
      probes: 'Lời khuyên sáo rỗng nào đang tràn lan trên mạng về lĩnh vực của anh/chị mà anh/chị thấy rất vô lý?|Anh/chị có bằng chứng thực tế nào để chứng minh điều ngược lại?',
      min_words: 20, check_vague: true
    },
    {
      code: '3.1.3', stage: 3, group: '3.1', order: 29, active: true,
      mode: 'hybrid', branch: '', output: 'Thư viện Case study 3C',
      question_live: 'Những khía cạnh đời sống, hậu trường làm việc hoặc câu chuyện vượt khó nào anh/chị sẵn sàng chia sẻ (và đâu là vùng cấm)?',
      question_self: 'Ngoài chuyên môn, những góc hậu trường công việc, sở thích cá nhân hoặc bài học đời sống nào anh/chị thấy thoải mái chia sẻ để khán giả thấy con người thật của mình?',
      self_hint: 'Gợi ý: đồng nghiệp thân thiết thường nhận xét tính cách ngoài đời của anh/chị có điểm gì thú vị khác lúc làm việc?',
      hidden_goal: 'Xây dựng tuyến bài kết nối cảm xúc (Empathy & Lifestyle) có kiểm soát.',
      probes: 'Đồng nghiệp thân thiết thường nhận xét tính cách ngoài đời của anh/chị có điểm gì thú vị/khác biệt so với lúc làm việc?',
      min_words: 15, check_vague: false
    },
    {
      code: '3.2.1', stage: 3, group: '3.2', order: 30, active: true,
      mode: 'hybrid', branch: '', output: 'Kịch bản trải nghiệm thử',
      question_live: 'Anh/chị có thể đóng gói một công cụ, checklist, tài liệu mẫu hoặc buổi chia sẻ ngắn nào giúp khách hàng đạt một kết quả nhỏ ngay lập tức?',
      question_self: 'Trong các file mẫu, checklist, bảng tính hay quy trình nội bộ anh/chị đang dùng hàng ngày, có công cụ nào tách ra tặng khách hàng là họ áp dụng thấy kết quả ngay được không?',
      self_hint: 'Anh/chị hãy liệt kê 2–3 tài sản có sẵn trên máy tính/Drive của mình.',
      hidden_goal: 'Thiết kế tài sản trải nghiệm thử (Lead Magnet / Productized Experience).',
      probes: 'Trong bộ công cụ nội bộ anh/chị đang dùng hàng ngày, có mẫu biểu hay quy trình nào tách ra tặng khách hàng là họ dùng được ngay không?',
      min_words: 15, check_vague: false
    },
    {
      code: '3.2.2', stage: 3, group: '3.2', order: 31, active: true,
      mode: 'live', branch: '', output: 'Kịch bản trải nghiệm thử',
      question_live: 'Trải nghiệm thử đó giúp khách hàng kiểm chứng được tư duy làm việc của anh/chị như thế nào trước khi chi tiền cho gói lớn?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Đảm bảo trải nghiệm thử liên kết chặt chẽ với sản phẩm cốt lõi (không tặng quà lệch tệp).',
      probes: 'Sau khi dùng xong tài liệu/buổi chia sẻ này, khách hàng sẽ nhận ra họ còn thiếu mảnh ghép lớn nào mà chỉ dịch vụ chính của anh/chị mới giải quyết được?',
      min_words: 0, check_vague: false
    },
    {
      code: '3.3.1', stage: 3, group: '3.3', order: 32, active: true,
      mode: 'self', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: 'Giữa viết lách, nói trước ống kính, đối thoại (podcast) hay trình bày trực tiếp (webinar), hình thức nào giúp anh/chị bộc lộ sự sắc bén tự nhiên nhất?',
      question_self: 'Khi cần giải thích một vấn đề phức tạp cho đồng nghiệp hoặc khách hàng, anh/chị thích nhất hình thức nào: viết bài, nói trước ống kính, trò chuyện kiểu podcast, hay trình bày/vẽ bảng trực tiếp?',
      self_hint: 'Xếp hạng từ hình thức anh/chị thấy tự nhiên nhất đến hình thức khiến anh/chị ngại nhất.',
      hidden_goal: 'Chọn định dạng sản xuất nội dung tối ưu hóa thế mạnh biểu đạt của client.',
      probes: 'Khi giải thích một vấn đề phức tạp cho người quen, anh/chị thích viết email dài, gửi tin nhắn thoại, hay vẽ ra giấy rồi nói?',
      min_words: 10, check_vague: false
    },
    {
      code: '3.3.2', stage: 3, group: '3.3', order: 33, active: true,
      mode: 'live', branch: '', output: 'Trụ cột nội dung (Pillars)',
      question_live: 'Đâu là 1 kênh chính để xây chiều sâu và 1–2 kênh phụ để lan tỏa phù hợp với tệp khách hàng và quỹ thời gian của anh/chị?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Tránh dàn trải nguồn lực đa kênh ngay từ đầu.',
      probes: 'Nếu chỉ được duy trì đều đặn 2 bài/tuần trên một nền tảng duy nhất trong 6 tháng, anh/chị chọn nền tảng nào?',
      min_words: 0, check_vague: false
    },

    // ==================== GIAI ĐOẠN 4 (6 câu – lặp theo quý bằng cột round) ====================
    {
      code: '4.1.1', stage: 4, group: '4.1', order: 34, active: true,
      mode: 'self', branch: '', output: 'Báo cáo chỉ số Nhận diện – Tin tưởng – Doanh thu',
      question_live: 'Những người mới tiếp cận có mô tả đúng chuyên môn của anh/chị không? Nội dung nào đang thu hút đúng tệp khách hàng mục tiêu nhất?',
      question_self: 'Trong 10 người mới nhắn tin/kết nối với anh/chị tháng qua, có bao nhiêu người đúng chân dung khách hàng mục tiêu? Họ thường nhắc tới bài viết hoặc video cụ thể nào của anh/chị?',
      self_hint: 'Ghi tỷ lệ cụ thể (ví dụ "6/10 người đúng tệp") và dán tiêu đề/link 2–3 bài viết kéo về nhiều tin nhắn đúng tệp nhất.',
      hidden_goal: 'Đo lường chất lượng nhận diện (Quality of Reach) thay vì chạy theo lượt thích ảo.',
      probes: 'Trong 10 người nhắn tin cho anh/chị tháng qua, có bao nhiêu người đúng chân dung khách hàng mục tiêu?|Họ nhắc đến bài viết/video cụ thể nào của anh/chị?',
      min_words: 15, check_vague: true
    },
    {
      code: '4.1.2', stage: 4, group: '4.1', order: 35, active: true,
      mode: 'self', branch: '', output: 'Báo cáo chỉ số Nhận diện – Tin tưởng – Doanh thu',
      question_live: 'Khách hàng có chủ động đặt vấn đề dựa trên nội dung anh/chị chia sẻ không? Băn khoăn nào vẫn lặp lại nhiều nhất ở khâu chốt sales?',
      question_self: 'Trong quý vừa qua, tỷ lệ khách chủ động hỏi mua từ nội dung của anh/chị là bao nhiêu, và 2–3 lý do từ chối phổ biến nhất ở khâu chốt đơn là gì (giá, chưa tin kết quả, chưa đúng thời điểm...)?',
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
      self_hint: 'Ghi rõ kênh/định dạng hiệu quả nhất và phần anh/chị muốn cắt bỏ ở quý tới.',
      hidden_goal: 'Tái phân bổ nguồn lực theo nguyên lý 80/20.',
      probes: 'Nếu phải cắt bỏ 50% khối lượng công việc làm nội dung hiện tại để giữ lại phần hiệu quả nhất, anh/chị sẽ giữ lại phần nào?',
      min_words: 15, check_vague: true
    },
    {
      code: '4.2.1', stage: 4, group: '4.2', order: 37, active: true,
      mode: 'live', branch: '', output: 'Lộ trình Thought Leadership',
      question_live: 'Từ những ca thành công thực tế đã tích lũy, anh/chị đã đúc kết được mô hình, công thức hoặc hệ thống tư duy mang tên riêng chưa?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Đóng gói tài sản trí tuệ (Intellectual Property) để nâng cấp lên tầng Thought Leadership.',
      probes: 'Nếu phải đặt tên cho quy trình 3–5 bước mà anh/chị luôn áp dụng thành công cho khách hàng, anh/chị sẽ gọi tên nó là gì?',
      min_words: 0, check_vague: false
    },
    {
      code: '4.2.2', stage: 4, group: '4.2', order: 38, active: true,
      mode: 'self', branch: '', output: 'Lộ trình Thought Leadership',
      question_live: 'Đã có đồng nghiệp, học viên hoặc khách hàng nào bắt đầu trích dẫn và áp dụng phương pháp của anh/chị vào công việc của họ chưa?',
      question_self: 'Đã có đồng nghiệp, học viên hay khách hàng nào trích dẫn lại thuật ngữ, bài viết hoặc áp dụng cách làm của anh/chị chưa? Anh/chị hãy ghi lại các dẫn chứng cụ thể.',
      self_hint: 'Liệt kê ví dụ/link bài chia sẻ lại hoặc ghi "Chưa có rõ rệt" nếu mới ở quý đầu.',
      hidden_goal: 'Kiểm chứng mức độ lan tỏa tư tưởng (Thought Leadership Validation).',
      probes: 'Có thuật ngữ, câu nói hay cách làm nào do anh/chị khởi xướng đang được mọi người trong ngành nhắc lại không?',
      min_words: 10, check_vague: false
    },
    {
      code: '4.2.3', stage: 4, group: '4.2', order: 39, active: true,
      mode: 'live', branch: '', output: 'Lộ trình Thought Leadership',
      question_live: 'Ở giai đoạn tiếp theo, anh/chị muốn dẫn dắt cộng đồng trong ngách của mình thay đổi một thói quen hay tiêu chuẩn nghề nghiệp nào?',
      question_self: '',
      self_hint: '',
      hidden_goal: 'Định hình tầm nhìn dẫn dắt dài hạn (Category Design / Movement).',
      probes: '5 năm nữa, khi nhắc đến tên anh/chị trong ngành này, anh/chị muốn người ta nói anh/chị đã thay đổi điều gì cho thị trường?',
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
      note: 'Phiên bản điều khoản bảo mật dữ liệu'
    },
    {
      key: 'consent_text',
      value: 'Tôi đồng ý cung cấp thông tin này cho quá trình tư vấn thương hiệu cá nhân. Dữ liệu chỉ phục vụ cho dự án tư vấn của tôi.',
      note: 'Nội dung ô tick đồng ý ở màn chào'
    },
    {
      key: 'notify_email_on_submit',
      value: 'TRUE',
      note: 'Tự động gửi email báo cho chuyên gia (kèm toàn bộ câu trả lời sạch) ngay khi khách bấm Hoàn tất & Gửi'
    },
    {
      key: 'zalo_invite_template',
      value: 'Chào anh/chị {name},\n\nGửi anh/chị đường link chuẩn bị dữ kiện trước buổi làm việc xây dựng thương hiệu cá nhân:\n{link}\n\n{deadline_line}Anh/chị có thể điền dần khi rảnh (hệ thống tự lưu nháp) và nên mở bằng Safari/Chrome để nhập giọng nói mượt nhất nhé!',
      note: 'Mẫu tin nhắn Zalo 1-click Copy khi tạo khách mới (biến: {name}, {field}, {link}, {deadline_line})'
    },
    {
      key: 'zalo_next_stage_template',
      value: 'Chào anh/chị {name},\n\nPhần chuẩn bị cho Giai đoạn {next_stage} đã được mở sẵn ngay trên đường link cũ của anh/chị:\n{link}\n\nAnh/chị mở lại đường link này để điền tiếp trước buổi làm việc sắp tới nhé!',
      note: 'Mẫu tin nhắn Zalo 1-click Copy sau khi chốt giai đoạn cũ & mở giai đoạn tiếp theo'
    },
    {
      key: 'prompt_preread_s1',
      value: [
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Chỉ dựa trên <du_lieu> (các câu khách tự điền trước Buổi 1):',
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
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Chỉ dựa trên <du_lieu> (bao gồm cả ghi chú thô/transcript nếu có) và <checklist_nha_tu_van>:',
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
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Đọc <tom_tat_gd_truoc> kết hợp với <du_lieu> GĐ2:',
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
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc>, <du_lieu> GĐ2 và <checklist_nha_tu_van>:',
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
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc> (GĐ1–2) và <du_lieu> GĐ3:',
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
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc>, <du_lieu> GĐ3 và <checklist_nha_tu_van>:',
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
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Đọc <tom_tat_gd_truoc> và số liệu rà soát quý trong <du_lieu> GĐ4:',
        '1. So sánh tỷ lệ đúng tệp (4.1.1) và lý do từ chối (4.1.2) với định vị & phễu đã chốt ở GĐ2.',
        '2. Đề xuất 3–5 câu hỏi trọng tâm cho buổi họp rà soát quý nhằm cắt bỏ 50% hoạt động kém hiệu quả (4.1.3) và đóng gói tài sản trí tuệ riêng (4.2.1).',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đọc trước Giai đoạn 4 (Rà soát quý)'
    },
    {
      key: 'prompt_eval_s4',
      value: [
        'Đóng vai chuyên gia tư vấn thương hiệu cá nhân. Dựa trên <tom_tat_gd_truoc>, <du_lieu> GĐ4 và <checklist_nha_tu_van>:',
        '1. Lập Báo cáo Nhận diện – Tin tưởng – Doanh thu của quý này theo thẻ [F]/[A]/[G].',
        '2. Chỉ rõ phương án tái phân bổ nguồn lực theo nguyên lý 80/20 cho quý tới.',
        '3. Đề xuất bước tiếp theo cho Lộ trình Thought Leadership (4.2.1–4.2.3) và viết khối "TÓM TẮT CHỐT QUÝ" (8–10 gạch đầu dòng).',
        'Không suy diễn ngoài dữ liệu.'
      ].join('\n'),
      note: 'Lời nhắc cho Bản đánh giá Giai đoạn 4 (Rà soát quý)'
    }
  ];
}
