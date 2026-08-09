import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Check,
  Eye,
  Search,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Music2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { masterDataApi, reviewsApi, usersApi } from '../../api/services';
import type { AdminUser, Instrument, ReviewItem as ApiReviewItem } from '../../api/types';

interface ReviewAsset {
  id: number;
  assetType: string;
  title: string;
  assetUrl: string;
  mimeType?: string;
  durationSec?: number;
}

interface ReviewItem {
  id: string;
  title: string;
  instrumentId?: number;
  instrument: string;
  instructorId?: number;
  instructor: string;
  date: string;
  assets: ReviewAsset[];
  description: string;
  technicalNotes: string;
  lessonId?: number;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

const isAudioAsset = (asset: ReviewAsset) =>
  ['AUDIO', 'REFERENCE_AUDIO'].includes(asset.assetType.toUpperCase()) || asset.mimeType?.startsWith('audio/');

const isImageAsset = (asset: ReviewAsset) =>
  ['SHEET_MUSIC', 'SHEET_IMAGE', 'IMAGE'].includes(asset.assetType.toUpperCase()) || asset.mimeType?.startsWith('image/');

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds < 0) return '';
  const rounded = Math.round(seconds);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
};

const normalizeReview = (item: ApiReviewItem): ReviewItem => {
  const assets = (item.assets ?? []).map((asset) => ({
    id: asset.id,
    assetType: asset.assetType || 'FILE',
    title: asset.title || `Tệp đính kèm #${asset.id}`,
    assetUrl: asset.assetUrl,
    mimeType: asset.mimeType,
    durationSec: asset.durationSec,
  }));

  return {
    id: String(item.id),
    lessonId: item.lessonId,
    title: item.title || 'Bài giảng chưa đặt tên',
    instrumentId: item.instrumentId,
    instrument: item.instrument || 'Chưa xác định',
    instructorId: item.instructorId,
    instructor: item.instructor || 'Chưa xác định',
    date: item.date || '',
    assets,
    description: item.description || '',
    technicalNotes: item.technicalNotes || '',
    status: normalizeReviewStatus(item.status),
    feedback: item.feedback,
    approvedBy: item.approvedBy,
    approvedAt: item.approvedAt,
  };
};

const normalizeReviewStatus = (status?: string): ReviewItem['status'] => {
  switch (String(status || 'PENDING').trim().toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
    default:
      return 'pending';
  }
};

