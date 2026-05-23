import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Music,
  FileText,
  X,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  module: string;
  instrument: string;
  difficulty: number;
  updatedAt: string;
  status: 'public' | 'draft';
  description: string;
  passingThreshold: number;
  exercises: string[];
  orderIndex: number;
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
    description: 'Hướng dẫn các tư thế cầm đàn, gảy phím nốt trơn và bài luyện ngón chạy âm giai Cung oán.',
    passingThreshold: 75,
    exercises: ['Bài tập gảy phím đơn', 'Chạy ngón âm giai Cung oán', 'Luyện nhịp phách đơn'],
    orderIndex: 1,
  },
  {
    id: 'L-002',
    title: 'Dạ Cổ Hoài Lang',
    module: 'Cải Lương học',
    instrument: 'Đàn Tranh',
    difficulty: 2,
    updatedAt: '08/10/2023',
    status: 'draft',
    description: 'Học bài bản Dạ Cổ Hoài Lang nhịp đôi. Tập trung kỹ thuật nhấn ngón rung, vuốt dây và láy âm.',
    passingThreshold: 80,
    exercises: ['Kỹ thuật nhấn ngón rung tranh', 'Thực hành nhịp đôi lòng bản', 'Trình diễn Dạ Cổ Hoài Lang trọn vẹn'],
    orderIndex: 2,
  },
  {
    id: 'L-003',
    title: 'Lưu Thủy Kim Tiền',
    module: 'Nhạc lễ',
    instrument: 'Đàn Nguyệt',
    difficulty: 3,
    updatedAt: '05/10/2023',
    status: 'public',
    description: 'Học liên khúc Lưu Thủy và Kim Tiền bản nhạc lễ Nam Bộ. Yêu cầu kỹ thuật cao độ chuẩn xác và tốc độ nhanh.',
    passingThreshold: 85,
    exercises: ['Luyện ngón nhanh tốc độ 100bpm', 'Thực hành Lưu Thủy', 'Thực hành Kim Tiền liên khúc'],
    orderIndex: 3,
  },
];

const InstructorLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('vietstage_instructor_lessons');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing instructor lessons:', e);
      }
    }
    return initialLessons;
  });

  const saveLessons = (updatedLessons: Lesson[]) => {
    setLessons(updatedLessons);
    localStorage.setItem('vietstage_instructor_lessons', JSON.stringify(updatedLessons));
  };

  const [newTitle, setNewTitle] = useState('');
  const [newInstrument, setNewInstrument] = useState('Đàn Nguyệt');
  const [newStatus, setNewStatus] = useState<'public' | 'draft'>('draft');
  const [newDescription, setNewDescription] = useState('');
  const [newPassingThreshold, setNewPassingThreshold] = useState<number>(80);
  const [newOrderIndex, setNewOrderIndex] = useState<number>(1);
  const [newExercises, setNewExercises] = useState<string[]>([]);
  const [currentExerciseInput, setCurrentExerciseInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const handleEditClick = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setNewTitle(lesson.title);
    setNewInstrument(lesson.instrument);
    setNewStatus(lesson.status);
    setNewDescription(lesson.description || '');
    setNewPassingThreshold(lesson.passingThreshold || 80);
    setNewOrderIndex(lesson.orderIndex || 1);
    setNewExercises(lesson.exercises || []);
    setCurrentExerciseInput('');
  };

  const handleCloseModal = () => {
    setNewTitle('');
    setNewInstrument('Đàn Nguyệt');
    setNewStatus('draft');
    setNewDescription('');
    setNewPassingThreshold(80);
    setNewOrderIndex(1);
    setNewExercises([]);
    setCurrentExerciseInput('');
    setEditingLesson(null);
    setShowAddForm(false);
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tên bài giảng');
      return;
    }

    if (editingLesson) {
      const updated = lessons.map((l) =>
        l.id === editingLesson.id
          ? {
              ...l,
              title: newTitle,
              instrument: newInstrument,
              status: newStatus,
              description: newDescription,
              passingThreshold: newPassingThreshold,
              orderIndex: newOrderIndex,
              exercises: newExercises,
              updatedAt: new Date().toLocaleDateString('vi-VN'),
            }
          : l
      );
      saveLessons(updated);
      alert('Đã cập nhật bài giảng thành công!');
    } else {
      const newLesson: Lesson = {
        id: `L-00${lessons.length + 1}`,
        title: newTitle,
        module: 'Khóa học tự do',
        instrument: newInstrument,
        difficulty: 2,
        updatedAt: new Date().toLocaleDateString('vi-VN'),
        status: newStatus,
        description: newDescription,
        passingThreshold: newPassingThreshold,
        orderIndex: newOrderIndex,
        exercises: newExercises,
      };
      saveLessons([...lessons, newLesson]);
      alert('Đã thêm bài giảng mới!');
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài giảng này không?')) {
      const updated = lessons.filter((l) => l.id !== id);
      saveLessons(updated);
    }
  };

  const isModalOpen = showAddForm || editingLesson !== null;

  // Arrange curriculum order by sorting lessons dynamically by orderIndex
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-xl gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-primary tracking-tight">
            Quản lý Bài giảng
          </h2>
          <p className="text-on-surface-variant font-body-md mt-base">
            Tổ chức, đăng tải học liệu và cấu hình giáo trình giảng dạy trực tuyến của bạn.
          </p>
        </div>
        <button
          onClick={() => {
            // Suggest next order index
            const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.orderIndex)) + 1 : 1;
            setNewOrderIndex(nextOrder);
            setShowAddForm(true);
          }}
          className="flex items-center gap-sm bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Thêm bài giảng mới
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Lesson List Table */}
        <div className="col-span-12 flex flex-col gap-gutter">
          <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
              <span className="text-headline-md font-bold text-primary">
                Danh sách lộ trình giáo trình
              </span>
              <span className="px-md py-xs bg-[#eae8e3] rounded-full text-label-sm font-label-sm">
                Tổng cộng: {lessons.length} bài học
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f5f3ee]/50">
                    <th className="text-left py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Thứ tự giáo trình
                    </th>
                    <th className="text-left py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Tên bài giảng
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Nhạc cụ
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Ngưỡng đạt (Scoring)
                    </th>
                    <th className="text-left py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Bài tập nhỏ
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
                  {sortedLessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="hover:bg-[#f5f3ee] transition-colors group"
                    >
                      <td className="py-lg px-xl font-label-md text-primary font-bold text-center">
                        <span className="bg-primary/5 text-primary px-3 py-1 rounded-md border border-primary/10">
                          #{lesson.orderIndex}
                        </span>
                      </td>
                      <td className="py-lg px-xl">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-primary font-bold">
                            {lesson.title}
                          </span>
                          <span className="text-label-sm text-on-surface-variant text-[12px] line-clamp-1 max-w-xs">
                            {lesson.description || 'Chưa có mô tả kỹ thuật.'}
                          </span>
                        </div>
                      </td>
                      <td className="py-lg px-md">
                        <span className="px-md py-xs bg-[#ffe088]/20 text-[#574500] rounded-full text-label-sm font-semibold">
                          {lesson.instrument}
                        </span>
                      </td>
                      <td className="py-lg px-md">
                        <span className="font-semibold text-secondary">
                          &ge; {lesson.passingThreshold || 80}%
                        </span>
                      </td>
                      <td className="py-lg px-md text-on-surface-variant font-label-md text-[13px]">
                        {lesson.exercises ? lesson.exercises.length : 0} bài tập
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
                        <button
                          onClick={() => handleEditClick(lesson)}
                          className="p-2 hover:bg-[#ffe088]/20 text-primary transition-all rounded-lg border border-[#ffe088]/30 inline-flex items-center justify-center bg-[#fbf9f4]"
                          title="Chỉnh sửa cấu hình bài giảng"
                        >
                          <Edit2 className="w-4 h-4 text-[#735c00]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form Overlay - Centered on screen */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-md backdrop-blur-xs">
          {/* Close backdrop click */}
          <div className="absolute inset-0" onClick={handleCloseModal} />

          {/* Form Content Card */}
          <form
            onSubmit={handleAddLesson}
            className="relative bg-white rounded-2xl p-xl border border-outline-variant/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10 space-y-xl"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-md">
              <h3 className="text-headline-md font-bold text-primary border-l-4 border-primary pl-md">
                {editingLesson ? 'Chỉnh sửa bài giảng' : 'Thông tin bài giảng mới'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 hover:bg-[#f5f3ee] rounded-full transition-colors text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
              {/* Basic Fields */}
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Tên bài giảng
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tên bài giảng..."
                  className="w-full px-md py-md bg-[#fbf9f4] border border-[#ffe088]/30 rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Chọn nhạc cụ
                </label>
                <select
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                  className="w-full px-md py-md bg-[#fbf9f4] border border-[#ffe088]/30 rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-on-surface cursor-pointer"
                >
                  <option>Đàn Nguyệt</option>
                  <option>Đàn Tranh</option>
                  <option>Đàn Bầu</option>
                  <option>Đàn Tỳ Bà</option>
                </select>
              </div>
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Trạng thái
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'public' | 'draft')}
                  className="w-full px-md py-md bg-[#fbf9f4] border border-[#ffe088]/30 rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-on-surface cursor-pointer"
                >
                  <option value="public">Công khai</option>
                  <option value="draft">Nháp</option>
                </select>
              </div>

              {/* Curriculum Sắp xếp & Ngưỡng điểm */}
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Thứ tự bài học trong giáo trình
                </label>
                <input
                  type="number"
                  min="1"
                  value={newOrderIndex}
                  onChange={(e) => setNewOrderIndex(Number(e.target.value))}
                  className="w-full px-md py-md bg-[#fbf9f4] border border-[#ffe088]/30 rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-on-surface"
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col gap-sm">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-on-surface-variant font-semibold">
                    Ngưỡng điểm AI tối thiểu đạt bài (Passing Score)
                  </label>
                  <span className="bg-secondary/15 text-secondary px-sm py-xs rounded font-label-md font-bold">
                    {newPassingThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={newPassingThreshold}
                  onChange={(e) => setNewPassingThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-[#eae8e3] rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                />
              </div>

              {/* Technique Description Text Area */}
              <div className="col-span-1 md:col-span-3 flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Mô tả kỹ thuật biểu diễn (Technique Description)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả kỹ thuật rung dây, nhấn vuốt, gảy ngón..."
                  className="w-full px-md py-md bg-[#fbf9f4] border border-[#ffe088]/30 rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-on-surface h-24"
                />
              </div>

              {/* Exercises Manager */}
              <div className="col-span-1 md:col-span-3 border-t border-outline-variant/10 pt-lg space-y-md">
                <h4 className="font-label-md text-primary font-bold">
                  Cơ cấu bài tập thực hành (Exercises List)
                </h4>
                <div className="flex gap-sm">
                  <input
                    type="text"
                    value={currentExerciseInput}
                    onChange={(e) => setCurrentExerciseInput(e.target.value)}
                    placeholder="Nhập tên bài tập nhỏ (ví dụ: Luyện phách nốt trơn, Chạy âm giai...)"
                    className="flex-grow px-md py-md bg-[#fbf9f4] border border-[#ffe088]/30 rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentExerciseInput.trim()) return;
                      setNewExercises([...newExercises, currentExerciseInput.trim()]);
                      setCurrentExerciseInput('');
                    }}
                    className="bg-[#ffe088] text-primary px-xl py-md rounded-lg font-label-md font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    Thêm
                  </button>
                </div>

                {newExercises.length === 0 ? (
                  <p className="text-on-surface-variant font-body-sm text-[13px] italic">
                    Chưa có bài tập nhỏ nào được thêm. Học viên sẽ thực hành toàn bộ bài giảng làm 1 bài tập chính.
                  </p>
                ) : (
                  <ul className="space-y-sm bg-[#fbf9f4] p-md rounded-xl border border-outline-variant/10 max-h-40 overflow-y-auto custom-scrollbar">
                    {newExercises.map((ex, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-white px-md py-sm rounded-lg border border-outline-variant/5 shadow-xs text-body-md text-on-surface">
                        <span className="font-medium">{idx + 1}. {ex}</span>
                        <button
                          type="button"
                          onClick={() => setNewExercises(newExercises.filter((_, i) => i !== idx))}
                          className="text-error hover:scale-110 active:scale-95 transition-transform"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Upload Section */}
              <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-xl border-t border-outline-variant/10 pt-lg">
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-on-surface-variant font-semibold">
                    Tải lên Âm thanh (.wav)
                  </label>
                  <div className="border-2 border-dashed border-[#ffe088]/30 rounded-xl p-xl flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer">
                    <Music className="w-12 h-12 text-primary mb-sm" />
                    <span className="font-label-md text-primary font-bold">
                      Thả file âm thanh mẫu
                    </span>
                    <span className="text-label-sm text-on-surface-variant mt-xs text-center text-[12px]">
                      Định dạng hỗ trợ: .wav, .mp3
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-on-surface-variant font-semibold">
                    Tải lên Sheet nhạc (.png/.pdf)
                  </label>
                  <div className="border-2 border-dashed border-[#ffe088]/30 rounded-xl p-xl flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer">
                    <FileText className="w-12 h-12 text-primary mb-sm" />
                    <span className="font-label-md text-primary font-bold">
                      Thả bản ký âm mẫu
                    </span>
                    <span className="text-label-sm text-on-surface-variant mt-xs text-center text-[12px]">
                      Định dạng hỗ trợ: .pdf, .png, .jpg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-md border-t border-outline-variant/10 pt-md">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-xl py-md border border-outline rounded-lg text-on-surface-variant font-label-md hover:bg-[#f5f3ee] transition-all"
              >
                Hủy
              </button>
              {editingLesson && (
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(editingLesson.id);
                    handleCloseModal();
                  }}
                  className="bg-error hover:bg-error/95 text-white px-xl py-md rounded-lg font-label-md transition-all shadow-md active:scale-95 flex items-center gap-sm"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                  <span className="text-white">Xóa bài giảng</span>
                </button>
              )}
              <button
                type="submit"
                className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95"
              >
                {editingLesson ? 'Lưu thay đổi' : 'Lưu bài học'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InstructorLessons;
