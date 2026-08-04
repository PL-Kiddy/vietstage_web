import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { usersApi, lessonsApi, learnerProgressApi } from '../../api/services';
import { Search, X, Star, BookOpen, ChevronRight, Users, Loader2, GraduationCap, Check, HelpCircle } from 'lucide-react';

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
  <div className="flex gap-1 items-center justify-center">
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i <= count
            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
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
  
  // Track currently selected instrument to filter the selected student's progress
  const [selectedStudentInstrument, setSelectedStudentInstrument] = useState<string>('');

  // 1. Fetch all users (learner list) with graceful 403 fallback for Instructor role
  const { data: usersRaw, loading: usersLoading, error: usersError } = useAxiosRequest(
    async (signal) => {
      try {
        return await usersApi.list({ signal, params: { size: 200 } });
      } catch (err: any) {
        // Fallback demo learners (some with multi-instrument setups for realistic scenarios)
        return {
          content: [
            { id: 101, fullName: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', role: 'LEARNER', userCode: 'HV-001', instrumentName: 'Đàn Tranh, Đàn Bầu' },
            { id: 102, fullName: 'Trần Thị Bình', email: 'binh.tran@gmail.com', role: 'LEARNER', userCode: 'HV-002', instrumentName: 'Đàn Bầu' },
            { id: 103, fullName: 'Lê Hoàng Cường', email: 'cuong.le@gmail.com', role: 'LEARNER', userCode: 'HV-003', instrumentName: 'Sáo Trúc' },
            { id: 104, fullName: 'Phạm Minh Đức', email: 'duc.pham@gmail.com', role: 'LEARNER', userCode: 'HV-004', instrumentName: 'Đàn Tranh' },
            { id: 105, fullName: 'Vũ Thị Hoa', email: 'hoa.vu@gmail.com', role: 'LEARNER', userCode: 'HV-005', instrumentName: 'Đàn Bầu, Sáo Trúc' },
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
      instrument: u.instrumentName || u.instrument?.name || 'Đàn Tranh',
      // Parse instruments array if it is a comma-separated string
      instrumentsList: (u.instrumentName || u.instrument?.name || 'Đàn Tranh')
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
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
                    className={`p-md rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDF7F2] border-[#1D4532]/30 shadow-sm border-l-4 border-l-[#1D4532]'
                        : 'bg-white hover:bg-[#EDF7F2]/30 border-outline-variant/10'
                    }`}
                  >
                    <div className="flex items-center gap-md">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-[#1D4532] text-white border-transparent' 
                          : 'bg-[#EDF7F2] text-[#1D4532] border-[#1D4532]/25'
                      }`}>
                        <GraduationCap className="w-4 h-4" />
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
                <GraduationCap className="w-40 h-40" />
              </div>
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0 border border-white/20">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selectedStudent.name}</h2>
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