const AdminReview = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 1 });
  const [reviewCounts, setReviewCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [instrumentOptions, setInstrumentOptions] = useState<Instrument[]>([]);
  const [instructorOptions, setInstructorOptions] = useState<AdminUser[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const instructorParams = new URLSearchParams({ page: '0', size: '100', sortBy: 'name', sortDir: 'asc' });
    instructorParams.append('roles', 'INSTRUCTOR');

    void Promise.all([
      masterDataApi.instruments({ signal: controller.signal }),
      usersApi.list({ signal: controller.signal, params: instructorParams }),
    ]).then(([instruments, instructors]) => {
      if (controller.signal.aborted) return;
      setInstrumentOptions(Array.isArray(instruments) ? instruments : []);
      setInstructorOptions(instructors.content ?? []);
    }).catch(() => {
      if (!controller.signal.aborted) {
        setInstrumentOptions([]);
        setInstructorOptions([]);
      }
    });

    return () => controller.abort();
  }, []);

  const loadReviews = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const createParams = (status?: string, page = currentPage - 1, size = perPage) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (status) params.set('status', status);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedInstructorId !== null) params.set('instructorId', String(selectedInstructorId));
        if (selectedInstrumentId !== null) params.set('instrumentId', String(selectedInstrumentId));
        return params;
      };
      const activeStatus = statusFilter === 'all' ? undefined : statusFilter.toUpperCase();
      const [reviewPage, allPage, pendingPage, approvedPage, rejectedPage] = await Promise.all([
        reviewsApi.list(createParams(activeStatus), { signal }),
        reviewsApi.list(createParams(undefined, 0, 1), { signal }),
        reviewsApi.list(createParams('PENDING', 0, 1), { signal }),
        reviewsApi.list(createParams('APPROVED', 0, 1), { signal }),
        reviewsApi.list(createParams('REJECTED', 0, 1), { signal }),
      ]);
      setItems((reviewPage.content ?? []).map(normalizeReview));
      setPageInfo({ totalElements: reviewPage.totalElements ?? 0, totalPages: reviewPage.totalPages ?? 1 });
      setReviewCounts({
        all: allPage.totalElements ?? 0,
        pending: pendingPage.totalElements ?? 0,
        approved: approvedPage.totalElements ?? 0,
        rejected: rejectedPage.totalElements ?? 0,
      });
    } catch (error) {
      setItems([]);
      setPageInfo({ totalElements: 0, totalPages: 1 });
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách kiểm duyệt.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, perPage, selectedInstructorId, selectedInstrumentId, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadReviews(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadReviews]);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string>('');
  const [isDecisionSubmitting, setIsDecisionSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState<boolean>(false);
  const [previewAsset, setPreviewAsset] = useState<ReviewAsset | null>(null);

  const openDrawer = (item: ReviewItem) => {
    setSelectedItem(item);
    setFeedback(item.feedback || '');
    setFeedbackError('');
    setPreviewAsset(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setPreviewAsset(null);
  };

  const handleApprove = async () => {
    if (!selectedItem || isDecisionSubmitting) return;
    setIsDecisionSubmitting(true);
    try {
      await reviewsApi.approve(Number(selectedItem.id));
      await loadReviews();
      alert(`Đã phê duyệt học liệu: ${selectedItem.title}`);
      closeDrawer();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể phê duyệt học liệu.');
    } finally {
      setIsDecisionSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || isDecisionSubmitting) return;
    if (!feedback.trim()) {
      setFeedbackError('Lý do từ chối là bắt buộc để giảng viên nắm được thông tin chỉnh sửa.');
      return;
    }
    setIsDecisionSubmitting(true);
    try {
      await reviewsApi.reject(Number(selectedItem.id), feedback.trim());
      await loadReviews();
      alert(`Đã từ chối học liệu: ${selectedItem.title}`);
      closeDrawer();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể từ chối học liệu.');
    } finally {
      setIsDecisionSubmitting(false);
    }
  };

  // Get instrument color tag style
  const getInstrumentTagClass = (ins: string) => {
    const lower = ins.toLowerCase();
    if (lower.includes('tranh')) {
      return 'bg-rose-50 border border-rose-200 text-rose-700';
    } else if (lower.includes('bầu')) {
      return 'bg-indigo-50 border border-indigo-200 text-indigo-700';
    } else if (lower.includes('trống')) {
      return 'bg-amber-50 border border-amber-200 text-amber-700';
    } else if (lower.includes('sáo')) {
      return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
    }
    return 'bg-[#eae8e3] border border-outline-variant text-on-surface-variant';
  };

  const parseReviewDate = (value: string) => {
    const matched = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (matched) {
      return new Date(
        Number(matched[3]),
        Number(matched[2]) - 1,
        Number(matched[1]),
        Number(matched[4] ?? 0),
        Number(matched[5] ?? 0),
        Number(matched[6] ?? 0),
      ).getTime();
    }
    const directTimestamp = Date.parse(value);
    return Number.isNaN(directTimestamp) ? 0 : directTimestamp;
  };

  // The API applies status, search, instructorId and instrumentId before pagination.
  const displayedItems = useMemo(
    () => [...items].sort((a, b) => parseReviewDate(b.date) - parseReviewDate(a.date)),
    [items],
  );

  const totalPages = Math.max(1, pageInfo.totalPages);
  const paginatedItems = displayedItems;
  const displayStart = pageInfo.totalElements === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const displayEnd = Math.min((currentPage - 1) * perPage + items.length, pageInfo.totalElements);

  // Status counts
  const pendingCount = reviewCounts.pending;
  const approvedCount = reviewCounts.approved;
  const rejectedCount = reviewCounts.rejected;
  const materialAssets = selectedItem?.assets.filter((asset) => !isAudioAsset(asset)) ?? [];
  const audioAssets = selectedItem?.assets.filter(isAudioAsset) ?? [];
  return (
    <div className="w-full mx-auto relative text-on-surface font-sans flex-1 flex flex-col justify-between">
      <div className="flex-grow">
      {/* Zoom Sheet Music Overlay */}
      {isPreviewZoomed && previewAsset && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-md cursor-zoom-out"
          onClick={() => setIsPreviewZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[95vh] flex flex-col items-center">
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-sm transition-all"
              onClick={() => setIsPreviewZoomed(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewAsset.assetUrl}
              alt={previewAsset.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
            />
            <p className="text-white mt-md font-label-md bg-black/50 px-lg py-sm rounded-full">
              {previewAsset.title}
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="mb-4 border-b border-outline-variant/10 pb-md">
        <h2
          className="text-headline-lg font-bold text-[#1D4532] mt-xs"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Kiểm duyệt học liệu
        </h2>
        <p className="text-body-md text-[#5e5e5b] mt-xs">
          Phê duyệt, từ chối và xem lại lịch sử kiểm duyệt các học liệu do Giảng viên đóng góp.
        </p>

        {/* Search + Filters bar — dưới tiêu đề */}
        <div className="flex flex-wrap items-center gap-md mt-lg">
          {/* Search Bar */}
          <div className="flex min-w-[320px] flex-1 items-center gap-xs px-md py-sm bg-white border border-[#d1e4fb] rounded-lg w-full lg:max-w-[42rem] shadow-sm focus-within:ring-1 focus-within:ring-[#1D4532] transition-all">
            <Search className="w-5 h-5 text-[#5e5e5b]" />
            <input
              type="text"
              placeholder="Tìm theo tên bài học, giảng viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-body-md w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="text-[#5e5e5b] hover:text-error transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Instrument Filter */}
          <div className="flex items-center gap-xs px-md py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
            <span className="font-label-md text-[#5e5e5b]">Nhạc cụ:</span>
            <select
              value={selectedInstrumentId ?? 'all'}
              onChange={(e) => {
                setSelectedInstrumentId(e.target.value === 'all' ? null : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Tất cả nhạc cụ</option>
              {instrumentOptions.map((instrument) => (
                <option key={instrument.id} value={instrument.id}>{instrument.name}</option>
              ))}
            </select>
          </div>

          {/* Instructor Filter */}
          <div className="flex w-full sm:w-72 items-center gap-xs px-md py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
            <span className="font-label-md text-[#5e5e5b]">Giảng viên:</span>
            <select
              value={selectedInstructorId ?? 'all'}
              onChange={(e) => {
                setSelectedInstructorId(e.target.value === 'all' ? null : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="min-w-0 flex-1 bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Tất cả giảng viên</option>
              {instructorOptions.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Status filtering pills */}
      <div className="flex flex-wrap gap-xs mb-lg border-b border-[#d1e4fb]/40 pb-sm">
        <button
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-lg py-sm rounded-t-lg font-label-md text-label-md transition-all border-b-2 ${
            statusFilter === 'all'
              ? 'border-[#1D4532] text-[#1D4532] bg-[#EDF7F2] font-bold'
              : 'border-transparent text-[#5e5e5b] hover:bg-[#EDF7F2]/50'
          }`}
        >
          Tất cả ({reviewCounts.all})
        </button>
        <button
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          className={`px-lg py-sm rounded-t-lg font-label-md text-label-md transition-all border-b-2 flex items-center gap-2 ${
            statusFilter === 'pending'
              ? 'border-orange-500 text-orange-700 bg-orange-50 font-bold'
              : 'border-transparent text-[#5e5e5b] hover:bg-orange-50/30'
          }`}
        >
          Chờ duyệt
          <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full text-xs font-semibold">
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => {
            setStatusFilter('approved');
            setCurrentPage(1);
          }}
          className={`px-lg py-sm rounded-t-lg font-label-md text-label-md transition-all border-b-2 flex items-center gap-2 ${
            statusFilter === 'approved'
              ? 'border-emerald-500 text-emerald-700 bg-emerald-50 font-bold'
              : 'border-transparent text-[#5e5e5b] hover:bg-emerald-50/30'
          }`}
        >
          Đã duyệt
          <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-semibold">
            {approvedCount}
          </span>
        </button>
        <button
          onClick={() => {
            setStatusFilter('rejected');
            setCurrentPage(1);
          }}
          className={`px-lg py-sm rounded-t-lg font-label-md text-label-md transition-all border-b-2 flex items-center gap-2 ${
            statusFilter === 'rejected'
              ? 'border-error text-error bg-red-50 font-bold'
              : 'border-transparent text-[#5e5e5b] hover:bg-red-50/30'
          }`}
        >
          Đã từ chối
          <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-xs font-semibold">
            {rejectedCount}
          </span>
        </button>
      </div>



      {loadError && (
        <div className="mb-lg flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <span>{loadError}</span>
          <button onClick={() => void loadReviews()} className="font-bold underline">Thử lại</button>
        </div>
      )}
      {/* Table Section */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-outline-variant/10 p-xxl text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#1D4532]/20 border-t-primary" />
          <p className="text-body-md text-on-surface-variant">Đang tải danh sách kiểm duyệt...</p>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-outline-variant/10 p-xxl text-center shadow-sm flex flex-col items-center justify-center gap-md">
          <p className="text-body-md text-on-surface-variant">
            Không tìm thấy học liệu nào phù hợp với bộ lọc hiện tại!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#d1e4fb]/40 overflow-hidden shadow-sm w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#e3efff] border-b border-[#d1e4fb]/50">
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider text-left">
                    Tên học liệu
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider text-center">
                    Nhạc cụ
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider text-left">
                    Giảng viên
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#1D4532] font-bold uppercase tracking-wider text-center">
                    Ngày gửi
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider text-center">
                    Trạng thái
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1e4fb]/40">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openDrawer(item)}
                    className="hover:bg-[#EDF7F2] transition-colors cursor-pointer"
                  >
                    <td className="px-xl py-lg">
                      <div className="font-body-md font-bold text-[#1D4532]">
                        {item.title}
                      </div>
                      <div className="text-[12px] text-on-surface-variant">
                        ID: {item.id}
                      </div>
                    </td>
                    <td className="px-xl py-lg whitespace-nowrap text-center">
                      <span
                        className={`px-lg py-sm rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${getInstrumentTagClass(
                          item.instrument
                        )}`}
                      >
                        {item.instrument}
                      </span>
                    </td>
                    <td className="px-xl py-lg text-body-md text-on-surface font-semibold whitespace-nowrap">
                      {item.instructor}
                    </td>
                    <td className="px-xl py-lg text-body-md text-on-surface-variant whitespace-nowrap text-center">
                      {item.date}
                    </td>
                    <td className="px-xl py-lg whitespace-nowrap text-center">
                      {item.status === 'pending' && (
                        <span className="px-lg py-sm bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap">
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="px-lg py-sm bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap">
                          Đã duyệt
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-lg py-sm bg-red-50 border border-red-200 text-error rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap">
                          Đã từ chối
                        </span>
                      )}
                    </td>
                    <td className="px-xl py-lg text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDrawer(item)}
                        className={`inline-flex w-40 items-center justify-center gap-xs px-lg py-sm rounded-lg font-label-sm text-label-sm transition-all active:scale-95 shadow-sm whitespace-nowrap ${
                          item.status === 'pending'
                            ? 'bg-[#1D4532] text-white hover:bg-[#1D4532]/90'
                            : 'border border-[#1D4532] text-[#1D4532] hover:bg-[#EDF7F2]'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        {item.status === 'pending' ? 'Kiểm duyệt' : 'Xem lại'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Pagination Controls */}
      {pageInfo.totalElements > 0 && (
        <div className="mt-lg flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b] pt-4">
          <div className="flex items-center gap-lg">
            <p>
              Hiển thị {displayStart} - {displayEnd} trong tổng số {pageInfo.totalElements} học liệu
            </p>

            <div className="flex items-center gap-xs">
              <span>Số dòng mỗi trang:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-outline-variant rounded px-2 py-1 text-label-md cursor-pointer outline-none"
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
              className="p-2 border border-outline-variant rounded hover:bg-[#e3efff] transition-colors disabled:opacity-40"
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
                    : 'border border-outline-variant hover:bg-[#e3efff]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 border border-outline-variant rounded hover:bg-[#e3efff] transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer Component using Framer Motion */}
      <AnimatePresence>
        {isDrawerOpen && selectedItem && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[65%] md:w-[55%] lg:w-[50%] bg-surface-bright border-l border-outline-variant/15 shadow-2xl z-50 overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-[#1D4532] font-sans">
                    Trình xem trước học liệu
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    {selectedItem.title} ({selectedItem.id}) • Gửi bởi {selectedItem.instructor}
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-md hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Body - Scrollable content area */}
              <div className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar">
                {/* Visual Preview Card */}
                <div className="bg-white/95 backdrop-blur-md border border-[#d1e4fb]/40 rounded-2xl p-lg shadow-sm space-y-lg">
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      1. Tài liệu đính kèm ({materialAssets.length})
                    </span>
                    {materialAssets.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-outline-variant/40 bg-[#f5f3ee]/50 px-md py-lg text-sm text-on-surface-variant">
                        Không có tài liệu đính kèm.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                        {materialAssets.map((asset) => isImageAsset(asset) ? (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => {
                              setPreviewAsset(asset);
                              setIsPreviewZoomed(true);
                            }}
                            className="group overflow-hidden rounded-xl border border-outline-variant/20 bg-[#f5f3ee] text-left transition-shadow hover:shadow-md"
                          >
                            <img src={asset.assetUrl} alt={asset.title} className="h-40 w-full object-cover" />
                            <span className="flex items-center justify-between gap-2 px-md py-sm text-sm font-semibold text-[#1D4532]">
                              <span className="truncate">{asset.title}</span>
                              <ZoomIn className="h-4 w-4 shrink-0" />
                            </span>
                          </button>
                        ) : (
                          <a
                            key={asset.id}
                            href={asset.assetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-28 items-center justify-between gap-md rounded-xl border border-outline-variant/20 bg-[#f5f3ee]/50 px-md py-md text-[#1D4532] hover:bg-[#EDF7F2]"
                          >
                            <span className="min-w-0">
                              <FileText className="mb-2 h-5 w-5" />
                              <span className="block truncate text-sm font-semibold">{asset.title}</span>
                              <span className="block text-xs text-on-surface-variant">{asset.mimeType || asset.assetType}</span>
                            </span>
                            <ExternalLink className="h-4 w-4 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      2. Tệp âm thanh ({audioAssets.length})
                    </span>
                    {audioAssets.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-outline-variant/40 bg-[#f5f3ee]/50 px-md py-lg text-sm text-on-surface-variant">
                        Không có tệp âm thanh đính kèm.
                      </div>
                    ) : (
                      <div className="space-y-md">
                        {audioAssets.map((asset) => (
                          <div key={asset.id} className="rounded-xl border border-[#d1e4fb]/40 bg-[#f5f3ee]/50 p-md">
                            <div className="mb-sm flex items-center justify-between gap-md">
                              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#1D4532]">
                                <Music2 className="h-5 w-5 shrink-0" />
                                <span className="truncate">{asset.title}</span>
                              </span>
                              {formatDuration(asset.durationSec) && <span className="text-xs text-on-surface-variant">{formatDuration(asset.durationSec)}</span>}
                            </div>
                            <audio className="w-full" controls preload="metadata" src={asset.assetUrl}>
                              Trình duyệt không hỗ trợ phát tệp âm thanh này.
                            </audio>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Technical Description Section */}
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      3. Mô tả học liệu
                    </span>
                    <div className="bg-[#fbf9f4] border border-[#d1e4fb]/40 rounded-xl p-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description || 'Không có mô tả kỹ thuật chi tiết kèm theo học liệu này.'}
                    </div>
                  </div>

                  {selectedItem.technicalNotes && (
                    <div>
                      <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                        4. Ghi chú kỹ thuật
                      </span>
                      <div className="bg-[#EDF7F2] border border-[#d1e4fb]/40 rounded-xl p-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                        {selectedItem.technicalNotes}
                      </div>
                    </div>
                  )}

                  {/* Feedback Textarea & Validation */}
                  <div className="pt-md border-t border-outline-variant/10">
                    {selectedItem.status === 'pending' ? (
                      <>
                        <label className="font-label-sm text-on-surface-variant block mb-xs font-semibold uppercase tracking-wider text-xs">
                          Lý do phản hồi <span className="text-error font-bold">* Bắt buộc nếu chọn Từ chối</span>
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => {
                            setFeedback(e.target.value);
                            if (e.target.value.trim() !== '') setFeedbackError('');
                          }}
                          className={`w-full bg-[#fbf9f4] border rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] h-28 transition-all outline-none ${
                            feedbackError ? 'border-error ring-1 ring-error' : 'border-outline-variant/30'
                          }`}
                          placeholder="Bắt buộc phải nhập lý do chi tiết khi từ chối học liệu..."
                        />
                        {feedbackError && (
                          <p className="text-xs text-[#ba1a1a] font-semibold mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] inline-block animate-ping" />
                            {feedbackError}
                          </p>
                        )}
                      </>
                    ) : selectedItem.status === 'approved' ? (
                      <div className="bg-emerald-50/50 p-md rounded-xl border border-emerald-200/60">
                        <span className="font-label-sm text-emerald-800 block mb-xs font-semibold uppercase tracking-wider text-xs">
                          Thông tin phê duyệt
                        </span>
                        <p className="text-body-md text-on-surface font-semibold">
                          Đã phê duyệt bởi: <span className="text-[#1b5e20]">{selectedItem.approvedBy || 'Chưa có thông tin'}</span>
                        </p>
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          Thời gian phê duyệt: {selectedItem.approvedAt || 'Chưa có thông tin'}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50/50 p-md rounded-xl border border-red-200/60">
                        <span className="font-label-sm text-red-800 block mb-xs font-semibold uppercase tracking-wider text-xs">
                          Lý do từ chối (Admin phản hồi)
                        </span>
                        <p className="text-body-md text-on-surface italic leading-relaxed">
                          "{selectedItem.feedback || 'Không có phản hồi đi kèm.'}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md">
                {selectedItem.status === 'pending' ? (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={isDecisionSubmitting}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#c62828] text-white py-lg rounded-xl font-bold hover:bg-[#b71c1c] active:scale-[0.98] transition-all shadow-sm disabled:cursor-wait disabled:opacity-60"
                    >
                      <X className="w-5 h-5" />
                      {isDecisionSubmitting ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isDecisionSubmitting}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-lg rounded-xl font-bold hover:bg-[#1b5e20]/90 active:scale-[0.98] transition-all shadow-sm disabled:cursor-wait disabled:opacity-60"
                    >
                      <Check className="w-5 h-5" />
                      {isDecisionSubmitting ? 'Đang xử lý...' : 'Phê duyệt'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={closeDrawer}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#e1dfdb] text-on-surface py-lg rounded-xl font-bold hover:bg-[#c8c6c2] active:scale-[0.98] transition-all border border-outline-variant/30"
                    >
                      <X className="w-5 h-5" />
                      Đóng
                    </button>

                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminReview;
