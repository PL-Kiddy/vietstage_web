import { useState, useEffect, useMemo } from 'react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { instructorStudentsApi, learnerProgressApi } from '../../api/services';
import type { AdminUser, PracticeAttempt } from '../../api/types';
import { Volume2, Send, Save, History, Search, X, Award, CheckCircle2, Flame } from 'lucide-react';

const InstructorStudents = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [activeAttemptIdx, setActiveAttemptIdx] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('ALL');

  // 1. Fetch users
  const fetchUsers = () => instructorStudentsApi.listStudents();
  const { data: users } = useAxiosRequest<AdminUser[]>(fetchUsers, { auto: true });

  const allStudents = useMemo(() => {
    let rawList: any[] = [];
    if (Array.isArray(users)) {
      rawList = users;
    } else if ((users as any)?.content) {
      rawList = (users as any).content;
    } else if ((users as any)?.data?.content) {
      rawList = (users as any).data.content;
    } else if ((users as any)?.data) {
      rawList = Array.isArray((users as any).data) ? (users as any).data : [];
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
  }, [users]);

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

  // Selected student (defaults to null if not explicitly clicked to support Empty Selection state)
  const student = useMemo(() => {
    if (selectedStudentId !== null) {
      return allStudents.find((s: any) => s.id === selectedStudentId) || null;
    }
    return null;
  }, [allStudents, selectedStudentId]);

  // 2. Fetch student attempts & progress summary (specifically passing learnerId)
  const fetchAttempts = () => {
    if (student) {
      return instructorStudentsApi.getAttempts(student.id);
    }
    return Promise.resolve({ content: [] } as any);
  };
  const { data: attemptsData, execute: doFetchAttempts } = useAxiosRequest<any>(fetchAttempts, { auto: false });

  // 3. Fetch progress summary per selected learnerId (passing student.id explicitly)
  const fetchProgressSummary = () => {
    if (student) {
      return learnerProgressApi.getLearnerProgressSummary(student.id);
    }
    return Promise.resolve({
      total_stars: 0,
      completed_lessons: 0,
      current_streak: 0,
      longest_streak: 0,
      total_points: 0,
      adaptive_difficulty: 1,
    });
  };
  const { data: progressSummary, execute: doFetchSummary } = useAxiosRequest<any>(fetchProgressSummary, { auto: false });

  const attempts: PracticeAttempt[] = (attemptsData as any)?.content || [];
  const attempt = attempts[activeAttemptIdx] || null;

  useEffect(() => {
    if (student) {
      doFetchAttempts();
      doFetchSummary();
      setActiveAttemptIdx(0);
      setFeedbackText('');
    }
  }, [student?.id]);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Vui lòng nhập nội dung nhận xét trước khi gửi.');
      return;
    }
    if (!attempt) return;
    try {
      await instructorStudentsApi.sendFeedback(attempt.id, feedbackText.trim(), 'INSTRUCTOR');
      alert(`Đã gửi nhận xét cho học viên ${student?.name}!`);
    } catch (e: any) {
      alert(e.message || 'Lỗi gửi nhận xét');
    }
  };

  const handleSaveDraft = () => {
    alert(`Đã lưu nháp nhận xét lượt thực hành của ${student?.name || ''}`);
  };

  const handleStudentSelect = (id: number) => {
    setSelectedStudentId(id);
    setActiveAttemptIdx(0);
    setFeedbackText('');
  };

  // Safe coordinates helper for radar chart polygon
  const getRadarPoint = (val: number, angle: number, scale = 120) => {
    const scoreVal = val / 10;
    const x = 150 + scale * scoreVal * Math.cos(angle);
    const y = 150 + scale * scoreVal * Math.sin(angle);
    return `${x},${y}`;
  };

  const points = attempt
    ? [
        getRadarPoint((attempt?.pitch_score || 0), -Math.PI / 2),
        getRadarPoint((attempt?.rhythm_score || 0), Math.PI / 6),
        getRadarPoint((attempt?.technique_score || 0), (5 * Math.PI) / 6),
      ].join(' ')
    : '';

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
            {filteredStudents.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic px-base py-md text-center">
                Không tìm thấy học viên phù hợp.
              </p>
            ) : (
              filteredStudents.map((st: any) => {
                const isSelected = student?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => handleStudentSelect(st.id)}
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
                        <h4
                          className={`font-label-md text-sm font-bold ${
                            isSelected ? 'text-[#1D4532]' : 'text-on-surface'
                          }`}
                        >
                          {st.name}
                        </h4>
                        <p className="font-label-sm text-xs text-on-surface-variant">
                          {st.userCode}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1D4532]/10 text-[#1D4532]">
                      {st.instrument}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Details Container (Empty Selection State or Selected Student Details) */}
        {!student ? (
          <section className="col-span-12 lg:col-span-9 bg-white rounded-2xl p-12 shadow-sm border border-outline-variant/10 flex flex-col items-center justify-center text-center min-h-[420px]">
            <div className="w-20 h-20 rounded-full bg-[#EDF7F2] flex items-center justify-center text-[#1D4532] mb-4 shadow-inner">
              <Search className="w-10 h-10 opacity-70" />
            </div>
            <h3 className="text-xl font-bold text-[#1D4532] mb-2">
              Vui lòng chọn học viên từ danh sách
            </h3>
            <p className="text-sm text-[#5e5e5b] max-w-md">
              Chọn một học viên ở cột bên trái để xem báo cáo tiến trình học tập, biểu đồ năng lực biểu diễn và duyệt các bài thực hành ghi âm.
            </p>
          </section>
        ) : (
          <>
            <section className="col-span-12 lg:col-span-5 bg-white rounded-xl p-xl shadow-sm border border-outline-variant/5">
              <div className="flex justify-between items-center mb-xl">
                <h3 className="text-headline-md font-bold text-[#1D4532]">
                  Biểu đồ Năng lực
                </h3>
                <span className="px-3 py-1 rounded-full bg-[#EDF7F2] text-[#1D4532] font-label-sm text-label-sm font-semibold">
                  Điểm số: {attempt ? (attempt.overall_score || 0) : 0}/10
                </span>
              </div>

          {attempt ? (
            <div className="flex flex-col items-center">
              <div className="relative w-[300px] h-[300px] bg-[#EDF7F2]/20 rounded-full border border-outline-variant/10 shadow-inner flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full">
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#eae8e3" strokeDasharray="3" />
                  <circle cx="150" cy="150" r="80" fill="none" stroke="#eae8e3" strokeDasharray="3" />
                  <circle cx="150" cy="150" r="40" fill="none" stroke="#eae8e3" strokeDasharray="3" />

                  <line x1="150" y1="150" x2="150" y2="30" stroke="#eae8e3" />
                  <line x1="150" y1="150" x2={150 + 120 * Math.cos(Math.PI / 6)} y2={150 + 120 * Math.sin(Math.PI / 6)} stroke="#eae8e3" />
                  <line x1="150" y1="150" x2={150 + 120 * Math.cos((5 * Math.PI) / 6)} y2={150 + 120 * Math.sin((5 * Math.PI) / 6)} stroke="#eae8e3" />

                  <polygon points={points} fill="rgba(29, 69, 50, 0.25)" stroke="#1D4532" strokeWidth="2.5" />

                  <circle cx="150" cy={150 - 12 * (attempt.pitch_score || 0)} r="5" fill="#1D4532" stroke="white" strokeWidth="1.5" />
                  <circle cx={150 + 12 * (attempt.rhythm_score || 0) * Math.cos(Math.PI / 6)} cy={150 + 12 * (attempt.rhythm_score || 0) * Math.sin(Math.PI / 6)} r="5" fill="#1D4532" stroke="white" strokeWidth="1.5" />
                  <circle cx={150 + 12 * (attempt.technique_score || 0) * Math.cos((5 * Math.PI) / 6)} cy={150 + 12 * (attempt.technique_score || 0) * Math.sin((5 * Math.PI) / 6)} r="5" fill="#1D4532" stroke="white" strokeWidth="1.5" />
                </svg>

                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Cao độ</span>
                  <span className="text-body-sm font-bold text-[#1D4532]">{(attempt.pitch_score || 0)}/10</span>
                </div>
                <div className="absolute bottom-6 right-2 flex flex-col items-end">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Nhịp điệu</span>
                  <span className="text-body-sm font-bold text-[#1D4532]">{(attempt.rhythm_score || 0)}/10</span>
                </div>
                <div className="absolute bottom-6 left-2 flex flex-col items-start">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Kỹ thuật</span>
                  <span className="text-body-sm font-bold text-[#1D4532]">{(attempt.technique_score || 0)}/10</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-sm w-full mt-xl">
                {[
                  { label: 'Pitch Precision', val: (attempt.pitch_score || 0) * 10, suffix: '%' },
                  { label: 'Rhythm Sync', val: (attempt.rhythm_score || 0) * 10, suffix: '%' },
                  { label: 'Technique Score', val: (attempt.technique_score || 0) * 10, suffix: '%' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#EDF7F2]/40 p-md rounded-lg border border-[#1D4532]/10 text-center">
                    <span className="text-[11px] text-on-surface-variant block font-medium uppercase tracking-wider leading-none mb-1">
                      {stat.label}
                    </span>
                    <span className="text-body-md font-bold text-[#1D4532]">
                      {stat.val.toFixed(0)}{stat.suffix}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-on-surface-variant py-xxl italic">
              Không có lượt thực hành nào của học viên này.
            </p>
          )}

          {/* Student Overall Progress Summary API metrics */}
          <div className="mt-xl pt-lg border-t border-outline-variant/10">
            <h4 className="font-label-md text-xs font-semibold uppercase tracking-wider text-[#1D4532] mb-md">
              Tổng quan tiến độ tích lũy học viên
            </h4>
            <div className="grid grid-cols-3 gap-sm">
              <div className="bg-[#EDF7F2]/30 p-md rounded-xl border border-[#1D4532]/10 flex flex-col items-center text-center">
                <Award className="w-5 h-5 text-[#1D4532] mb-1" />
                <span className="text-[11px] text-on-surface-variant font-medium">Tổng sao</span>
                <span className="text-body-md font-bold text-[#1D4532] mt-0.5">
                  {progressSummary?.total_stars ?? 0} ⭐
                </span>
              </div>
              <div className="bg-[#EDF7F2]/30 p-md rounded-xl border border-[#1D4532]/10 flex flex-col items-center text-center">
                <CheckCircle2 className="w-5 h-5 text-[#1D4532] mb-1" />
                <span className="text-[11px] text-on-surface-variant font-medium">Bài hoàn thành</span>
                <span className="text-body-md font-bold text-[#1D4532] mt-0.5">
                  {progressSummary?.completed_lessons ?? 0} bài
                </span>
              </div>
              <div className="bg-[#EDF7F2]/30 p-md rounded-xl border border-[#1D4532]/10 flex flex-col items-center text-center">
                <Flame className="w-5 h-5 text-[#1D4532] mb-1" />
                <span className="text-[11px] text-on-surface-variant font-medium">Chuỗi học tập</span>
                <span className="text-body-md font-bold text-[#1D4532] mt-0.5">
                  {progressSummary?.current_streak ?? 0} ngày
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/5 flex-grow">
            <div className="flex items-center gap-xs mb-lg">
              <History className="w-5 h-5 text-[#1D4532]" />
              <h3 className="text-headline-md font-bold text-[#1D4532]">
                Lịch sử thực hành
              </h3>
            </div>

            <div className="space-y-sm max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {attempts.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-lg text-center">
                  Học viên chưa thực hiện lượt thực hành nào.
                </p>
              ) : (
                attempts.map((att, aIdx) => {
                  const isActive = aIdx === activeAttemptIdx;
                  return (
                    <div
                      key={att.id}
                      onClick={() => {
                        setActiveAttemptIdx(aIdx);
                        setFeedbackText(att.feedback_data || '');
                      }}
                      className={`p-md rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                        isActive
                          ? 'bg-[#EDF7F2] border-[#1D4532]/30 shadow-xs'
                          : 'bg-white hover:bg-[#EDF7F2]/30 border-outline-variant/5'
                      }`}
                    >
                      <div>
                        <h4 className="font-label-md text-label-md font-bold text-[#1D4532]">
                          {att.lessonName || 'Bài thực hành'}
                        </h4>
                        <p className="text-[12px] text-on-surface-variant mt-xs">
                          {att.createdAt ? new Date(att.createdAt).toLocaleDateString('vi-VN') : ''} • {att.duration || '0:00'}
                        </p>
                      </div>
                      <span
                        className={`text-body-md font-bold ${
                          (att.overall_score || 0) >= 8.0 ? 'text-[#1D4532]' : 'text-on-surface'
                        }`}
                      >
                        {att.overall_score || 0}/10
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {attempt && (
            <div className="bg-white rounded-xl p-lg shadow-sm border border-[#1D4532]/20 flex flex-col gap-md">
              <h4 className="font-label-md text-[#1D4532] font-bold">
                Bản ghi âm &amp; Phê duyệt phản hồi
              </h4>

              <div className="bg-[#EDF7F2]/30 p-md rounded-xl border border-[#1D4532]/10 flex items-center gap-md">
                <button className="w-10 h-10 rounded-full bg-[#1D4532] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform hover:opacity-95 shrink-0">
                  <Volume2 className="w-5 h-5 text-white fill-white ml-[1px]" />
                </button>
                <div className="flex-grow">
                  <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-medium">
                    <span>Lượt ghi âm #{attempt.id}</span>
                    <span>0:00 / {attempt.duration || '0:00'}</span>
                  </div>
                  <div className="h-1 w-full bg-[#eae8e3] rounded-full overflow-hidden mt-sm">
                    <div className="bg-[#1D4532] h-full" style={{ width: '35%' }} />
                  </div>
                </div>
              </div>

              <div className="space-y-sm">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-white border border-[#1D4532]/20 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] h-20 outline-none transition-all resize-none placeholder:text-on-surface-variant/40"
                  placeholder="Nhập nhận xét..."
                />
                <div className="flex gap-sm">
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 bg-white border border-outline text-on-surface-variant py-md rounded-lg font-label-md hover:bg-[#EDF7F2] transition-all flex items-center justify-center gap-xs"
                  >
                    <Save className="w-4 h-4" />
                    Lưu nháp
                  </button>
                  <button
                    onClick={handleSendFeedback}
                    className="flex-1 bg-[#1D4532] text-white py-md rounded-lg font-label-md hover:bg-[#1D4532]/95 transition-all flex items-center justify-center gap-xs shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    Gửi nhận xét
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        </>
      )}
      </div>
    </div>
  );
};

export default InstructorStudents;
