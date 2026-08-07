import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  X,
  Check,
  Eye,
  Search,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewsApi } from '../../api/services';
import type { ReviewItem as ApiReviewItem } from '../../api/types';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

interface ReviewItem {
  id: string;
  title: string;
  instrument: string;
  instructor: string;
  date: string;
  sheetMusicUrl: string;
  audioUrl: string;
  duration: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  feedback?: string;
  approvedBy?: string;
  approvedAt?: string;
}

const normalizeReview = (item: ApiReviewItem): ReviewItem => ({
  id: String(item.id),
  title: item.title || 'Bài giảng chưa đặt tên',
  instrument: item.instrument || 'Chưa xác định',
  instructor: item.instructor || 'Chưa xác định',
  date: item.date || '',
  sheetMusicUrl: item.sheetMusicUrl || '',
  audioUrl: item.audioUrl || '',
  duration: item.duration || '00:00',
  description: item.description || '',
  status: String(item.status || 'pending').trim().toLowerCase() as ReviewItem['status'],
  feedback: item.feedback,
  approvedBy: item.approvedBy,
  approvedAt: item.approvedAt,
});

const AdminReview = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { execute: requestReviews } = useAxiosRequest<ReviewItem[]>(async (signal) => {
    const reviewData = await reviewsApi.list({ signal });
    return Array.isArray(reviewData) ? reviewData.map(normalizeReview) : [];
  }, { auto: false });

  const loadReviews = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const reviewData = await requestReviews(signal);
      if (reviewData) setItems(reviewData);
    } catch (error) {
      setItems([]);
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách kiểm duyệt.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [requestReviews]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadReviews(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadReviews]);
  // Filtering states
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState<boolean>(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const openDrawer = (item: ReviewItem) => {
    setSelectedItem(item);
    setFeedback(item.feedback || '');
    setFeedbackError('');
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    audioRef.current?.pause();
    setIsDrawerOpen(false);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleAudioPlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !selectedItem?.audioUrl) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }
    audio.pause();
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      await reviewsApi.approve(Number(selectedItem.id));
      await loadReviews();
      alert(`Đã phê duyệt học liệu: ${selectedItem.title}`);
      closeDrawer();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể phê duyệt học liệu.');
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!feedback.trim()) {
      setFeedbackError('Lý do từ chối là bắt buộc để giảng viên nắm được thông tin chỉnh sửa.');
      return;
    }
    try {
      await reviewsApi.reject(Number(selectedItem.id), feedback.trim());
      await loadReviews();
      alert(`Đã từ chối học liệu: ${selectedItem.title}`);
      closeDrawer();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể từ chối học liệu.');
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

  const instructorOptions = useMemo(
    () => Array.from(new Set(
      items
        .filter((item) => item.status !== 'draft')
        .filter((item) => selectedInstrument === 'all' || item.instrument === selectedInstrument)
        .map((item) => item.instructor)
        .filter(Boolean),
    )).sort((a, b) => a.localeCompare(b, 'vi')),
    [items, selectedInstrument],
  );

  // Filter items based on criteria
  const moderationItems = useMemo(() => items.filter((item) => item.status !== 'draft'), [items]);

  const filteredItems = useMemo(() => {
    return moderationItems.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // 2. Search query (title, id, instructor)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (
          !item.title.toLowerCase().includes(q) &&
          !item.id.toLowerCase().includes(q) &&
          !item.instructor.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // 3. Instrument filter
      if (selectedInstrument !== 'all' && item.instrument !== selectedInstrument) {
        return false;
      }
      // 4. Instructor filter
      if (selectedInstructor !== 'all' && item.instructor !== selectedInstructor) {
        return false;
      }
      return true;
    }).sort((a, b) => parseReviewDate(b.date) - parseReviewDate(a.date));
  }, [moderationItems, statusFilter, searchQuery, selectedInstrument, selectedInstructor]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(
      (currentPage - 1) * perPage,
      currentPage * perPage
    );
  }, [filteredItems, currentPage, perPage]);

  // Status counts
  const pendingCount = moderationItems.filter((i) => i.status === 'pending').length;
  const approvedCount = moderationItems.filter((i) => i.status === 'approved').length;
  const rejectedCount = moderationItems.filter((i) => i.status === 'rejected').length;
  const instrumentOptions = useMemo(
    () => Array.from(new Set(moderationItems.map((item) => item.instrument))).filter(Boolean),
    [moderationItems],
  );

  return (
    <div className="w-full mx-auto relative text-on-surface font-sans flex-1 flex flex-col justify-between">
      <div className="flex-grow">
      {/* Zoom Sheet Music Overlay */}
      {isPreviewZoomed && selectedItem && (
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
              src={selectedItem.sheetMusicUrl}
              alt={selectedItem.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
            />
            <p className="text-white mt-md font-label-md bg-black/50 px-lg py-sm rounded-full">
              Khuông nhạc / Sheet nhạc: {selectedItem.title}
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
              value={selectedInstrument}
              onChange={(e) => {
                const nextInstrument = e.target.value;
                setSelectedInstrument(nextInstrument);
                setSelectedInstructor((current) => current !== 'all' && !moderationItems.some((item) => (nextInstrument === 'all' || item.instrument === nextInstrument) && item.instructor === current) ? 'all' : current);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Tất cả nhạc cụ</option>
              {instrumentOptions.map((ins) => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>

          {/* Instructor Filter */}
          <div className="flex w-full sm:w-72 items-center gap-xs px-md py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
            <span className="font-label-md text-[#5e5e5b]">Giảng viên:</span>
            <input
              list="review-instructors"
              type="search"
              placeholder="Tất cả giảng viên"
              value={selectedInstructor === 'all' ? '' : selectedInstructor}
              onChange={(e) => {
                setSelectedInstructor(e.target.value || 'all');
                setCurrentPage(1);
              }}
              className="min-w-0 flex-1 bg-transparent border-none text-label-md font-semibold text-[#1D4532] placeholder:font-semibold placeholder:text-[#1D4532] placeholder:opacity-100 focus:ring-0 outline-none"
            />
            <datalist id="review-instructors">
              {instructorOptions.map((instructor) => (
                <option key={instructor} value={instructor} />
              ))}
            </datalist>
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
          Tất cả ({moderationItems.length})
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
      ) : filteredItems.length === 0 ? (
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
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider">
                    Tên học liệu
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider">
                    Nhạc cụ
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider">
                    Giảng viên
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-xl py-md font-label-sm text-label-sm text-[#5e5e5b] font-bold uppercase tracking-wider text-right">
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
                    <td className="px-xl py-lg whitespace-nowrap">
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
                    <td className="px-xl py-lg text-body-md text-on-surface-variant whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-xl py-lg whitespace-nowrap">
                      {item.status === 'draft' && (
                        <span className="px-lg py-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap">
                          Bản nháp
                        </span>
                      )}                      {item.status === 'pending' && (
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
                    <td className="px-xl py-lg text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDrawer(item)}
                        className={`inline-flex items-center gap-xs px-lg py-sm rounded-lg font-label-sm text-label-sm transition-all active:scale-95 shadow-sm whitespace-nowrap ${
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
      {filteredItems.length > 0 && (
        <div className="mt-lg flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b] pt-4">
          <div className="flex items-center gap-lg">
            <p>
              Hiển thị {(currentPage - 1) * perPage + 1} -{' '}
              {Math.min(currentPage * perPage, filteredItems.length)} trong tổng số{' '}
              {filteredItems.length} học liệu
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
                  {/* Sheet Music Section */}
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      1. Khuông nhạc / Sheet nhạc
                    </span>
                    <div className="relative group aspect-[4/3] bg-[#f5f3ee] rounded-xl overflow-hidden border border-outline-variant/20 flex items-center justify-center">
                      <img
                        src={selectedItem.sheetMusicUrl}
                        alt="Sheet Music Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setIsPreviewZoomed(true)}
                          className="bg-white text-[#1D4532] px-lg py-md rounded-full shadow-lg font-label-md flex items-center gap-xs hover:scale-105 active:scale-95 transition-transform"
                        >
                          <ZoomIn className="w-5 h-5" />
                          Phóng to ảnh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audio Player Section */}
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      2. Bản âm thanh minh họa
                    </span>
                    <div className="bg-[#f5f3ee]/50 border border-[#d1e4fb]/30 rounded-xl p-md">
                      <audio
                        ref={audioRef}
                        src={selectedItem.audioUrl || undefined}
                        preload="metadata"
                        onLoadedMetadata={(event) => setAudioDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
                        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                      />
                      <div className="flex justify-between items-center mb-sm">
                        <span className="text-label-sm font-bold text-on-surface truncate max-w-[200px]">
                          {selectedItem.audioUrl ? `Audio tham chiếu #${selectedItem.id}` : 'Không có tệp âm thanh đính kèm'}
                        </span>
                        <span className="text-label-sm font-bold text-[#1D4532]">
                          {formatTime(currentTime)} / {audioDuration > 0 ? formatTime(audioDuration) : selectedItem.duration}
                        </span>
                      </div>

                      {/* Interactive Waveform visual */}
                      <div className="h-16 flex items-end justify-between gap-[3px] relative overflow-hidden bg-white/60 border border-outline-variant/10 rounded p-sm mb-md">
                        {[
                          60, 40, 55, 95, 30, 75, 65, 80, 50, 70, 90, 60, 45, 75,
                          35, 85, 70, 50, 65, 80, 45, 90, 55, 30, 70, 85, 60, 40,
                        ].map((val, index, arr) => {
                          const percent = currentTime / Math.max(audioDuration, 1);
                          const barPercent = index / arr.length;
                          const isPlayed = barPercent <= percent;

                          return (
                            <div
                              key={index}
                              className={`w-full rounded-full transition-all duration-300 ${
                                isPlayed ? 'bg-[#1D4532]' : 'bg-[#1D4532]/25'
                              }`}
                              style={{
                                height: isPlaying
                                  ? `${Math.min(100, val + Math.sin(currentTime * 2 + index) * 15)}%`
                                  : `${val}%`,
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex justify-center">
                        <button
                        onClick={() => void toggleAudioPlayback()}
                        disabled={!selectedItem.audioUrl}
                        className="w-12 h-12 bg-[#1D4532] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-white ml-[3px]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Technical Description Section */}
                  <div>
                    <span className="font-label-sm text-on-surface-variant block mb-sm font-semibold uppercase tracking-wider text-xs">
                      3. Mô tả kỹ thuật học liệu
                    </span>
                    <div className="bg-[#fbf9f4] border border-[#d1e4fb]/40 rounded-xl p-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                      {selectedItem.description || 'Không có mô tả kỹ thuật chi tiết kèm theo học liệu này.'}
                    </div>
                  </div>

                  {/* Feedback Textarea & Validation */}
                  <div className="pt-md border-t border-outline-variant/10">
                    {selectedItem.status === 'draft' ? (
                      <div className="bg-slate-50 p-md rounded-xl border border-slate-200">
                        <span className="font-label-sm text-slate-700 block mb-xs font-semibold uppercase tracking-wider text-xs">
                          Bản nháp chưa gửi duyệt
                        </span>
                        <p className="text-body-md text-on-surface-variant">
                          Giảng viên cần chuyển bài giảng sang trạng thái Chờ duyệt trước khi quản trị viên có thể phê duyệt hoặc từ chối.
                        </p>
                      </div>
                    ) : selectedItem.status === 'pending' ? (
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
                          Đã phê duyệt bởi: <span className="text-[#1b5e20]">{selectedItem.approvedBy || 'Trần Minh Quân (Admin)'}</span>
                        </p>
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          Thời gian phê duyệt: {selectedItem.approvedAt || '25/10/2024 10:45'}
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
                      className="flex-1 flex items-center justify-center gap-sm bg-[#c62828] text-white py-lg rounded-xl font-bold hover:bg-[#b71c1c] active:scale-[0.98] transition-all shadow-sm"
                    >
                      <X className="w-5 h-5" />
                      Từ chối
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-lg rounded-xl font-bold hover:bg-[#1b5e20]/90 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Check className="w-5 h-5" />
                      Phê duyệt
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
