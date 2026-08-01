import { useState } from 'react';
import { Volume2, Send, Save, History } from 'lucide-react';

interface Attempt {
  id: string;
  lessonName: string;
  score: number;
  date: string;
  duration: string;
  pitch: number;
  rhythm: number;
  technique: number;
  audioTimestamp: string;
  feedbackText?: string;
}

interface Student {
  id: string;
  name: string;
  class: string;
  avatar: string;
  progress: number;
  feedbackPlaceholder: string;
  attempts: Attempt[];
}

const mockStudents: Student[] = [
  {
    id: 'S-2401',
    name: 'Lê Hải Nam',
    class: 'Lớp Đàn Bầu K24',
    avatar: 'LH',
    progress: 75,
    feedbackPlaceholder: 'Học viên Nam cần chú ý hơn về cách nhấn ngón ở đoạn cao trào...',
    attempts: [
      {
        id: 'AT-101',
        lessonName: 'Tiểu phẩm: "Lưu Thủy"',
        score: 8.2,
        date: '15/10/2024',
        duration: '2:15',
        pitch: 8.5,
        rhythm: 9.2,
        technique: 7.0,
        audioTimestamp: '0:42',
      },
      {
        id: 'AT-102',
        lessonName: 'Chạy ngón âm giai Cung oán',
        score: 7.1,
        date: '12/10/2024',
        duration: '1:45',
        pitch: 7.0,
        rhythm: 7.8,
        technique: 6.5,
        audioTimestamp: '1:10',
      },
    ],
  },
  {
    id: 'S-2304',
    name: 'Nguyễn Thu Thủy',
    class: 'Lớp Đàn Tranh K23',
    avatar: 'NT',
    progress: 88,
    feedbackPlaceholder: 'Khả năng vuốt dây của Thủy rất tốt, cần phối hợp đều tay trái...',
    attempts: [
      {
        id: 'AT-201',
        lessonName: 'Bài thực hành: "Trống Cơm"',
        score: 8.8,
        date: '18/10/2024',
        duration: '1:50',
        pitch: 9.0,
        rhythm: 8.5,
        technique: 8.8,
        audioTimestamp: '1:10',
      },
      {
        id: 'AT-202',
        lessonName: 'Kỹ thuật nhấn ngón rung tranh',
        score: 7.9,
        date: '14/10/2024',
        duration: '2:05',
        pitch: 8.2,
        rhythm: 7.5,
        technique: 8.0,
        audioTimestamp: '0:55',
      },
    ],
  },
  {
    id: 'S-2509',
    name: 'Phạm Duy Hoàng',
    class: 'Lớp Ca Trù K25',
    avatar: 'PH',
    progress: 45,
    feedbackPlaceholder: 'Chú ý giữ chắc nhịp phách gỗ, không bị đẩy nhanh ở giữa câu ca...',
    attempts: [
      {
        id: 'AT-301',
        lessonName: 'Bài tập: "Gõ Phách"',
        score: 7.1,
        date: '19/10/2024',
        duration: '3:05',
        pitch: 7.2,
        rhythm: 7.5,
        technique: 6.8,
        audioTimestamp: '2:01',
      },
    ],
  },
  {
    id: 'S-2412',
    name: 'Trần Lan Anh',
    class: 'Lớp Cải Lương K24',
    avatar: 'LA',
    progress: 60,
    feedbackPlaceholder: 'Lan Anh có hơi thở khỏe, cần trau chuốt các từ ngân luyến cuối chữ...',
    attempts: [
      {
        id: 'AT-401',
        lessonName: 'Vọng Cổ: "Lá Trầu Xanh"',
        score: 8.1,
        date: '21/10/2024',
        duration: '4:20',
        pitch: 8.8,
        rhythm: 8.0,
        technique: 7.5,
        audioTimestamp: '3:15',
      },
    ],
  },
];

