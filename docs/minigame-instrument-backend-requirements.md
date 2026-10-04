# Yêu cầu BE: sửa CRUD Minigame theo nhạc cụ

Ngày: 04/10/2026. Gửi nhóm backend để xử lý lỗi trang `/instructor/minigame`.

## Hiện tượng

Giảng viên bấm **Tạo Minigame** trên web; `POST /api/instruments/3/minigames` trả HTTP 500 (ảnh Console do người dùng cung cấp). Frontend gọi endpoint theo nhạc cụ qua proxy Vite đến backend Render. Ảnh chưa có Response body hay log server, nên **chưa thể chốt exception cụ thể**.

## Contract cần giữ

- `POST /api/instruments/{instrumentId}/minigames`: giảng viên/admin tạo Minigame độc lập với lesson. Body là `MinigameChallengeRequest`, gồm `title`, `challengeType` (`RHYTHM_MATCH` hoặc `MELODY_COMPLETE`), `contentJson` là **JSON string**, `difficulty`, `maxScore`, `orderIndex`, `status`. Trả Minigame đã lưu có ID.
- `GET /api/instruments/{instrumentId}/minigames`: trả hoạt động của đúng nhạc cụ; LEARNER chỉ thấy `ACTIVE`. Giảng viên xem được cả `INACTIVE`/`ARCHIVED` để quản lý.
- `PUT /api/minigames/{id}` và `DELETE /api/minigames/{id}`: thao tác được với Minigame độc lập theo nhạc cụ. Khi đã có attempts, DELETE chuyển `ARCHIVED` và giữ lịch sử, theo quy tắc hiện có.
- Không buộc FE gửi `lessonId` giả hoặc chuyển sang endpoint Minigame theo bài học.

## Việc BE cần làm

1. **Xác định lỗi 500 thật:** lấy Response body và log của POST cùng thời điểm trên Render; đối chiếu Request Payload. Kiểm tra lỗi ràng buộc `lesson_id`, thiếu cột `instrument_id`, và các lỗi INSERT khác. Không log/chia sẻ JWT.
2. **Sửa tạo theo nhạc cụ:** tra cứu `instrumentId`, trả lỗi không tìm thấy (404) nếu không tồn tại, gán `instrument` trước khi lưu. Trong HEAD đã commit của repo BE, `MinigameServiceImpl.createMinigameByInstrument` chưa gán liên kết này. Bản BE local có chỉnh sửa chưa commit từ công việc trước; cần review, test và triển khai thực tế, không mặc định Render đã có bản sửa.
3. **Sửa quyền sửa/xóa:** các Minigame theo nhạc cụ có `lesson == null`. Tránh gọi kiểm tra quyền qua `lesson.getCreatedBy()` với null. Phân nhánh quyền cho loại liên kết lesson/instrument, bảo đảm LEARNER không sửa/xóa. Xác nhận chính sách giảng viên được quản lý tất cả Minigame của nhạc cụ hay chỉ Minigame họ tạo; nếu cần quyền theo người tạo, BE phải lưu và kiểm tra `created_by`.
4. **Migration DB:** với `spring.jpa.hibernate.ddl-auto=none`, kiểm tra schema triển khai và áp dụng migration an toàn để `minigame_challenges.instrument_id` tồn tại, có foreign key đến `instruments(id)`, còn `lesson_id` cho phép NULL. File tham khảo trong repo BE: `update_instrument_schema.sql`. Không dùng sửa annotation entity để thay cho migration.
5. **Trả lỗi đúng loại:** payload không hợp lệ → 400; chưa đăng nhập → 401; thiếu quyền → 403; nhạc cụ/Minigame không tồn tại → 404. Trường hợp hợp lệ không được rơi vào 500.

## Tiêu chí nghiệm thu BE

Chạy integration test trên DB **cô lập**, không xóa dữ liệu môi trường dùng chung:

1. INSTRUCTOR tạo một `RHYTHM_MATCH` và một `MELODY_COMPLETE` cho nhạc cụ A. POST thành công; DB lưu `instrument_id=A`, `lesson_id=NULL`; response có ID, loại, nội dung và trạng thái đúng.
2. GET A trả hai bản ghi; GET nhạc cụ B không trả chúng. LEARNER chỉ thấy bản ghi `ACTIVE`; INSTRUCTOR thấy cả bản ghi `INACTIVE` và `ARCHIVED`.
3. INSTRUCTOR sửa nội dung/trạng thái bằng PUT rồi GET lại thấy giá trị mới; DELETE bản ghi chưa có attempts xóa được; DELETE bản ghi đã có attempts chuyển `ARCHIVED` và lịch sử vẫn truy xuất được.
4. Nhạc cụ không tồn tại, payload sai, LEARNER gọi create/update/delete đều trả mã lỗi phù hợp, không trả 500.
5. Sau triển khai migration và BE, thử lại thao tác tạo từ trang web với tài khoản INSTRUCTOR thật; kiểm tra cả Request, Response và GET danh sách. Chưa có bằng chứng bước này đã thành công.

## Phạm vi ghi nhận

Tài liệu này là yêu cầu cho BE. Chưa sửa mã, cấu hình hoặc DB backend trong lượt viết yêu cầu này.
