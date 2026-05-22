import React, { useState } from 'react';
import {
  Volume2,
  Send,
  Save,
  Activity,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  class: string;
  avatar: string;
  pitch: number;
  rhythm: number;
  technique: number;
  lastRecording: {
    title: string;
    duration: string;
    timestamp: string;
  };
  progress: number;
  feedbackPlaceholder: string;
}

const mockStudents: Student[] = [
  {
    id: 'S-2401',
    name: 'Lê Hải Nam',
    class: 'Lớp Đàn Bầu K24',
    avatar: 'LH',
    pitch: 8.5,
    rhythm: 9.2,
    technique: 7.0,
    lastRecording: {
      title: 'Tiểu phẩm: "Lưu Thủy"',
      duration: '2:15',
      timestamp: '0:42',
    },
    progress: 75,
    feedbackPlaceholder: 'Học viên Nam cần chú ý hơn về cách nhấn ngón ở đoạn cao trào...',
  },
  {
    id: 'S-2304',
    name: 'Nguyễn Thu Thủy',
    class: 'Lớp Đàn Tranh K23',
    avatar: 'NT',
    pitch: 9.0,
    rhythm: 8.5,
    technique: 8.8,
    lastRecording: {
      title: 'Bài thực hành: "Trống Cơm"',
      duration: '1:50',
      timestamp: '1:10',
    },
    progress: 88,
    feedbackPlaceholder: 'Khả năng vuốt dây của Thủy rất tốt, cần phối hợp đều tay trái...',
  },
  {
    id: 'S-2509',
    name: 'Phạm Duy Hoàng',
    class: 'Lớp Ca Trù K25',
    avatar: 'PH',
    pitch: 7.2,
    rhythm: 7.5,
    technique: 6.8,
    lastRecording: {
      title: 'Bài tập: "Gõ Phách"',
      duration: '3:05',
      timestamp: '2:01',
    },
    progress: 45,
    feedbackPlaceholder: 'Chú ý giữ chắc nhịp phách gỗ, không bị đẩy nhanh ở giữa câu ca...',
  },
  {
    id: 'S-2412',
    name: 'Trần Lan Anh',
    class: 'Lớp Cải Lương K24',
    avatar: 'LA',
    pitch: 8.8,
    rhythm: 8.0,
    technique: 7.5,
    lastRecording: {
      title: 'Vọng Cổ: "Lá Trầu Xanh"',
      duration: '4:20',
      timestamp: '3:15',
    },
    progress: 60,
    feedbackPlaceholder: 'Lan Anh có hơi thở khỏe, cần trau chuốt các từ ngân luyến cuối chữ...',
  },
];

