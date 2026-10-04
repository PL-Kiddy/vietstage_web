# Ghi chú cho BE: Quiz độc lập theo nhạc cụ

Ngày rà soát: 03/10/2026. Chỉ ghi nhận, không sửa repository BE.

**Lưu ý cập nhật 04/10/2026:** các mục 1–4 bên dưới là ghi nhận lịch sử. Mã BE hiện tại đã thay đổi: POST Quiz có `@PreAuthorize`, `@Valid`, principal expression và gán instrument khi lưu. Xem phần rà soát 04/10/2026 ở cuối tài liệu; không dùng các mục cũ để kết luận nguyên nhân lỗi hiện tại.

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

## Rà soát lỗi quyền tại `/instructor/quiz` — 04/10/2026

**Cập nhật trạng thái:** phần `created_at=NULL` dưới đây ghi lại một lần POST lỗi trước đó. Source BE hiện đã gán `createdAt` khi tạo Quiz và entity có `@CreationTimestamp`; yêu cầu BE hiện hành nằm tại [quiz-instrument-backend-requirements.md](quiz-instrument-backend-requirements.md). Cần kiểm tra bản Render và DB trước khi kết luận lỗi còn tái diễn.

### Kết luận cập nhật từ Response POST do người dùng cung cấp

**Đã xác định nguyên nhân POST tạo Quiz thất bại: `created_at` được INSERT với giá trị null, vi phạm NOT NULL của bảng `quizzes`.** Response người dùng cung cấp có `null value in column "created_at" of relation "quizzes" violates not-null constraint` và câu INSERT liệt kê rõ `created_at`. Đây là lỗi lưu DB; response quyền của request `feedback` trong ảnh là vấn đề riêng. Request đã đi đến bước INSERT, nên lỗi quyền không phải nguyên nhân của lần tạo Quiz trong log này.

Đối chiếu source BE hiện tại:

- `entity/Quiz.java:55–56` khai báo `createdAt` nhưng không có giá trị mặc định, `@CreationTimestamp` hoặc callback `@PrePersist` để khởi tạo.
- `service/impl/QuizServiceImpl.java:140` (`createQuizByInstrument`) dùng `Quiz.builder()` rồi `quizRepository.save(quiz)` mà không gán `createdAt`. Nhánh tạo Quiz theo lesson cũng cần được rà soát khi BE bổ sung khởi tạo timestamp.
- `QuizRequest` không yêu cầu FE gửi `createdAt`. Timestamp tạo bản ghi thuộc trách nhiệm BE; không thêm trường này vào payload FE để né lỗi.
- `GlobalExceptionHandler.handleGlobalException` trả HTTP 500 với tiền tố `Internal server error`, khớp dạng Response được cung cấp. Người dùng chưa gửi mã HTTP riêng; nhận định nhánh 500 dựa trên handler và nội dung log.

**Đề nghị BE xử lý (chỉ ghi chú, chưa sửa):** khởi tạo `createdAt` trước INSERT, ưu tiên cơ chế lifecycle của entity như `@PrePersist` hoặc `@CreationTimestamp` để bao phủ các đường tạo Quiz; hoặc gán rõ trong mọi service tạo bản ghi. Giữ ràng buộc NOT NULL. Chỉ thêm DEFAULT ở DB không xử lý câu INSERT đang truyền NULL tường minh. Kiểm tra schema triển khai và triển khai bản sửa lên Render; sửa source local không thay đổi API hiện đang dùng.

**Tiêu chí xác minh sau khi BE sửa:** dùng DB kiểm thử cô lập, INSTRUCTOR tạo Quiz GENERAL và NOTE_IDENTIFICATION theo instrument, POST thành công, `created_at` khác null, GET cùng instrument trả Quiz vừa tạo; kiểm tra LEARNER vẫn bị từ chối tạo. Chưa chạy POST có đăng nhập hoặc kiểm thử sau sửa vì BE chưa được thay đổi trong nhiệm vụ này.

### Bằng chứng ban đầu từ ảnh và FE

- Ảnh đang chọn request **`feedback`**, không phải POST **`quizzes`**. Response `success:false, message:"Không có quyền truy cập"` trong ảnh chưa chứng minh POST tạo Quiz bị 403. Các dòng `quizzes` màu đỏ xác nhận có request lỗi, nhưng ảnh không hiển thị mã HTTP hoặc Response của chúng.
- FE gọi POST `/api/instruments/{instrumentId}/quizzes` trong `src/pages/instructor/InstructorActivities.tsx:65`. `src/api/client.ts:135` gắn `Authorization: Bearer` từ session. QuizEditor gửi `options` dạng JSON string, loại câu hỏi GENERAL/NOTE_IDENTIFICATION, phù hợp DTO và OpenAPI hiện hành. Chưa thấy lỗi route hoặc thiếu chủ động gửi token trong mã FE.
- Development gọi qua proxy Vite, đích `.env` hiện là `https://vietstage-web-backend.onrender.com`. Source BE local và server Render có thể khác phiên bản; không coi việc source local đúng là bằng chứng server đang chạy đúng bản đó.

