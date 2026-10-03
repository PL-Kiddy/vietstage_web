# Luồng Quiz theo nhạc cụ

Ngày: 03/10/2026.

## Contract

- Web `/instructor/quiz`: POST `/api/instruments/{instrumentId}/quizzes`, options là JSON string, đáp án đúng là nội dung một lựa chọn, status ACTIVE/INACTIVE/ARCHIVED.
- Backend phải lưu `instrument_id`; Quiz độc lập không cần `lesson_id`.
- App đọc GET `/api/instruments/{instrumentId}/quizzes` mỗi lần mở Quiz. Mã nhạc cụ được resolve từ danh mục, không hardcode ID.
- App tách GENERAL (kiến thức) và NOTE_IDENTIFICATION (nhận diện nốt), chỉ dùng ACTIVE.
- Nộp từng câu qua POST `/api/quizzes/{id}/attempts`; điểm, sao và đáp án đúng lấy từ phản hồi máy chủ. Quiz tự do không gửi vào assessment hoàn thành bài học.
- Yêu cầu BE còn chờ xử lý: lưu liên kết nhạc cụ, lấy đúng User từ principal, giới hạn quyền tạo và bật Bean Validation. Xem `quiz-instrument-backend-notes.md`.

## Đã kiểm tra

- Web: `npm run build` đạt; có cảnh báo bundle >500 kB.
- Chrome desktop/mobile: script `.tools/verify-instructor-activities.mjs` đạt với API giả lập (validation, payload tạo Quiz, giữ form khi lỗi, reset sau thành công, đổi nhạc cụ, không lỗi runtime).
- Godot headless: `test_quiz_instrument_flow.gd` đạt. Scene LearningQuizScreen thực sự instantiate, hiển thị bốn lựa chọn khi không có lesson binding, lọc ACTIVE, gửi đáp án, nhận 10 điểm/2 sao, resolve hai nhạc cụ, tải mới khi mở lại, lọc Quiz kiến thức và xử lý tải thất bại. API giả lập.
- Godot `test_learning_quiz_grading.gd` đạt cho chấm offline/backend và trạng thái đồng bộ.

- Lịch sử kiểm thử: Maven build/test `InstrumentQuizFlowTest` từng đạt trên bản BE có sửa thử. Theo yêu cầu không sửa BE, các sửa đổi và test này đã được hoàn tác/xóa; kết quả đó KHÔNG xác minh BE hiện tại. Repo BE hiện không có thay đổi từ tác vụ này.

## Giới hạn

- Chưa kiểm tra end-to-end với server triển khai, tài khoản thật và database thật; chưa triển khai. Các điểm BE cần sửa chỉ được ghi chú, không giữ thay đổi trong repo BE.
- Godot trong sandbox báo không ghi được user:// (log/lưu offline). Không xác nhận việc lưu offline lên đĩa từ các lần chạy này.
- Những test cũ gắn Quiz theo bài học không xác minh contract Quiz độc lập theo nhạc cụ; test mới dành riêng cho contract này.

Bổ sung: scene chọn hoạt động phát hiện Quiz kiến thức theo nhạc cụ; scene QuizScreen cũ cũng chạy đạt và nộp trực tiếp qua API attempts.
