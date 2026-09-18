import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  BookOpen,
  Loader2,
  Search,
  MoreVertical,
  Pencil,
  Layers,
} from 'lucide-react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import { lessonsApi, masterDataApi } from '../../api/services';
import SubmitLessonReviewButton from '../../components/instructor/SubmitLessonReviewButton';
import type { Lesson, SkillLevel } from '../../api/types';
import { canEditLesson } from '../../api/lessonPermissions';
import { useInstructorIdentity } from '../../hooks/useInstructorIdentity';

type CurriculumLevelKey = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Ba cấp dùng chung cho mọi nhạc cụ. Không cung cấp CRUD ở web; API sau này
// chỉ cần ánh xạ các mã cố định này sang skillLevelId.
const CURRICULUM_LEVELS: Array<{ key: CurriculumLevelKey; number: number; label: string; title: string; description: string }> = [
  { key: 'BEGINNER', number: 1, label: 'Cơ bản', title: 'Cấp 1 · Cơ bản', description: 'Nền tảng về nhạc cụ, nhạc lý và kỹ năng nhập môn.' },
  { key: 'INTERMEDIATE', number: 2, label: 'Trung cấp', title: 'Cấp 2 · Trung cấp', description: 'Củng cố kỹ thuật, tiết tấu và bài thực hành.' },
  { key: 'ADVANCED', number: 3, label: 'Nâng cao', title: 'Cấp 3 · Nâng cao', description: 'Hoàn thiện kỹ thuật, biểu cảm và tiết mục nâng cao.' },
];

