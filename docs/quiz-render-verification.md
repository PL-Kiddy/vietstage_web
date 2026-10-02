# Kiểm tra luồng Quiz với Render (2026-10-01)

## Kết quả đã xác minh

- Đăng nhập giảng viên và học viên trên Render thành công. Form tại `/instructor/lessons/50/content` đã tạo Quiz qua trình duyệt; API giảng viên đọc lại được Quiz vừa tạo.
- API học viên `GET /api/lessons/50/quizzes` trả Quiz `ACTIVE`, không kèm `correctAnswer`. Kiểm tra bằng tài khoản học viên thực tế.
- Bài học 50 hiện có `approvalStatus=DRAFT` và `isVisible=false`. Vì vậy bài học chưa xuất hiện trong danh mục bài học đã duyệt, đang hiển thị của app học viên. Cần duyệt và bật hiển thị bài học trước khi kiểm tra điều hướng đầy đủ trên app.
- Học viên nộp đáp án đúng qua `POST /api/quizzes/33/attempts` nhận HTTP 500: `Internal server error: null identifier (com.example.vietstage_web_be.entity.LearnerProfile)`. Sau lỗi, `GET /api/quizzes/33/attempts?page=0&size=10` trả 0 lượt làm. Chưa thể xác minh chấm điểm và màn kết quả với Render.
- Hai Quiz kiểm thử 33 và 34 đã được xóa. `GET /api/lessons/50/quizzes` với tài khoản giảng viên trả danh sách rỗng sau khi dọn.

## Kiểm thử cục bộ

- Build web và kiểm thử Chrome headless với Render xác nhận Quiz xuất hiện, nút thêm Quiz mở form và việc gửi form tạo Quiz thành công.
- Kiểm thử runtime Godot với API giả lập xác nhận tải Quiz của lesson 50, nộp bài, hiện kết quả và trạng thái lỗi chờ gửi lại. Đây không phải bằng chứng nộp bài thành công trên Render.

## Vấn đề backend cần xử lý

1. Xác định vì sao tài khoản học viên đăng nhập được nhưng lúc nộp Quiz backend không tìm thấy `LearnerProfile`. Sửa dữ liệu/profile hoặc luồng tạo profile; sau đó thử lại một lượt đúng và một lượt sai, đối chiếu điểm/sao và lịch sử lượt làm.
2. API học viên hiện trả Quiz `ACTIVE` của bài 50 dù bài học còn `DRAFT` và `isVisible=false`. Cần kiểm tra điều kiện công bố bài học ở endpoint Quiz và submit.
3. Swagger mô tả `GET /api/lessons` là `PUBLIC`, nhưng Render trả 401 khi không có token. Cần đồng nhất tài liệu và chính sách truy cập.

Không thay đổi mã backend hay trạng thái công bố bài học trong lần kiểm tra này.
