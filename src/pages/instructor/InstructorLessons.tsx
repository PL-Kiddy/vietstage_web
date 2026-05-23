import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Music,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

      {/* Drawer Form Overlay - Slide from right */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[75%] md:w-[65%] lg:w-[50%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl z-50 overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-primary font-sans">
                    {editingLesson ? 'Chỉnh sửa bài giảng' : 'Bài giảng mới'}
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    {editingLesson ? `Cập nhật cấu hình cho bài giảng: ${editingLesson.title}` : 'Thêm bài giảng mới vào giáo trình giảng dạy trực tuyến.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-md hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Body */}
              <form onSubmit={handleAddLesson} className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar flex flex-col justify-between">
                <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                  {/* Title & Instrument & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Tên bài giảng
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Nhập tên bài giảng..."
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Nhạc cụ giảng dạy
                      </label>
                      <select
                        value={newInstrument}
                        onChange={(e) => setNewInstrument(e.target.value)}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer"
                      >
                        <option>Đàn Nguyệt</option>
                        <option>Đàn Tranh</option>
                        <option>Đàn Bầu</option>
                        <option>Đàn Tỳ Bà</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Thứ tự trong giáo trình
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newOrderIndex}
                        onChange={(e) => setNewOrderIndex(Number(e.target.value))}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Trạng thái hiển thị
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer"
                      >
                        <option value="public">Công khai (Public)</option>
                        <option value="draft">Bản nháp (Draft)</option>
                      </select>
                    </div>
                  </div>

                  {/* Score range */}
                  <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
                    <div className="flex justify-between items-center">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Điểm AI tối thiểu để đạt
                      </label>
                      <span className="bg-primary/15 text-primary px-sm py-xs rounded font-bold text-sm">
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

                  {/* Description */}
                  <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Mô tả kỹ thuật biểu diễn
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Mô tả kỹ thuật rung dây, nhấn vuốt, gảy ngón..."
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface h-24"
                    />
                  </div>

                  {/* Exercises Manager */}
                  <div className="border-t border-outline-variant/10 pt-md space-y-sm">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs block">
                      Bài tập thực hành lòng bản
                    </label>
                    <div className="flex gap-sm">
                      <input
                        type="text"
                        value={currentExerciseInput}
                        onChange={(e) => setCurrentExerciseInput(e.target.value)}
                        placeholder="Nhập tên bài tập nhỏ..."
                        className="flex-grow bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentExerciseInput.trim()) return;
                          setNewExercises([...newExercises, currentExerciseInput.trim()]);
                          setCurrentExerciseInput('');
                        }}
                        className="bg-[#ffe088] text-primary px-xl py-md rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        Thêm
                      </button>
                    </div>

                    {newExercises.length === 0 ? (
                      <p className="text-on-surface-variant text-[12px] italic">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md border-t border-outline-variant/10 pt-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Âm thanh (.wav/.mp3)
                      </label>
                      <div className="border border-dashed border-outline-variant/40 rounded-xl p-md flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer">
                        <Music className="w-8 h-8 text-primary mb-xs" />
                        <span className="font-label-sm text-primary font-bold text-xs">Tải lên file âm thanh</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Ký âm / Sheet nhạc
                      </label>
                      <div className="border border-dashed border-outline-variant/40 rounded-xl p-md flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer">
                        <FileText className="w-8 h-8 text-primary mb-xs" />
                        <span className="font-label-sm text-primary font-bold text-xs">Tải lên bản ký âm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 flex items-center justify-center gap-sm bg-[#ba1a1a] text-white py-lg rounded-xl font-bold hover:bg-[#a61717] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <X className="w-5 h-5" />
                    Hủy
                  </button>
                  {editingLesson && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingLesson.id);
                        handleCloseModal();
                      }}
                      className="flex-1 flex items-center justify-center gap-sm bg-black/60 text-white py-lg rounded-xl font-bold hover:bg-black/70 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                      Xóa
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-lg rounded-xl font-bold hover:bg-[#154618] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                    Lưu
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorLessons;
