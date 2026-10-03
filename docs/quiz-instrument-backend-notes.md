# Ghi chú cho BE: Quiz độc lập theo nhạc cụ

Ngày rà soát: 03/10/2026. Chỉ ghi nhận, không sửa repository BE.

Nguồn bằng chứng: mã nguồn BE hiện tại sau khi hoàn tác các sửa đổi của Codex. Chưa gọi endpoint server triển khai; các nhận định runtime bên dưới cần BE xác minh bằng integration test.

## 1. Cần gán nhạc cụ khi tạo Quiz

File: `QuizServiceImpl.java`, hàm `createQuizByInstrument`.

Hàm nhận `instrumentId` nhưng không dùng để tìm nhạc cụ và không gán `Quiz.instrument` trước `quizRepository.save`. Entity có quan hệ `instrument_id`; GET theo nhạc cụ dùng `findByInstrumentIdOrderByOrderIndexAsc`. Vì vậy, theo mã nguồn hiện tại, Quiz tạo từ POST không được gắn vào danh sách GET của nhạc cụ đã chọn. Đây là điểm chặn luồng web tạo → app thấy Quiz.

Đề nghị BE: kiểm tra nhạc cụ tồn tại, gán vào Quiz trước khi lưu; trả 404 cho ID không tồn tại. Test POST tạo, sau đó GET cùng nhạc cụ có Quiz, GET nhạc cụ khác không có Quiz, và kiểm tra `instrument_id` trong DB. Không bắt buộc `lesson_id` cho Quiz độc lập.

## 2. Cần lấy đúng người dùng ở endpoint Quiz theo nhạc cụ

File: `InstrumentController.java`, POST/GET `/{instrumentId}/quizzes`.

Các tham số đang là `@AuthenticationPrincipal User`, trong khi `CustomUserDetailsService`/JWT dùng principal `CustomUserDetails` chứa trường `user`. `QuizController` đã dùng `@AuthenticationPrincipal(expression = "user")`.

Đề nghị BE: dùng cách lấy User phù hợp với principal hiện tại. Kiểm tra GET bằng JWT LEARNER thật: chỉ ACTIVE, không có correctAnswer trước khi nộp. Khi currentUser bị null, điều kiện lọc LEARNER trong service không chạy; nguy cơ trả cả INACTIVE/ARCHIVED cần kiểm chứng qua HTTP. POST nên nhận đúng actor để áp dụng phân quyền khi cần.

## 3. Cần giới hạn quyền và bật Bean Validation cho POST

Endpoint POST Quiz theo nhạc cụ chưa có `@PreAuthorize`, request chưa có `@Valid`. SecurityConfig chỉ yêu cầu đăng nhập cho `/api/instruments/**`, không giới hạn vai trò. Service tạo theo nhạc cụ cũng không kiểm tra actor.

Đề nghị BE: chỉ INSTRUCTOR/ADMIN được tạo; bật validation cho QuizRequest. Test LEARNER bị 403, thiếu title/question/orderIndex hoặc questionType/status không hợp lệ bị 400. Đây là yêu cầu BE; frontend không thể thay thế kiểm soát quyền của server.

## 4. Cần thống nhất quyền sửa/xóa Quiz độc lập

File: `QuizServiceImpl.java`, `updateQuiz`/`deleteQuiz` gọi `validateOwnership(actor, quiz.getLesson())`.

Quiz độc lập có lesson null. Với actor INSTRUCTOR, hàm hiện truy cập `lesson.getCreatedBy()` có thể gây NullPointerException. Không chỉ thêm null-check rồi từ chối mọi INSTRUCTOR: BE cần xác định quyền quản lý Quiz theo nhạc cụ (ví dụ tác giả/phân công nhạc cụ) trước khi triển khai sửa/xóa. Tạo và làm Quiz không dùng các endpoint này, nhưng cần ghi nhận cho luồng quản lý sau đó.

## Tiêu chí xác nhận toàn luồng

INSTRUCTOR tạo một GENERAL và một NOTE_IDENTIFICATION cho nhạc cụ A; LEARNER lấy được hai câu ACTIVE ở A, không thấy chúng ở B, không nhận đáp án đúng; nộp đáp án qua `/api/quizzes/{id}/attempts`, nhận kết quả/điểm/sao và lịch sử. INACTIVE/ARCHIVED không hiện cho LEARNER. Test với DB cô lập, không dùng bài học để làm khóa liên kết Quiz độc lập.

Frontend/app đã chuyển sang contract endpoint theo nhạc cụ. Chưa xác nhận toàn luồng với BE chưa sửa hoặc server đang triển khai.

## Rà soát lần tạo Quiz bị lỗi trên localhost:5173

- Đã gọi GET `/api-docs` thực tế qua localhost:5173: HTTP 200. BE triển khai có POST `/api/instruments/{instrumentId}/quizzes`, nhận QuizRequest với options kiểu string; endpoint và cấu trúc payload frontend phù hợp tài liệu API hiện tại. Điều này chưa xác minh POST tạo thành công.
- `.env` frontend trỏ API/proxy đến `https://vietstage-web-backend.onrender.com`; sửa repo BE local không tự thay đổi server Render.
- Thông báo trong ảnh do InstructorActivities gom mọi lỗi ngoài 401/403 thành một thông báo chung. Ảnh không cho biết HTTP status hoặc nội dung lỗi máy chủ.
- Chưa có phiên đăng nhập của người dùng trong trình duyệt kiểm thử; không tái hiện POST với tài khoản thật, không tạo dữ liệu kiểm thử lên server triển khai.
- Cần kiểm tra schema DB triển khai: config hiện là `spring.jpa.hibernate.ddl-auto=none`, nên đổi annotation entity không tự migrate DB. File SQL cũ `vietstage_full_reset_v2.sql` vẫn có `quizzes.lesson_id NOT NULL` và cấu trúc quizzes khác entity hiện tại. Đây chỉ là bằng chứng schema cũ trong repo, KHÔNG khẳng định DB Render hiện dùng schema đó.
- Nếu response/log có lỗi lesson_id NOT NULL, BE cần migration cho phép lesson_id null với Quiz độc lập. Nếu báo thiếu instrument_id/cột khác, cần migration đúng schema entity. Không thêm lessonId giả hoặc chuyển sang endpoint theo bài học để né lỗi.
- Cần lấy mã HTTP và Response của POST thất bại (không kèm Authorization/token), đối chiếu log Render và schema DB trước khi chốt nguyên nhân.
