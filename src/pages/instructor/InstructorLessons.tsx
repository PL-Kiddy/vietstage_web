import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { lessonsApi, masterDataApi, uploadApi, lessonAssetsApi, lessonTechniquesApi } from '../../api/services';
import { lessonDetailApi } from '../../api/management';
import type { Instrument, Lesson as ApiLesson, SkillLevel } from '../../api/types';
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

const getLevelTranslation = (levelName: string) => {
  switch (levelName.toLowerCase()) {
    case 'beginner':
      return 'Cơ bản';
    case 'intermediate':
      return 'Trung cấp';
    case 'advanced':
      return 'Nâng cao';
    default:
      return levelName;
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
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newInstrument, setNewInstrument] = useState('Đàn Nguyệt');
  const [newSkillLevelId, setNewSkillLevelId] = useState(0);
  const [newStatus, setNewStatus] = useState<'public' | 'draft'>('draft');
  const [newDescription, setNewDescription] = useState('');
  const [newOrderIndex, setNewOrderIndex] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
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
  const { execute: requestInstruments } = useAxiosRequest<Instrument[]>(
    (signal) => masterDataApi.instruments({ signal }),
    { auto: false },
  );
  const { execute: requestSkillLevels } = useAxiosRequest<SkillLevel[]>(
    (signal) => masterDataApi.skillLevels({ signal }),
    { auto: false },
  );

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

  const loadMasterData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [instrumentData, skillLevelData] = await Promise.all([
        requestInstruments(signal),
        requestSkillLevels(signal),
      ]);
      if (!instrumentData || !skillLevelData) return;
      setInstruments(instrumentData);
      setSkillLevels(skillLevelData);
      if (instrumentData[0]) setNewInstrument(instrumentData[0].name);
      if (skillLevelData[0]) setNewSkillLevelId(skillLevelData[0].id);
    } catch (error) {
      setInstruments([]);
      setSkillLevels([]);
      setLoadError((current) => current || (error instanceof Error ? error.message : 'Không thể tải dữ liệu nhạc cụ và trình độ.'));
    }
  }, [requestInstruments, requestSkillLevels]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadLessons(controller.signal);
      void loadMasterData(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
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
      setNewOrderIndex(mapped.orderIndex || 1);
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
    setNewOrderIndex(1);
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
        const lessonIdNum = Number(editingLesson.id);
        await lessonsApi.update(lessonIdNum, {
          title: newTitle.trim(),
          description: newDescription,
          skillLevelId,
          orderIndex: newOrderIndex,
        });
        if (newDescription.trim()) {
          try {
            await lessonTechniquesApi.create(lessonIdNum, {
              name: 'Ghi chú kỹ thuật gảy/thổi',
              description: newDescription.trim(),
            });
          } catch {
            // fallback
          }
        }
        if (editingLesson.backendStatus !== targetStatus
            && !(editingLesson.backendStatus === 'APPROVED' && targetStatus === 'PENDING')) {
          await lessonsApi.updateStatus(lessonIdNum, targetStatus);
        }
        alert('Đã cập nhật bài giảng thành công!');
      } else {
        const createdLesson = await lessonsApi.create({
          title: newTitle.trim(),
          description: newDescription,
          instrumentId: instrument.id,
          skillLevelId,
          status: targetStatus,
          orderIndex: newOrderIndex,
        });
        if (createdLesson?.id && newDescription.trim()) {
          try {
            await lessonTechniquesApi.create(createdLesson.id, {
              name: 'Ghi chú kỹ thuật gảy/thổi',
              description: newDescription.trim(),
            });
          } catch {
            // fallback
          }
        }
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

          {/* Add Lesson Button */}
          <button
            onClick={() => {
              const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.orderIndex)) + 1 : 1;
              setNewOrderIndex(nextOrder);
              setShowAddForm(true);
            }}
            className="bg-[#1D4532] text-white px-lg h-[42px] rounded-lg font-label-md hover:bg-[#1D4532]/95 transition-all flex items-center justify-center gap-xs shadow-md shrink-0"
          >
            <Plus className="w-[18px] h-[18px]" />
            Thêm bài giảng
          </button>
        </div>
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
                          <p className="mt-1 text-sm text-on-surface-variant">Tạo bài giảng đầu tiên để bắt đầu đăng tải học liệu giảng dạy.</p>
                          <button onClick={() => setShowAddForm(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1D4532] px-5 py-2.5 font-bold text-white hover:opacity-90">
                            <Plus className="h-4 w-4" /> Thêm bài giảng
                          </button>
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
                                <Link
                                  to={`/instructor/lessons/${lesson.id}/content`}
                                  onClick={() => setOpenActionMenuLessonId(null)}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <BookOpen className="w-4 h-4 text-[#1D4532]" />
                                  Quản lý bài tập & Quiz
                                </Link>
                                <button
                                  onClick={() => {
                                    setOpenActionMenuLessonId(null);
                                    void handleEditClick(lesson);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-[#1D4532]" />
                                  Sửa bài giảng & học liệu
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenActionMenuLessonId(null);
                                    void handleDelete(lesson.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-[13px] text-red-700 transition-colors border-t border-[#d1e4fb]/40"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                  Xóa bài giảng
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
        {Boolean(showAddForm || editingLesson) && (
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
                    {editingLesson ? 'Chỉnh sửa cấu hình bài giảng' : 'Thêm bài giảng mới'}
                  </h4>
                  <p className="text-label-sm text-on-surface-variant text-[13px] mt-xs">
                    Tạo lộ trình và tiêu chí đánh giá kỹ năng bài học.
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
                            {getInstrumentTranslation(instrument.name)}
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
                          <option key={level.id} value={level.id}>
                            {getLevelTranslation(level.levelName)}
                          </option>
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
                        <option value="public">Công khai</option>
                        <option value="draft">Bản nháp</option>
                      </select>
                    </div>
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

                  {/* Upload Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md border-t border-outline-variant/10 pt-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Âm thanh (.wav/.mp3)
                      </label>
                      <label className="border border-dashed border-outline-variant/40 rounded-xl p-md flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                if (editingLesson) {
                                  await lessonAssetsApi.uploadAsset(Number(editingLesson.id), file, 'REFERENCE_AUDIO');
                                } else {
                                  await uploadApi.uploadFile(file);
                                }
                                alert(`Đã tải lên âm thanh: ${file.name}`);
                              } catch (err) {
                                alert(`Tải âm thanh thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
                              }
                            }
                          }}
                        />
                        <Music className="w-8 h-8 text-primary mb-xs" />
                        <span className="font-label-sm text-primary font-bold text-xs">Tải lên file âm thanh</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Ký âm / Sheet nhạc
                      </label>
                      <label className="border border-dashed border-outline-variant/40 rounded-xl p-md flex flex-col items-center justify-center bg-[#fbf9f4] hover:bg-[#ffe088]/10 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                if (editingLesson) {
                                  await lessonAssetsApi.uploadAsset(Number(editingLesson.id), file, 'SHEET_MUSIC');
                                } else {
                                  await uploadApi.uploadFile(file);
                                }
                                alert(`Đã tải lên ký âm: ${file.name}`);
                              } catch (err) {
                                alert(`Tải ký âm thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
                              }
                            }
                          }}
                        />
                        <FileText className="w-8 h-8 text-primary mb-xs" />
                        <span className="font-label-sm text-primary font-bold text-xs">Tải lên bản ký âm</span>
                      </label>
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