const InstructorStudents = () => {
  // Load/Save from localStorage
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('vietstage_instructor_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing instructor students:', e);
      }
    }
    return mockStudents;
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeAttemptIdx, setActiveAttemptIdx] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const student = students[selectedIdx] || students[0];
  const attempt = student.attempts[activeAttemptIdx] || student.attempts[0];

  const saveStudents = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem('vietstage_instructor_students', JSON.stringify(updatedStudents));
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      alert('Vui lòng nhập nội dung nhận xét trước khi gửi.');
      return;
    }
    const updated = students.map((st, sIdx) => {
      if (sIdx === selectedIdx) {
        const updatedAttempts = st.attempts.map((att, aIdx) => {
          if (aIdx === activeAttemptIdx) {
            return { ...att, feedbackText: feedbackText.trim() };
          }
          return att;
        });
        return { ...st, attempts: updatedAttempts };
      }
      return st;
    });
    saveStudents(updated);
    alert(`Đã gửi nhận xét cho học viên ${student.name} ở bài tập "${attempt.lessonName}"!`);
  };

  const handleSaveDraft = () => {
    const updated = students.map((st, sIdx) => {
      if (sIdx === selectedIdx) {
        const updatedAttempts = st.attempts.map((att, aIdx) => {
          if (aIdx === activeAttemptIdx) {
            return { ...att, feedbackText: feedbackText.trim() };
          }
          return att;
        });
        return { ...st, attempts: updatedAttempts };
      }
      return st;
    });
    saveStudents(updated);
    alert(`Đã lưu nháp nhận xét lượt thực hành của ${student.name}`);
  };

  const handleStudentChange = (idx: number) => {
    setSelectedIdx(idx);
    setActiveAttemptIdx(0);
    setFeedbackText(students[idx]?.attempts[0]?.feedbackText || '');
  };

  // Safe coordinates helper for radar chart polygon
  const getRadarPoint = (val: number, angle: number, scale = 120) => {
    // val is from 0 to 10
    const scoreVal = val / 10;
    const x = 150 + scale * scoreVal * Math.cos(angle);
    const y = 150 + scale * scoreVal * Math.sin(angle);
    return `${x},${y}`;
  };

  const points = attempt
    ? [
        getRadarPoint(attempt.pitch, -Math.PI / 2), // Pitch (Top)
        getRadarPoint(attempt.rhythm, Math.PI / 6),  // Rhythm (Bottom Right)
        getRadarPoint(attempt.technique, (5 * Math.PI) / 6), // Technique (Bottom Left)
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

      {/* Grid Bento Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Student List Column */}
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
                    {st.avatar}
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
                      {st.class}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Analytics Center (Radar Chart) */}
        <section className="col-span-12 lg:col-span-5 bg-white rounded-xl p-xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="text-headline-md font-bold text-on-surface">
              Biểu đồ Năng lực
            </h3>
            <span className="px-3 py-1 rounded-full bg-[#f0eee9] text-[#745c00] font-label-sm text-label-sm font-semibold">
              Điểm số: {attempt ? attempt.score : 0}/10
            </span>
          </div>

          {/* Radar Chart SVG */}
          {attempt ? (
            <div className="flex flex-col items-center">
              <div className="relative w-[300px] h-[300px] bg-[#fbf9f4] rounded-full border border-outline-variant/10 shadow-inner flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full">
                  {/* Grid Lines */}
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#eae8e3" strokeDasharray="3" />
                  <circle cx="150" cy="150" r="80" fill="none" stroke="#eae8e3" strokeDasharray="3" />
                  <circle cx="150" cy="150" r="40" fill="none" stroke="#eae8e3" strokeDasharray="3" />

                  {/* Axis lines */}
                  <line x1="150" y1="150" x2="150" y2="30" stroke="#eae8e3" />
                  <line x1="150" y1="150" x2={150 + 120 * Math.cos(Math.PI / 6)} y2={150 + 120 * Math.sin(Math.PI / 6)} stroke="#eae8e3" />
                  <line x1="150" y1="150" x2={150 + 120 * Math.cos((5 * Math.PI) / 6)} y2={150 + 120 * Math.sin((5 * Math.PI) / 6)} stroke="#eae8e3" />

                  {/* Polygon showing student score */}
                  <polygon points={points} fill="rgba(115, 92, 0, 0.25)" stroke="#735c00" strokeWidth="2.5" />

                  {/* Individual indicator dots */}
                  <circle cx="150" cy={150 - 12 * attempt.pitch} r="5" fill="#735c00" stroke="white" strokeWidth="1.5" />
                  <circle cx={150 + 12 * attempt.rhythm * Math.cos(Math.PI / 6)} cy={150 + 12 * attempt.rhythm * Math.sin(Math.PI / 6)} r="5" fill="#735c00" stroke="white" strokeWidth="1.5" />
                  <circle cx={150 + 12 * attempt.technique * Math.cos((5 * Math.PI) / 6)} cy={150 + 12 * attempt.technique * Math.sin((5 * Math.PI) / 6)} r="5" fill="#735c00" stroke="white" strokeWidth="1.5" />
                </svg>

                {/* Outer Labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Cao độ</span>
                  <span className="text-body-sm font-bold text-primary">{attempt.pitch}/10</span>
                </div>
                <div className="absolute bottom-6 right-2 flex flex-col items-end">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Nhịp điệu</span>
                  <span className="text-body-sm font-bold text-primary">{attempt.rhythm}/10</span>
                </div>
                <div className="absolute bottom-6 left-2 flex flex-col items-start">
                  <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Kỹ thuật</span>
                  <span className="text-body-sm font-bold text-primary">{attempt.technique}/10</span>
                </div>
              </div>

              {/* Progress Summary Cards */}
              <div className="grid grid-cols-3 gap-sm w-full mt-xl">
                {[
                  { label: 'Pitch Precision', val: attempt.pitch * 10, suffix: '%' },
                  { label: 'Rhythm Sync', val: attempt.rhythm * 10, suffix: '%' },
                  { label: 'Technique Score', val: attempt.technique * 10, suffix: '%' },
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

        {/* History Attempts & Audio Player + Approval Feed */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          {/* List of Attempts */}
          <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/5 flex-grow">
            <div className="flex items-center gap-xs mb-lg">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-headline-md font-bold text-on-surface">
                Lịch sử thực hành
              </h3>
            </div>

            <div className="space-y-sm max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {student.attempts.map((att, aIdx) => {
                const isActive = aIdx === activeAttemptIdx;
                return (
                  <div
                    key={att.id}
                    onClick={() => {
                      setActiveAttemptIdx(aIdx);
                      setFeedbackText(student.attempts[aIdx]?.feedbackText || '');
                    }}
                    className={`p-md rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                      isActive
                        ? 'bg-primary/5 border-primary/20 shadow-xs'
                        : 'bg-[#fbf9f4] border-outline-variant/5 hover:bg-[#f5f3ee]'
                    }`}
                  >
                    <div>
                      <h4 className="font-label-md text-label-md font-bold text-primary">
                        {att.lessonName}
                      </h4>
                      <p className="text-[12px] text-on-surface-variant mt-xs">
                        {att.date} • {att.duration}
                      </p>
                    </div>
                    <span
                      className={`text-body-md font-bold ${
                        att.score >= 8.0 ? 'text-[#735c00]' : 'text-on-surface'
                      }`}
                    >
                      {att.score}/10
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audio Player & Feedback Comments Form */}
          {attempt && (
            <div className="bg-white rounded-xl p-lg shadow-sm border border-[#ffe088]/20 flex flex-col gap-md">
              <h4 className="font-label-md text-primary font-bold">
                Bản ghi âm &amp; Phê duyệt phản hồi
              </h4>

              {/* Fake Audio Bar */}
              <div className="bg-[#fbf9f4] p-md rounded-xl border border-outline-variant/10 flex items-center gap-md">
                <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform hover:opacity-95 shrink-0">
                  <Volume2 className="w-5 h-5 text-white fill-white ml-[1px]" />
                </button>
                <div className="flex-grow">
                  <div className="flex justify-between items-center text-[12px] text-on-surface-variant font-medium">
                    <span>Lượt ghi âm #{attempt.id}</span>
                    <span>0:00 / {attempt.duration}</span>
                  </div>
                  {/* Waveform placeholder line */}
                  <div className="h-1 w-full bg-[#eae8e3] rounded-full overflow-hidden mt-sm">
                    <div className="bg-[#735c00] h-full" style={{ width: '35%' }} />
                  </div>
                </div>
              </div>

              {/* Feedback Form */}
              <div className="space-y-sm">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-[#fbf9f4] border border-[#ffe088]/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-0 h-20 outline-none transition-all resize-none placeholder:text-on-surface-variant/40"
                  placeholder={student.feedbackPlaceholder}
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