### Mã BE hiện tại: quyền tạo Quiz hợp lệ về cấu hình

- `InstrumentController.java:38`: `hasAnyAuthority('INSTRUCTOR', 'ADMIN')`, principal `expression="user"`, request có `@Valid`.
- `CustomUserDetails.java:22`: cung cấp cả `ROLE_<tên vai trò>` và `<tên vai trò>`. Với role INSTRUCTOR, cả `hasRole('INSTRUCTOR')` và `hasAuthority('INSTRUCTOR')` đều phù hợp. Không kết luận có lỗi ROLE_ trong bản source hiện tại.
- `JwtAuthenticationFilter` nạp lại UserDetails từ DB sau khi xác minh token và session, rồi dùng `getAuthorities()`. Tên INSTRUCTOR trên header FE có thể là dữ liệu session cũ; cần đối chiếu người dùng/vai trò trên server.
- `QuizServiceImpl.createQuizByInstrument` hiện gán `.instrument(instrument)` trước khi save. Các ghi nhận cũ về thiếu instrument/principal/validation không còn đúng với source đang rà soát.
- Nếu POST thực tế bị 403, BE cần kiểm tra phiên bản triển khai, authorities của principal và vai trò trong DB. Không log token. Source hiện tại không có điều kiện sở hữu lesson trong hàm tạo Quiz theo instrument.

### Lỗi `feedback` trong ảnh có nhánh quyền riêng

`FeedbackServiceImpl.getFeedbackForAttempt`, dòng 64–66: nếu người dùng là INSTRUCTOR nhưng `attempt.exercise.lesson.createdBy.id` khác ID giảng viên hiện tại, service ném `AppException(ErrorCode.FORBIDDEN)`. `ErrorCode.FORBIDDEN` có message “Không có quyền truy cập”; `GlobalExceptionHandler.handleAppException` trả envelope `success:false` tương ứng.

Đây là nhánh mã có thể tạo đúng dạng response đang chọn trong ảnh. Chưa kiểm chứng ownership của attempt trong ảnh bằng DB hoặc phiên đăng nhập. Cần BE xác nhận dashboard có trả lượt tập của bài do giảng viên khác tạo hay không, và chính sách đọc feedback mong muốn. Không quy lỗi ownership này cho POST tạo Quiz.

### Thông báo FE cũng cho thấy cần tách request

`InstructorActivities.tsx:72` hiển thị thông báo quyền riêng khi HTTP 403 và thông báo phiên đăng nhập khi HTTP 401. Ảnh đang hiển thị “Chưa thể lưu hoạt động...” là nhánh lỗi chung. Theo source hiện tại, POST có thể là 400/500/lỗi mạng hoặc envelope lỗi ở status khác; cũng có khả năng trang đang chạy bản FE khác. Không đủ dữ liệu để chốt POST là 403 từ response của feedback.

Nếu server từ chối method security nhưng bị `GlobalExceptionHandler.handleGlobalException(Exception.class)` gom thành 500, FE cũng sẽ hiện nhánh lỗi chung. Đây là khả năng cần BE kiểm chứng bằng status/log thật, không phải nguyên nhân đã xác nhận.

### Kiểm tra đã chạy

- Mở `http://localhost:5173/instructor/quiz` bằng trình duyệt kiểm thử: chuyển về `/login` vì trình duyệt kiểm thử không có phiên người dùng. Không lấy token từ ảnh hoặc profile trình duyệt cá nhân.
- GET `/api-docs` qua proxy localhost: HTTP 200; có POST `/api/instruments/{instrumentId}/quizzes`, path parameter instrumentId và body QuizRequest.
- GET `/api/instruments` không có JWT: HTTP 401, message token không hợp lệ/đã hết hạn.
- POST `/api/instruments/1/quizzes` với body `{}` và không có JWT: HTTP 401, message tương tự. Request dùng ID 1 chỉ để kiểm tra chặn xác thực; không khẳng định đây là ID Đàn Tranh. Không tạo quiz thử trên Render.
- Không chạy bộ BE integration test hiện có: `QuizIntegrationTest` dùng repository và `deleteAll` khi thiết lập/dọn dữ liệu, chưa có bằng chứng datasource test cô lập. Kiểm tra endpoint thực tế ở trên không thay thế kiểm thử tạo Quiz với INSTRUCTOR.

### Phạm vi chưa xác minh sau khi nhận Response POST

Response POST đã được người dùng cung cấp và xác định lỗi constraint `created_at` như trên. Chưa kiểm tra trực tiếp schema DB Render, chưa có phiên INSTRUCTOR trong trình duyệt kiểm thử, chưa xác minh tạo thành công sau sửa. Lỗi ownership của `feedback` vẫn cần BE đối chiếu attempt và giảng viên thực tế; không suy diễn từ lỗi Quiz.

