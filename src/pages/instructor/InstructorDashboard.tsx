import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FilePenLine,
  RefreshCw,
  Send,
  Users,
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
  totalAttempts?: number;
  lessons: Lesson[];
  recentAttempts: PracticeAttemptDetailResponse[];
  weeklyAttempts: PracticeAttemptDetailResponse[];
  hasPartialError: boolean;
}

const lessonStatusMeta: Record<LessonStatus, { label: string; color: string; icon: typeof CircleDashed }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-400', icon: FilePenLine },
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-500', icon: Clock3 },
  APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-600', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'bg-rose-500', icon: RefreshCw },
};

const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const scoreLabel = (score?: number) =>
  typeof score === 'number' ? `${score.toFixed(2)} điểm` : 'Chưa chấm điểm';

const RECENT_PAGE_SIZE = 5;

// Dashboard giảng viên: thống kê học viên/bài giảng/lượt tập, biểu đồ 7 ngày, trạng thái bài giảng, lượt tập mới nhất
const InstructorDashboard = () => {
  const [recentPage, setRecentPage] = useState(1);
  // Tải toàn bộ dữ liệu dashboard (profile, students, attempts, lessons của chính giảng viên) — cho phép lỗi từng phần
  const fetchDashboard = useCallback(async (signal?: AbortSignal): Promise<InstructorDashboardData> => {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - 6);

    const profilePromise = profileApi.get({ signal });
    const studentsPromise = instructorStudentsApi.listStudents(0, 1, undefined, { signal });
    const recentAttemptsPromise = (async () => {
      const attempts: PracticeAttemptDetailResponse[] = [];
      let page = 0;
      let totalPages = 1;
      while (page < totalPages) {
        const response = await instructorStudentsApi.getInstructorAttempts({ page, size: 100 }, { signal });
        attempts.push(...(response.content ?? []));
        totalPages = response.totalPages ?? 1;
        page += 1;
      }
      return attempts.sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
    })();
    const weeklyAttemptsPromise = (async () => {
      const attempts: PracticeAttemptDetailResponse[] = [];
      let page = 0;
      let totalPages = 1;
      while (page < totalPages) {
        const response = await instructorStudentsApi.getInstructorAttempts({
          fromDate: toLocalDate(firstDay),
          toDate: toLocalDate(today),
          page,
          size: 100,
        }, { signal });
        attempts.push(...(response.content ?? []));
        totalPages = response.totalPages ?? 1;
        page += 1;
      }
      return attempts;
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

    const [profileResult, studentsResult, recentResult, weeklyResult, lessonsResult] = await Promise.allSettled([
      profilePromise,
      studentsPromise,
      recentAttemptsPromise,
      weeklyAttemptsPromise,
      ownLessonsPromise,
    ]);
    const results = [profileResult, studentsResult, recentResult, weeklyResult, lessonsResult];

    return {
      teacherName: profileResult.status === 'fulfilled' ? profileResult.value.fullName : '',
      totalStudents: studentsResult.status === 'fulfilled' ? studentsResult.value.totalElements : undefined,
      totalLessons: lessonsResult.status === 'fulfilled' ? lessonsResult.value.length : undefined,
      totalAttempts: recentResult.status === 'fulfilled' ? recentResult.value.length : undefined,
      lessons: lessonsResult.status === 'fulfilled' ? lessonsResult.value : [],
      recentAttempts: recentResult.status === 'fulfilled' ? recentResult.value : [],
      weeklyAttempts: weeklyResult.status === 'fulfilled' ? weeklyResult.value : [],
      hasPartialError: results.some((result) => result.status === 'rejected'),
    };
  }, []);

  const { data, loading, execute } = useAxiosRequest(fetchDashboard);
  const teacherName = data?.teacherName?.trim();

  // Số lượt luyện tập mỗi ngày trong 7 ngày gần nhất (cho biểu đồ cột)
  const chartRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const attempt of data?.weeklyAttempts ?? []) {
      if (!attempt.createdAt) continue;
      const attemptDate = new Date(attempt.createdAt);
      if (Number.isNaN(attemptDate.getTime())) continue;
      const key = toLocalDate(attemptDate);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const rows: Array<{ date: string; label: string; attempts: number }> = [];
    const today = new Date();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = toLocalDate(date);
      rows.push({
        date: key,
        label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        attempts: counts.get(key) ?? 0,
      });
    }
    return rows;
  }, [data?.weeklyAttempts]);

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

  const recentTotalPages = Math.max(1, Math.ceil((data?.recentAttempts.length ?? 0) / RECENT_PAGE_SIZE));
  const paginatedRecentAttempts = useMemo(
    () => (data?.recentAttempts ?? []).slice((recentPage - 1) * RECENT_PAGE_SIZE, recentPage * RECENT_PAGE_SIZE),
    [data?.recentAttempts, recentPage],
  );

  const maxAttempts = Math.max(1, ...chartRows.map((row) => row.attempts));
  const weeklyTotal = chartRows.reduce((total, row) => total + row.attempts, 0);
  const statCards = [
    { icon: Users, label: 'Học viên đang theo dõi', value: data?.totalStudents, href: '/instructor/students' },
    { icon: BookOpen, label: 'Bài giảng của tôi', value: data?.totalLessons, href: '/instructor/lessons' },
    { icon: Activity, label: 'Tổng lượt luyện tập', value: data?.totalAttempts, href: '/instructor/students' },
  ];

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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Chỉ số tổng quan">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)] transition hover:-translate-y-0.5 hover:border-[#bfd3c7] hover:shadow-[0_10px_28px_rgba(20,61,44,0.08)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5f1] text-[#1D4532]">
                <stat.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-[#9aa9a1] transition group-hover:translate-x-0.5 group-hover:text-[#1D4532]" />
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#173f2f]">
              {loading || stat.value === undefined ? '—' : stat.value.toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-sm font-medium text-[#6b7770]">{stat.label}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <article className="rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#173f2f]">Hoạt động 7 ngày gần nhất</h2>
              <p className="mt-1 text-sm text-[#718078]">Số lượt luyện tập của học viên theo ngày.</p>
            </div>
            <div className="rounded-xl bg-[#edf5f1] px-3 py-2 text-right">
              <p className="text-lg font-bold leading-none text-[#1D4532]">{weeklyTotal}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#718078]">Lượt tập</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 h-52 animate-pulse rounded-xl bg-[#f1f5f3]" />
          ) : weeklyTotal === 0 ? (
            <div className="mt-6 grid min-h-52 place-items-center rounded-xl border border-dashed border-[#d5e2db] bg-[#fafcfb] px-6 text-center">
              <div>
                <Activity className="mx-auto h-8 w-8 text-[#91a39a]" />
                <p className="mt-3 font-semibold text-[#365647]">Chưa có lượt luyện tập trong 7 ngày qua</p>
                <p className="mt-1 text-sm text-[#7a8780]">Hoạt động mới sẽ được cập nhật tự động tại đây.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid h-52 grid-cols-7 items-end gap-2 sm:gap-3" aria-label="Biểu đồ lượt luyện tập 7 ngày">
              {chartRows.map((row) => (
                <div key={row.date} className="flex h-full min-w-0 flex-col justify-end gap-2 text-center">
                  <span className="text-xs font-bold text-[#1D4532]">{row.attempts}</span>
                  <div className="flex h-36 items-end justify-center rounded-lg bg-[#f3f7f5] px-1.5">
                    <div
                      className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[#1D4532] to-[#4f856c]"
                      style={{ height: row.attempts === 0 ? 0 : `${Math.max(9, (row.attempts / maxAttempts) * 100)}%` }}
                    />
                  </div>
                  <span className="truncate text-[10px] font-medium text-[#7a8780] sm:text-xs">{row.label}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#173f2f]">Trạng thái bài giảng</h2>
              <p className="mt-1 text-sm text-[#718078]">Tổng hợp từ các bài giảng của bạn.</p>
            </div>
            <Link to="/instructor/lessons" className="text-sm font-semibold text-[#1D4532] hover:underline">Chi tiết</Link>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f3]" />)}
            </div>
          ) : (data?.totalLessons ?? 0) === 0 ? (
            <div className="mt-6 grid min-h-52 place-items-center rounded-xl border border-dashed border-[#d5e2db] bg-[#fafcfb] px-5 text-center">
              <div>
                <BookOpen className="mx-auto h-8 w-8 text-[#91a39a]" />
                <p className="mt-3 font-semibold text-[#365647]">Chưa có bài giảng</p>
                <Link to="/instructor/media" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1D4532] hover:underline">
                  Tạo bài giảng <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {statusRows.map((row) => {
                const Icon = row.icon;
                const percentage = data?.totalLessons ? (row.count / data.totalLessons) * 100 : 0;
                return (
                  <div key={row.status} className="rounded-xl border border-[#e8eeea] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-[#64766c]" />
                        <span className="text-sm font-medium text-[#44564d]">{row.label}</span>
                      </div>
                      <span className="text-sm font-bold text-[#173f2f]">{row.count}</span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#edf2ef]">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
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
              <article key={attempt.attemptId} className="grid gap-3 px-5 py-4 transition hover:bg-[#fafcfb] md:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1.4fr)_120px_190px] md:items-center md:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#294c3c]">{attempt.learnerName || 'Chưa cập nhật tên'}</p>
                  <p className="mt-0.5 truncate text-xs text-[#7a8780]">Học viên</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#354b40]">{attempt.lessonTitle || 'Chưa cập nhật bài học'}</p>
                  <p className="mt-0.5 truncate text-xs text-[#7a8780]">{attempt.exerciseTitle || 'Chưa cập nhật bài tập'}</p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-[#edf5f1] px-2.5 py-1 text-xs font-bold text-[#1D4532]">
                    {scoreLabel(attempt.totalScore)}
                  </span>
                </div>
                <time className="text-xs text-[#718078]" dateTime={attempt.createdAt}>
                  {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString('vi-VN') : 'Chưa cập nhật thời gian'}
                </time>
              </article>
            ))}
            <div className="flex flex-col gap-3 px-5 py-4 text-sm text-[#66756d] sm:flex-row sm:items-center sm:justify-between md:px-6">
              <span>
                Hiển thị {(recentPage - 1) * RECENT_PAGE_SIZE + 1}–{Math.min(recentPage * RECENT_PAGE_SIZE, data?.recentAttempts.length ?? 0)} trong {data?.recentAttempts.length ?? 0} lượt luyện tập
              </span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={recentPage === 1} onClick={() => setRecentPage((page) => Math.max(1, page - 1))} className="h-9 rounded-lg border border-[#d8e4dd] px-3 font-semibold text-[#365647] disabled:opacity-40">Trước</button>
                <span className="min-w-20 text-center font-semibold text-[#294c3c]">Trang {recentPage}/{recentTotalPages}</span>
                <button type="button" disabled={recentPage === recentTotalPages} onClick={() => setRecentPage((page) => Math.min(recentTotalPages, page + 1))} className="h-9 rounded-lg border border-[#d8e4dd] px-3 font-semibold text-[#365647] disabled:opacity-40">Sau</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default InstructorDashboard;
