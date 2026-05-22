import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Music,
  FileText,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  module: string;
  instrument: string;
  difficulty: number;
  updatedAt: string;
  status: 'public' | 'draft';
}

const initialLessons: Lesson[] = [
  {
    id: 'L-001',
    title: 'Lý Ngựa Ô - Căn bản',
    module: 'Nhạc lý cơ bản',
    instrument: 'Đàn Nguyệt',
    difficulty: 1,
    updatedAt: '12/10/2023',
    status: 'public',
  },
  {
    id: 'L-002',
    title: 'Dạ Cổ Hoài Lang',
    module: 'Cải Lương học',
    instrument: 'Đàn Tranh',
    difficulty: 2,
    updatedAt: '08/10/2023',
    status: 'draft',
  },
  {
    id: 'L-003',
    title: 'Lưu Thủy Kim Tiền',
    module: 'Nhạc lễ',
    instrument: 'Đàn Nguyệt',
    difficulty: 3,
    updatedAt: '05/10/2023',
    status: 'public',
  },
];

const InstructorLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [newTitle, setNewTitle] = useState('');
  const [newInstrument, setNewInstrument] = useState('Đàn Nguyệt');
  const [difficultyEasy, setDifficultyEasy] = useState(15);
  const [difficultyMedium, setDifficultyMedium] = useState(8);
  const [difficultyHard, setDifficultyHard] = useState(3);

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tên bài giảng');
      return;
    }
    const newLesson: Lesson = {
      id: `L-00${lessons.length + 1}`,
      title: newTitle,
      module: 'Khóa học tự do',
      instrument: newInstrument,
      difficulty: 2,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
      status: 'draft',
    };
    setLessons([...lessons, newLesson]);
    setNewTitle('');
    alert('Đã thêm bài giảng mới vào danh sách nháp!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài giảng này không?')) {
      setLessons(lessons.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-xl gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-primary tracking-tight">
            Quản lý Bài giảng
          </h2>
          <p className="text-on-surface-variant font-body-md mt-base">
            Tổ chức và cấu hình nội dung giảng dạy trực tuyến của bạn.
          </p>
        </div>
        <button className="flex items-center gap-sm bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95">
          <Plus className="w-5 h-5" />
          Thêm bài giảng mới
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Bento Grid Left: Lesson List & Form */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-gutter">
          {/* Lesson List Table */}
          <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
              <span className="text-headline-md font-bold text-primary">
                Danh sách bài giảng
              </span>
              <span className="px-md py-xs bg-[#eae8e3] rounded-full text-label-sm font-label-sm">
                Tổng cộng: {lessons.length} bài
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f5f3ee]/50">
                    <th className="text-left py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Tên bài
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Nhạc cụ
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Độ khó
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Ngày cập nhật
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Trạng thái
                    </th>
                    <th className="text-right py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {lessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="hover:bg-[#f5f3ee] transition-colors group"
                    >
                      <td className="py-lg px-xl">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-primary font-bold">
                            {lesson.title}
                          </span>
                          <span className="text-label-sm text-on-surface-variant text-[12px]">
                            Module: {lesson.module}
                          </span>
                        </div>
                      </td>
                      <td className="py-lg px-md">
                        <span className="px-md py-xs bg-[#ffe088]/20 text-[#574500] rounded-full text-label-sm font-semibold">
                          {lesson.instrument}
                        </span>
                      </td>
                      <td className="py-lg px-md">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((star) => (
                            <div
                              key={star}
                              className={`w-2 h-2 rounded-full ${
                                star <= lesson.difficulty
                                  ? 'bg-[#735c00]'
                                  : 'bg-[#e4e2dd]'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-lg px-md text-on-surface-variant font-label-md">
                        {lesson.updatedAt}
                      </td>
                      <td className="py-lg px-md">
                        {lesson.status === 'public' ? (
                          <span className="flex items-center gap-xs text-[#735c00] text-label-sm font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#735c00]" />{' '}
                            Công khai
                          </span>
                        ) : (
                          <span className="flex items-center gap-xs text-on-surface-variant text-label-sm">
                            <span className="w-2 h-2 rounded-full bg-[#e3beb8]" />{' '}
                            Nháp
                          </span>
                        )}
                      </td>
                      <td className="py-lg px-xl text-right">
                        <button className="p-2 opacity-0 group-hover:opacity-100 hover:text-primary transition-all">
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(lesson.id)}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Section */}
          <form
            onSubmit={handleAddLesson}
            className="bg-white rounded-xl p-xl border border-outline-variant/10 shadow-sm"
          >
            <h3 className="text-headline-md font-bold text-primary mb-lg border-l-4 border-primary pl-md">
              Thông tin bài giảng mới
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Tên bài giảng
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tên bài giảng..."
                  className="w-full px-md py-md bg-[#fbf9f4] border border-outline/20 rounded-lg focus:ring-2 focus:ring-[#735c00]/20 focus:border-[#735c00] outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Chọn nhạc cụ
                </label>
                <select
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  className="w-full px-md py-md bg-[#fbf9f4] border border-outline/20 rounded-lg focus:ring-2 focus:ring-[#735c00]/20 focus:border-[#735c00] outline-none transition-all"
                >
                  <option>Đàn Nguyệt</option>
                  <option>Đàn Tranh</option>
                  <option>Đàn Bầu</option>
                  <option>Đàn Tỳ Bà</option>
                </select>
              </div>

              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-xl">
                {/* File Upload Area */}
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-on-surface-variant font-semibold">
                    Tải lên Âm thanh (.wav)
                  </label>
                  <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-xl flex flex-col items-center justify-center bg-[#f5f3ee]/30 hover:bg-[#f5f3ee] transition-all cursor-pointer">
                    <Music className="w-12 h-12 text-primary mb-sm" />
                    <span className="font-label-md text-primary font-bold">
                      Thả file âm thanh vào đây
                    </span>
                    <span className="text-label-sm text-on-surface-variant mt-xs text-center text-[12px]">
                      Định dạng hỗ trợ: .wav, .mp3 (Max 20MB)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-on-surface-variant font-semibold">
                    Tải lên Sheet nhạc (.png/.pdf)
                  </label>
                  <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-xl flex flex-col items-center justify-center bg-[#f5f3ee]/30 hover:bg-[#f5f3ee] transition-all cursor-pointer">
                    <FileText className="w-12 h-12 text-primary mb-sm" />
                    <span className="font-label-md text-primary font-bold">
                      Thả bản ký âm vào đây
                    </span>
                    <span className="text-label-sm text-on-surface-variant mt-xs text-center text-[12px]">
                      Định dạng hỗ trợ: .pdf, .png, .jpg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-lg flex justify-end">
              <button
                type="submit"
                className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95"
              >
                Lưu bài học
              </button>
            </div>
          </form>
        </div>

        {/* Bento Grid Right: AI Configuration & Quick Stats */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          {/* AI Precision Configuration */}
          <div className="bg-white rounded-xl p-xl border border-outline-variant/10 shadow-sm bg-gradient-to-br from-white to-[#f5f3ee]">
            <div className="flex items-center gap-md mb-lg">
              <div className="p-3 bg-[#fed65b]/20 rounded-lg">
                <HelpCircle className="w-6 h-6 text-[#735c00]" />
              </div>
              <h3 className="text-headline-md font-bold text-primary">
                Cấu hình AI
              </h3>
            </div>
            <p className="text-label-md text-on-surface-variant mb-xl">
              Thiết lập độ nhạy nhận diện nốt nhạc cho các mức độ luyện tập.
            </p>
            <div className="flex flex-col gap-xl">
              {/* Easy Level */}
              <div className="space-y-sm">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-primary font-bold">
                    Dễ (Beginner)
                  </span>
                  <span className="font-label-sm text-secondary font-semibold">
                    {difficultyEasy}% sai số
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={difficultyEasy}
                  onChange={(e) => setDifficultyEasy(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#eae8e3] rounded-full appearance-none accent-[#735c00] cursor-pointer"
                />
              </div>
              {/* Medium Level */}
              <div className="space-y-sm">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-primary font-bold">
                    Trung bình
                  </span>
                  <span className="font-label-sm text-secondary font-semibold">
                    {difficultyMedium}% sai số
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={difficultyMedium}
                  onChange={(e) => setDifficultyMedium(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#eae8e3] rounded-full appearance-none accent-[#735c00] cursor-pointer"
                />
              </div>
              {/* Hard Level */}
              <div className="space-y-sm">
                <div className="flex justify-between items-center">
                  <span className="font-label-md text-primary font-bold">
                    Khó (Expert)
                  </span>
                  <span className="font-label-sm text-secondary font-semibold">
                    {difficultyHard}% sai số
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={difficultyHard}
                  onChange={(e) => setDifficultyHard(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#eae8e3] rounded-full appearance-none accent-[#735c00] cursor-pointer"
                />
              </div>
            </div>
            <div className="mt-xl p-md bg-white/50 rounded-lg border border-outline-variant/10">
              <div className="flex gap-sm">
                <Info className="w-5 h-5 text-[#735c00] shrink-0 mt-0.5" />
                <p className="text-label-sm text-on-surface-variant leading-relaxed text-[12px]">
                  AI sẽ dựa vào mức sai số này để đánh giá độ chính xác của cao độ và
                  trường độ khi học viên thực hành.
                </p>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-xl overflow-hidden group border border-outline-variant/10 shadow-sm">
            <div className="h-48 relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvYuhNO1suPrcop2Dw6t-duQw9na-U1Gbm__j1f7tNM-bGEBDUFluZCKKNlbbjL2JhQt8tykntIGFVxKEbzd5a6Qi01SD0vVtD8YEqJVFA3y5yVO8K1SkmD_y13DBzNljGTDxhoLZJsUPhabdtm20_aTd0lkmGQ_6DuRrEizidGWLEHrPeCzBzSlK6Oiuz8jXjXPBFL-m4gdDsOarMvzpjdBZOoVAlhDO8TbaBZv25FD69hSTctl9_XuJicqISMqmSVPa3aHUMrq2A"
                alt="Music notation preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
              <div className="absolute bottom-md left-md">
                <span className="font-label-sm text-on-primary bg-secondary/80 px-md py-xs rounded-full backdrop-blur-sm">
                  Xem trước giao diện
                </span>
              </div>
            </div>
            <div className="p-xl">
              <h4 className="text-headline-md font-bold text-primary mb-sm">
                Giao diện học viên
              </h4>
              <p className="text-on-surface-variant font-body-md text-[14px]">
                Kiểm tra cách bài giảng của bạn hiển thị trên máy tính và thiết bị di động.
              </p>
              <button className="mt-lg w-full py-md border border-primary text-primary font-label-md rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-sm">
                <Eye className="w-5 h-5" />
                Chạy thử bài học
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorLessons;
