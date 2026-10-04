# Yêu cầu BE: sửa luồng quản lý Minigame theo nhạc cụ

## Lỗi hiện tại

Giảng viên tạo Minigame tại `/instructor/minigame`. Trình duyệt gửi `POST /api/instruments/3/minigames` qua Vite proxy tới backend Render và nhận **HTTP 500** (ảnh chụp ngày 04/10/2026). Chưa có Response body hoặc log server của request này, nên chưa chốt exception trực tiếp. FE đang gửi `MinigameChallengeRequest` với `title`, `challengeType`, `difficulty`, `maxScore`, `orderIndex`, `status`, `contentJson` dạng JSON string.

## BE cần thực hiện

1. Kiểm tra Response và log Render của POST lỗi, cùng schema DB đang triển khai. Xác định lỗi chính xác trước khi sửa; đặc biệt kiểm tra ràng buộc `minigame_challenges.lesson_id`, cột `instrument_id` và lỗi INSERT.
2. Ở `MinigameServiceImpl.createMinigameByInstrument`, tra cứu `instrumentId`, trả 404 khi không tồn tại, gán `instrument` vào `MinigameChallenge` trước khi lưu. Bản HEAD của repo BE được rà soát chưa gán trường này. Không gắn Minigame độc lập vào một lesson giả.
3. Đảm bảo `updateMinigame` và `deleteMinigame` xử lý Minigame có `lesson == null` theo quyền phù hợp với Minigame thuộc nhạc cụ. Bản HEAD đang gọi `validateLessonOwnership(actor, challenge.getLesson())`, có nguy cơ 500. Giữ kiểm tra quyền hiện có cho Minigame thuộc lesson.
4. Áp dụng migration an toàn trên DB triển khai nếu chưa có: thêm `minigame_challenges.instrument_id` và khóa ngoại đến `instruments(id)`; cho phép `lesson_id` null. Repo BE có bản nháp `update_instrument_schema.sql`, nhưng `spring.jpa.hibernate.ddl-auto=none` nên annotation không tự cập nhật DB. Xác minh trạng thái schema trước khi chạy migration; giữ dữ liệu Minigame và lịch sử attempt hiện có.
5. Trả lỗi có nghĩa cho input sai/nhạc cụ không tồn tại/quyền không đủ (400/404/403 hoặc mã tương ứng), thay vì HTTP 500. Không trả SQL/stack trace hoặc thông tin nhạy cảm ra client.

## Tiêu chí nghiệm thu

- Test với DB cô lập: INSTRUCTOR tạo một `RHYTHM_MATCH` và một `MELODY_COMPLETE` cho nhạc cụ A. POST thành công; cả hai bản ghi có `instrument_id=A`, `lesson_id=null`; GET A trả về chúng, GET B không trả về chúng.
- Sửa nội dung, thứ tự và trạng thái qua `PUT /api/minigames/{id}`; GET A phản ánh dữ liệu mới. Xóa qua `DELETE /api/minigames/{id}`: bản chưa có attempt được xóa; bản đã có attempt được chuyển `ARCHIVED` và giữ lịch sử.
- LEARNER chỉ thấy Minigame `ACTIVE`, không được tạo/sửa/xóa. INSTRUCTOR/ADMIN được thao tác theo chính sách quyền đã thống nhất; thao tác với ID nhạc cụ không tồn tại trả lỗi phù hợp.
- Chạy lại form tạo trên web trỏ tới backend đã triển khai: không còn HTTP 500, danh sách quản lý theo nhạc cụ hiển thị Minigame vừa tạo.

## Trạng thái xác minh

Chỉ có ảnh HTTP 500 và đối chiếu source/migration trong repo. Chưa có Response body, log Render, quyền truy cập DB triển khai hoặc lần POST thành công. Source BE local đang có thay đổi chưa commit từ nhiệm vụ trước; thay đổi local đó không chứng minh server Render đã cập nhật. Tài liệu này không sửa mã BE.
