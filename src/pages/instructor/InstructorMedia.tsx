import { useState, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Target,
  BookOpen,
  AlertCircle,
  Loader2,
  Search,
  MoreVertical,
  ListChecks,
} from 'lucide-react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { lessonsApi, exercisesApi, masterDataApi, type ExerciseInput } from '../../api/services';
import type { Lesson } from '../../api/types';



const getInstrumentTranslation = (instName: string) => {
  if (!instName) return '';
  const nameLower = instName.toLowerCase();
  if (nameLower.includes('tranh')) return 'Đàn Tranh';
  if (nameLower.includes('bau')) return 'Đàn Bầu';
  if (nameLower.includes('sao')) return 'Sáo Trúc';
  if (nameLower.includes('nguyet')) return 'Đàn Nguyệt';
  if (nameLower.includes('trong')) return 'Trống';
  return instName;
};

const InstructorMedia = () => {
  // ── Curriculum List State ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // ── Exercise & Pass Threshold Modal State ─────────────────────────────
  const [configuringLesson, setConfiguringLesson] = useState<Lesson | null>(null);
  const [exTitle, setExTitle] = useState('');
  const [exDesc, setExDesc] = useState('');
  const [exPassThreshold, setExPassThreshold] = useState<number>(80);
  const [exOrderIndex, setExOrderIndex] = useState<number>(1);
  const [isSavingEx, setIsSavingEx] = useState(false);
  const [exError, setExError] = useState<string | null>(null);
  const [exSuccess, setExSuccess] = useState<string | null>(null);

  // ── Fetch lessons ─────────────────────────────────────────────────────
  const fetchLessons = useCallback((signal?: AbortSignal) =>
    lessonsApi.list(new URLSearchParams({ size: '100', sort: 'orderIndex,asc' }), { signal })
    , []);

  const { data: lessonsResponse, loading: lessonsLoading } = useAxiosRequest(
    fetchLessons, { auto: true }
  );

  const lessons: Lesson[] = (lessonsResponse as any)?.content ?? (Array.isArray(lessonsResponse) ? lessonsResponse as Lesson[] : []);

  // ── Fetch instruments & skill levels ─────────────────────────────────
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const { data: instruments = [] } = useAxiosRequest<any[]>(
    (signal) => masterDataApi.instruments({ signal }),
    { auto: true, initialData: [] }
  );


  // ── Handler: Open Config Modal ───────────────────────────────────────
  const handleOpenConfigModal = (lesson: Lesson) => {
    setConfiguringLesson(lesson);
    setExTitle('');
    setExDesc('');
    setExPassThreshold(80);
    setExOrderIndex(1);
    setExError(null);
    setExSuccess(null);
    setOpenActionMenuId(null);
  };

  // ── Handler: Create exercise ──────────────────────────────────────────
  const handleCreateExercise = async (e: FormEvent) => {
    e.preventDefault();
    if (!configuringLesson || !exTitle.trim()) return;
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
      await exercisesApi.create(configuringLesson.id, body);
      setExSuccess(`Đã cấu hình bài tập "${exTitle}" (Ngưỡng điểm: ${exPassThreshold}) thành công!`);
      setExTitle('');
      setExDesc('');
      setExOrderIndex((prev) => prev + 1);
    } catch (err) {
      setExError(err instanceof Error ? err.message : 'Không thể lưu cấu hình bài tập.');
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
    // 2. Status filter
    if (selectedStatus !== 'ALL') {
      if (lesson.status !== selectedStatus) return false;
    }
    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = lesson.title.toLowerCase().includes(q);
      const descMatch = (lesson.description || '').toLowerCase().includes(q);
      
      const instName = (lesson as any).instrument?.name ?? (lesson as any).instrumentName ?? '';
      const instTranslated = getInstrumentTranslation(instName).toLowerCase();
      const instMatch = instTranslated.includes(q);
      
      const rawDate = (lesson as any).updatedAt ?? (lesson as any).updated_at ?? (lesson as any).createdAt ?? (lesson as any).created_at;
      const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN').toLowerCase() : '';
      const dateMatch = formattedDate.includes(q);
      
      if (!titleMatch && !descMatch && !instMatch && !dateMatch) return false;
    }
    return true;
  });

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const orderA = (a as any).orderIndex ?? (a as any).order_index ?? 0;
    const orderB = (b as any).orderIndex ?? (b as any).order_index ?? 0;
    return orderA - orderB;
  });

  const totalPages = Math.ceil(sortedLessons.length / perPage);
  const paginatedLessons = sortedLessons.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="space-y-lg">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-[#1D4532]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Cấu hình Giáo trình
          </h2>
          <p className="text-on-surface-variant mt-1">
            Quản lý lộ trình học tập, cấu hình ngưỡng điểm đạt và biên soạn bài tập/quiz thực hành.
          </p>
        </div>
      </div>

      <div className="space-y-md">
          {/* Toolbar with Search Bar, Instrument Filter, Status Filter & Add Button */}
          <div className="flex flex-col md:flex-row md:items-center gap-sm w-full">
            {/* Search Bar */}
            <div className="flex items-center gap-xs px-md h-[42px] bg-white border border-[#d1e4fb] rounded-lg flex-grow shadow-sm focus-within:ring-1 focus-within:ring-[#1D4532] transition-all">
              <Search className="w-5 h-5 text-[#5e5e5b] flex-shrink-0" />
              <input
                type="text"
                placeholder="Tìm theo tên bài giảng, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-body-md w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50 py-1 leading-normal text-xs"
              />
            </div>

            {/* Instrument Filter */}
            <div className="flex items-center justify-between gap-xs px-md h-[42px] bg-white border border-[#d1e4fb] rounded-lg shadow-sm shrink-0 w-[260px]">
              <span className="font-label-md text-[#5e5e5b] text-xs font-medium whitespace-nowrap">Nhạc cụ:</span>
              <select
                value={selectedInstrumentId}
                onChange={(e) => setSelectedInstrumentId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none text-xs pr-6 py-1 leading-normal w-[160px]"
              >
                <option value="ALL">Tất cả nhạc cụ</option>
                {instruments.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>
                    {getInstrumentTranslation(inst.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center justify-between gap-xs px-md h-[42px] bg-white border border-[#d1e4fb] rounded-lg shadow-sm shrink-0 w-[225px]">
              <span className="font-label-md text-[#5e5e5b] text-xs font-medium whitespace-nowrap">Trạng thái:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none text-xs pr-6 py-1 leading-normal w-[130px]"
              >
                <option value="ALL">Tất cả</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="DRAFT">Bản nháp</option>
              </select>
            </div>
          </div>

          {/* Lesson List Table */}
          {lessonsLoading ? (
            <div className="flex items-center justify-center py-xl text-[#1D4532]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách bài học...
            </div>
          ) : sortedLessons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EB] p-2xl text-center">
              <BookOpen className="w-12 h-12 text-[#D1D5DB] mx-auto mb-md" />
              <p className="text-[#9CA3AF] font-medium">Chưa có bài học nào khớp với bộ lọc.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EDF7F2]/60 border-b border-outline-variant/10 text-[#1D4532]">
                    <th className="py-md px-md text-center font-bold text-xs w-20">Vị trí bài</th>
                    <th className="py-md px-md font-bold text-xs">Tên bài giảng & Mô tả</th>
                    <th className="py-md px-md text-center font-bold text-xs w-32">Nhạc cụ</th>
                    <th className="py-md px-md text-center font-bold text-xs w-32">Ngày cập nhật</th>
                    <th className="py-md px-md text-center font-bold text-xs w-32">Trạng thái</th>
                    <th className="py-md px-md text-right font-bold text-xs w-24 pr-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedLessons.map((lesson, idx) => {
                    const order = (lesson as any).orderIndex ?? (lesson as any).order_index ?? idx + 1;
                    const instName = (lesson as any).instrument?.name ?? (lesson as any).instrumentName ?? 'Chưa rõ';
                    const rawDate = (lesson as any).updatedAt ?? (lesson as any).updated_at ?? (lesson as any).createdAt ?? (lesson as any).created_at;
                    const formattedDate = rawDate
                      ? new Date(rawDate).toLocaleDateString('vi-VN')
                      : '---';

                    return (
                      <tr key={lesson.id} className="hover:bg-[#fbf9f4] transition-colors">
                        {/* Order Position */}
                        <td className="py-md px-md text-center font-bold text-[#1D4532] text-sm">
                          {order}
                        </td>

                        {/* Lesson Title & Desc */}
                        <td className="py-md px-md">
                          <p className="font-bold text-[#1D4532] text-sm">{lesson.title}</p>
                          {lesson.description ? (
                            <p className="text-xs text-on-surface-variant mt-0.5 italic">{lesson.description}</p>
                          ) : (
                            <p className="text-xs text-[#9CA3AF] italic mt-0.5">Chưa có mô tả</p>
                          )}
                        </td>

                        {/* Instrument Badge */}
                        <td className="py-md px-md text-center">
                          <span className="bg-[#ffe088]/25 text-[#574500] border border-[#ffe088]/40 font-bold text-xs px-md py-xs rounded-full inline-block">
                            {getInstrumentTranslation(instName)}
                          </span>
                        </td>

                        {/* Date Created Column */}
                        <td className="py-md px-md text-center text-xs font-medium text-on-surface-variant">
                          {formattedDate}
                        </td>

                        {/* Status Badge */}
                        <td className="py-md px-md text-center">
                          {(() => {
                            const statusMap: Record<string, { label: string; cls: string }> = {
                              APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                              PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                              REJECTED: { label: 'Bị từ chối', cls: 'bg-red-50 text-red-700 border-red-200' },
                              DRAFT: { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
                            };
                            const meta = statusMap[lesson.status] ?? { label: lesson.status, cls: 'bg-gray-100 text-gray-600' };
                            return (
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap ${meta.cls}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {meta.label}
                              </span>
                            );
                          })()}
                        </td>
                        {/* Thao tác Menu (3 dấu chấm) */}
                        <td className="py-md px-md text-right relative pr-6" onClick={(e) => e.stopPropagation()}>
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
                              <div className="absolute right-6 mt-1 w-64 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left">
                                <button
                                  onClick={() => handleOpenConfigModal(lesson)}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] font-medium text-[#1D4532] transition-colors"
                                >
                                  <Target className="w-4 h-4 text-[#1D4532]" />
                                  Cấu hình Bài tập & Điểm chuẩn
                                </button>
                                <Link
                                  to={`/instructor/lessons/${lesson.id}/content`}
                                  onClick={() => setOpenActionMenuId(null)}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <ListChecks className="w-4 h-4 text-[#1D4532]" />
                                  Biên soạn Chi tiết Quiz & Minigame
                                </Link>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {sortedLessons.length > 0 && (
            <div className="mt-lg flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b] pt-4">
              <div className="flex items-center gap-lg">
                <p>
                  Hiển thị {(currentPage - 1) * perPage + 1} -{' '}
                  {Math.min(currentPage * perPage, sortedLessons.length)} trong tổng số{' '}
                  {sortedLessons.length} bài giảng
                </p>

                <div className="flex items-center gap-xs">
                  <span>Số dòng mỗi trang:</span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-outline rounded px-2 py-1 text-label-md cursor-pointer outline-none font-semibold text-[#1D4532]"
                  >
                    <option value={5}>5 dòng</option>
                    <option value={10}>10 dòng</option>
                    <option value={20}>20 dòng</option>
                    <option value={50}>50 dòng</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-xs">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 border border-outline rounded hover:bg-[#EDF7F2] transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1 rounded font-bold transition-colors ${
                      p === currentPage
                        ? 'bg-[#1D4532] text-white'
                        : 'border border-outline hover:bg-[#EDF7F2]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 border border-outline rounded hover:bg-[#EDF7F2] transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* ── Modal Cấu hình Bài tập & Điểm chuẩn ────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {configuringLesson && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfiguringLesson(null)}
              />

              {/* Drawer Modal */}
              <motion.div
                className="fixed top-0 right-0 h-full w-[100%] sm:w-[75%] md:w-[60%] lg:w-[45%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl overflow-hidden flex flex-col z-[9999]"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                {/* Header */}
                <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#EDF7F2]">
                  <div>
                    <h4 className="text-headline-sm font-bold text-[#1D4532]">
                      Cấu hình Bài tập & Ngưỡng điểm
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                      Bài học: <span className="text-[#1D4532] font-bold">{configuringLesson.title}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfiguringLesson(null)}
                    className="p-md hover:bg-[#1D4532]/10 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleCreateExercise} className="flex-1 overflow-y-auto p-xl space-y-lg custom-scrollbar">
                  <div className="bg-white border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-md">
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
                          Thứ tự chặng (orderIndex)
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
                        Mô tả bài tập thực hành
                      </label>
                      <textarea
                        rows={2}
                        value={exDesc}
                        onChange={(e) => setExDesc(e.target.value)}
                        placeholder="Hướng dẫn học viên luyện tập..."
                        className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-md text-sm focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none resize-none"
                      />
                    </div>

                    {/* Pass Threshold Range */}
                    <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
                      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider flex justify-between items-center">
                        <span>Điểm chuẩn tối thiểu để qua bài (passThreshold)</span>
                        <span className="bg-[#1D4532] text-white px-md py-xs rounded-full font-bold text-xs">
                          {exPassThreshold} / 100 điểm
                        </span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={exPassThreshold}
                        onChange={(e) => setExPassThreshold(parseInt(e.target.value))}
                        className="accent-[#1D4532] w-full cursor-pointer mt-2"
                      />
                      <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
                        <span>0 (Tối thiểu)</span>
                        <span>50 (Trung bình)</span>
                        <span>100 (Hoàn hảo)</span>
                      </div>
                      <p className="text-xs text-[#5e5e5b] italic mt-1">
                        * Học viên cần đạt từ {exPassThreshold} điểm trở lên khi chấm mic/âm thanh để mở khóa bài học tiếp theo.
                      </p>
                    </div>

                    {/* Feedback Messages */}
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
                  </div>

                  <div className="flex items-center justify-end gap-md pt-md">
                    <button
                      type="button"
                      onClick={() => setConfiguringLesson(null)}
                      className="px-xl py-md rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-black/5 transition-all"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEx || !exTitle.trim()}
                      className="px-xl py-md rounded-xl bg-[#1D4532] text-white text-sm font-bold hover:bg-[#1D4532]/90 transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
                    >
                      {isSavingEx ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Lưu bài tập & Điểm chuẩn
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
