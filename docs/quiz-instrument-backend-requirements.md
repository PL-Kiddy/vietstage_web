# Yêu cầu BE: xác minh và hoàn thiện Quiz theo nhạc cụ

Ngày: 04/10/2026. Bàn giao cho nhóm backend về lỗi tạo Quiz trên web và luồng CRUD/làm bài theo nhạc cụ.

## Hiện tượng và trạng thái hiện tại

- Response POST do người dùng cung cấp trước đây báo `null value in column "created_at" of relation "quizzes" violates not-null constraint`. Đây là nguyên nhân đã xác nhận cho **lần lỗi trước đó**, không mặc định là lỗi của bản BE hiện đang chạy.
- Source BE local hiện đã gán `.createdAt(LocalDateTime.now())` trong cả hai hàm tạo Quiz và entity `Quiz.createdAt` có `@CreationTimestamp`. Cả HEAD local và ref `origin/main` hiện có phần gán timestamp. Vì vậy **không yêu cầu BE viết lại cùng bản sửa**; cần xác minh bản đã triển khai và POST thực tế.
- Web gọi `POST /api/instruments/{instrumentId}/quizzes` qua Vite proxy đến backend Render. Chưa có bằng chứng E2E rằng bản Render hiện tại đã tạo Quiz thành công. Việc source local đúng không chứng minh DB và server đang chạy đúng bản đó.

## Contract cần giữ

- Quiz độc lập theo nhạc cụ: `lesson_id=NULL`, `instrument_id` là ID nhạc cụ hợp lệ. Không dùng lesson giả để liên kết.
- `POST /api/instruments/{instrumentId}/quizzes` nhận `QuizRequest`: `title`, `questionType` (`GENERAL` hoặc `NOTE_IDENTIFICATION`), `question`, `options` là **JSON string array**, `correctAnswer`, `orderIndex`, `status`; `note` bắt buộc khi `NOTE_IDENTIFICATION`. Trả Quiz đã lưu có ID.
- `GET /api/instruments/{instrumentId}/quizzes` chỉ trả Quiz của nhạc cụ đó. LEARNER chỉ thấy `ACTIVE` và **không nhận `correctAnswer`** trước khi nộp bài; INSTRUCTOR/ADMIN được xem dữ liệu biên soạn và cả `INACTIVE`/`ARCHIVED`.
- `PUT /api/quizzes/{id}` và `DELETE /api/quizzes/{id}` hoạt động với Quiz độc lập theo nhạc cụ. Bản có attempts được lưu trữ (`ARCHIVED`) khi xóa để giữ lịch sử.
- `POST /api/quizzes/{id}/attempts` trả kết quả, điểm, sao và đáp án sau khi nộp; GET lịch sử attempt của người học hoạt động đúng.

## Việc BE cần kiểm tra và xử lý

1. **Đối chiếu deployment:** xác nhận commit BE đang chạy trên Render, Response body và log của POST thất bại gần nhất. Nếu log vẫn báo `created_at=NULL`, xác định bản nào đang chạy và triển khai bản sửa timestamp đã có trong source. Không đưa `createdAt` vào request frontend.
2. **Kiểm tra DB triển khai:** `spring.jpa.hibernate.ddl-auto=none`, nên kiểm tra đã áp dụng migration: bảng `quizzes` có `instrument_id`/foreign key và `lesson_id` cho phép NULL; `created_at` có giá trị khi INSERT. File tham khảo ở BE: `update_instrument_schema.sql`. Không dùng thay đổi annotation để thay migration.
3. **Kiểm tra mã lỗi:** nhạc cụ/Quiz không tồn tại → 404; payload sai → 400; không đăng nhập → 401; thiếu quyền → 403. Request hợp lệ không được trả 500. Không nhầm lỗi `feedback` riêng với POST tạo Quiz.
4. **Rà soát quyền:** INSTRUCTOR/ADMIN quản lý Quiz; LEARNER chỉ xem Quiz ACTIVE và làm bài. Xác nhận chính sách giảng viên quản lý tất cả Quiz của nhạc cụ hay chỉ Quiz do mình tạo; nếu cần ownership theo người tạo, BE phải lưu và kiểm tra `created_by`.

## Tiêu chí nghiệm thu

Chạy trên DB kiểm thử **cô lập**, không xóa dữ liệu môi trường dùng chung:

1. INSTRUCTOR tạo một `GENERAL` và một `NOTE_IDENTIFICATION` cho nhạc cụ A. POST thành công; DB có `instrument_id=A`, `lesson_id=NULL`, `created_at` khác NULL.
2. GET A trả đúng hai Quiz, GET B không trả chúng. LEARNER chỉ thấy `ACTIVE`, không thấy đáp án đúng; INSTRUCTOR thấy cả `INACTIVE`/`ARCHIVED` và đáp án để biên soạn.
3. INSTRUCTOR sửa rồi GET lại thấy thay đổi; xóa Quiz chưa có attempts xóa được; xóa Quiz có attempts chuyển `ARCHIVED` và lịch sử vẫn truy xuất được.
4. LEARNER nộp đáp án đúng/sai qua attempt endpoint, nhận `isCorrect`, `score`, `pointsEarned`, `starsEarned`, đáp án sau khi nộp; GET lịch sử trả lượt tương ứng. Gửi lại cùng `clientAttemptId` không cộng thưởng hai lần.
5. LEARNER không được tạo/sửa/xóa; nhạc cụ không tồn tại và payload không hợp lệ trả lỗi đúng loại. Sau khi triển khai, kiểm thử lại bằng tài khoản INSTRUCTOR thật trên web và lưu kết quả HTTP/Response đã loại bỏ token.

## Phạm vi

Đây là yêu cầu cho BE. Chưa sửa mã BE hoặc DB trong lượt viết tài liệu này; chưa xác minh runtime POST/GET sau triển khai.
