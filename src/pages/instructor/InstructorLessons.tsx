import LessonBodyEditor from '../../components/instructor/LessonBodyEditor';
import { useSearchParams } from 'react-router-dom';
import { EMPTY_PRACTICE_SHEET, type PracticeSheetConfig } from '../../components/instructor/PracticeSheetComposer';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Music,
  FileText,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
} from 'lucide-react';
import { lessonsApi, masterDataApi } from '../../api/services';
import { lessonDetailApi } from '../../api/management';
import type { Instrument, Lesson as ApiLesson, SkillLevel } from '../../api/types';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

interface Lesson {
  id: string;
  title: string;
  module: string;
  instrument: string;
  instrumentId?: number;
  skillLevel?: ApiLesson['skillLevel'];
  difficulty: number;
  updatedAt: string;
  status: ApiLesson['status'];
  description: string;
  orderIndex: number;
  backendStatus?: ApiLesson['status'];
}

const mapLesson = (lesson: ApiLesson): Lesson => ({
  id: String(lesson.id),
  title: lesson.title,
  instrumentId: lesson.instrument?.id,
  skillLevel: lesson.skillLevel,
  module: lesson.skillLevel?.levelName ?? 'Chưa phân cấp',
  instrument: lesson.instrument?.name ?? 'Chưa chọn nhạc cụ',
  difficulty: lesson.skillLevel?.id ?? 1,
  updatedAt: lesson.updatedAt
    ? new Date(lesson.updatedAt).toLocaleDateString('vi-VN')
    : '',
  status: lesson.status,
  backendStatus: lesson.status,
  description: lesson.description ?? '',
  orderIndex: lesson.orderIndex ?? 0,
});