const normalizeLevelText = (value?: string) => (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const getCurriculumLevelKey = (level?: Partial<SkillLevel> | null): CurriculumLevelKey => {
  const code = level?.levelCode?.toUpperCase();
  if (code === 'INTERMEDIATE') return 'INTERMEDIATE';
  if (code === 'ADVANCED') return 'ADVANCED';
  if (code === 'BEGINNER') return 'BEGINNER';
  const name = normalizeLevelText(level?.levelName);
  if (name.includes('trung cap') || name.includes('intermediate')) return 'INTERMEDIATE';
  if (name.includes('cao cap') || name.includes('nang cao') || name.includes('advanced')) return 'ADVANCED';
  if (level?.orderIndex === 2) return 'INTERMEDIATE';
  if (level?.orderIndex === 3) return 'ADVANCED';
  return 'BEGINNER';
};



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

// Trang Cấu hình Giáo trình: tạo/sửa bài học, cập nhật trạng thái, cấu hình bài tập & ngưỡng điểm
const InstructorMedia = () => {
  const { data: instructor } = useInstructorIdentity();
  const navigate = useNavigate();
  // ── Curriculum List State ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // ── Fetch lessons ─────────────────────────────────────────────────────
  // Tải danh sách bài học (size 100, sort theo orderIndex)
  const fetchLessons = useCallback((signal?: AbortSignal) =>
    lessonsApi.listAll({ signal })
    , []);

  const { data: lessonsResponse, loading: lessonsLoading, execute: reloadLessons } = useAxiosRequest(
    fetchLessons, { auto: true }
  );

  const lessons: Lesson[] = (lessonsResponse as any)?.content ?? (Array.isArray(lessonsResponse) ? lessonsResponse as Lesson[] : []);

  // ── Fetch instruments & skill levels ─────────────────────────────────
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCurriculumLevel, setSelectedCurriculumLevel] = useState<CurriculumLevelKey>('BEGINNER');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const { data: instruments = [] } = useAxiosRequest<any[]>(
    (signal) => masterDataApi.instruments({ signal }),
    { auto: true, initialData: [] }
  );

  const { data: skillLevels = [] } = useAxiosRequest<SkillLevel[]>(
    (signal) => masterDataApi.skillLevels({ signal }),
    { auto: true, initialData: [] }
  );

  // Cấu hình luôn bắt đầu trong phạm vi một nhạc cụ, không trộn giáo trình
  // của Đàn Tranh, Sáo, Đàn Bầu… vào cùng một danh sách.
  useEffect(() => {
    if (selectedInstrumentId === 'ALL' && instruments.length > 0) {
      setSelectedInstrumentId(instruments[0].id);
    }
  }, [instruments, selectedInstrumentId]);

  // ── Create / Edit Lesson State ───────────────────────────────────────
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLessonInfo, setEditingLessonInfo] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonInstrumentId, setLessonInstrumentId] = useState<number | null>(null);
  const [lessonSkillLevelId, setLessonSkillLevelId] = useState<number | undefined>();
  const [lessonOrderIndex, setLessonOrderIndex] = useState<number>(1);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState('');

  const getBackendSkillLevelId = (key: CurriculumLevelKey) =>
    skillLevels.find((level) => getCurriculumLevelKey(level) === key)?.id;

  // Mở drawer tạo bài học mới với giá trị mặc định (nhạc cụ/trình độ đầu tiên, orderIndex tiếp theo)
  const handleOpenCreateLesson = () => {
    if (selectedInstrumentId === 'ALL') { alert('Vui lòng chọn nhạc cụ trước khi tạo bài học.'); return; }
    setLessonError('');
    setEditingLessonInfo(null);
    setLessonTitle('');
    setLessonInstrumentId(selectedInstrumentId);
    setLessonSkillLevelId(getBackendSkillLevelId(selectedCurriculumLevel));
    const scoped = lessons.filter(l => l.instrument?.id === selectedInstrumentId && getCurriculumLevelKey(l.skillLevel) === selectedCurriculumLevel);
    setLessonOrderIndex(Math.max(0, ...scoped.map(l => l.orderIndex ?? 0)) + 1);
    setLessonModalOpen(true);
  };

  // Mở drawer sửa bài học: nạp thông tin hiện tại vào form
  const handleOpenEditLesson = async (lesson: Lesson) => {
    if (!canEditLesson(instructor, lesson)) return;
    setLessonError('');
    setEditingLessonInfo(lesson);
    setLessonTitle(lesson.title);
    setLessonInstrumentId((lesson as any).instrument?.id ?? (lesson as any).instrument_id ?? instruments[0]?.id ?? null);
    const lessonLevel = ((lesson as any).skillLevel ?? (lesson as any).skill_level) as Partial<SkillLevel> | undefined;
    const curriculumLevel = getCurriculumLevelKey(lessonLevel);
    setLessonSkillLevelId(lessonLevel?.id ?? getBackendSkillLevelId(curriculumLevel));
    setLessonOrderIndex((lesson as any).orderIndex ?? (lesson as any).order_index ?? 1);
    setOpenActionMenuId(null);
    setLessonModalOpen(true);
  };

  // Lưu bài học: tạo mới (POST /api/lessons) hoặc cập nhật (PUT + PUT status nếu đổi trạng thái)
  const handleSaveLesson = async (e: FormEvent) => {
    e.preventDefault();
    if (isSavingLesson) return;
    if (editingLessonInfo && !canEditLesson(instructor, editingLessonInfo)) { setLessonError('Bài học hiện chỉ được xem.'); return; }
    setLessonError('');
    if (!lessonTitle.trim() || !Number.isInteger(lessonInstrumentId) || !instruments.some(item => item.id === lessonInstrumentId)) { setLessonError('Nhập tên bài và chọn nhạc cụ hợp lệ.'); return; }
    if (!Number.isInteger(lessonOrderIndex) || lessonOrderIndex < 1) { setLessonError('Vị trí bài phải là số nguyên từ 1 trở lên.'); return; }
    if (!skillLevels.some(level => level.id === lessonSkillLevelId)) {
      setLessonError('Chưa xác định được cấp giáo trình. Vui lòng tải lại danh sách.');
      return;
    }
    setIsSavingLesson(true);
    try {
      let savedLessonId = editingLessonInfo?.id;
      if (editingLessonInfo) {
        await lessonsApi.update(editingLessonInfo.id, {
          title: lessonTitle.trim(),
          description: editingLessonInfo.description,
          skillLevelId: lessonSkillLevelId,
          orderIndex: lessonOrderIndex,
        });

      } else {
        const created = await lessonsApi.create({
          title: lessonTitle.trim(),
          instrumentId: lessonInstrumentId!,
          skillLevelId: lessonSkillLevelId,
          status: 'DRAFT',
          orderIndex: lessonOrderIndex,
        });
        savedLessonId = created.id;
        setEditingLessonInfo(created);
      }
      setLessonModalOpen(false);
      if (!editingLessonInfo && savedLessonId !== undefined) {
        navigate(`/instructor/lessons?editLesson=${savedLessonId}`);
      } else await reloadLessons();
    } catch (err) {
      setLessonError(err instanceof Error ? err.message : 'Không thể lưu bài học.');
    } finally {
      setIsSavingLesson(false);
    }
  };


  const filteredLessons = lessons.filter((lesson) => {
    // Tập trung đúng một trong ba cấp cố định để giảng viên chỉnh giáo trình.
    if (getCurriculumLevelKey((lesson as any).skillLevel ?? (lesson as any).skill_level) !== selectedCurriculumLevel) return false;
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
  const activeInstrument = selectedInstrumentId === 'ALL' ? null : instruments.find((instrument) => instrument.id === selectedInstrumentId);
  const lessonsForActiveInstrument = selectedInstrumentId === 'ALL'
    ? lessons
    : lessons.filter((lesson) => Number((lesson as any).instrument?.id ?? (lesson as any).instrument_id) === Number(selectedInstrumentId));

  return (
    <div className="space-y-lg">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-headline-lg font-bold text-[#1D4532]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Cấu hình Giáo trình
        </h2>
        <p className="text-on-surface-variant mt-1">
          Tạo bài học, sắp xếp lộ trình và cấu hình bài tập, thứ tự hoạt động, ngưỡng điểm đạt.
        </p>
      </div>

      <div className="space-y-md">
          <section aria-label="Phạm vi nhạc cụ" className="flex flex-col gap-3 rounded-2xl border border-[#d8eadf] bg-[#f7fbf8] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#567364]">Nhạc cụ đang cấu hình</p>
              <p className="mt-1 text-lg font-bold text-[#1D4532]">{activeInstrument ? getInstrumentTranslation(activeInstrument.name) : 'Đang tải nhạc cụ…'}</p>
              <p className="mt-1 text-xs text-on-surface-variant">Chọn nhạc cụ trước, sau đó chọn cấp để biên soạn đúng giáo trình.</p>
            </div>
            <label className="flex min-w-[250px] flex-col gap-1 text-xs font-semibold text-[#52605a]">
              Chuyển nhạc cụ
              <select
                value={selectedInstrumentId === 'ALL' ? '' : selectedInstrumentId}
                onChange={(e) => { setSelectedInstrumentId(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-lg border border-[#c9ddcf] bg-white px-3 py-2.5 text-sm font-bold text-[#1D4532] outline-none focus:ring-2 focus:ring-[#1D4532]/20"
              >
                {instruments.map((instrument: any) => <option key={instrument.id} value={instrument.id}>{getInstrumentTranslation(instrument.name)}</option>)}
              </select>
            </label>
          </section>

          <section aria-label="Ba cấp giáo trình cố định" className="flex flex-wrap gap-2 rounded-xl border border-outline-variant/15 bg-white p-2">
            {CURRICULUM_LEVELS.map((level) => {
              const isSelected = level.key === selectedCurriculumLevel;
              const lessonCount = lessonsForActiveInstrument.filter((lesson) => getCurriculumLevelKey((lesson as any).skillLevel ?? (lesson as any).skill_level) === level.key).length;
              return (
                <button
                  key={level.key}
                  type="button"
                  onClick={() => { setSelectedCurriculumLevel(level.key); setCurrentPage(1); }}
                  className={`flex min-w-[175px] flex-1 items-center justify-between rounded-lg px-4 py-3 text-left transition-all ${isSelected ? 'bg-[#1D4532] text-white shadow-sm' : 'text-[#1D4532] hover:bg-[#edf7f2]'}`}
                >
                  <span><span className={`mr-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-[#f2eee1] text-[#665126]'}`}>Cấp {level.number}</span><span className="text-sm font-bold">{level.label}</span></span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isSelected ? 'bg-white/15 text-white' : 'bg-[#edf7f2] text-[#1D4532]'}`}>{lessonCount} bài</span>
                </button>
              );
            })}
          </section>

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

            {/* Add Lesson Button - Right aligned inline with status filter */}
            <button
              onClick={handleOpenCreateLesson}
              className="bg-[#1D4532] text-white px-lg h-[42px] rounded-lg font-label-md hover:bg-[#1D4532]/95 transition-all flex items-center justify-center gap-xs shadow-md shrink-0 font-bold whitespace-nowrap"
            >
              <Plus className="w-[18px] h-[18px]" />
              Tạo bài
            </button>
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
                    <th className="py-md px-md text-center font-bold text-xs w-32">Ngày cập nhật</th>
                    <th className="py-md px-md text-center font-bold text-xs w-32">Trạng thái</th>
                    <th className="py-md px-md text-right font-bold text-xs w-24 pr-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedLessons.map((lesson, idx) => {
                    const order = (lesson as any).orderIndex ?? (lesson as any).order_index ?? idx + 1;
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
                              <div className="absolute right-6 mt-1 w-72 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left overflow-hidden">
                                {canEditLesson(instructor, lesson) && <button
                                  onClick={() => handleOpenEditLesson(lesson)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#EDF7F2] text-[13px] font-medium text-on-surface transition-colors whitespace-nowrap"
                                >
                                  <Pencil className="w-4 h-4 text-[#1D4532] flex-shrink-0" />
                                  Sửa thông tin bài học
                                </button>}
                                <SubmitLessonReviewButton id={lesson.id} title={lesson.title} status={lesson.status} createdById={lesson.createdBy?.id} onSubmitted={async () => { if (!await reloadLessons()) throw new Error('Không tải được danh sách'); }} />
                                
                                <Link to={`/instructor/lessons?editLesson=${lesson.id}`} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#EDF7F2] text-[13px] font-medium whitespace-nowrap"><BookOpen className="w-4 h-4" /> {canEditLesson(instructor, lesson) ? 'Biên soạn nội dung & học liệu' : 'Xem nội dung bài học'}</Link>
                                <Link
                                  to={`/instructor/lessons/${lesson.id}/content`}
                                  onClick={() => setOpenActionMenuId(null)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#EDF7F2] text-[13px] font-medium text-on-surface transition-colors border-t border-[#d1e4fb]/30 whitespace-nowrap"
                                >
                                  <Layers className="w-4 h-4 text-[#1D4532] flex-shrink-0" />
                                  Bài tập, Quiz & Ngưỡng đạt
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

      {/* ── Modal Tạo / Sửa Bài học ────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {lessonModalOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLessonModalOpen(false)}
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
                      {editingLessonInfo ? 'Thông tin bài trong giáo trình' : 'Tạo Bài học Mới'}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                      Đặt tên và vị trí bài trong lộ trình. Nội dung được biên soạn ở bước tiếp theo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLessonModalOpen(false)}
                    className="p-md hover:bg-[#1D4532]/10 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSaveLesson} className="flex-1 overflow-y-auto p-xl space-y-lg custom-scrollbar">
                  {lessonError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{lessonError}</p>}
                  <fieldset disabled={isSavingLesson} className="bg-white border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-md min-w-0">
                    <label className="block text-sm font-semibold">Tên bài học *<input required value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="Nhập tên bài học…" className="mt-2 block w-full rounded-xl border bg-white p-3" /></label>
                    <label className="block text-sm font-semibold">Vị trí trong giáo trình<input type="number" min={1} required value={lessonOrderIndex} onChange={e => setLessonOrderIndex(Math.max(1, Number(e.target.value) || 1))} className="mt-2 block w-full rounded-xl border bg-white p-3" /></label>
                    <p className="text-sm text-on-surface-variant">{editingLessonInfo ? 'Trạng thái phê duyệt do quản trị viên quyết định; lưu thông tin không thay đổi trạng thái.' : 'Bài mới được tạo ở trạng thái nháp.'}</p>
                      <p className="text-sm text-on-surface-variant">Lời cô Mai, audio và khuông thực hành được biên soạn tại Nội dung & Học liệu sau khi tạo bài.</p>
                  </fieldset>

                  <div className="flex items-center justify-end gap-md pt-md">
                    <button
                      type="button"
                      onClick={() => setLessonModalOpen(false)}
                      className="px-xl py-md rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-black/5 transition-all"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingLesson || !lessonTitle.trim()}
                      className="px-xl py-md rounded-xl bg-[#1D4532] text-white text-sm font-bold hover:bg-[#1D4532]/90 transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
                    >
                      {isSavingLesson ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {editingLessonInfo ? 'Lưu thông tin bài' : 'Tạo và biên soạn'}
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
