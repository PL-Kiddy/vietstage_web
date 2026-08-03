import { useState, useCallback, type FormEvent } from 'react';
import {
  ListOrdered,
  Dumbbell,
  Plus,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Edit2,
  Check,
  X,
  Target,
  BookOpen,
  AlertCircle,
  Loader2,
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
}

const InstructorMedia = () => {
  const [activeTab, setActiveTab] = useState<Tab>('order');

  // ── Tab 1: Curriculum Order ────────────────────────────────────────────
  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonSaveError, setLessonSaveError] = useState<string | null>(null);

  // Create lesson form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createOrder, setCreateOrder] = useState<number>(1);
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

  // ── Handler: Start editing a lesson ──────────────────────────────────
  const startEditing = (lesson: Lesson) => {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || '',
      orderIndex: (lesson as any).orderIndex ?? (lesson as any).order_index ?? 0,
      skillLevelId: (lesson as any).skillLevel?.id ?? (lesson as any).skill_level_id,
    });
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
        instrumentId: 1, // default; user can edit after creation
        status: 'DRAFT',
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
    if (selectedInstrumentId === 'ALL') return true;
    const instId = (lesson as any).instrument?.id ?? (lesson as any).instrument_id;
    return Number(instId) === Number(selectedInstrumentId);
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
          { id: 'order', icon: ListOrdered, label: 'Sắp xếp Bài học' },
          { id: 'exercises', icon: Dumbbell, label: 'Bài tập & Điểm chuẩn' },
        ] as { id: Tab; icon: typeof ListOrdered; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-xs px-md py-sm text-sm font-bold rounded-lg transition-all ${
              activeTab === tab.id
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
          {/* Toolbar with Instrument Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md bg-white p-md rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-sm">
              <span className="text-xs font-bold text-[#1D4532] uppercase tracking-wider whitespace-nowrap">Lọc theo Nhạc cụ:</span>
              <select
                value={selectedInstrumentId}
                onChange={(e) => setSelectedInstrumentId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1D4532] focus:ring-1 focus:ring-[#1D4532] outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả nhạc cụ ({lessons.length} bài)</option>
                {instruments.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-md w-full sm:w-auto justify-between sm:justify-end">
              <p className="text-xs text-[#5e5e5b]">
                Đang hiển thị <strong>{sortedLessons.length}</strong> bài học
              </p>
              <button
                onClick={() => { setShowCreateForm(true); setCreateOrder(lessons.length + 1); }}
                className="bg-[#1D4532] text-white px-md py-sm rounded-lg text-sm font-bold flex items-center gap-xs hover:bg-[#1D4532]/90 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tạo bài học mới
              </button>
            </div>
          </div>

          {/* Create Lesson Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateLesson} className="bg-white border border-[#1D4532]/20 rounded-2xl p-lg shadow-sm space-y-md">
              <h4 className="text-sm font-bold text-[#1D4532] uppercase tracking-wider">Tạo bài học mới (POST /api/lessons)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tiêu đề bài học *</label>
                  <input
                    type="text"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Ví dụ: Bài 1 - Tư thế đặt tay..."
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Vị trí trong giáo trình (orderIndex)</label>
                  <input
                    type="number"
                    min={1}
                    value={createOrder}
                    onChange={(e) => setCreateOrder(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Mô tả bài học</label>
                <textarea
                  rows={2}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Mô tả ngắn nội dung bài học..."
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none resize-none"
                />
              </div>
              {createError && (
                <div className="flex items-center gap-xs bg-red-50 border border-red-200 rounded-xl p-md text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}
              <div className="flex gap-md">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-sm rounded-xl border border-[#E5E7EB] text-[#6B7280] text-sm font-bold hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-xs"
                >
                  <X className="w-4 h-4" /> Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createTitle.trim()}
                  className="flex-1 py-sm rounded-xl bg-[#1D4532] text-white text-sm font-bold hover:bg-[#1D4532]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-xs"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Tạo bài học
                </button>
              </div>
            </form>
          )}

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
                <span className="flex-1">Thông tin bài học &amp; Nhạc cụ</span>
                <span className="w-24 text-center">Trạng thái</span>
                <span className="w-24 text-right pr-4">Thao tác</span>
              </div>

              <div className="divide-y divide-[#F3F4F6]">
                {sortedLessons.map((lesson, idx) => {
                  const order = (lesson as any).orderIndex ?? (lesson as any).order_index ?? idx + 1;
                  const isEditing = editingLesson?.id === lesson.id;
                  const instName = (lesson as any).instrument?.name ?? (lesson as any).instrumentName ?? 'Chưa rõ nhạc cụ';

                  return (
                    <div key={lesson.id} className={`p-lg transition-all ${isEditing ? 'bg-[#EDF7F2]/60' : 'hover:bg-[#F9FAFB]'}`}>
                      {isEditing ? (
                        /* ── Inline Edit Form ── */
                        <div className="space-y-md">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                            <div className="sm:col-span-2 flex flex-col gap-xs">
                              <label className="text-xs font-semibold text-[#6B7280] uppercase">Tiêu đề (title)</label>
                              <input
                                type="text"
                                value={editingLesson.title}
                                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                className="bg-white border border-[#1D4532]/30 rounded-lg p-sm text-sm focus:ring-1 focus:ring-[#1D4532] outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-xs">
                              <label className="text-xs font-semibold text-[#6B7280] uppercase">Thứ tự (orderIndex)</label>
                              <input
                                type="number"
                                min={0}
                                value={editingLesson.orderIndex}
                                onChange={(e) => setEditingLesson({ ...editingLesson, orderIndex: parseInt(e.target.value) || 0 })}
                                className="bg-white border border-[#1D4532]/30 rounded-lg p-sm text-sm focus:ring-1 focus:ring-[#1D4532] outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-xs">
                            <label className="text-xs font-semibold text-[#6B7280] uppercase">Mô tả (description)</label>
                            <input
                              type="text"
                              value={editingLesson.description}
                              onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                              className="bg-white border border-[#1D4532]/30 rounded-lg p-sm text-sm focus:ring-1 focus:ring-[#1D4532] outline-none"
                              placeholder="Mô tả ngắn..."
                            />
                          </div>
                          <div className="flex flex-col gap-xs">
                            <label className="text-xs font-semibold text-[#6B7280] uppercase">Cấp độ kỹ năng (skillLevel)</label>
                            <select
                              value={editingLesson.skillLevelId ?? ''}
                              onChange={(e) => setEditingLesson({ ...editingLesson, skillLevelId: e.target.value ? Number(e.target.value) : undefined })}
                              className="bg-white border border-[#1D4532]/30 rounded-lg p-sm text-sm focus:ring-1 focus:ring-[#1D4532] outline-none"
                            >
                              <option value="">-- Chọn cấp độ --</option>
                              {(skillLevels as SkillLevel[]).map((sl: SkillLevel) => (
                                <option key={sl.id} value={sl.id}>{sl.levelName}</option>
                              ))}
                            </select>
                          </div>
                          {lessonSaveError && (
                            <p className="text-xs text-red-600 flex items-center gap-xs">
                              <AlertCircle className="w-3.5 h-3.5" /> {lessonSaveError}
                            </p>
                          )}
                          <div className="flex gap-md">
                            <button
                              type="button"
                              onClick={() => setEditingLesson(null)}
                              className="px-md py-xs rounded-lg border border-[#E5E7EB] text-xs font-bold text-[#6B7280] hover:bg-[#F9FAFB] transition-all flex items-center gap-xs"
                            >
                              <X className="w-3.5 h-3.5" /> Hủy
                            </button>
                            <button
                              type="button"
                              onClick={saveLesson}
                              disabled={isSavingLesson}
                              className="px-md py-xs rounded-lg bg-[#1D4532] text-white text-xs font-bold hover:bg-[#1D4532]/90 transition-all disabled:opacity-50 flex items-center gap-xs"
                            >
                              {isSavingLesson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Lưu
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Read Mode ── */
                        <div className="flex items-center gap-md">
                          <GripVertical className="w-4 h-4 text-[#D1D5DB] flex-shrink-0 cursor-grab" />
                          
                          {/* Order Badge with Explicit Label */}
                          <div className="w-12 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="w-8 h-8 rounded-xl bg-[#1D4532] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                              {order}
                            </span>
                          </div>

                          {/* Lesson Info & Instrument Tag */}
                          <div className="flex-1 min-w-0 pr-md">
                            <div className="flex items-center gap-xs mb-0.5">
                              <p className="font-bold text-[#111827] text-sm truncate">{lesson.title}</p>
                              <span className="text-[10px] font-semibold text-[#1D4532] bg-[#EDF7F2] border border-[#D1FAE5] px-2 py-0.5 rounded-md flex-shrink-0">
                                🎵 {instName}
                              </span>
                            </div>
                            {lesson.description ? (
                              <p className="text-xs text-[#6B7280] truncate">{lesson.description}</p>
                            ) : (
                              <p className="text-xs text-[#9CA3AF] italic">Chưa có mô tả</p>
                            )}
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
                          {/* Up/Down buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              title="Lên trên"
                              onClick={() => moveLesson(lesson, 'up')}
                              className="p-0.5 text-[#9CA3AF] hover:text-[#1D4532] transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              title="Xuống dưới"
                              onClick={() => moveLesson(lesson, 'down')}
                              className="p-0.5 text-[#9CA3AF] hover:text-[#1D4532] transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Edit button */}
                          <button
                            onClick={() => startEditing(lesson)}
                            className="p-sm hover:bg-[#EDF7F2] rounded-lg text-[#1D4532] transition-colors"
                            title="Sửa tiêu đề / thứ tự"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
    </div>
  );
};

export default InstructorMedia;
