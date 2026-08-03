import { useState, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Plus,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  Target,
  BookOpen,
  AlertCircle,
  Loader2,
  Search,
  MoreVertical,
  ArrowUpDown,
  Award,
} from 'lucide-react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { lessonsApi, exercisesApi, masterDataApi, type ExerciseInput } from '../../api/services';
import type { Lesson, SkillLevel } from '../../api/types';

// ─── Tab definitions ──────────────────────────────────────────────────────────
type Tab = 'order' | 'exercises';

// ─── Lesson edit state ────────────────────────────────────────────────────────
interface EditingLesson {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  skillLevelId?: number;
  instrumentId?: number;
  status?: string;
}

const InstructorMedia = () => {
  const [activeTab, setActiveTab] = useState<Tab>('order');

  // ── Tab 1: Curriculum Order ────────────────────────────────────────────
  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonSaveError, setLessonSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Create lesson form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createOrder, setCreateOrder] = useState<number>(1);
  const [createInstrumentId, setCreateInstrumentId] = useState<number>(1);
  const [createSkillLevelId, setCreateSkillLevelId] = useState<number | undefined>(undefined);
  const [createStatus, setCreateStatus] = useState<string>('DRAFT');
  const [createPassingThreshold, setCreatePassingThreshold] = useState<number>(80);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Tab 2: Exercise Management ─────────────────────────────────────────
  const [selectedLessonId, setSelectedLessonId] = useState<number | ''>('');
  const [exTitle, setExTitle] = useState('');
  const [exDesc, setExDesc] = useState('');
  const [exPassThreshold, setExPassThreshold] = useState<number>(100);
  const [exOrderIndex, setExOrderIndex] = useState<number>(1);
  const [isSavingEx, setIsSavingEx] = useState(false);
  const [exError, setExError] = useState<string | null>(null);
  const [exSuccess, setExSuccess] = useState<string | null>(null);

  // ── Fetch lessons ─────────────────────────────────────────────────────
  const fetchLessons = useCallback((signal?: AbortSignal) =>
    lessonsApi.list(new URLSearchParams({ size: '100', sort: 'orderIndex,asc' }), { signal })
    , []);

  const { data: lessonsResponse, loading: lessonsLoading, execute: refetchLessons } = useAxiosRequest(
    fetchLessons, { auto: true }
  );

  const lessons: Lesson[] = (lessonsResponse as any)?.content ?? (Array.isArray(lessonsResponse) ? lessonsResponse as Lesson[] : []);

  // ── Fetch instruments & skill levels ─────────────────────────────────
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | 'ALL'>('ALL');

  const { data: instruments = [] } = useAxiosRequest<any[]>(
    (signal) => masterDataApi.instruments({ signal }),
    { auto: true, initialData: [] }
  );

  const { data: skillLevels = [] } = useAxiosRequest<SkillLevel[]>(
    (signal) => masterDataApi.skillLevels({ signal }),
    { auto: true, initialData: [] }
  );

  // ── Drawer Modal control ─────────────────────────────────────────────
  const isDrawerOpen = showCreateForm || editingLesson !== null;

  const handleOpenCreateModal = () => {
    setEditingLesson(null);
    setCreateTitle('');
    setCreateDesc('');
    setCreateOrder(lessons.length > 0 ? Math.max(...lessons.map(l => (l as any).orderIndex ?? (l as any).order_index ?? 0)) + 1 : 1);
    setCreateInstrumentId(selectedInstrumentId !== 'ALL' ? Number(selectedInstrumentId) : (instruments[0]?.id ?? 1));
    setCreateSkillLevelId(skillLevels[0]?.id);
    setCreateStatus('DRAFT');
    setCreatePassingThreshold(80);
    setCreateError(null);
    setShowCreateForm(true);
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingLesson(null);
    setCreateError(null);
    setLessonSaveError(null);
  };

  // ── Handler: Start editing a lesson ──────────────────────────────────
  const startEditing = (lesson: Lesson) => {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || '',
      orderIndex: (lesson as any).orderIndex ?? (lesson as any).order_index ?? 0,
      skillLevelId: (lesson as any).skillLevel?.id ?? (lesson as any).skill_level_id,
      instrumentId: (lesson as any).instrument?.id ?? (lesson as any).instrument_id ?? 1,
      status: lesson.status || 'DRAFT',
    });
    setShowCreateForm(false);
    setLessonSaveError(null);
  };

  // ── Handler: Save lesson order/details ───────────────────────────────
  const saveLesson = async () => {
    if (!editingLesson) return;
    setIsSavingLesson(true);
    setLessonSaveError(null);
    try {
      await lessonsApi.update(editingLesson.id, {
        title: editingLesson.title,
        description: editingLesson.description,
        orderIndex: editingLesson.orderIndex,
        skillLevelId: editingLesson.skillLevelId,
      });
      await refetchLessons();
      setEditingLesson(null);
    } catch (err) {
      setLessonSaveError(err instanceof Error ? err.message : 'Không thể cập nhật bài học.');
    } finally {
      setIsSavingLesson(false);
    }
  };

  // ── Handler: Quick order change (move up/down) ────────────────────────
  const moveLesson = async (lesson: Lesson, direction: 'up' | 'down') => {
    const currentOrder = (lesson as any).orderIndex ?? (lesson as any).order_index ?? 0;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    try {
      await lessonsApi.update(lesson.id, {
        title: lesson.title,
        description: lesson.description || '',
        orderIndex: newOrder,
      });
      await refetchLessons();
    } catch (err) {
      // Silent fail for quick reorder
    }
  };

  // ── Handler: Create new lesson ────────────────────────────────────────
  const handleCreateLesson = async (e: FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await lessonsApi.create({
        title: createTitle.trim(),
        description: createDesc.trim(),
        orderIndex: createOrder,
        instrumentId: createInstrumentId,
        skillLevelId: createSkillLevelId,
        status: (createStatus as 'DRAFT' | 'PENDING') || 'DRAFT',
      });
      await refetchLessons();
      setShowCreateForm(false);
      setCreateTitle('');
      setCreateDesc('');
      setCreateOrder(lessons.length + 1);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Không thể tạo bài học.');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Handler: Create exercise ──────────────────────────────────────────
  const handleCreateExercise = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId || !exTitle.trim()) return;
    setIsSavingEx(true);
    setExError(null);
    setExSuccess(null);
    const body: ExerciseInput = {
      title: exTitle.trim(),
      description: exDesc.trim() || undefined,
      passThreshold: exPassThreshold,
      orderIndex: exOrderIndex,
    };
    try {
      await exercisesApi.create(Number(selectedLessonId), body);
      setExSuccess(`Đã thêm bài tập "${exTitle}" thành công!`);
      setExTitle('');
      setExDesc('');
      setExPassThreshold(100);
      setExOrderIndex(exOrderIndex + 1);
    } catch (err) {
      setExError(err instanceof Error ? err.message : 'Không thể thêm bài tập.');
    } finally {
      setIsSavingEx(false);
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    // 1. Instrument filter
    if (selectedInstrumentId !== 'ALL') {
      const instId = (lesson as any).instrument?.id ?? (lesson as any).instrument_id;
      if (Number(instId) !== Number(selectedInstrumentId)) return false;
    }
    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = lesson.title.toLowerCase().includes(q);
      const descMatch = (lesson.description || '').toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  });

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const oa = (a as any).orderIndex ?? (a as any).order_index ?? 9999;
    const ob = (b as any).orderIndex ?? (b as any).order_index ?? 9999;
    return oa - ob;
  });

  return (
    <div className="space-y-lg">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-[#1D4532]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Cấu trúc Giáo trình
          </h2>
          <p className="text-on-surface-variant mt-1">
            Sắp xếp thứ tự bài học trong khóa học và cấu hình bài tập cho từng bài.
          </p>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────── */}
      <div className="flex gap-xs bg-[#F3F4F6] p-1 rounded-xl w-fit">
        {([
          { id: 'order', icon: ArrowUpDown, label: 'Sắp xếp Bài học' },
          { id: 'exercises', icon: Award, label: 'Bài tập & Điểm chuẩn' },
        ] as { id: Tab; icon: typeof ArrowUpDown; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-xs px-md py-sm text-sm font-bold rounded-lg transition-all ${activeTab === tab.id
                ? 'bg-white text-[#1D4532] shadow-sm'
                : 'text-[#6B7280] hover:text-[#374151]'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CURRICULUM ORDER                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'order' && (
        <div className="space-y-md">
          {/* Toolbar with Search Bar & Instrument Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md bg-white p-md rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex flex-wrap items-center gap-md w-full sm:w-auto">
              {/* Search Bar */}
              <div className="flex items-center gap-xs px-md py-sm bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl w-full sm:w-64 focus-within:ring-1 focus-within:ring-[#1D4532] focus-within:border-[#1D4532]">
                <Search className="w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Tìm tiêu đề bài học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-[#111827] w-full placeholder:text-[#9CA3AF]"
                />
              </div>

              {/* Instrument Filter */}
              <div className="flex items-center gap-xs">
                <span className="text-xs font-bold text-[#1D4532] uppercase tracking-wider whitespace-nowrap">Nhạc cụ:</span>
                <select
                  value={selectedInstrumentId}
                  onChange={(e) => setSelectedInstrumentId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1D4532] focus:ring-1 focus:ring-[#1D4532] outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả nhạc cụ</option>
                  {instruments.map((inst: any) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-md w-full sm:w-auto justify-end">
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#1D4532] text-white px-md py-sm rounded-lg text-sm font-bold flex items-center gap-xs hover:bg-[#1D4532]/90 transition-all shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Tạo bài mới
              </button>
            </div>
          </div>

          {/* Lesson List Table with Header Bar */}
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-xl text-[#1D4532]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách bài học...
            </div>
          ) : sortedLessons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EB] p-2xl text-center">
              <BookOpen className="w-12 h-12 text-[#D1D5DB] mx-auto mb-md" />
              <p className="text-[#9CA3AF] font-medium">Chưa có bài học nào cho nhạc cụ này.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
              {/* Header explanation bar */}
              <div className="bg-[#EDF7F2] px-lg py-xs border-b border-[#D1FAE5] flex items-center gap-md text-[11px] font-bold text-[#1D4532] uppercase tracking-wider">
                <span className="w-16 text-center">Vị trí bài</span>
                <span className="flex-1">Thông tin bài học</span>
                <span className="w-28">Nhạc cụ</span>
                <span className="w-28 text-center">Ngày tạo</span>
                <span className="w-24 text-center">Trạng thái</span>
                <span className="w-20 text-right pr-2">Thao tác</span>
              </div>

              <div className="divide-y divide-[#F3F4F6]">
                {sortedLessons.map((lesson, idx) => {
                  const order = (lesson as any).orderIndex ?? (lesson as any).order_index ?? idx + 1;
                  const instName = (lesson as any).instrument?.name ?? (lesson as any).instrumentName ?? 'Chưa rõ';
                  const rawDate = (lesson as any).createdAt ?? (lesson as any).created_at;
                  const formattedDate = rawDate
                    ? new Date(rawDate).toLocaleDateString('vi-VN')
                    : '---';

                  return (
                    <div key={lesson.id} className="p-lg transition-all hover:bg-[#F9FAFB]">
                      {/* ── Read Mode ── */}
                      <div className="flex items-center gap-md">

                        {/* Order Badge */}
                        <div className="w-12 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="w-8 h-8 rounded-xl bg-[#1D4532] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                            {order}
                          </span>
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0 pr-md">
                          <p className="font-bold text-[#111827] text-sm truncate">{lesson.title}</p>
                          {lesson.description ? (
                            <p className="text-xs text-[#6B7280] truncate mt-0.5">{lesson.description}</p>
                          ) : (
                            <p className="text-xs text-[#9CA3AF] italic mt-0.5">Chưa có mô tả</p>
                          )}
                        </div>

                        {/* Instrument Column */}
                        <div className="w-28 flex-shrink-0">
                          <span className="text-[11px] font-semibold text-[#1D4532] bg-[#EDF7F2] border border-[#D1FAE5] px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            🎵 {instName}
                          </span>
                        </div>

                        {/* Date Created Column */}
                        <div className="w-28 text-center text-xs font-medium text-[#6B7280] flex-shrink-0">
                          {formattedDate}
                        </div>

                        {/* Status Badge */}
                        <div className="w-24 text-center flex-shrink-0">
                          {(() => {
                            const statusMap: Record<string, { label: string; cls: string }> = {
                              APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                              PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
                              REJECTED: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-800 border-red-200' },
                              DRAFT: { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
                            };
                            const meta = statusMap[lesson.status] ?? { label: lesson.status, cls: 'bg-gray-100 text-gray-600' };
                            return (
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.cls}`}>
                                {meta.label}
                              </span>
                            );
                          })()}
                        </div>
                        {/* Thao tác Menu (3 dấu chấm) */}
                        <div className="w-20 text-right relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenActionMenuId(openActionMenuId === lesson.id ? null : lesson.id)}
                            className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                            title="Thao tác"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openActionMenuId === lesson.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenuId(null)} />
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left">
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    startEditing(lesson);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-[#1D4532]" />
                                  Chỉnh sửa bài học
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    moveLesson(lesson, 'up');
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4 text-[#1D4532]" />
                                  Đẩy vị trí lên trên
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    moveLesson(lesson, 'down');
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4 text-[#1D4532]" />
                                  Đẩy vị trí xuống dưới
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: EXERCISE MANAGEMENT                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'exercises' && (
        <div className="space-y-lg">
          {/* Lesson selector */}
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-lg">
            <label className="block text-xs font-bold text-[#1D4532] uppercase tracking-wider mb-sm">
              Chọn bài học để thêm bài tập
            </label>
            <select
              value={selectedLessonId}
              onChange={(e) => {
                setSelectedLessonId(e.target.value ? Number(e.target.value) : '');
                setExSuccess(null);
                setExError(null);
                setExOrderIndex(1);
              }}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none"
            >
              <option value="">-- Chọn bài học --</option>
              {sortedLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  [{(lesson as any).orderIndex ?? lesson.id}] {lesson.title}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise form */}
          {selectedLessonId ? (
            <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
              <div className="bg-[#EDF7F2] px-lg py-md border-b border-[#D1FAE5]">
                <div className="flex items-center gap-sm">
                  <Target className="w-5 h-5 text-[#1D4532]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1D4532]">
                      Thêm bài tập — POST /api/lessons/{selectedLessonId}/exercises
                    </h3>
                    <p className="text-xs text-[#5e5e5b] mt-0.5">
                      Định nghĩa bài tập & cài đặt điểm chuẩn (passThreshold) cho bài học đã chọn
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateExercise} className="p-lg space-y-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Tên bài tập (title) *
                    </label>
                    <input
                      type="text"
                      required
                      value={exTitle}
                      onChange={(e) => setExTitle(e.target.value)}
                      placeholder="Ví dụ: Luyện tập âm cơ bản..."
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Thứ tự bài tập (orderIndex)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={exOrderIndex}
                      onChange={(e) => setExOrderIndex(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Mô tả bài tập (description)
                  </label>
                  <textarea
                    rows={2}
                    value={exDesc}
                    onChange={(e) => setExDesc(e.target.value)}
                    placeholder="Hướng dẫn ngắn gọn nội dung bài tập..."
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex justify-between items-center">
                    <span>Điểm chuẩn vượt qua (passThreshold)</span>
                    <span className="text-[#1D4532] font-bold text-sm normal-case">{exPassThreshold} điểm</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={exPassThreshold}
                    onChange={(e) => setExPassThreshold(parseInt(e.target.value))}
                    className="accent-[#1D4532] w-full"
                  />
                  <div className="flex justify-between text-xs text-[#9CA3AF]">
                    <span>0 (Không cần đạt)</span>
                    <span>100 (Phải hoàn hảo)</span>
                  </div>
                  <p className="text-xs text-[#5e5e5b]">
                    Học viên phải đạt tối thiểu <strong>{exPassThreshold} điểm</strong> để vượt qua bài tập này.
                  </p>
                </div>

                {/* Feedback messages */}
                {exError && (
                  <div className="flex items-center gap-xs bg-red-50 border border-red-200 rounded-xl p-md text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {exError}
                  </div>
                )}
                {exSuccess && (
                  <div className="flex items-center gap-xs bg-emerald-50 border border-emerald-200 rounded-xl p-md text-emerald-700 text-xs">
                    <Check className="w-4 h-4 flex-shrink-0" /> {exSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingEx || !exTitle.trim()}
                  className="w-full py-md rounded-xl bg-[#1D4532] text-white text-sm font-bold hover:bg-[#1D4532]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-xs shadow-sm"
                >
                  {isSavingEx ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Thêm bài tập
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EB] p-2xl text-center">
              <Dumbbell className="w-12 h-12 text-[#D1D5DB] mx-auto mb-md" />
              <p className="text-[#9CA3AF] font-medium">Chọn một bài học ở trên để bắt đầu thêm bài tập</p>
            </div>
          )}
        </div>
      )}

      {/* Drawer Form Overlay - Slide from right */}
      {createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop Blur Overlay */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                style={{ zIndex: 9998 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
              />

              {/* Slide-in Drawer */}
              <motion.div
                className="fixed top-0 right-0 h-full w-[100%] sm:w-[75%] md:w-[65%] lg:w-[50%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl overflow-hidden flex flex-col"
                style={{ zIndex: 9999 }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                {/* Drawer Header */}
                <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#EDF7F2]">
                  <div>
                    <h4 className="text-headline-md font-bold text-[#1D4532] font-sans">
                      {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                    </h4>
                    <p className="text-label-sm text-on-surface-variant text-[13px] mt-xs">
                      {editingLesson ? 'Cập nhật tiêu đề, nhạc cụ và cấu hình cho bài học.' : 'Tạo bài học mới và xếp vị trí lộ trình trong giáo trình.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="p-md hover:bg-[#1D4532]/10 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Drawer Body Form */}
                <form
                  onSubmit={editingLesson ? (e) => { e.preventDefault(); void saveLesson(); } : handleCreateLesson}
                  className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar flex flex-col justify-between"
                >
                  <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                    {/* Grid 1: Title & Instrument */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Tên bài học *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingLesson ? editingLesson.title : createTitle}
                          onChange={(e) => editingLesson ? setEditingLesson({ ...editingLesson, title: e.target.value }) : setCreateTitle(e.target.value)}
                          placeholder="Nhập tên bài học..."
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Nhạc cụ giảng dạy
                        </label>
                        <select
                          value={editingLesson ? (editingLesson.instrumentId ?? 1) : createInstrumentId}
                          onChange={(e) => editingLesson ? setEditingLesson({ ...editingLesson, instrumentId: Number(e.target.value) }) : setCreateInstrumentId(Number(e.target.value))}
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer text-sm"
                        >
                          {instruments.map((inst: any) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Grid 2: Order Index & Skill Level */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Thứ tự trong giáo trình
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editingLesson ? editingLesson.orderIndex : createOrder}
                          onChange={(e) => editingLesson ? setEditingLesson({ ...editingLesson, orderIndex: Math.max(1, parseInt(e.target.value) || 1) }) : setCreateOrder(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Trình độ
                        </label>
                        <select
                          value={editingLesson ? (editingLesson.skillLevelId ?? '') : (createSkillLevelId ?? '')}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            if (editingLesson) setEditingLesson({ ...editingLesson, skillLevelId: val });
                            else setCreateSkillLevelId(val);
                          }}
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer text-sm"
                        >
                          <option value="">-- Chọn trình độ --</option>
                          {(skillLevels as SkillLevel[]).map((level: SkillLevel) => (
                            <option key={level.id} value={level.id}>{level.levelName}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status Selection */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Trạng thái hiển thị
                      </label>
                      <select
                        value={editingLesson ? (editingLesson.status ?? 'DRAFT') : createStatus}
                        onChange={(e) => editingLesson ? setEditingLesson({ ...editingLesson, status: e.target.value }) : setCreateStatus(e.target.value)}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface cursor-pointer text-sm"
                      >
                        <option value="DRAFT">Bản nháp (Draft)</option>
                        <option value="APPROVED">Công khai (Approved)</option>
                        <option value="PENDING">Chờ duyệt (Pending)</option>
                      </select>
                    </div>

                    {/* Score Range Slider */}
                    <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
                      <div className="flex justify-between items-center">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Điểm AI tối thiểu để đạt
                        </label>
                        <span className="bg-[#ffe088]/30 text-[#574500] px-sm py-xs rounded font-bold text-xs">
                          {createPassingThreshold}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={createPassingThreshold}
                        onChange={(e) => setCreatePassingThreshold(Number(e.target.value))}
                        className="w-full h-2 bg-[#eae8e3] rounded-lg appearance-none cursor-pointer accent-[#1D4532] mt-2"
                      />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Mô tả kỹ thuật biểu diễn
                      </label>
                      <textarea
                        rows={3}
                        value={editingLesson ? editingLesson.description : createDesc}
                        onChange={(e) => editingLesson ? setEditingLesson({ ...editingLesson, description: e.target.value }) : setCreateDesc(e.target.value)}
                        placeholder="Mô tả kỹ thuật rung dây, nhấn vuốt, gảy ngón..."
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface text-sm resize-none"
                      />
                    </div>

                    {/* Errors */}
                    {(createError || lessonSaveError) && (
                      <div className="flex items-center gap-xs bg-red-50 border border-red-200 rounded-xl p-md text-red-700 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {createError || lessonSaveError}
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer Buttons */}
                  <div className="flex items-center justify-end gap-md pt-lg border-t border-outline-variant/10">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-xl py-md rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-black/5 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || isSavingLesson || (editingLesson ? !editingLesson.title.trim() : !createTitle.trim())}
                      className="px-xl py-md rounded-xl bg-[#1D4532] text-white text-sm font-bold hover:bg-[#1D4532]/90 transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
                    >
                      {(isCreating || isSavingLesson) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {editingLesson ? 'Lưu thay đổi' : 'Tạo bài học'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default InstructorMedia;
