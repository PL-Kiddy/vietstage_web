import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock3,
  FilePenLine,
  MessageSquare,
  RefreshCw,
  Send,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { instructorStudentsApi, lessonsApi } from '../../api/services';
import { profileApi } from '../../api/management';
import type { Lesson, PracticeAttemptDetailResponse } from '../../api/types';

type LessonStatus = Lesson['status'];

interface InstructorDashboardData {
  teacherName: string;
  totalStudents?: number;
  totalLessons?: number;
  lessons: Lesson[];
  recentAttempts: PracticeAttemptDetailResponse[];
  attemptsNeedingFeedback: number[];
  recentAttemptTotal: number;
  recentAttemptTotalPages: number;
  hasPartialError: boolean;
}

const lessonStatusMeta: Record<LessonStatus, { label: string; color: string; icon: typeof CircleDashed }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-400', icon: FilePenLine },
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-500', icon: Clock3 },
  APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-600', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'bg-rose-500', icon: RefreshCw },
};

const scoreLabel = (score?: number) =>
  typeof score === 'number' ? `${score.toFixed(2)} điểm` : 'Chưa chấm điểm';

const RECENT_PAGE_SIZE = 5;

// Dashboard giảng viên: chỉ giữ chỉ số chính, việc cần xử lý và lượt tập mới nhất.
const InstructorDashboard = () => {
  const [recentPage, setRecentPage] = useState(1);
  const [feedbackTarget, setFeedbackTarget] = useState<PracticeAttemptDetailResponse | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  // Tải toàn bộ dữ liệu dashboard (profile, students, attempts, lessons của chính giảng viên) — cho phép lỗi từng phần
  const fetchDashboard = useCallback(async (signal?: AbortSignal): Promise<InstructorDashboardData> => {
    const profilePromise = profileApi.get({ signal });
    const studentsPromise = instructorStudentsApi.listStudents(0, 1, undefined, { signal });
    const recentAttemptsPromise = (async () => {
      // Dashboard chỉ lấy các lượt mới nhất; không tải toàn bộ lịch sử chỉ để đếm.
      const response = await instructorStudentsApi.getInstructorAttempts({ page: recentPage - 1, size: RECENT_PAGE_SIZE }, { signal });
      return { ...response, content: (response.content ?? []).sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      }) };
    })();
    const ownLessonsPromise = (async () => {
      const profile = await profilePromise;
      const firstPage = await lessonsApi.list(new URLSearchParams({ page: '1', size: '100' }), { signal });
      const lessonPages = [firstPage];
      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        lessonPages.push(await lessonsApi.list(
          new URLSearchParams({ page: String(page), size: '100' }),
          { signal },
        ));
      }
      return lessonPages
        .flatMap((lessonPage) => lessonPage.content ?? [])
        .filter((lesson) => lesson.createdBy?.id === profile.id);
    })();

    const [profileResult, studentsResult, recentResult, lessonsResult] = await Promise.allSettled([
      profilePromise,
      studentsPromise,
      recentAttemptsPromise,
      ownLessonsPromise,
    ]);
    const recentAttemptPage = recentResult.status === 'fulfilled' ? recentResult.value : undefined;
    const recentAttempts = recentAttemptPage?.content ?? [];
    // API chưa trả feedbackCount trong attempt; chỉ kiểm tra 5 lượt trên trang hiện tại.
    const feedbackResults = await Promise.allSettled(recentAttempts.map((attempt) => instructorStudentsApi.getFeedbacks(attempt.attemptId, { signal })));
    const attemptsNeedingFeedback = recentAttempts
      .filter((_, index) => {
        const result = feedbackResults[index];
        if (result.status !== 'fulfilled') return false;
        const feedback = result.value;
        return Array.isArray(feedback) ? feedback.length === 0 : (feedback.content ?? []).length === 0;
      })
      .map((attempt) => attempt.attemptId);
    const results = [profileResult, studentsResult, recentResult, lessonsResult, ...feedbackResults];

    return {
      teacherName: profileResult.status === 'fulfilled' ? profileResult.value.fullName : '',
      totalStudents: studentsResult.status === 'fulfilled' ? studentsResult.value.totalElements : undefined,
      totalLessons: lessonsResult.status === 'fulfilled' ? lessonsResult.value.length : undefined,
      lessons: lessonsResult.status === 'fulfilled' ? lessonsResult.value : [],
      recentAttempts,
      attemptsNeedingFeedback,
      recentAttemptTotal: recentAttemptPage?.totalElements ?? 0,
      recentAttemptTotalPages: recentAttemptPage?.totalPages ?? 1,
      hasPartialError: results.some((result) => result.status === 'rejected'),
    };
  }, [recentPage]);

  const { data, loading, execute } = useAxiosRequest(fetchDashboard, { auto: false });
  useEffect(() => { void execute(); }, [execute, recentPage]);
  const teacherName = data?.teacherName?.trim();

  const statusRows = useMemo(() => {
    const counts: Record<LessonStatus, number> = { DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const lesson of data?.lessons ?? []) {
      if (lesson.status in counts) counts[lesson.status] += 1;
    }
    return (Object.keys(counts) as LessonStatus[]).map((status) => ({
      status,
      count: counts[status],
      ...lessonStatusMeta[status],
    }));
  }, [data?.lessons]);

  const recentTotalPages = Math.max(1, data?.recentAttemptTotalPages ?? 1);
  const paginatedRecentAttempts = data?.recentAttempts ?? [];
  const recentAttemptTotal = data?.recentAttemptTotal ?? 0;
  const recentPageStart = Math.max(1, Math.min(recentPage - 2, recentTotalPages - 4));
  const recentPageNumbers = Array.from(
    { length: Math.min(5, recentTotalPages) },
    (_, index) => recentPageStart + index,
  );

  const attemptsNeedingFeedback = data?.attemptsNeedingFeedback ?? [];
  const pendingLessons = statusRows.find((row) => row.status === 'PENDING')?.count ?? 0;
  const statCards = [
    { icon: Users, label: 'Học viên đang theo dõi', value: data?.totalStudents, href: '/instructor/students' },
    { icon: BookOpen, label: 'Bài giảng của tôi', value: data?.totalLessons, href: '/instructor/lessons' },
    { icon: Clock3, label: 'Bài chờ duyệt', value: pendingLessons, href: '/instructor/lessons' },
  ];

  const submitFeedback = async () => {
    if (!feedbackTarget || !feedbackText.trim()) return;
    setSendingFeedback(true);
    setFeedbackError('');
    try {
      await instructorStudentsApi.sendFeedback(feedbackTarget.attemptId, feedbackText.trim());
      setFeedbackTarget(null);
      setFeedbackText('');
      await execute();
    } catch {
      setFeedbackError('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#163d2d] md:text-4xl">
            {teacherName ? `Xin chào, ${teacherName}` : 'Xin chào'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#68736d] md:text-base">
            Theo dõi nhanh bài giảng, học viên và kết quả luyện tập mới nhất.
          </p>
        </div>
      </header>

      {data?.hasPartialError && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Một số dữ liệu chưa thể tải. Các phần còn lại vẫn được cập nhật bình thường.</span>
          <button type="button" onClick={() => void execute()} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="Chỉ số tổng quan">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group flex items-center gap-3 rounded-xl border border-[#e0e9e4] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(20,61,44,0.04)] transition hover:-translate-y-0.5 hover:border-[#bfd3c7] hover:shadow-[0_10px_28px_rgba(20,61,44,0.08)]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf5f1] text-[#1D4532]">
              <stat.icon className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 text-sm font-medium text-[#6b7770]">{stat.label}</p>
            <p className="text-xl font-bold tracking-tight text-[#173f2f]">
              {loading || stat.value === undefined ? '—' : stat.value.toLocaleString('vi-VN')}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-[#e0e9e4] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(20,61,44,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#173f2f]">Việc cần xử lý</h2>
              <p className="mt-0.5 text-sm text-[#718078]">Các lượt mới chưa phản hồi và trạng thái bài giảng.</p>
            </div>
            <Link to="/instructor/lessons" className="text-sm font-semibold text-[#1D4532] hover:underline">Chi tiết</Link>
          </div>

          {loading ? (
            <div className="mt-3 h-10 animate-pulse rounded-lg bg-[#f1f5f3]" />
          ) : (data?.totalLessons ?? 0) === 0 && recentAttemptTotal === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#fafcfb] px-3 py-2.5 text-sm text-[#365647]">
                <BookOpen className="h-4 w-4 text-[#91a39a]" />
                <Link to="/instructor/media" className="inline-flex items-center gap-1 font-semibold text-[#1D4532] hover:underline">
                  Tạo bài giảng <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link to="/instructor/students" className="flex items-center justify-between rounded-lg border border-[#d7e8dd] bg-[#f7fbf8] px-3 py-2 transition hover:bg-[#edf7f2]">
                <span className="flex items-center gap-2 text-sm font-medium text-[#365647]"><MessageSquare className="h-4 w-4 text-[#1D4532]" /> Lượt mới chưa phản hồi</span>
                <span className="rounded-full bg-[#1D4532] px-2.5 py-1 text-xs font-bold text-white">{attemptsNeedingFeedback.length}</span>
              </Link>
              {statusRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.status} className="flex items-center gap-2 rounded-lg border border-[#e8eeea] px-3 py-2">
                    <Icon className="h-4 w-4 text-[#64766c]" />
                    <span className="text-sm font-medium text-[#44564d]">{row.label}</span>
                    <span className="text-sm font-bold text-[#173f2f]">{row.count}</span>
                  </div>
                );
              })}
            </div>
          )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e0e9e4] bg-white shadow-[0_4px_18px_rgba(20,61,44,0.04)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#e8eeea] px-5 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#173f2f]">Lượt luyện tập mới nhất</h2>
            <p className="mt-1 text-sm text-[#718078]">Các bài nộp gần đây từ học viên của bạn.</p>
            <p className="mt-1 text-xs text-[#8a9690]">Chú thích: sắp xếp theo ngày và thời gian gửi mới nhất; điểm hiển thị đến 2 chữ số thập phân.</p>
          </div>
          <Link to="/instructor/students" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#1D4532] hover:underline">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5 md:p-6">
            {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-[#f1f5f3]" />)}
          </div>
        ) : (data?.recentAttempts.length ?? 0) === 0 ? (
          <div className="grid min-h-40 place-items-center px-6 py-8 text-center">
            <div>
              <Send className="mx-auto h-8 w-8 text-[#91a39a]" />
              <p className="mt-3 font-semibold text-[#365647]">Chưa có lượt luyện tập nào</p>
              <p className="mt-1 text-sm text-[#7a8780]">Bài nộp mới của học viên sẽ xuất hiện tại đây.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#edf1ef]">
            {paginatedRecentAttempts.map((attempt) => (
              <article key={attempt.attemptId} className="grid gap-3 px-5 py-4 transition hover:bg-[#fafcfb] md:grid-cols-[minmax(160px,0.8fr)_minmax(220px,1.4fr)_120px_116px_170px] md:items-center md:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#294c3c]">{attempt.learnerName || 'Chưa cập nhật tên'}</p>
                  <p className="mt-0.5 truncate text-xs text-[#7a8780]">Học viên</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#354b40]">{attempt.lessonTitle || 'Chưa cập nhật bài học'}</p>
                  <p className="mt-0.5 truncate text-xs text-[#7a8780]">{attempt.exerciseTitle || 'Chưa cập nhật bài tập'} · Lượt #{attempt.attemptId}</p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-[#edf5f1] px-2.5 py-1 text-xs font-bold text-[#1D4532]">
                    {scoreLabel(attempt.totalScore)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setFeedbackTarget(attempt); setFeedbackText(''); setFeedbackError(''); }}
                  className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition ${attemptsNeedingFeedback.includes(attempt.attemptId) ? 'border-[#1D4532] bg-[#1D4532] text-white hover:bg-[#163d2d]' : 'border-[#d8e4dd] text-[#365647] hover:bg-[#edf7f2]'}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Phản hồi
                </button>
                <time className="text-xs text-[#718078]" dateTime={attempt.createdAt}>
                  {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString('vi-VN') : 'Chưa cập nhật thời gian'}
                </time>
              </article>
            ))}
            <div className="flex flex-col gap-3 px-5 py-4 text-sm text-[#66756d] sm:flex-row sm:items-center sm:justify-between md:px-6">
              <span>
                Hiển thị {recentAttemptTotal === 0 ? 0 : (recentPage - 1) * RECENT_PAGE_SIZE + 1}–{Math.min(recentPage * RECENT_PAGE_SIZE, recentAttemptTotal)} trong {recentAttemptTotal} lượt luyện tập
              </span>
              <div className="flex gap-2">
                <button type="button" aria-label="Trang trước" disabled={recentPage === 1} onClick={() => setRecentPage((page) => Math.max(1, page - 1))} className="p-2 border border-outline-variant rounded hover:bg-[#EDF7F2] transition-colors disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {recentPageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    aria-label={`Trang ${page}`}
                    aria-current={page === recentPage ? 'page' : undefined}
                    onClick={() => setRecentPage(page)}
                    className={`px-3 py-1 rounded font-bold transition-colors ${page === recentPage ? 'bg-[#1D4532] text-white' : 'border border-outline-variant hover:bg-[#EDF7F2]'}`}
                  >
                    {page}
                  </button>
                ))}
                <button type="button" aria-label="Trang sau" disabled={recentPage === recentTotalPages} onClick={() => setRecentPage((page) => Math.min(recentTotalPages, page + 1))} className="p-2 border border-outline-variant rounded hover:bg-[#EDF7F2] transition-colors disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {feedbackTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <form
            onSubmit={(event) => { event.preventDefault(); void submitFeedback(); }}
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="feedback-title" className="text-lg font-bold text-[#173f2f]">Phản hồi lượt luyện tập</h2>
                <p className="mt-1 text-sm text-[#718078]">{feedbackTarget.learnerName} · {feedbackTarget.lessonTitle}</p>
              </div>
              <button type="button" onClick={() => { setFeedbackTarget(null); setFeedbackError(''); }} className="rounded-lg p-2 text-[#607268] hover:bg-[#edf5f1]" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f7fbf8] p-3 text-sm">
              <span>Điểm tổng: <strong className="text-[#173f2f]">{scoreLabel(feedbackTarget.totalScore)}</strong></span>
              <span>Kết quả: <strong className="text-[#173f2f]">{feedbackTarget.isPassed ? 'Đạt' : 'Cần luyện thêm'}</strong></span>
            </div>
            <label className="mt-4 block text-sm font-semibold text-[#365647]">Nhận xét cho học viên
              <textarea
                autoFocus
                required
                rows={5}
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                placeholder="Ví dụ: Em giữ nhịp tốt. Hãy luyện chậm hơn ở đoạn chuyển ngón thứ hai."
                className="mt-2 w-full resize-none rounded-xl border border-[#d8e4dd] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#1D4532] focus:ring-2 focus:ring-[#1D4532]/15"
              />
            </label>
            {feedbackError && <p className="mt-2 text-sm font-medium text-rose-700" role="alert">{feedbackError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setFeedbackTarget(null); setFeedbackError(''); }} className="rounded-lg border border-[#d8e4dd] px-4 py-2.5 text-sm font-bold text-[#365647] hover:bg-[#f7fbf8]">Hủy</button>
              <button disabled={sendingFeedback || !feedbackText.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4532] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#163d2d] disabled:opacity-50"><Send className="h-4 w-4" /> {sendingFeedback ? 'Đang gửi…' : 'Gửi phản hồi'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