type CurriculumLevelKey = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
const CURRICULUM_LEVELS: Array<{ key: CurriculumLevelKey; number: number; label: string }> = [
  { key: 'BEGINNER', number: 1, label: 'Cơ bản' },
  { key: 'INTERMEDIATE', number: 2, label: 'Trung cấp' },
  { key: 'ADVANCED', number: 3, label: 'Nâng cao' },
];
const normalizeLevelText = (value?: string) => (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const getCurriculumLevelKey = (level?: Partial<SkillLevel> | null): CurriculumLevelKey => {
  const code = level?.levelCode?.toUpperCase();
  if (code === 'INTERMEDIATE') return 'INTERMEDIATE';
  if (code === 'ADVANCED') return 'ADVANCED';
  const name = normalizeLevelText(level?.levelName);
  if (name.includes('trung cap') || name.includes('intermediate') || level?.orderIndex === 2) return 'INTERMEDIATE';
  if (name.includes('nang cao') || name.includes('cao cap') || name.includes('advanced') || level?.orderIndex === 3) return 'ADVANCED';
  return 'BEGINNER';
};

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

const getInstrumentTranslation = (instName: string) => {
  const nameLower = instName.toLowerCase();
  if (nameLower.includes('tranh')) return 'Đàn Tranh';
  if (nameLower.includes('bau')) return 'Đàn Bầu';
  if (nameLower.includes('sao')) return 'Sáo Trúc';
  if (nameLower.includes('nguyet')) return 'Đàn Nguyệt';
  if (nameLower.includes('trong')) return 'Trống';
  return instName;
};

// Trang Nội dung & Học liệu: danh sách bài giảng, quản lý học liệu (upload âm thanh/sheet, lưu ghi chú)
const InstructorLessons = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Local draft only: never send notation through the narration API.
  const [sheetDrafts, setSheetDrafts] = useState<Record<string, PracticeSheetConfig>>({});

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const materialRequest = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null);
  const [selectedCurriculumLevel, setSelectedCurriculumLevel] = useState<CurriculumLevelKey>('BEGINNER');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [openActionMenuLessonId, setOpenActionMenuLessonId] = useState<string | null>(null);

  const { data: instruments = [] } = useAxiosRequest<Instrument[]>(
    (signal) => masterDataApi.instruments({ signal }),
    { auto: true, initialData: [] },
  );

  useEffect(() => {
    if (selectedInstrumentId === null && instruments.length > 0) setSelectedInstrumentId(instruments[0].id);
  }, [instruments, selectedInstrumentId]);

  const { execute: requestLessons } = useAxiosRequest<Lesson[]>(async (signal) => {
    const params = new URLSearchParams({ page: '1', size: '100' });
    const response = await lessonsApi.list(params, { signal });
    return Array.isArray(response.content) ? response.content.map(mapLesson) : [];
  }, { auto: false });

  // Tải danh sách bài giảng từ GET /api/lessons (page 1, size 100)
  const loadLessons = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await requestLessons(signal);
      if (response) setLessons(response);
    } catch (error) {
      setLessons([]);
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách bài giảng.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [requestLessons]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadLessons(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadLessons]);

  const handleEditClick = (lesson: Lesson, viewOnly = false) => {
    materialRequest.current++;
    setReadOnly(viewOnly);
    setEditingLesson(lesson);
  };
  const requestedLessonId = searchParams.get('editLesson');
  useEffect(() => {
    if (!requestedLessonId || !/^\d+$/.test(requestedLessonId)) return;
    let cancelled = false;
    const requestId = ++materialRequest.current;
    lessonDetailApi.get(Number(requestedLessonId)).then(detail => {
      if (cancelled || requestId !== materialRequest.current) return;
      const mapped = mapLesson(detail);
      setReadOnly(false);
      setEditingLesson(mapped);
      setSelectedInstrumentId(mapped.instrumentId ?? null);
      setSelectedCurriculumLevel(getCurriculumLevelKey(mapped.skillLevel));
    }).catch(error => { if (!cancelled && requestId === materialRequest.current) setLoadError(error instanceof Error ? error.message : 'Không thể mở bài học.'); });
    return () => { cancelled = true; };
  }, [requestedLessonId]);

  const handleCloseModal = () => {
    materialRequest.current++;
    setEditingLesson(null);
    if (requestedLessonId) setSearchParams({}, { replace: true });
  };

  // Filter and arrange curriculum order
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.updatedAt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInstrument = selectedInstrumentId === null || Number(lesson.instrumentId) === selectedInstrumentId;
    const matchesLevel = getCurriculumLevelKey(lesson.skillLevel) === selectedCurriculumLevel;

    let matchesStatus = true;
    if (selectedStatusFilter === 'Chờ duyệt') {
      matchesStatus = lesson.status === 'PENDING';
    } else if (selectedStatusFilter === 'Đã duyệt') {
      matchesStatus = lesson.status === 'APPROVED';
    } else if (selectedStatusFilter === 'Bị từ chối') {
      matchesStatus = lesson.status === 'REJECTED';
    } else if (selectedStatusFilter === 'Bản nháp') {
      matchesStatus = lesson.status !== 'PENDING' && lesson.status !== 'APPROVED' && lesson.status !== 'REJECTED';
    }

    return matchesSearch && matchesInstrument && matchesLevel && matchesStatus;
  });

  const parseDate = (dStr: string) => {
    if (!dStr) return 0;
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
    return new Date(dStr).getTime() || 0;
  };

  const sortedLessons = [...filteredLessons].sort((a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt));
  const totalPages = Math.max(1, Math.ceil(sortedLessons.length / perPage));
  const paginatedLessons = sortedLessons.slice((currentPage - 1) * perPage, currentPage * perPage);
  const activeInstrument = instruments.find((instrument) => instrument.id === selectedInstrumentId);
  const lessonsForActiveInstrument = selectedInstrumentId === null ? lessons : lessons.filter((lesson) => Number(lesson.instrumentId) === selectedInstrumentId);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="mb-lg flex flex-col gap-md">
        <div>
          <h1 className="text-headline-lg font-bold text-[#1D4532]">
            Nội dung & Học liệu
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Xem và chỉnh sửa lời cô Mai hướng dẫn cùng khuông thực hành của từng bài học.
          </p>
        </div>

        <section aria-label="Phạm vi nhạc cụ" className="flex flex-col gap-3 rounded-2xl border border-[#d8eadf] bg-[#f7fbf8] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#567364]">Nhạc cụ</p>
            <p className="mt-1 text-lg font-bold text-[#1D4532]">{activeInstrument ? getInstrumentTranslation(activeInstrument.name) : 'Đang tải nhạc cụ…'}</p>
            <p className="mt-1 text-xs text-on-surface-variant">Chọn nhạc cụ và cấp độ để tìm bài học cần biên soạn.</p>
          </div>
          <label className="flex min-w-[250px] flex-col gap-1 text-xs font-semibold text-[#52605a]">
            Chuyển nhạc cụ
            <select
              value={selectedInstrumentId ?? ''}
              onChange={(e) => { setSelectedInstrumentId(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-lg border border-[#c9ddcf] bg-white px-3 py-2.5 text-sm font-bold text-[#1D4532] outline-none focus:ring-2 focus:ring-[#1D4532]/20"
            >
              {instruments.map((instrument) => <option key={instrument.id} value={instrument.id}>{getInstrumentTranslation(instrument.name)}</option>)}
            </select>
          </label>
        </section>

        <section aria-label="Ba cấp giáo trình cố định" className="flex flex-wrap gap-2 rounded-xl border border-outline-variant/15 bg-white p-2">
          {CURRICULUM_LEVELS.map((level) => {
            const isSelected = level.key === selectedCurriculumLevel;
            const lessonCount = lessonsForActiveInstrument.filter((lesson) => getCurriculumLevelKey(lesson.skillLevel) === level.key).length;
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

        {/* Controls Row: Search + Filter + Add Button */}
        <div className="flex flex-col md:flex-row md:items-center gap-sm w-full">
          {/* Search Bar - Kéo dài chiếm khoảng trống bên trái */}
          <div className="flex items-center gap-xs px-md h-[42px] bg-white border border-[#d1e4fb] rounded-lg flex-grow shadow-sm focus-within:ring-1 focus-within:ring-[#1D4532] transition-all">
            <Search className="w-5 h-5 text-[#5e5e5b] flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên bài giảng, mô tả, nhạc cụ, ngày cập nhật..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-body-md w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50 py-1 leading-normal"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-[#5e5e5b] hover:text-error transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center justify-between gap-xs px-md h-[42px] bg-white border border-[#d1e4fb] rounded-lg shadow-sm shrink-0 w-[225px]">
            <span className="font-label-md text-[#5e5e5b] text-sm font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none text-sm pr-6 py-1 leading-normal w-[130px]"
            >
              <option value="Tất cả">Tất cả</option>
              <option value="Đã duyệt">Đã duyệt</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Bị từ chối">Bị từ chối</option>
              <option value="Bản nháp">Bản nháp</option>
            </select>
          </div>

        </div>
      </div>

      {loadError && (
        <div className="mb-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button onClick={() => { void loadLessons(); }} className="inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap hover:underline">
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-gutter">
        {/* Lesson List Table */}
        <div className="col-span-12 flex flex-col gap-gutter">
          <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[930px] border-collapse">
                <thead>
                  <tr className="bg-[#EDF7F2]/60">
                    <th className="text-center whitespace-nowrap py-md px-lg font-label-sm text-label-sm text-[#1D4532] font-semibold border-b border-outline-variant/10 w-16">
                      STT
                    </th>
                    <th className="text-left whitespace-nowrap py-md px-xl font-label-sm text-label-sm text-[#1D4532] font-semibold border-b border-outline-variant/10">
                      Tên bài giảng & Kỹ thuật
                    </th>
                    <th className="text-center whitespace-nowrap py-md px-md font-label-sm text-label-sm text-[#1D4532] font-semibold border-b border-outline-variant/10">
                      Học liệu Media
                    </th>
                    <th className="text-center whitespace-nowrap py-md px-md font-label-sm text-label-sm text-[#1D4532] font-semibold border-b border-outline-variant/10">
                      Ngày cập nhật
                    </th>
                    <th className="text-center whitespace-nowrap py-md px-md font-label-sm text-label-sm text-[#1D4532] font-semibold border-b border-outline-variant/10">
                      Trạng thái
                    </th>
                    <th className="text-right whitespace-nowrap py-md px-xl font-label-sm text-label-sm text-[#1D4532] font-semibold border-b border-outline-variant/10">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-xl py-14 text-center">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#1D4532]/20 border-t-[#1D4532]" />
                        <p className="text-on-surface-variant">Đang tải danh sách bài giảng...</p>
                      </td>
                    </tr>
                  ) : paginatedLessons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-xl py-16 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1D4532]/10 text-[#1D4532]">
                            <BookOpen className="h-7 w-7" />
                          </div>
                          <h3 className="text-lg font-bold text-on-surface">Chưa có bài giảng nào</h3>
                          <p className="mt-1 text-sm text-on-surface-variant">Hãy sang mục Cấu hình Giáo trình để tạo bài giảng mới.</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedLessons.map((lesson, idx) => {
                    return (
                      <tr
                        key={lesson.id}
                        className="hover:bg-[#EDF7F2]/40 transition-colors group"
                      >
                        <td className="py-lg px-lg text-center font-semibold text-on-surface-variant text-sm">
                          {(currentPage - 1) * perPage + idx + 1}
                        </td>
                        <td className="py-lg px-xl">
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-[#1D4532] font-bold">
                              {lesson.title}
                            </span>
                            <span className="line-clamp-1 max-w-xs text-label-sm text-on-surface-variant text-[12px] mt-0.5 italic">
                              {lesson.description || 'Chưa có mô tả kỹ thuật biểu diễn.'}
                            </span>
                          </div>
                        </td>
                        <td className="py-lg px-md text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-xs whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap" title="File âm thanh mẫu">
                              <Music className="w-3 h-3 flex-shrink-0" /> Âm thanh
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap" title="Ký âm / Sheet nhạc">
                              <FileText className="w-3 h-3 flex-shrink-0" /> Sheet
                            </span>
                          </div>
                        </td>
                        <td className="py-lg px-md text-on-surface-variant font-label-md text-xs text-center">
                          {lesson.updatedAt}
                        </td>
                        <td className="py-lg px-md text-center">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${getStatusMeta(lesson.status).className}`}>
                            <span className={`h-2 w-2 rounded-full ${getStatusMeta(lesson.status).dot}`} />
                            {getStatusMeta(lesson.status).label}
                          </span>
                        </td>
                        <td className="py-lg px-xl text-right relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenActionMenuLessonId(openActionMenuLessonId === lesson.id ? null : lesson.id)}
                            className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openActionMenuLessonId === lesson.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenuLessonId(null)} />
                              <div className={`absolute right-4 w-52 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left ${
                                idx >= paginatedLessons.length - 2 && paginatedLessons.length > 2 ? 'bottom-[85%] mb-1' : 'top-full mt-1'
                              }`}>
                                <button type="button" onClick={() => { setOpenActionMenuLessonId(null); handleEditClick(lesson, true); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] font-medium text-[#1D4532] hover:bg-[#EDF7F2]"><Eye className="h-4 w-4" /> Xem bài học</button>
                                <button
                                  onClick={() => {
                                    setOpenActionMenuLessonId(null);
                                    void handleEditClick(lesson);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors font-medium text-[#1D4532]"
                                >
                                  <Pencil className="w-4 h-4 text-[#1D4532]" />
                                  Chỉnh sửa bài học
                                </button>
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
          </div>
        </div>
      </div>

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
                className="bg-white border border-outline-variant rounded px-2 py-1 text-label-md cursor-pointer outline-none font-semibold text-[#1D4532]"
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
              className="p-2 border border-outline-variant rounded hover:bg-[#EDF7F2] transition-colors disabled:opacity-40"
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
                    : 'border border-outline-variant hover:bg-[#EDF7F2]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 border border-outline-variant rounded hover:bg-[#EDF7F2] transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {editingLesson && <LessonBodyEditor key={`${editingLesson.id}:${readOnly}`} lesson={editingLesson} readOnly={readOnly} initialSheet={sheetDrafts[editingLesson.id] ?? EMPTY_PRACTICE_SHEET} onSaveSheet={sheet => setSheetDrafts(current => ({ ...current, [editingLesson.id]: sheet }))} onClose={handleCloseModal} />}
    </div>
  );
};

export default InstructorLessons;
