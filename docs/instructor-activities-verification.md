# Xác minh giao diện Quiz và Minigame

Ngày kiểm tra: 03/10/2026.

## Phạm vi thay đổi

- Đồng bộ tiêu đề, màu xanh, khối chọn nhạc cụ, viền và khoảng cách với `/instructor/media`.
- Quiz dùng bố cục biên soạn theo nhóm, cuộn trang tự nhiên và nút làm mới.
- Minigame dùng trường nhập chuỗi nốt, tốc độ và chọn nốt khuyết; tự tạo cấu hình gửi đi thay cho nhập JSON.
- Bổ sung khuông nhạc mẫu cập nhật trực tiếp, khóa Sol/Fa, số chỉ nhịp 2/4–3/4–4/4–6/8 và trường độ từng nốt (tròn, trắng, đen, móc đơn, móc kép). Khuông có thể cuộn ngang trên màn hình nhỏ.
- Khớp nhịp tính thời điểm bắt đầu bằng tổng thời lượng các nốt trước; cấu hình giai điệu gửi thêm khóa, nhịp và mảng trường độ.
- Khóa form khi chưa có nhạc cụ hoặc đang lưu; thông báo lỗi dễ hiểu, giữ nội dung khi lưu thất bại.
- Tách trạng thái hai trang khi điều hướng, đưa thông báo kết quả lưu vào vùng nhìn thấy và focus.

## Kết quả kiểm tra

- `npm run build`: đạt. Vite vẫn cảnh báo bundle trên 500 kB.
- ESLint trên ba file thay đổi: đạt.
- Chrome headless, desktop 1440 × 1000 và mobile 390 × 844: render hai trang, không tràn ngang, không có exception runtime.
- Quiz: kiểm tra trường bắt buộc, chọn đáp án, gửi dữ liệu, giữ form khi lỗi và làm mới sau thành công.
- Minigame: kiểm tra chuỗi khớp nhịp và thời điểm nốt; chọn nốt khuyết và cấu hình giai điệu; giữ form khi lỗi.
- Kiểm tra đổi khóa Fa, nhịp 3/4, trường độ hỗn hợp và chú thích khuông; xác nhận thời điểm tích lũy `[0, 1200, 1500, 1650, 4050]` ms ở tốc độ 100 với trường độ `[2, 0.5, 0.25, 4, 1]`. Kiểm tra cấu hình giai điệu 6/8 và đặt lại khóa mặc định sau khi tạo thành công.
- Tải nhạc cụ thất bại, thử lại và danh sách rỗng: thông báo phù hợp, khóa thao tác khi không có nhạc cụ.
- Phản hồi lỗi chứa chuỗi kỹ thuật cố ý: không xuất hiện trên giao diện.

Script kiểm tra: `E:/VietStage_web/.tools/verify-instructor-activities.mjs` (Chrome CDP cổng 9338, Vite cổng 5178).

Ảnh: `E:/VietStage_web/.tools/captures/activities-{quiz,minigame}-{desktop,mobile}.png`.

## Giới hạn

Kiểm thử trình duyệt sử dụng API giả lập. Chưa xác minh lưu dữ liệu vào backend thật, phiên đăng nhập thật hoặc chạy cấu hình minigame trong Godot. Không thay đổi backend hay Godot trong tác vụ này. Giữ nguyên các thay đổi đã có trong App, sidebar và trang nội dung bài học.

Khóa Fa và các trường ký âm mới của giai điệu đã được kiểm tra ở form/xem trước và payload gửi đi; không coi đây là xác nhận Godot đã đọc và áp dụng các trường này. Bộ vẽ khuông Godot hiện dùng khóa Sol.
