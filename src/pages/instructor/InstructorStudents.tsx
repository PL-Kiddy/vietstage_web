import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { lessonsApi, learnerProgressApi, instructorStudentsApi } from '../../api/services';
import type { FeedbackResponse, PracticeAttempt } from '../../api/types';
import { Search, X, BookOpen, ChevronRight, Users, Loader2, Check, HelpCircle, User, CalendarDays, BarChart3, Clock3, MessageSquareText, Send } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LessonProgress {
  lessonId: number;
  stars: number;
  completed: boolean;
  totalPracticeAttempts: number;
  bestPracticeScore: number;
  totalQuizAttempts: number;
  loading: boolean;
  error: boolean;
}

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getInitialDateFrom = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toDateInputValue(date);
};

const CustomStar = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const StarDisplay = ({ count }: { count: number }) => (
  <div className="flex gap-1 items-center justify-center">
    {[1, 2, 3].map((i) => (
      <CustomStar
        key={i}
        className={`w-4 h-4 ${i <= count
          ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_1px_2px_rgba(251,191,36,0.5)]'
          : 'text-gray-200 fill-gray-200'
          }`}
      />
    ))}
  </div>
);

const InstructorStudents = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('ALL');
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 5;
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgress>>({});
  const [practiceAttempts, setPracticeAttempts] = useState<PracticeAttempt[]>([]);
  const [practiceAttemptsLoading, setPracticeAttemptsLoading] = useState(false);
  const [practiceAttemptsError, setPracticeAttemptsError] = useState('');
  const [practiceDateFrom, setPracticeDateFrom] = useState(getInitialDateFrom);
  const [practiceDateTo, setPracticeDateTo] = useState(() => toDateInputValue(new Date()));
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [attemptFeedbacks, setAttemptFeedbacks] = useState<FeedbackResponse[]>([]);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Track currently selected instrument to filter the selected student's progress
  const [selectedStudentInstrument, setSelectedStudentInstrument] = useState<string>('');

  // The learner list must come from the server; never substitute demo identities
  // when an authorization or connectivity error occurs.
  const { data: learnersPage, loading: usersLoading, error: usersError } = useAxiosRequest(
    (signal) => instructorStudentsApi.listStudents(0, 100, undefined, { signal }),
    { auto: true },
  );

  const allStudents = useMemo(() => {
    const rawList = Array.isArray((learnersPage as any)?.content)
      ? (learnersPage as any).content
      : [];

    const mapped = rawList.map((u: any) => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      userCode: u.userCode,
      instrument: u.instrumentName,
      instrumentsList: u.instrumentName ? [u.instrumentName] : [],
    }));

    return mapped;
  }, [learnersPage]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.userCode && s.userCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesInstrument =
        instrumentFilter === 'ALL' ||
        s.instrumentsList.some((inst: string) => inst.toLowerCase() === instrumentFilter.toLowerCase());

      return matchesSearch && matchesInstrument;
    });
  }, [allStudents, searchQuery, instrumentFilter]);

  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);
  }, [filteredStudents, studentPage]);

  // Selected student
  const selectedStudent = useMemo(
    () => (selectedStudentId !== null ? allStudents.find((s: any) => s.id === selectedStudentId) ?? null : null),
    [allStudents, selectedStudentId]
  );

  // Sync selected student instrument list
  useEffect(() => {
    setSelectedAttemptId(null);
    if (selectedStudent) {
      // Default to the first instrument they learn
      setSelectedStudentInstrument(selectedStudent.instrumentsList[0] || 'Đàn Tranh');
    } else {
      setSelectedStudentInstrument('');
    }
  }, [selectedStudent]);

  // 2. Fetch instructor's lesson list
  const lessonParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', '0');
    p.set('size', '50');
    return p;
  }, []);

  const { data: lessonsRaw, loading: lessonsLoading } = useAxiosRequest(
    (signal) => lessonsApi.list(lessonParams, { signal }),
    { auto: true }
  );

  const lessons = useMemo(() => {
    const raw = lessonsRaw as any;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.content)) return raw.content;
    return [];
  }, [lessonsRaw]);

  // 3. Fetch per-lesson progress for selected learner
  const fetchLessonProgress = useCallback(
    async (learnerId: number, lessonId: number) => {
      setLessonProgressMap((prev) => ({
        ...prev,
        [lessonId]: { lessonId, stars: 0, completed: false, totalPracticeAttempts: 0, bestPracticeScore: 0, totalQuizAttempts: 0, loading: true, error: false },
      }));
      try {
        const result = await learnerProgressApi.getLessonLearnerProgress(lessonId, learnerId);
        setLessonProgressMap((prev) => ({
          ...prev,
          [lessonId]: {
            lessonId,
            stars: (result as any)?.stars ?? 0,
            completed: (result as any)?.completed ?? false,
            totalPracticeAttempts: (result as any)?.totalPracticeAttempts ?? 0,
            bestPracticeScore: (result as any)?.bestPracticeScore ?? 0,
            totalQuizAttempts: (result as any)?.totalQuizAttempts ?? 0,
            loading: false,
            error: false,
          },
        }));
      } catch {
        setLessonProgressMap((prev) => ({
          ...prev,
          [lessonId]: { lessonId, stars: 0, completed: false, totalPracticeAttempts: 0, bestPracticeScore: 0, totalQuizAttempts: 0, loading: false, error: true },
        }));
      }
    },
    []
  );

  // Filter progress details by the selected student's currently active viewed instrument
  const studentLessons = useMemo(() => {
    if (!selectedStudent || !selectedStudentInstrument) return [];
    return lessons.filter((lesson: any) => {
      const lessonInstName = (lesson as any).instrument?.name ?? (lesson as any).instrumentName ?? '';
      if (!lessonInstName) return false;
      return lessonInstName.toLowerCase().trim() === selectedStudentInstrument.toLowerCase().trim();
    });
  }, [lessons, selectedStudent, selectedStudentInstrument]);

  useEffect(() => {
    if (!selectedStudentId || studentLessons.length === 0) {
      setLessonProgressMap({});
      return;
    }
    studentLessons.forEach((lesson: any) => {
      fetchLessonProgress(selectedStudentId, lesson.id);
    });
  }, [selectedStudentId, studentLessons, fetchLessonProgress]);

  // Load attempts via the Instructor endpoint. Both feedback and frequency
  // reporting use this same authorized attempt set.
  useEffect(() => {
    if (!selectedStudentId) {
      setPracticeAttempts([]);
      setPracticeAttemptsError('');
      setPracticeAttemptsLoading(false);
      return;
    }

    if (practiceDateFrom > practiceDateTo) {
      setPracticeAttempts([]);
      setPracticeAttemptsError('Khoảng ngày không hợp lệ. Ngày bắt đầu phải không sau ngày kết thúc.');
      setPracticeAttemptsLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadAttempts = async () => {
      setPracticeAttemptsLoading(true);
      setPracticeAttemptsError('');
      setSelectedAttemptId(null);
      try {
        const attempts: PracticeAttempt[] = [];
        let page = 0;
        let totalPages = 1;
        while (page < totalPages) {
          const result = await instructorStudentsApi.getInstructorAttempts(
            {
              learnerId: selectedStudentId,
              fromDate: practiceDateFrom,
              toDate: practiceDateTo,
              page,
              size: 100,
            },
            { signal: controller.signal },
          );
          attempts.push(...(result.content ?? []).map((attempt) => ({
            id: attempt.attemptId,
            createdAt: attempt.createdAt,
            lessonName: attempt.lessonTitle,
            overall_score: attempt.totalScore,
            pitch_score: attempt.pitchScore,
            rhythm_score: attempt.rhythmScore,
            duration: attempt.durationSeconds ? String(attempt.durationSeconds) : undefined,
          })));
          totalPages = result.totalPages ?? 1;
          page += 1;
        }
        if (!controller.signal.aborted) setPracticeAttempts(attempts);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setPracticeAttempts([]);
          setPracticeAttemptsError(cause instanceof Error ? cause.message : 'Không thể tải lịch sử luyện tập.');
        }
      } finally {
        if (!controller.signal.aborted) setPracticeAttemptsLoading(false);
      }
    };
    void loadAttempts();
    return () => controller.abort();
  }, [selectedStudentId, practiceDateFrom, practiceDateTo]);

  useEffect(() => {
    if (!selectedAttemptId) {
      setAttemptFeedbacks([]);
      setFeedbackComment('');
      setFeedbackError('');
      return;
    }
    const controller = new AbortController();
    const loadFeedbacks = async () => {
      setFeedbackLoading(true);
      setFeedbackError('');
      try {
        const result = await instructorStudentsApi.getFeedbacks(selectedAttemptId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          const list = Array.isArray(result)
            ? result
            : (result as any)?.content && Array.isArray((result as any).content)
              ? (result as any).content
              : result ? [result] : [];
          setAttemptFeedbacks(list);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setAttemptFeedbacks([]);
          setFeedbackError(cause instanceof Error ? cause.message : 'Không thể tải phản hồi của lượt tập.');
        }
      } finally {
        if (!controller.signal.aborted) setFeedbackLoading(false);
      }
    };
    void loadFeedbacks();
    return () => controller.abort();
  }, [selectedAttemptId]);

  // Summary stats aggregated from filtered student lessons
  const summaryStats = useMemo(() => {
    const rows = Object.values(lessonProgressMap).filter((r) => !r.loading && !r.error);
    const matchedLessonIds = new Set(studentLessons.map((l: any) => l.id));
    const filteredRows = rows.filter(r => matchedLessonIds.has(r.lessonId));

    return {
      completed: filteredRows.filter((r) => r.completed).length,
      totalStars: filteredRows.reduce((acc, r) => acc + (r.stars || 0), 0),
      totalLessons: studentLessons.length,
      avgScore: filteredRows.length > 0
        ? ((filteredRows.reduce((acc, r) => acc + (r.bestPracticeScore || 0), 0) / filteredRows.length) * 100).toFixed(0)
        : null,
    };
  }, [lessonProgressMap, studentLessons]);

  const progressRows = useMemo(
    () => studentLessons.map((lesson: any) => ({ id: lesson.id, title: lesson.title, progress: lessonProgressMap[lesson.id] ?? null })),
    [studentLessons, lessonProgressMap]
  );

  const frequencyReport = useMemo(() => {
    const start = new Date(`${practiceDateFrom}T00:00:00`);
    const end = new Date(`${practiceDateTo}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return { invalidRange: true, rows: [] as { date: string; label: string; attempts: number }[], total: 0, activeDays: 0 };
    }

    const counts = new Map<string, number>();
    practiceAttempts.forEach((attempt) => {
      const rawDate = attempt.createdAt ?? (attempt as PracticeAttempt & { created_at?: string }).created_at;
      const date = rawDate ? new Date(rawDate) : null;
      if (!date || Number.isNaN(date.getTime()) || date < start || date > end) return;
      const key = toDateInputValue(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const rows: { date: string; label: string; attempts: number }[] = [];
    for (const cursor = new Date(start); cursor <= end && rows.length < 366; cursor.setDate(cursor.getDate() + 1)) {
      const date = toDateInputValue(cursor);
      rows.push({ date, label: cursor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), attempts: counts.get(date) ?? 0 });
    }
    const total = rows.reduce((sum, row) => sum + row.attempts, 0);
    return { invalidRange: false, rows, total, activeDays: rows.filter((row) => row.attempts > 0).length };
  }, [practiceAttempts, practiceDateFrom, practiceDateTo]);

  const selectedAttempt = useMemo(
    () => practiceAttempts.find((attempt) => attempt.id === selectedAttemptId) ?? null,
    [practiceAttempts, selectedAttemptId],
  );

  const submitFeedback = async () => {
    if (!selectedAttemptId || !feedbackComment.trim()) return;
    setFeedbackSaving(true);
    setFeedbackError('');
    try {
      const created = await instructorStudentsApi.sendFeedback(selectedAttemptId, feedbackComment.trim());
      if (created) {
        setAttemptFeedbacks((current) => [...current, created]);
      }
      setFeedbackComment('');
      // Refresh list to ensure consistency with backend
      try {
        const freshList = await instructorStudentsApi.getFeedbacks(selectedAttemptId);
        const list = Array.isArray(freshList)
          ? freshList
          : (freshList as any)?.content && Array.isArray((freshList as any).content)
            ? (freshList as any).content
            : freshList ? [freshList] : [];
        if (list.length > 0) setAttemptFeedbacks(list);
      } catch {
        // Ignore refresh error if optimistic update succeeded
      }
    } catch (cause) {
      setFeedbackError(cause instanceof Error ? cause.message : 'Không thể gửi phản hồi.');
    } finally {
      setFeedbackSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-xl">
        <h2 className="text-headline-lg font-bold text-[#1D4532]">
          Tiến độ & Phản hồi
        </h2>
        <p className="text-on-surface-variant font-body-md mt-base">
          Theo dõi và đánh giá chi tiết kỹ năng biểu diễn của từng học viên.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-md">
          <div className="flex items-center justify-between px-base">
            <h3 className="font-label-md text-label-md uppercase tracking-widest text-[#1D4532] text-xs font-semibold">
              Danh sách Học viên
            </h3>
            <span className="text-[11px] font-semibold text-on-surface-variant/70">
              ({filteredStudents.length})
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-xs">
            <div className="flex items-center gap-xs px-md py-2 bg-white border border-[#d1e4fb] rounded-xl shadow-xs focus-within:ring-1 focus-within:ring-[#1D4532] transition-all flex-grow">
              <Search className="w-4 h-4 text-[#5e5e5b] flex-shrink-0" />
              <input
                type="text"
                placeholder="Tìm học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#5e5e5b] hover:text-error transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instrument Filter */}
            <select
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
              className="bg-white border border-[#d1e4fb] text-xs font-semibold text-[#1D4532] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#1D4532]"
            >
              <option value="ALL">Tất cả nhạc cụ</option>
              <option value="Đàn Bầu">Đàn Bầu</option>
              <option value="Đàn Tranh">Đàn Tranh</option>
              <option value="Sáo Trúc">Sáo Trúc</option>
            </select>
          </div>

          <div className="flex flex-col gap-sm overflow-y-auto max-h-[calc(100vh-380px)] pr-1 custom-scrollbar">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#1D4532]" />
              </div>
            ) : usersError ? (
              <p className="text-xs text-rose-500 italic px-base py-md text-center">
                Lỗi tải danh sách: {usersError}
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic px-base py-md text-center">
                Không tìm thấy học viên phù hợp.
              </p>
            ) : (
              paginatedStudents.map((st: any) => {
                const isSelected = selectedStudentId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-md rounded-xl border transition-all flex items-center justify-between cursor-pointer ${isSelected
                      ? 'bg-[#EDF7F2] border-[#1D4532]/30 shadow-sm border-l-4 border-l-[#1D4532]'
                      : 'bg-white hover:bg-[#EDF7F2]/30 border-outline-variant/10'
                      }`}
                  >
                    <div className="flex items-center gap-md">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${isSelected
                        ? 'bg-[#1D4532] text-white border-transparent'
                        : 'bg-[#EDF7F2] text-[#1D4532] border-[#1D4532]/25'
                        }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`font-label-md text-xs font-bold ${isSelected ? 'text-[#1D4532]' : 'text-on-surface'}`}>
                          {st.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {st.userCode}
                          </span>
                          <span className="text-[10px] text-on-surface-variant/80 truncate max-w-[120px]">
                            • {st.instrumentsList.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#1D4532]' : 'text-on-surface-variant/30'}`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Student List Pagination */}
          {filteredStudents.length > studentsPerPage && (
            <div className="flex items-center justify-between pt-xs px-xs border-t border-outline-variant/10">
              <span className="text-[11px] text-[#5e5e5b]">
                Trang {studentPage}/{totalStudentPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 border border-outline-variant/30 rounded text-[11px] font-bold text-[#1D4532] hover:bg-[#EDF7F2] disabled:opacity-30"
                >
                  Trước
                </button>
                <button
                  disabled={studentPage >= totalStudentPages}
                  onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                  className="px-2 py-1 border border-outline-variant/30 rounded text-[11px] font-bold text-[#1D4532] hover:bg-[#EDF7F2] disabled:opacity-30"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Details Container */}
        {!selectedStudent ? (
          <section className="col-span-12 lg:col-span-9 bg-white rounded-2xl p-12 shadow-sm border border-outline-variant/10 flex flex-col items-center justify-center text-center min-h-[420px]">
            <div className="w-20 h-20 rounded-full bg-[#EDF7F2] flex items-center justify-center text-[#1D4532] mb-4 shadow-inner">
              <Users className="w-10 h-10 opacity-70" />
            </div>
            <h3 className="text-xl font-bold text-[#1D4532] mb-2">
              Vui lòng chọn học viên từ danh sách
            </h3>
            <p className="text-sm text-[#5e5e5b] max-w-md">
              Chọn một học viên ở cột bên trái để xem tiến độ học tập theo từng bài giảng.
            </p>
          </section>
        ) : (
          <section className="col-span-12 lg:col-span-9 flex flex-col gap-lg">
            {/* Student Info Banner */}
            <div className="bg-gradient-to-r from-[#1D4532] to-[#2D5A43] rounded-2xl p-lg text-white flex flex-wrap items-center gap-lg shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-4 opacity-10">
                <Users className="w-40 h-40" />
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0 border border-white/20">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selectedStudent.name}</h2>
                <p className="mt-0.5 text-[11px] font-medium text-white/65">Tổng quan scorecard cho nhạc cụ đang chọn</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1">
                  <span className="bg-white/10 px-2 py-0.5 rounded font-semibold text-xs text-white">
                    {selectedStudent.userCode}
                  </span>
                  <span className="text-xs text-white/80">{selectedStudent.email}</span>
                  <span className="text-white/40">•</span>

                  {/* Multi-instrument Toggle Dropdown */}
                  <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-lg border border-white/10">
                    <span className="text-[11px] font-medium text-white/80">Xem nhạc cụ:</span>
                    <select
                      value={selectedStudentInstrument}
                      onChange={(e) => setSelectedStudentInstrument(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-[#ffe088] focus:ring-0 cursor-pointer outline-none p-0 pr-4"
                    >
                      {selectedStudent.instrumentsList.map((inst: string) => (
                        <option key={inst} value={inst} className="text-on-surface font-semibold text-xs bg-white text-[#1D4532]">
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-xl ml-auto flex-shrink-0 flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-bold">{summaryStats.completed}/{summaryStats.totalLessons}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Bài hoàn thành</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summaryStats.totalStars} ⭐</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Tổng sao</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summaryStats.avgScore ?? '—'}%</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">Điểm TB</p>
                </div>
              </div>
            </div>

            {/* Lesson Progress Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="px-lg py-md border-b border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <BookOpen className="w-4 h-4 text-[#1D4532]" />
                  <h3 className="text-sm font-bold text-[#1D4532]">Bảng điểm & Tiến độ theo Bài giảng</h3>
                </div>
                <span className="text-xs text-[#5e5e5b] font-medium">
                  Tổng số: <strong>{progressRows.length}</strong> bài giảng
                </span>
              </div>

              {lessonsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1D4532]" />
                </div>
              ) : progressRows.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <BookOpen className="w-8 h-8 text-[#1D4532]/30 mb-2" />
                  <p className="text-sm text-on-surface-variant">Bạn chưa có bài giảng nào.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F8FAF9] text-xs text-[#5e5e5b] uppercase tracking-wider border-b border-outline-variant/10">
                        <th className="text-left px-lg py-md font-semibold">Tên bài giảng</th>
                        <th className="text-center px-md py-md font-semibold">Hoàn thành</th>
                        <th className="text-center px-md py-md font-semibold">Sao đạt được</th>
                        <th className="text-center px-md py-md font-semibold">Lượt thực hành</th>
                        <th className="text-center px-md py-md font-semibold">Điểm tốt nhất</th>
                        <th className="text-center px-md py-md font-semibold">Lượt Quiz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {progressRows.map((row: { id: number; title: string; progress: LessonProgress | null }) => {
                        const p = row.progress;
                        return (
                          <tr key={row.id} className="hover:bg-[#EDF7F2]/30 transition-colors">
                            <td className="px-lg py-md">
                              <p className="font-medium text-on-surface text-xs">{row.title}</p>
                            </td>
                            <td className="px-md py-md text-center">
                              {!p || p.loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1D4532]/40 mx-auto" />
                              ) : p.error ? (
                                <span className="text-[10px] text-on-surface-variant/40">—</span>
                              ) : p.completed ? (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-[#EDF7F2] text-[#1D4532]">
                                  <Check className="w-3 h-3 text-[#1D4532]" />
                                  Đạt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-100 text-gray-500">
                                  <HelpCircle className="w-3 h-3 text-gray-400" />
                                  Chưa đạt
                                </span>
                              )}
                            </td>
                            <td className="px-md py-md">
                              <div className="flex justify-center">
                                {!p || p.loading ? (
                                  <div className="flex gap-1">
                                    {[1, 2, 3].map((i) => <CustomStar key={i} className="w-4 h-4 text-gray-200 fill-gray-200" />)}
                                  </div>
                                ) : (
                                  <StarDisplay count={p?.stars ?? 0} />
                                )}
                              </div>
                            </td>
                            <td className="px-md py-md text-center">
                              {!p || p.loading ? (
                                <span className="text-on-surface-variant/30 text-xs">—</span>
                              ) : p.error ? (
                                <span className="text-on-surface-variant/40 text-xs">—</span>
                              ) : (
                                <span className="text-xs font-semibold text-on-surface">{p.totalPracticeAttempts}</span>
                              )}
                            </td>
                            <td className="px-md py-md text-center">
                              {!p || p.loading ? (
                                <span className="text-on-surface-variant/30 text-xs">—</span>
                              ) : p.error ? (
                                <span className="text-on-surface-variant/40 text-xs">—</span>
                              ) : (
                                <span className={`text-xs font-bold ${p.bestPracticeScore >= 0.8 ? 'text-emerald-600'
                                  : p.bestPracticeScore >= 0.5 ? 'text-amber-600'
                                    : 'text-rose-500'
                                  }`}>
                                  {(p.bestPracticeScore * 100).toFixed(0)}%
                                </span>
                              )}
                            </td>
                            <td className="px-md py-md text-center">
                              {!p || p.loading ? (
                                <span className="text-on-surface-variant/30 text-xs">—</span>
                              ) : p.error ? (
                                <span className="text-on-surface-variant/40 text-xs">—</span>
                              ) : (
                                <span className="text-xs font-semibold text-on-surface">{p.totalQuizAttempts}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="px-lg py-md border-b border-outline-variant/10 flex items-center gap-sm">
                <MessageSquareText className="w-4 h-4 text-[#1D4532]" />
                <div><h3 className="text-sm font-bold text-[#1D4532]">Phản hồi theo lượt tập</h3><p className="text-xs text-on-surface-variant mt-0.5">Chọn đúng một lượt tập để xem và gửi nhận xét gắn với attemptId của lượt đó.</p></div>
              </div>
              {practiceAttemptsLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-on-surface-variant"><Loader2 className="w-5 h-5 animate-spin text-[#1D4532]" />Đang tải các lượt tập...</div>
              ) : practiceAttemptsError ? (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{practiceAttemptsError}</div>
              ) : practiceAttempts.length === 0 ? (
                <div className="p-10 text-center text-sm text-on-surface-variant">Học viên chưa có lượt tập nào trong các bài học được quản lý.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-outline-variant/10">
                  <div className="max-h-[440px] overflow-y-auto divide-y divide-outline-variant/10">
                    {[...practiceAttempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((attempt) => {
                      const rawScore = attempt.overall_score ?? (attempt as PracticeAttempt & { totalScore?: number; total_score?: number }).totalScore ?? (attempt as PracticeAttempt & { total_score?: number }).total_score;
                      const selected = selectedAttemptId === attempt.id;
                      return <button type="button" key={attempt.id} onClick={() => setSelectedAttemptId(attempt.id)} className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors ${selected ? 'bg-[#EDF7F2] border-l-4 border-l-[#1D4532]' : 'hover:bg-[#fbf9f4]'}`}>
                        <div className="min-w-0"><p className="text-xs font-bold text-[#1D4532]">{attempt.lessonName || 'Bài học'} · Lượt #{attempt.id}</p><p className="text-xs text-on-surface-variant mt-1 inline-flex items-center gap-1"><Clock3 className="w-3 h-3" />{attempt.createdAt ? new Date(attempt.createdAt).toLocaleString('vi-VN') : 'Chưa có thời gian'}</p></div>
                        <span className="shrink-0 rounded-full bg-[#f7f5ef] px-2.5 py-1 text-xs font-bold text-[#574500]">{typeof rawScore === 'number' ? `${Math.round(rawScore * (rawScore <= 1 ? 100 : 1))}%` : '—'}</span>
                      </button>;
                    })}
                  </div>
                  <div className="p-5 bg-[#fbf9f4]/50 min-h-[300px]">
                    {!selectedAttempt ? <div className="h-full flex items-center justify-center text-center text-sm text-on-surface-variant">Chọn một lượt tập ở bên trái để phản hồi.</div> : <>
                      <div className="flex justify-between gap-3 mb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#1D4532]">Lượt tập đang chọn</p><h4 className="font-bold mt-1">{selectedAttempt.lessonName || 'Bài học'} · #{selectedAttempt.id}</h4></div><span className="text-xs font-semibold text-[#1D4532] bg-[#EDF7F2] px-2 py-1 rounded">attemptId: {selectedAttempt.id}</span></div>
                      <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                        {feedbackLoading ? <div className="py-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline text-[#1D4532]" /></div> : attemptFeedbacks.length === 0 ? <p className="rounded-lg border border-dashed border-outline-variant/30 p-3 text-xs text-on-surface-variant">Chưa có phản hồi cho lượt tập này (attemptId: {selectedAttempt.id}).</p> : attemptFeedbacks.map((feedback) => <article key={feedback.id} className="rounded-lg bg-white border border-outline-variant/10 p-3"><p className="text-sm text-on-surface">{feedback.comment}</p><p className="text-[11px] text-on-surface-variant mt-1">{feedback.instructorName || feedback.instructor_name || 'Giảng viên'} · {(feedback.createdAt || feedback.created_at) ? new Date(feedback.createdAt || feedback.created_at!).toLocaleString('vi-VN') : ''}</p></article>)}
                      </div>
                      {feedbackError && <p className="mb-3 text-xs text-red-700">{feedbackError}</p>}
                      <label className="block text-xs font-semibold text-on-surface-variant mb-2">Nhận xét cho lượt tập này (gắn trực tiếp với attemptId: {selectedAttempt.id})</label>
                      <textarea value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} maxLength={2000} placeholder="Ví dụ: Cần giữ nhịp đều hơn ở ô nhịp thứ hai." className="w-full min-h-24 rounded-xl border border-outline-variant/25 bg-white p-3 text-sm outline-none focus:border-[#1D4532]" />
                      <button type="button" disabled={feedbackSaving || !feedbackComment.trim()} onClick={() => void submitFeedback()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1D4532] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send className="w-4 h-4" />{feedbackSaving ? 'Đang gửi...' : 'Gửi phản hồi'}</button>
                    </>}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="px-lg py-md border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-sm">
                  <BarChart3 className="w-4 h-4 text-[#1D4532]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1D4532]">Báo cáo tần suất luyện tập</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Tổng hợp toàn bộ lượt tập của học viên theo ngày trong khoảng đã chọn.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="inline-flex items-center gap-2 border rounded-lg px-2.5 py-2">
                    <CalendarDays className="w-3.5 h-3.5 text-[#1D4532]" />
                    <span>Từ</span><input type="date" value={practiceDateFrom} max={practiceDateTo} onChange={(event) => setPracticeDateFrom(event.target.value)} className="outline-none bg-transparent" />
                  </label>
                  <label className="inline-flex items-center gap-2 border rounded-lg px-2.5 py-2">
                    <span>Đến</span><input type="date" value={practiceDateTo} min={practiceDateFrom} max={toDateInputValue(new Date())} onChange={(event) => setPracticeDateTo(event.target.value)} className="outline-none bg-transparent" />
                  </label>
                </div>
              </div>

              {practiceAttemptsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-on-surface-variant"><Loader2 className="w-5 h-5 animate-spin text-[#1D4532]" />Đang tổng hợp lịch sử luyện tập...</div>
              ) : practiceAttemptsError ? (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{practiceAttemptsError}</div>
              ) : frequencyReport.invalidRange ? (
                <div className="p-10 text-center text-sm text-red-700">Khoảng ngày không hợp lệ. Ngày bắt đầu phải không sau ngày kết thúc.</div>
              ) : (
                <div className="p-lg">
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="rounded-xl bg-[#EDF7F2] p-3"><p className="text-[11px] uppercase tracking-wide text-[#1D4532]/70">Tổng lượt tập</p><p className="text-xl font-bold text-[#1D4532] mt-1">{frequencyReport.total}</p></div>
                    <div className="rounded-xl bg-[#f7f5ef] p-3"><p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Ngày có luyện tập</p><p className="text-xl font-bold text-on-surface mt-1">{frequencyReport.activeDays}</p></div>
                    <div className="rounded-xl bg-[#fff8df] p-3"><p className="text-[11px] uppercase tracking-wide text-[#7b6100]">TB mỗi ngày</p><p className="text-xl font-bold text-[#574500] mt-1">{frequencyReport.rows.length ? (frequencyReport.total / frequencyReport.rows.length).toFixed(1) : '0.0'}</p></div>
                  </div>
                  {frequencyReport.rows.length === 0 ? <p className="py-5 text-center text-sm text-on-surface-variant">Không có ngày nào trong khoảng đã chọn.</p> : (
                    <div className="overflow-x-auto pb-1">
                      <div className="min-w-max flex items-end gap-2 h-40 px-1">
                        {frequencyReport.rows.map((row) => {
                          const peak = Math.max(...frequencyReport.rows.map((item) => item.attempts), 1);
                          const height = row.attempts ? Math.max(12, (row.attempts / peak) * 112) : 3;
                          return <div key={row.date} className="w-9 flex flex-col items-center gap-1.5" title={`${row.date}: ${row.attempts} lượt tập`}><span className="text-[10px] font-bold text-[#1D4532]">{row.attempts || ''}</span><div className="w-5 h-28 flex items-end"><div className="w-full rounded-t-md bg-[#1D4532]" style={{ height }} /></div><span className="text-[9px] text-on-surface-variant whitespace-nowrap">{row.label}</span></div>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;
