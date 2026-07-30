import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Music,
  FileText,
  X,
  Check,
  ListChecks,
  BookOpen,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { lessonsApi, masterDataApi } from '../../api/services';
import { lessonDetailApi } from '../../api/management';
import type { Instrument, Lesson as ApiLesson, SkillLevel } from '../../api/types';

interface Lesson {
  id: string;
  title: string;
  module: string;
  instrument: string;
  difficulty: number;
  updatedAt: string;
  status: ApiLesson['status'];
  description: string;
  passingThreshold: number;
  exercises: string[];
  orderIndex: number;
  backendStatus?: ApiLesson['status'];
}

const mapLesson = (lesson: ApiLesson): Lesson => ({
  id: String(lesson.id),
  title: lesson.title,
  module: lesson.skillLevel?.levelName ?? 'Chưa phân cấp',
  instrument: lesson.instrument?.name ?? 'Chưa chọn nhạc cụ',
  difficulty: lesson.skillLevel?.id ?? 1,
  updatedAt: lesson.updatedAt
    ? new Date(lesson.updatedAt).toLocaleDateString('vi-VN')
    : '',
  status: lesson.status,
  backendStatus: lesson.status,
  description: lesson.description ?? '',
  passingThreshold: lesson.exercises?.[0]?.passThreshold ?? 80,
  exercises: lesson.exercises?.map((exercise) => exercise.title) ?? [],
  orderIndex: lesson.orderIndex ?? 0,
});