Build FE `npm run build` đã thành công trong lần rà soát này (có cảnh báo chunk lớn của Vite). Không thay đổi UI hoặc logic FE; thay đổi duy nhất của nhiệm vụ là tài liệu này.

Chỉ cập nhật tài liệu FE này. Không sửa code, cấu hình hoặc dữ liệu BE; không xác nhận tạo Quiz thành công với tài khoản người dùng khi chưa tái hiện được.

## Rà soát POST tạo Minigame theo nhạc cụ — 04/10/2026

### Bằng chứng và phạm vi

- Ảnh người dùng tại `localhost:5173/instructor/minigame` cho thấy `POST /api/instruments/3/minigames` nhận **HTTP 500**. Ảnh không hiển thị Response body hoặc log server, nên chưa xác định được exception cụ thể.
- FE gọi đúng endpoint qua `instrumentMinigamesApi.create` (`src/api/lessonContent.ts`) và Vite proxy chuyển `/api` đến `https://vietstage-web-backend.onrender.com` theo `.env`. Không có bằng chứng request được gửi trực tiếp đến BE local.
- `MinigameComposer` gửi `title`, `challengeType`, `difficulty`, `maxScore`, `orderIndex`, `status`, và `contentJson` dạng JSON string. Với `RHYTHM_MATCH`, form hiện sinh `rounds[0].tempo_bpm` và mảng `rounds[0].beats` có ít nhất hai vị trí nếu có ít nhất hai nốt. Các trường này tương ứng DTO và nhánh validation trong source BE. Cần xem Request Payload trong Network để xác nhận đúng dữ liệu của lần lỗi trên ảnh.
- Không có phiên INSTRUCTOR trong trình duyệt kiểm thử và không nộp dữ liệu thử lên Render. Lần gọi GET `/api-docs` qua localhost:5173 trong phiên rà soát này bị timeout; không coi đây là xác nhận phiên bản BE đang triển khai.

### Lỗi rõ trong source BE đã commit, cần BE sửa

- `MinigameServiceImpl.createMinigameByInstrument` trên HEAD của repo BE tạo `MinigameChallenge.builder()` **không gán `instrument`** dù nhận `instrumentId`. Vì vậy bản ghi được tạo có `instrument_id` null hoặc thất bại ở DB; dù INSERT thành công, GET theo nhạc cụ cũng không trả hoạt động vừa tạo. Cần tra cứu nhạc cụ theo ID, trả lỗi không tìm thấy nếu thiếu, và `.instrument(instrument)` trước khi lưu.
- `MinigameServiceImpl.updateMinigame` và `deleteMinigame` trên HEAD gọi `validateLessonOwnership(actor, challenge.getLesson())`. Mini game độc lập theo nhạc cụ có `lesson == null`, nên thao tác quản lý sau tạo có nguy cơ `NullPointerException`/500. Cần kiểm tra quyền theo nguồn liên kết thực tế (lesson hoặc instrument).
- Source BE local hiện có **thay đổi chưa commit từ nhiệm vụ trước** nhằm gắn instrument và xử lý quyền cho Mini game độc lập. Không thay đổi file BE trong lần rà soát này. Source local chưa chứng minh bản Render đang chạy thay đổi đó.
- `spring.jpa.hibernate.ddl-auto=none`; cần kiểm tra schema Render đã áp dụng `update_instrument_schema.sql`: bảng `minigame_challenges` phải có `instrument_id` và cho phép `lesson_id` null. Nếu chưa, INSERT Mini game độc lập có thể nhận 500 do lỗi cột hoặc ràng buộc NOT NULL. Đây là khả năng cần đối chiếu log/DB, chưa phải nguyên nhân đã xác nhận.

### BE cần đối chiếu và kiểm thử

1. Lấy Response body của POST trong tab Network và log Render cùng thời điểm. Kiểm tra lỗi `lesson_id NOT NULL`, thiếu `instrument_id`, hoặc exception khác trước khi chốt nguyên nhân HTTP 500. Không chia sẻ Authorization/token.
2. Trên DB kiểm thử cô lập: dùng INSTRUCTOR tạo `RHYTHM_MATCH` và `MELODY_COMPLETE` cho nhạc cụ A; xác nhận POST thành công, `instrument_id=A`, `lesson_id=null`, GET A có bản ghi, GET B không có; sửa, đổi trạng thái và xóa/lưu trữ theo ID. Kiểm tra ID nhạc cụ không tồn tại trả 404 và LEARNER không được tạo/sửa/xóa.
3. Sau khi sửa và triển khai BE cùng migration, kiểm thử lại form thật trên web. Hiện **chưa xác minh tạo Minigame thành công với backend triển khai**.