const InstructorStudents = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const student = mockStudents[selectedIdx];

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) {
      alert('Vui lòng nhập nội dung nhận xét trước khi gửi.');
      return;
    }
    alert(`Đã gửi nhận xét đến học viên ${student.name}`);
    setFeedbackText('');
  };

  const handleSaveDraft = () => {
    alert(`Đã lưu nháp nhận xét cho học viên ${student.name}`);
  };

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
          <div className="flex flex-col gap-sm overflow-y-auto max-h-[calc(100vh-300px)] pr-2">
            {mockStudents.map((st, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <div
                  key={st.id}
                  onClick={() => {
                    setSelectedIdx(idx);
                    setFeedbackText('');
                  }}
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
              Học viên: {student.name}
            </span>
          </div>

          <div className="flex items-center justify-center h-[300px] relative">
            {/* SVG Radar Chart Representation */}
            <svg className="w-full h-full max-w-[280px]" viewBox="0 0 200 200">
              {/* Radar rings grid */}
              <polygon
                points="100,20 170,140 30,140"
                className="stroke-[#e3beb8] fill-none"
                strokeWidth="1"
              />
              <polygon
                points="100,50 145,125 55,125"
                className="stroke-[#e3beb8] fill-none"
                strokeWidth="1"
              />
              <polygon
                points="100,80 120,110 80,110"
                className="stroke-[#e3beb8] fill-none"
                strokeWidth="1"
              />

              {/* Axes lines */}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="20"
                className="stroke-[#e3beb8]"
                strokeWidth="1"
              />
              <line
                x1="100"
                y1="100"
                x2="170"
                y2="140"
                className="stroke-[#e3beb8]"
                strokeWidth="1"
              />
              <line
                x1="100"
                y1="100"
                x2="30"
                y2="140"
                className="stroke-[#e3beb8]"
                strokeWidth="1"
              />

              {/* Dynamic polygon area based on stats */}
              {/* Cao độ center is at 100,100. max top is 100,20. so Y = 100 - stats*8 */}
              {/* Nhịp điệu max bottom-right is 170,140. Vector is (70, 40). delta is stats * (7, 4) */}
              {/* Kỹ thuật max bottom-left is 30,140. Vector is (-70, 40). delta is stats * (-7, 4) */}
              <polygon
                points={`
                  100,${100 - student.pitch * 8} 
                  ${100 + student.rhythm * 7},${100 + student.rhythm * 4} 
                  ${100 - student.technique * 7},${100 + student.technique * 4}
                `}
                className="fill-[#735c00]/20 stroke-[#735c00]"
                strokeWidth="2"
              />

              {/* Text labels */}
              <text
                x="100"
                y="12"
                className="text-[10px] font-bold fill-on-surface"
                textAnchor="middle"
              >
                Cao độ
              </text>
              <text
                x="185"
                y="150"
                className="text-[10px] font-bold fill-on-surface"
                textAnchor="middle"
              >
                Nhịp điệu
              </text>
              <text
                x="15"
                y="150"
                className="text-[10px] font-bold fill-on-surface"
                textAnchor="middle"
              >
                Kỹ thuật
              </text>
            </svg>
          </div>

          <div className="mt-xl grid grid-cols-3 gap-md border-t border-outline-variant/20 pt-lg">
            <div className="text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-[12px]">
                Cao độ
              </p>
              <p className="text-headline-md font-bold text-secondary">
                {student.pitch}
              </p>
            </div>
            <div className="text-center border-x border-outline-variant/20">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-[12px]">
                Nhịp điệu
              </p>
              <p className="text-headline-md font-bold text-secondary">
                {student.rhythm}
              </p>
            </div>
            <div className="text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant text-[12px]">
                Kỹ thuật
              </p>
              <p className="text-headline-md font-bold text-secondary">
                {student.technique}
              </p>
            </div>
          </div>
        </section>

        {/* Feedback & Waveform Column */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          {/* Audio Recording */}
          <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/5">
            <div className="flex items-center gap-md mb-lg">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="font-label-md text-label-md font-bold text-on-surface">
                Bản ghi âm gần nhất
              </h3>
            </div>
            <div className="bg-[#f0eee9] rounded-lg p-md">
              <div className="flex items-end justify-between h-12 mb-md bg-[#e4e2dd] p-sm rounded gap-[2px]">
                {/* Waveform bars */}
                {[
                  10, 20, 30, 15, 25, 40, 35, 20, 15, 25, 30, 20, 10, 25, 40,
                  20, 30, 15, 35, 10,
                ].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-sm ${
                      i < 12 ? 'bg-primary h-full' : 'bg-[#8e706b] h-2/3'
                    }`}
                    style={{ height: `${h * 2}%` }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <button className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow hover:scale-105 transition-transform">
                    <span className="text-[12px] font-bold text-white">▶</span>
                  </button>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {student.lastRecording.timestamp} /{' '}
                    {student.lastRecording.duration}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  {student.lastRecording.title}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/5 flex-grow">
            <div className="flex items-center gap-md mb-lg">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-label-md text-label-md font-bold text-on-surface">
                Phê duyệt &amp; Phản hồi
              </h3>
            </div>
            <div className="space-y-md">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-xs block font-semibold">
                  Viết nhận xét của bạn
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-[#fbf9f4] border border-outline-variant/20 rounded-lg p-md font-body-md text-body-md focus:ring-2 focus:ring-secondary outline-none transition-all placeholder:text-on-surface-variant/40 h-32"
                  placeholder={student.feedbackPlaceholder}
                />
              </div>
              <div className="flex gap-sm">
                <button
                  onClick={handleSendFeedback}
                  className="flex-grow bg-primary hover:bg-primary/95 text-on-primary font-label-md text-label-md py-3 rounded-lg transition-colors flex items-center justify-center gap-sm shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4 text-white" />
                  Gửi phản hồi
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-md border border-outline text-outline font-label-md text-label-md py-3 rounded-lg hover:bg-[#eae8e3] transition-colors flex items-center gap-1 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Lưu nháp
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Target Progress Banner */}
      <div className="mt-gutter bg-[#fed65b]/20 border border-[#fed65b]/30 rounded-xl p-lg flex flex-col md:flex-row justify-between items-center gap-md">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-[#fed65b] flex items-center justify-center text-[#241a00] shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-[#574500]">
              Mục tiêu đào tạo
            </h4>
            <p className="text-body-md text-[#574500]/80 text-[14px]">
              {student.name} đã hoàn thành {student.progress}% chương trình luyện tập.
            </p>
          </div>
        </div>
        <div className="w-full md:w-64 h-2 bg-[#dbdad5] rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-500"
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default InstructorStudents;
