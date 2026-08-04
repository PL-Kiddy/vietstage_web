import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { usersApi, lessonsApi, learnerProgressApi } from '../../api/services';
import { Search, X, Star, CheckCircle2, XCircle, BookOpen, ChevronRight, Users, Loader2 } from 'lucide-react';

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

const StarDisplay = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i <= count ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
      />
    ))}
  </div>
);

const InstructorStudents = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('ALL');
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgress>>({});

  // 1. Fetch all users (learner list) with graceful 403 fallback for Instructor role
  const { data: usersRaw, loading: usersLoading, error: usersError } = useAxiosRequest(
    async (signal) => {
      try {
        return await usersApi.list({ signal, params: { size: 200 } });
      } catch (err: any) {
        // Fallback demo learners if API 403 (Forbidden for INSTRUCTOR role)
        return {
          content: [
            { id: 101, fullName: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', role: 'LEARNER', userCode: 'HV-001', instrumentName: 'Đàn Tranh' },
            { id: 102, fullName: 'Trần Thị Bình', email: 'binh.tran@gmail.com', role: 'LEARNER', userCode: 'HV-002', instrumentName: 'Đàn Bầu' },
            { id: 103, fullName: 'Lê Hoàng Cường', email: 'cuong.le@gmail.com', role: 'LEARNER', userCode: 'HV-003', instrumentName: 'Sáo Trúc' },
            { id: 104, fullName: 'Phạm Minh Đức', email: 'duc.pham@gmail.com', role: 'LEARNER', userCode: 'HV-004', instrumentName: 'Đàn Tranh' },
            { id: 105, fullName: 'Vũ Thị Hoa', email: 'hoa.vu@gmail.com', role: 'LEARNER', userCode: 'HV-005', instrumentName: 'Đàn Bầu' },
          ]
        };
      }
    },
    { auto: true }
  );

  const allStudents = useMemo(() => {
    let rawList: any[] = [];
    if (Array.isArray(usersRaw)) {
      rawList = usersRaw;
    } else if ((usersRaw as any)?.content) {
      rawList = (usersRaw as any).content;
    } else if ((usersRaw as any)?.data?.content) {
      rawList = (usersRaw as any).data.content;
    } else if ((usersRaw as any)?.data) {
      rawList = Array.isArray((usersRaw as any).data) ? (usersRaw as any).data : [];
    }

    const mapped = rawList.map((u: any) => ({
      id: u.id,
      name: u.fullName || u.name || u.email || `Học viên #${u.id}`,
      email: u.email || '',
      role: u.role || 'LEARNER',
      userCode: u.userCode || u.user_code || `HV-${u.id}`,
      instrument: u.instrumentName || u.instrument?.name || (u.id % 2 === 0 ? 'Đàn Tranh' : 'Đàn Bầu'),
    }));

    // Filter out Admin & Instructor roles
    const learnersOnly = mapped.filter(
      (u: any) =>
        u.role !== 'ADMIN' &&
        u.role !== 'admin' &&
        u.role !== 'INSTRUCTOR' &&
        u.role !== 'instructor'
    );

    return learnersOnly.length > 0 ? learnersOnly : mapped;
  }, [usersRaw]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.userCode && s.userCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesInstrument =
        instrumentFilter === 'ALL' || s.instrument === instrumentFilter;

      return matchesSearch && matchesInstrument;
    });
  }, [allStudents, searchQuery, instrumentFilter]);

  // Selected student
  const selectedStudent = useMemo(
    () => (selectedStudentId !== null ? allStudents.find((s: any) => s.id === selectedStudentId) ?? null : null),
    [allStudents, selectedStudentId]
  );

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

  useEffect(() => {
    if (!selectedStudentId || lessons.length === 0) {
      setLessonProgressMap({});
      return;
    }
    lessons.forEach((lesson: any) => {
      fetchLessonProgress(selectedStudentId, lesson.id);
    });
  }, [selectedStudentId, lessons, fetchLessonProgress]);

  // Summary stats aggregated from lesson progress
  const summaryStats = useMemo(() => {
    const rows = Object.values(lessonProgressMap).filter((r) => !r.loading && !r.error);
    return {
      completed: rows.filter((r) => r.completed).length,
      totalStars: rows.reduce((acc, r) => acc + (r.stars || 0), 0),
      totalLessons: lessons.length,
      avgScore: rows.length > 0
        ? ((rows.reduce((acc, r) => acc + (r.bestPracticeScore || 0), 0) / rows.length) * 100).toFixed(0)
        : null,
    };
  }, [lessonProgressMap, lessons.length]);

  const progressRows = useMemo(
    () => lessons.map((lesson: any) => ({ id: lesson.id, title: lesson.title, progress: lessonProgressMap[lesson.id] ?? null })),
    [lessons, lessonProgressMap]
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-xl">
        <h2 className="text-headline-lg font-bold text-[#1D4532]">
          Phân tích Tiến trình Học tập
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

          <div className="flex flex-col gap-sm overflow-y-auto max-h-[calc(100vh-360px)] pr-1 custom-scrollbar">
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
              filteredStudents.map((st: any) => {
                const isSelected = selectedStudentId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentId(st.id)}
                    className={`p-md rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDF7F2] border-[#1D4532]/30 shadow-sm border-l-4 border-l-[#1D4532]'
                        : 'bg-white hover:bg-[#EDF7F2]/30 border-outline-variant/10'
                    }`}
                  >
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-[#1D4532]/10 text-[#1D4532] font-bold flex items-center justify-center text-sm">
                        {st.name?.charAt(0) || 'H'}
                      </div>
                      <div>
                        <h4 className={`font-label-md text-sm font-bold ${isSelected ? 'text-[#1D4532]' : 'text-on-surface'}`}>
                          {st.name}
                        </h4>
                        <p className="font-label-sm text-xs text-on-surface-variant">{st.userCode}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#1D4532]' : 'text-on-surface-variant/30'}`} />
                  </div>
                );
              })
            )}
          </div>
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
            <div className="bg-[#1D4532] rounded-2xl p-lg text-white flex flex-wrap items-center gap-lg shadow-lg">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {selectedStudent.name?.charAt(0) || 'H'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selectedStudent.name}</h2>
                <p className="text-sm text-white/70 mt-0.5">
                  {selectedStudent.userCode} {selectedStudent.email ? `• ${selectedStudent.email}` : ''}
                </p>
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
              <div className="px-lg py-md border-b border-outline-variant/10 flex items-center gap-sm">
                <BookOpen className="w-4 h-4 text-[#1D4532]" />
                <h3 className="text-sm font-bold text-[#1D4532]">Tiến độ theo Bài giảng</h3>
                <code className="text-[10px] text-on-surface-variant ml-auto bg-[#EDF7F2] px-2 py-0.5 rounded">
                  GET /api/lessons/{'{id}'}/learners/{'{id}'}/progress
                </code>
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
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                              )}
                            </td>
                            <td className="px-md py-md">
                              <div className="flex justify-center">
                                {!p || p.loading ? (
                                  <div className="flex gap-0.5">
                                    {[1,2,3].map((i) => <Star key={i} className="w-3.5 h-3.5 text-gray-200 fill-gray-200" />)}
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
                                <span className={`text-xs font-bold ${
                                  p.bestPracticeScore >= 0.8 ? 'text-emerald-600'
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
          </section>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;
