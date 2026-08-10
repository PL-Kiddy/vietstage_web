import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Music,
  FileText,
  X,
  Check,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Trash2,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lessonsApi, lessonAssetsApi, lessonContentsApi, type LessonContent } from '../../api/services';
import { lessonDetailApi } from '../../api/management';
import type { Lesson as ApiLesson, LessonAsset } from '../../api/types';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

interface Lesson {
  id: string;
  title: string;
  module: string;
  instrument: string;
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

const InstructorLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [assets, setAssets] = useState<LessonAsset[]>([]);
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [uploadingType, setUploadingType] = useState<'REFERENCE_AUDIO' | 'SHEET_MUSIC' | null>(null);
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrumentFilter, setSelectedInstrumentFilter] = useState('Tất cả');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [openActionMenuLessonId, setOpenActionMenuLessonId] = useState<string | null>(null);

  const { execute: requestLessons } = useAxiosRequest<Lesson[]>(async (signal) => {
    const params = new URLSearchParams({ page: '1', size: '100' });
    const response = await lessonsApi.list(params, { signal });
    return Array.isArray(response.content) ? response.content.map(mapLesson) : [];
  }, { auto: false });

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

  const handleEditClick = async (lesson: Lesson) => {
    try {
      const detail = await lessonDetailApi.get(Number(lesson.id));
      const mapped = mapLesson(detail);
      setEditingLesson(mapped);
      setNewDescription('');
      setEditingContentId(null);
      setMaterialsLoading(true);
      setMaterialsError('');
      const [lessonAssets, lessonContents] = await Promise.all([
        lessonAssetsApi.getAssets(Number(lesson.id)),
        lessonContentsApi.list(Number(lesson.id)),
      ]);
      setAssets(lessonAssets);
      setContents(lessonContents.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể tải chi tiết bài giảng.');
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setNewDescription('');
    setEditingContentId(null);
    setAssets([]);
    setContents([]);
    setMaterialsError('');
    setEditingLesson(null);
  };

  const reloadMaterials = async () => {
    if (!editingLesson) return;
    const [lessonAssets, lessonContents] = await Promise.all([
      lessonAssetsApi.getAssets(Number(editingLesson.id)),
      lessonContentsApi.list(Number(editingLesson.id)),
    ]);
    setAssets(lessonAssets);
    setContents(lessonContents.sort((a, b) => a.order_index - b.order_index));
  };

  const handleSaveAssets = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingLesson || !newDescription.trim()) return;
    setSavingDescription(true);
    setMaterialsError('');
    try {
      const currentContent = contents.find((content) => content.id === editingContentId);
      const payload = {
        content_text: newDescription.trim(),
        order_index: currentContent?.order_index ?? Math.max(0, ...contents.map((content) => content.order_index)) + 1,
      };
      if (editingContentId) await lessonContentsApi.update(Number(editingLesson.id), editingContentId, payload);
      else await lessonContentsApi.create(Number(editingLesson.id), payload);
      setNewDescription('');
      setEditingContentId(null);
      await reloadMaterials();
    } catch (error) {
      setMaterialsError(error instanceof Error ? error.message : 'Không thể lưu hướng dẫn kỹ thuật.');
    } finally {
      setSavingDescription(false);
    }
  };

  const uploadMaterial = async (file: File, type: 'REFERENCE_AUDIO' | 'SHEET_MUSIC') => {
    if (!editingLesson) return;
    const valid = type === 'REFERENCE_AUDIO'
      ? ['audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.type)
      : file.type.startsWith('image/');
    if (!valid) {
      setMaterialsError(type === 'REFERENCE_AUDIO' ? 'Chỉ hỗ trợ file MP3 hoặc WAV.' : 'Chỉ hỗ trợ file ảnh cho bản ký âm.');
      return;
    }
    setUploadingType(type);
    setMaterialsError('');
    try {
      await lessonAssetsApi.uploadAsset(Number(editingLesson.id), file, type);
      await reloadMaterials();
    } catch (error) {
      setMaterialsError(error instanceof Error ? error.message : 'Không thể tải học liệu lên.');
    } finally {
      setUploadingType(null);
    }
  };

  const removeMaterial = async (assetId: number) => {
    if (!editingLesson || !window.confirm('Xóa học liệu này khỏi bài học?')) return;
    setMaterialsError('');
    try {
      await lessonAssetsApi.deleteAsset(Number(editingLesson.id), assetId);
      await reloadMaterials();
    } catch (error) {
      setMaterialsError(error instanceof Error ? error.message : 'Không thể xóa học liệu.');
    }
  };

  const removeContent = async (contentId: number) => {
    if (!editingLesson || !window.confirm('Xóa hướng dẫn kỹ thuật này?')) return;
    setMaterialsError('');
    try {
      await lessonContentsApi.remove(Number(editingLesson.id), contentId);
      if (editingContentId === contentId) {
        setEditingContentId(null);
        setNewDescription('');
      }
      await reloadMaterials();
    } catch (error) {
      setMaterialsError(error instanceof Error ? error.message : 'Không thể xóa hướng dẫn kỹ thuật.');
    }
  };

  const editContent = (content: LessonContent) => {
    setEditingContentId(content.id);
    setNewDescription(content.content_text);
    setMaterialsError('');
  };

  // Filter and arrange curriculum order
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.updatedAt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInstrument =
      selectedInstrumentFilter === 'Tất cả' ||
      lesson.instrument.toLowerCase() === selectedInstrumentFilter.toLowerCase();

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

    return matchesSearch && matchesInstrument && matchesStatus;
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

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="mb-lg flex flex-col gap-md">
        <div>
          <h1 className="text-headline-lg font-bold text-[#1D4532]">
            Nội dung & Học liệu
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Tổ chức, đăng tải học liệu (âm thanh mẫu, bản ký âm sheet nhạc) và quản lý thông tin bài giảng của bạn.
          </p>
        </div>

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

          {/* Instrument Filter */}
          <div className="flex items-center justify-between gap-xs px-md h-[42px] bg-white border border-[#d1e4fb] rounded-lg shadow-sm shrink-0 w-[260px]">
            <span className="font-label-md text-[#5e5e5b] text-sm font-medium whitespace-nowrap">Nhạc cụ:</span>
            <select
              value={selectedInstrumentFilter}
              onChange={(e) => {
                setSelectedInstrumentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none text-sm pr-6 py-1 leading-normal w-[160px]"
            >
              <option value="Tất cả">Tất cả nhạc cụ</option>
              {Array.from(new Set(lessons.map((l) => l.instrument))).filter(Boolean).map((ins) => (
                <option key={ins} value={ins}>
                  {getInstrumentTranslation(ins)}
                </option>
              ))}
            </select>
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
              <table className="w-full min-w-[1080px] border-collapse">
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
                      Nhạc cụ
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
                      <td colSpan={7} className="px-xl py-14 text-center">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#1D4532]/20 border-t-[#1D4532]" />
                        <p className="text-on-surface-variant">Đang tải danh sách bài giảng...</p>
                      </td>
                    </tr>
                  ) : paginatedLessons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-xl py-16 text-center">
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
                    const rawInst = lesson.instrument || '';
                    const instFormatted = getInstrumentTranslation(rawInst) || 'Đàn Tranh';

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
                        <td className="py-lg px-md whitespace-nowrap text-center">
                          <span className="px-md py-xs bg-[#ffe088]/25 text-[#574500] rounded-full text-label-sm font-bold text-xs border border-[#ffe088]/40 whitespace-nowrap inline-block">
                            {instFormatted}
                          </span>
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
                                <button
                                  onClick={() => {
                                    setOpenActionMenuLessonId(null);
                                    void handleEditClick(lesson);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors font-medium text-[#1D4532]"
                                >
                                  <UploadCloud className="w-4 h-4 text-[#1D4532]" />
                                  Quản lý học liệu
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

      {/* Drawer Form Overlay - Slide from right */}
      <AnimatePresence>
        {Boolean(editingLesson) && (
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
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#EDF7F2]">
                <div>
                  <h4 className="text-headline-md font-bold text-[#1D4532] font-sans">
                    Quản lý Học liệu
                  </h4>
                  <p className="text-label-sm text-on-surface-variant text-[13px] mt-xs">
                    Đăng tải file âm thanh, sheet nhạc và mô tả kỹ thuật.
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

              {/* Drawer Body */}
              <form onSubmit={handleSaveAssets} className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar flex flex-col justify-between">
                <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                  {/* Context Info */}
                  <div className="bg-[#f8f9fa] rounded-xl p-4 border border-outline-variant/10">
                     <p className="text-sm font-semibold text-[#1D4532] mb-1">Bài học: <span className="text-on-surface ml-1">{editingLesson?.title}</span></p>
                     <p className="text-sm font-semibold text-[#1D4532]">Nhạc cụ: <span className="text-on-surface ml-1">{editingLesson?.instrument}</span></p>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-xs border-t border-outline-variant/10 pt-md">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      {editingContentId ? 'Chỉnh sửa hướng dẫn kỹ thuật' : 'Thêm hướng dẫn kỹ thuật'}
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Mô tả kỹ thuật rung dây, nhấn vuốt, gảy ngón..."
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-on-surface h-24"
                    />
                    {editingContentId && (
                      <button type="button" onClick={() => { setEditingContentId(null); setNewDescription(''); }} className="w-fit text-xs font-semibold text-on-surface-variant hover:text-[#1D4532]">
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md border-t border-outline-variant/10 pt-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Âm thanh (.wav/.mp3)
                      </label>
                      <label className="border border-dashed border-outline-variant/40 rounded-xl p-md flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="audio/mpeg,audio/wav,audio/x-wav"
                          className="hidden"
                          disabled={uploadingType !== null}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                if (editingLesson) {
                                  await uploadMaterial(file, 'REFERENCE_AUDIO');
                                }
                              } catch (err) {
                                alert(`Tải âm thanh thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
                              }
                            }
                          }}
                        />
                        <Music className="w-8 h-8 text-primary mb-xs" />
                        <span className="font-label-sm text-primary font-bold text-xs">{uploadingType === 'REFERENCE_AUDIO' ? 'Đang tải lên…' : 'Tải lên file âm thanh'}</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Ký âm / Sheet nhạc
                      </label>
                      <label className="border border-dashed border-outline-variant/40 rounded-xl p-md flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingType !== null}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                if (editingLesson) {
                                  await uploadMaterial(file, 'SHEET_MUSIC');
                                }
                              } catch (err) {
                                alert(`Tải ký âm thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
                              }
                            }
                          }}
                        />
                        <FileText className="w-8 h-8 text-primary mb-xs" />
                        <span className="font-label-sm text-primary font-bold text-xs">{uploadingType === 'SHEET_MUSIC' ? 'Đang tải lên…' : 'Tải lên bản ký âm'}</span>
                      </label>
                    </div>
                  </div>

                  {materialsError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{materialsError}</p>}

                  <section className="space-y-3 border-t border-outline-variant/10 pt-md" aria-label="Học liệu đã tải lên">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-[#1D4532]">Học liệu đã tải lên</h5>
                      {materialsLoading && <span className="text-xs text-on-surface-variant">Đang tải…</span>}
                    </div>
                    {!materialsLoading && assets.length === 0 && (
                      <p className="text-sm text-on-surface-variant">Chưa có audio tham chiếu hoặc bản ký âm.</p>
                    )}
                    <div className="space-y-2">
                      {assets.map((asset) => (
                        <div key={asset.id} className="rounded-xl border border-outline-variant/15 bg-[#fbf9f4] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1D4532]">{asset.type === 'REFERENCE_AUDIO' ? 'Âm thanh tham chiếu' : 'Bản ký âm'}</p>
                              <a href={asset.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                Mở học liệu <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                            <button type="button" onClick={() => void removeMaterial(asset.id)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" title="Xóa học liệu" aria-label="Xóa học liệu">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {asset.type === 'REFERENCE_AUDIO' && <audio className="mt-3 w-full" controls preload="metadata" src={asset.url}>Trình duyệt không hỗ trợ phát audio.</audio>}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3 border-t border-outline-variant/10 pt-md" aria-label="Hướng dẫn kỹ thuật">
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="text-sm font-bold text-[#1D4532]">Hướng dẫn kỹ thuật</h5>
                      <span className="text-xs text-on-surface-variant">{contents.length} nội dung</span>
                    </div>
                    {contents.length > 0 && (
                      <div className="space-y-2">
                        {contents.map((content) => (
                          <div key={content.id} className="flex items-start justify-between gap-3 rounded-xl border border-outline-variant/15 bg-[#fbf9f4] p-3">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface">{content.content_text}</p>
                            <div className="flex shrink-0 gap-1">
                              <button type="button" onClick={() => editContent(content)} className="rounded-lg p-2 text-[#1D4532] hover:bg-[#edf5f1]" title="Sửa hướng dẫn" aria-label="Sửa hướng dẫn">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => void removeContent(content.id)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" title="Xóa hướng dẫn" aria-label="Xóa hướng dẫn">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {contents.length === 0 && !materialsLoading && <p className="text-sm text-on-surface-variant">Chưa có hướng dẫn kỹ thuật.</p>}
                  </section>
                </div>

                {/* Drawer Footer Actions */}
                <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 flex items-center justify-center gap-sm bg-white border border-[#d1e4fb] text-[#1D4532] py-lg rounded-xl font-bold hover:bg-[#EDF7F2] active:scale-[0.98] transition-all shadow-sm"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={!newDescription.trim() || savingDescription}
                    className="flex-1 flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-lg rounded-xl font-bold hover:bg-[#154618] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                    {savingDescription ? 'Đang lưu…' : editingContentId ? 'Cập nhật hướng dẫn' : 'Thêm hướng dẫn'}
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
