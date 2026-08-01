import { useState, useEffect } from 'react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { instructorStudentsApi } from '../../api/services';
import type { AdminUser, PracticeAttempt } from '../../api/types';
import { Volume2, Send, Save, History } from 'lucide-react';

const InstructorStudents = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeAttemptIdx, setActiveAttemptIdx] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // 1. Fetch users
  const fetchUsers = () => instructorStudentsApi.listStudents();
  const { data: users } = useAxiosRequest<AdminUser[]>(fetchUsers, { auto: true });

    const students = (users || []).filter((u: any) => u.role === 'Người học' || u.role === 'LEARNER' || u.role === 'learner' || u.role === 'Learner');
  const student = students[selectedIdx] || null;

  // 2. Fetch attempts
  const fetchAttempts = () => {
    if (student) {
      return instructorStudentsApi.getAttempts(student.id);
    }
    return Promise.resolve({ content: [] } as any);
  };
  const { data: attemptsData, execute: doFetchAttempts } = useAxiosRequest<any>(fetchAttempts, { auto: false });

  const attempts: PracticeAttempt[] = (attemptsData as any)?.content || [];
  const attempt = attempts[activeAttemptIdx] || null;

  useEffect(() => {
    if (student) {
      doFetchAttempts();
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

  const handleStudentChange = (idx: number) => {
    setSelectedIdx(idx);
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
        <h2 className="text-headline-lg font-bold text-primary">
          Phân tích Tiến trình Học tập
        </h2>
        <p className="text-on-surface-variant font-body-md mt-base">
          Theo dõi và đánh giá chi tiết kỹ năng biểu diễn của từng học viên.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-md">
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant/70 px-base text-xs font-semibold">
            Danh sách Học viên
          </h3>
          <div className="flex flex-col gap-sm overflow-y-auto max-h-[calc(100vh-320px)] pr-2">
            {students.map((st, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <div
                  key={st.id}
                  onClick={() => handleStudentChange(idx)}
                  className={`p-md rounded-xl border transition-all flex items-center gap-md cursor-pointer ${
                    isSelected
                      ? 'bg-white border-secondary/20 shadow-sm border-l-4 border-l-secondary'
                      : 'bg-white/50 hover:bg-white border-outline-variant/10'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {st.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4
                      className={`font-label-md text-label-md font-bold ${
                        isSelected ? 'text-secondary' : 'text-on-surface'
                      }`}
                    >
                      {st.name}
                    </h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant text-[12px]">
                      {(st as any).userCode || 'Chưa phân lớp'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 bg-white rounded-xl p-xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="text-headline-md font-bold text-on-surface">
              Biểu đồ Năng lực
            </h3>
            <span className="px-3 py-1 rounded-full bg-[#f0eee9] text-[#745c00] font-label-sm text-label-sm font-semibold">
              Điểm số: {attempt ? (attempt.overall_score || 0) : 0}/10
            </span>
          </div>

          {attempt ? (
            <div className="flex flex-col items-center">
              <div className="relative w-[300px] h-[300px] bg-[#fbf9f4] rounded-full border border-outline-variant/10 shadow-inner flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full">
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#eae8e3" strokeDasharray="3" />
                  <circle cx="150" cy="150" r="80" fill="none" stroke="#eae8e3" strokeDasharray="3" />
                  <circle cx="150" cy="150" r="40" fill="none" stroke="#eae8e3" strokeDasharray="3" />

                  <line x1="150" y1="150" x2="150" y2="30" stroke="#eae8e3" />
                  <line x1="150" y1="150" x2={150 + 120 * Math.cos(Math.PI / 6)} y2={150 + 120 * Math.sin(Math.PI / 6)} stroke="#eae8e3" />
                  <line x1="150" y1="150" x2={150 + 120 * Math.cos((5 * Math.PI) / 6)} y2={150 + 120 * Math.sin((5 * Math.PI) / 6)} stroke="#eae8e3" />

                  <polygon points={points} fill="rgba(115, 92, 0, 0.25)" stroke="#735c00" strokeWidth="2.5" />

                  <circle cx="150" cy={150 - 12 * (attempt.pitch_score || 0)} r="5" fill="#735c00" stroke="white" strokeWidth="1.5" />
                  <circle cx={150 + 12 * (attempt.rhythm_score || 0) * Math.cos(Math.PI / 6)} cy={150 + 12 * (attempt.rhythm_score || 0) * Math.sin(Math.PI / 6)} r="5" fill="#735c00" stroke="white" strokeWidth="1.5" />
                  <circle cx={150 + 12 * (attempt.technique_score || 0) * Math.cos((5 * Math.PI) / 6)} cy={150 + 12 * (attempt.technique_score || 0) * Math.sin((5 * Math.PI) / 6)} r="5" fill="#735c00" stroke="white" strokeWidth="1.5" />
                </svg>

                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Cao độ</span>
                  <span className="text-body-sm font-bold text-primary">{(attempt.pitch_score || 0)}/10</span>
                </div>
                <div className="absolute bottom-6 right-2 flex flex-col items-end">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Nhịp điệu</span>
                  <span className="text-body-sm font-bold text-primary">{(attempt.rhythm_score || 0)}/10</span>
                </div>
                <div className="absolute bottom-6 left-2 flex flex-col items-start">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Kỹ thuật</span>
                  <span className="text-body-sm font-bold text-primary">{(attempt.technique_score || 0)}/10</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-sm w-full mt-xl">
                {[
                  { label: 'Pitch Precision', val: (attempt.pitch_score || 0) * 10, suffix: '%' },
                  { label: 'Rhythm Sync', val: (attempt.rhythm_score || 0) * 10, suffix: '%' },
                  { label: 'Technique Score', val: (attempt.technique_score || 0) * 10, suffix: '%' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#fbf9f4] p-md rounded-lg border border-outline-variant/10 text-center">
                    <span className="text-[11px] text-on-surface-variant block font-medium uppercase tracking-wider leading-none mb-1">
                      {stat.label}
                    </span>
                    <span className="text-body-md font-bold text-primary">
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
        </section>

        <section className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/5 flex-grow">
            <div className="flex items-center gap-xs mb-lg">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-headline-md font-bold text-on-surface">
                Lịch sử thực hành
              </h3>
            </div>

            <div className="space-y-sm max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {attempts.map((att, aIdx) => {
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
                        ? 'bg-primary/5 border-primary/20 shadow-xs'
                        : 'bg-[#fbf9f4] border-outline-variant/5 hover:bg-[#f5f3ee]'
                    }`}
                  >
                    <div>
                      <h4 className="font-label-md text-label-md font-bold text-primary">
                        {att.lessonName || 'Bài thực hành'}
                      </h4>
                      <p className="text-[12px] text-on-surface-variant mt-xs">
                        {att.createdAt ? new Date(att.createdAt).toLocaleDateString('vi-VN') : ''} • {att.duration || '0:00'}
                      </p>
                    </div>
                    <span
                      className={`text-body-md font-bold ${
                        (att.overall_score || 0) >= 8.0 ? 'text-[#735c00]' : 'text-on-surface'
                      }`}
                    >
                      {att.overall_score || 0}/10
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {attempt && (
            <div className="bg-white rounded-xl p-lg shadow-sm border border-[#ffe088]/20 flex flex-col gap-md">
              <h4 className="font-label-md text-primary font-bold">
                Bản ghi âm &amp; Phê duyệt phản hồi
              </h4>

              <div className="bg-[#fbf9f4] p-md rounded-xl border border-outline-variant/10 flex items-center gap-md">
                <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform hover:opacity-95 shrink-0">
                  <Volume2 className="w-5 h-5 text-white fill-white ml-[1px]" />
                </button>
                <div className="flex-grow">
                  <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-medium">
                    <span>Lượt ghi âm #{attempt.id}</span>
                    <span>0:00 / {attempt.duration || '0:00'}</span>
                  </div>
                  <div className="h-1 w-full bg-[#eae8e3] rounded-full overflow-hidden mt-sm">
                    <div className="bg-[#735c00] h-full" style={{ width: '35%' }} />
                  </div>
                </div>
              </div>

              <div className="space-y-sm">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-[#fbf9f4] border border-[#ffe088]/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-0 h-20 outline-none transition-all resize-none placeholder:text-on-surface-variant/40"
                  placeholder="Nhập nhận xét..."
                />
                <div className="flex gap-sm">
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 bg-[#fbf9f4] border border-outline text-on-surface-variant py-md rounded-lg font-label-md hover:bg-[#f5f3ee] transition-all flex items-center justify-center gap-xs"
                  >
                    <Save className="w-4 h-4" />
                    Lưu nháp
                  </button>
                  <button
                    onClick={handleSendFeedback}
                    className="flex-1 bg-primary text-on-primary py-md rounded-lg font-label-md hover:bg-primary/95 transition-all flex items-center justify-center gap-xs shadow-md"
                  >
                    <Send className="w-4 h-4 text-white" />
                    Gửi phản hồi
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InstructorStudents;