const getStatusMeta = (status: ApiLesson['status']) => {
  switch (status) {
    case 'PENDING':
      return { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    case 'APPROVED':
      return { label: 'Đã duyệt', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    case 'REJECTED':
      return { label: 'Bị từ chối', className: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500' };
    default:
      return { label: 'Bản nháp', className: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  }
};
const InstructorLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newInstrument, setNewInstrument] = useState('Đàn Nguyệt');
  const [newSkillLevelId, setNewSkillLevelId] = useState(0);
  const [newStatus, setNewStatus] = useState<'public' | 'draft'>('draft');
  const [newDescription, setNewDescription] = useState('');
  const [newPassingThreshold, setNewPassingThreshold] = useState<number>(80);
  const [newOrderIndex, setNewOrderIndex] = useState<number>(1);
  const [newExercises, setNewExercises] = useState<string[]>([]);
  const [currentExerciseInput, setCurrentExerciseInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: '1', size: '100' });
      const response = await lessonsApi.list(params);
      setLessons(Array.isArray(response.content) ? response.content.map(mapLesson) : []);
    } catch (error) {
      setLessons([]);
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách bài giảng.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMasterData = useCallback(async () => {
    try {
      const [instrumentData, skillLevelData] = await Promise.all([
        masterDataApi.instruments(),
        masterDataApi.skillLevels(),
      ]);
      setInstruments(instrumentData);
      setSkillLevels(skillLevelData);
      if (instrumentData[0]) setNewInstrument(instrumentData[0].name);
      if (skillLevelData[0]) setNewSkillLevelId(skillLevelData[0].id);
    } catch (error) {
      setInstruments([]);
      setSkillLevels([]);
      setLoadError((current) => current || (error instanceof Error ? error.message : 'Không thể tải dữ liệu nhạc cụ và trình độ.'));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLessons();
      void loadMasterData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLessons, loadMasterData]);

  const handleEditClick = async (lesson: Lesson) => {
    try {
      const detail = await lessonDetailApi.get(Number(lesson.id));
      const mapped = mapLesson(detail);
      setEditingLesson(mapped);
      setNewTitle(mapped.title);
      setNewInstrument(mapped.instrument);
      setNewSkillLevelId(detail.skillLevel?.id ?? skillLevels[0]?.id ?? 0);
      setNewStatus(mapped.status === 'DRAFT' || mapped.status === 'REJECTED' ? 'draft' : 'public');
      setNewDescription(mapped.description);
      setNewPassingThreshold(mapped.passingThreshold);
      setNewOrderIndex(mapped.orderIndex || 1);
      setNewExercises(mapped.exercises);
      setCurrentExerciseInput('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể tải chi tiết bài giảng.');
    }
  };

  const handleCloseModal = () => {
    setNewTitle('');
    setNewInstrument(instruments[0]?.name ?? 'Đàn Nguyệt');
    setNewSkillLevelId(skillLevels[0]?.id ?? 0);
    setNewStatus('draft');
    setNewDescription('');
    setNewPassingThreshold(80);
    setNewOrderIndex(1);
    setNewExercises([]);
    setCurrentExerciseInput('');
    setEditingLesson(null);
    setShowAddForm(false);
  };

  const handleAddLesson = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tên bài giảng');
      return;
    }

    const instrument = instruments.find((item) => item.name === newInstrument);
    if (!instrument) {
      alert('Vui lòng chọn nhạc cụ hợp lệ từ dữ liệu hệ thống.');
      return;
    }
    const skillLevelId = newSkillLevelId || undefined;
    const targetStatus = newStatus === 'public' ? 'PENDING' : 'DRAFT';

    try {
      if (editingLesson) {
        await lessonsApi.update(Number(editingLesson.id), {
          title: newTitle.trim(),
          description: newDescription,
          skillLevelId,
          orderIndex: newOrderIndex,
          exercises: newExercises,
          passThreshold: newPassingThreshold,
        });
        if (editingLesson.backendStatus !== targetStatus
            && !(editingLesson.backendStatus === 'APPROVED' && targetStatus === 'PENDING')) {
          await lessonsApi.updateStatus(Number(editingLesson.id), targetStatus);
        }
        alert('Đã cập nhật bài giảng thành công!');
      } else {
        await lessonsApi.create({
          title: newTitle.trim(),
          description: newDescription,
          instrumentId: instrument.id,
          skillLevelId,
          status: targetStatus,
          orderIndex: newOrderIndex,
          exercises: newExercises,
          passThreshold: newPassingThreshold,
        });
        alert('Đã thêm bài giảng mới!');
      }
      await loadLessons();
      handleCloseModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể lưu bài giảng.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài giảng này không?')) {
      try {
        await lessonsApi.remove(Number(id));
        await loadLessons();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Không thể xóa bài giảng.');
      }
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

      {loadError && (
        <div className="mb-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button onClick={() => { void loadLessons(); void loadMasterData(); }} className="inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap hover:underline">
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </div>
      )}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Lesson List Table */}
        <div className="col-span-12 flex flex-col gap-gutter">
          <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
              <span className="text-headline-md font-bold text-primary">
                {isLoading ? 'Đang tải bài giảng...' : 'Danh sách lộ trình giáo trình'}
              </span>
              <span className="px-md py-xs bg-[#eae8e3] rounded-full text-label-sm font-label-sm">
                Tổng cộng: {lessons.length} bài học
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead>
                  <tr className="bg-[#f5f3ee]/50">
                    <th className="text-left whitespace-nowrap py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Thứ tự giáo trình
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Tên bài giảng
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Nhạc cụ
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Ngưỡng đạt (Scoring)
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Bài tập nhỏ
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Ngày cập nhật
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-md font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Trạng thái
                    </th>
                    <th className="text-right whitespace-nowrap py-md px-xl font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/10">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-xl py-14 text-center">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        <p className="text-on-surface-variant">Đang tải danh sách bài giảng...</p>
                      </td>
                    </tr>
                  ) : sortedLessons.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-xl py-16 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <BookOpen className="h-7 w-7" />
                          </div>
                          <h3 className="text-lg font-bold text-on-surface">Chưa có bài giảng nào</h3>
                          <p className="mt-1 text-sm text-on-surface-variant">Tạo bài giảng đầu tiên để bắt đầu xây dựng lộ trình giảng dạy.</p>
                          <button onClick={() => setShowAddForm(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-bold text-white hover:opacity-90">
                            <Plus className="h-4 w-4" /> Thêm bài giảng
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : sortedLessons.map((lesson) => (
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
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${getStatusMeta(lesson.status).className}`}>
                          <span className={`h-2 w-2 rounded-full ${getStatusMeta(lesson.status).dot}`} />
                          {getStatusMeta(lesson.status).label}
                        </span>
                      </td>
                      <td className="py-lg px-xl text-right">
                        <Link
                          to={`/instructor/lessons/${lesson.id}/content`}
                          className="mr-2 p-2 hover:bg-primary/10 text-primary transition-all rounded-lg border border-primary/20 inline-flex items-center justify-center bg-white"
                          title="Quản lý bài tập, quiz và minigame"
                        >
                          <ListChecks className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => void handleEditClick(lesson)}
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
                        disabled={editingLesson !== null}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer"
                      >
                        {instruments.map((instrument) => (
                          <option key={instrument.id} value={instrument.name}>
                            {instrument.name}
                          </option>
                        ))}
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
                        Trình độ
                      </label>
                      <select
                        value={newSkillLevelId}
                        onChange={(e) => setNewSkillLevelId(Number(e.target.value))}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer"
                      >
                        {skillLevels.map((level) => (
                          <option key={level.id} value={level.id}>{level.levelName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Trạng thái hiển thị
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as 'public' | 'draft')}
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
