import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Music2,
  RefreshCw,
  Search,
  User,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { masterDataApi, reviewsApi, usersApi } from '../../api/services';
import type { AdminUser, Instrument, ReviewItem } from '../../api/types';

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type ReviewAsset = NonNullable<ReviewItem['assets']>[number];

interface ReviewCounts {
  pending?: number;
  approved?: number;
  rejected?: number;
}

interface PageInfo {
  totalElements: number;
  totalPages: number;
}

interface Notice {
  type: 'success' | 'error';
  message: string;
}

const STATUS_OPTIONS: Array<{
  id: ReviewStatus;
  label: string;
  description: string;
  icon: typeof Clock3;
  activeClass: string;
}> = [
  {
    id: 'pending',
    label: 'Chờ duyệt',
    description: 'Cần xử lý',
    icon: Clock3,
    activeClass: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  {
    id: 'approved',
    label: 'Đã phê duyệt',
    description: 'Đủ điều kiện phát hành',
    icon: CheckCircle2,
    activeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    id: 'rejected',
    label: 'Đã từ chối',
    description: 'Cần giảng viên chỉnh sửa',
    icon: XCircle,
    activeClass: 'border-red-300 bg-red-50 text-red-800',
  },
];

const normalizeReview = (item: ReviewItem): ReviewItem => ({
  ...item,
  status: String(item.status ?? 'pending').toLowerCase() as ReviewItem['status'],
  assets: Array.isArray(item.assets) ? item.assets : [],
});

const isAudioAsset = (asset: ReviewAsset) => {
  const type = `${asset.mimeType ?? ''} ${asset.assetType ?? ''}`.toLowerCase();
  return type.includes('audio') || /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(asset.assetUrl);
};

const isImageAsset = (asset: ReviewAsset) => {
  const type = `${asset.mimeType ?? ''} ${asset.assetType ?? ''}`.toLowerCase();
  return type.includes('image') || type.includes('sheet') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(asset.assetUrl);
};

const isVideoAsset = (asset: ReviewAsset) => {
  const type = `${asset.mimeType ?? ''} ${asset.assetType ?? ''}`.toLowerCase();
  return type.includes('video') || /\.(mp4|webm|mov)(\?|$)/i.test(asset.assetUrl);
};

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || !Number.isFinite(seconds)) return '';
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const statusBadge = (status: ReviewItem['status']) => {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
};

const statusLabel = (status: ReviewItem['status']) => {
  if (status === 'approved') return 'Đã phê duyệt';
  if (status === 'rejected') return 'Đã từ chối';
  return 'Chờ duyệt';
};

const AdminReview = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [counts, setCounts] = useState<ReviewCounts>({});
  const [pageInfo, setPageInfo] = useState<PageInfo>({ totalElements: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [instrumentId, setInstrumentId] = useState<number | null>(null);
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instructors, setInstructors] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [submittingAction, setSubmittingAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const instructorParams = new URLSearchParams({ page: '0', size: '100', sortBy: 'fullName', sortDir: 'asc' });
      instructorParams.append('roles', 'INSTRUCTOR');
      void Promise.allSettled([
        masterDataApi.instruments(),
        usersApi.list({ params: instructorParams }),
      ]).then(([instrumentResult, instructorResult]) => {
        if (instrumentResult.status === 'fulfilled') setInstruments(instrumentResult.value);
        if (instructorResult.status === 'fulfilled') setInstructors(instructorResult.value.content ?? []);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const createParams = useCallback((status: ReviewStatus, page = 0, size = 1) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      status: status.toUpperCase(),
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (instrumentId !== null) params.set('instrumentId', String(instrumentId));
    if (instructorId !== null) params.set('instructorId', String(instructorId));
    return params;
  }, [debouncedSearch, instrumentId, instructorId]);

  const loadReviews = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError('');

    const results = await Promise.allSettled([
      reviewsApi.list(createParams(statusFilter, currentPage - 1, perPage)),
      reviewsApi.list(createParams('pending')),
      reviewsApi.list(createParams('approved')),
      reviewsApi.list(createParams('rejected')),
    ]);

    if (requestId !== requestIdRef.current) return;
    const [pageResult, pendingResult, approvedResult, rejectedResult] = results;

    if (pageResult.status === 'rejected') {
      setItems([]);
      setPageInfo({ totalElements: 0, totalPages: 1 });
      setLoadError(pageResult.reason instanceof Error ? pageResult.reason.message : 'Không thể tải hàng đợi kiểm duyệt.');
    } else {
      setItems((pageResult.value.content ?? []).map(normalizeReview).filter((item) => item.status !== 'draft'));
      setPageInfo({
        totalElements: pageResult.value.totalElements ?? 0,
        totalPages: Math.max(1, pageResult.value.totalPages ?? 1),
      });
    }

    setCounts({
      pending: pendingResult.status === 'fulfilled' ? pendingResult.value.totalElements : undefined,
      approved: approvedResult.status === 'fulfilled' ? approvedResult.value.totalElements : undefined,
      rejected: rejectedResult.status === 'fulfilled' ? rejectedResult.value.totalElements : undefined,
    });
    setLoading(false);
  }, [createParams, currentPage, perPage, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  useEffect(() => {
    if (!selectedItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && submittingAction === null) setSelectedItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedItem, submittingAction]);

  const openReview = (item: ReviewItem) => {
    setSelectedItem(item);
    setFeedback(item.feedback ?? '');
    setFeedbackError('');
    setConfirmApprove(false);
    setNotice(null);
  };

  const closeReview = () => {
    if (submittingAction) return;
    setSelectedItem(null);
    setConfirmApprove(false);
  };

  const approveReview = async () => {
    if (!selectedItem) return;
    setSubmittingAction('approve');
    setNotice(null);
    try {
      await reviewsApi.approve(Number(selectedItem.id));
      setNotice({ type: 'success', message: `Đã phê duyệt bài học “${selectedItem.title}” cùng các tài liệu đính kèm.` });
      setSelectedItem(null);
      setConfirmApprove(false);
      await loadReviews();
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Không thể phê duyệt bài học.' });
    } finally {
      setSubmittingAction(null);
    }
  };

  const rejectReview = async () => {
    if (!selectedItem) return;
    if (!feedback.trim()) {
      setFeedbackError('Vui lòng nhập lý do để giảng viên biết nội dung cần chỉnh sửa.');
      return;
    }
    setSubmittingAction('reject');
    setNotice(null);
    try {
      await reviewsApi.reject(Number(selectedItem.id), feedback.trim());
      setNotice({ type: 'success', message: `Đã từ chối bài học “${selectedItem.title}” và gửi phản hồi cho giảng viên.` });
      setSelectedItem(null);
      await loadReviews();
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Không thể từ chối bài học.' });
    } finally {
      setSubmittingAction(null);
    }
  };

  const totalModerated = useMemo(() => {
    const values = [counts.pending, counts.approved, counts.rejected];
    if (values.some((value) => value === undefined)) return undefined;
    return values.reduce<number>((total, value) => total + (value ?? 0), 0);
  }, [counts]);

  const selectedAssets = selectedItem?.assets ?? [];
  const audioAssets = selectedAssets.filter(isAudioAsset);
  const otherAssets = selectedAssets.filter((asset) => !isAudioAsset(asset));
  const displayStart = pageInfo.totalElements === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const displayEnd = Math.min(currentPage * perPage, pageInfo.totalElements);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#163d2d] md:text-4xl">Kiểm duyệt học liệu</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#68736d] md:text-base">
          Xem xét nội dung bài học và nghe lại tài liệu âm thanh trước khi phê duyệt hoặc yêu cầu chỉnh sửa.
        </p>
      </header>

      {notice && (
        <div role="status" className={`flex items-center gap-2 rounded-xl border px-5 py-4 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{notice.message}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Trạng thái kiểm duyệt">
        <article className="rounded-2xl border border-[#dfe9e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#64736b]">Tổng học liệu kiểm duyệt</p>
          <p className="mt-2 text-3xl font-bold text-[#173f2f]">{totalModerated?.toLocaleString('vi-VN') ?? '—'}</p>
          <p className="mt-1 text-xs text-[#87938c]">Không bao gồm bản nháp của giảng viên</p>
        </article>
        {STATUS_OPTIONS.map((status) => {
          const Icon = status.icon;
          const value = counts[status.id];
          const active = statusFilter === status.id;
          return (
            <button
              key={status.id}
              type="button"
              onClick={() => {
                setStatusFilter(status.id);
                setCurrentPage(1);
              }}
              className={`rounded-2xl border p-5 text-left shadow-sm transition ${active ? status.activeClass : 'border-[#dfe9e3] bg-white hover:border-[#bfd3c7]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{status.label}</p>
                  <p className="mt-2 text-3xl font-bold">{value?.toLocaleString('vi-VN') ?? '—'}</p>
                  <p className="mt-1 text-xs opacity-75">{status.description}</p>
                </div>
                <Icon className="h-5 w-5" />
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#dfe9e3] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d8e4dd] bg-white px-3 focus-within:border-[#1D6750]">
            <Search className="h-4 w-4 shrink-0 text-[#7b8981]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên bài học hoặc giảng viên..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#274b3b] outline-none"
            />
          </label>

          <select
            value={instructorId ?? ''}
            onChange={(event) => {
              setInstructorId(event.target.value ? Number(event.target.value) : null);
              setCurrentPage(1);
            }}
            className="h-11 rounded-xl border border-[#d8e4dd] bg-white px-3 text-sm text-[#365647] outline-none focus:border-[#1D6750]"
          >
            <option value="">Tất cả giảng viên</option>
            {instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name}</option>)}
          </select>

          <select
            value={instrumentId ?? ''}
            onChange={(event) => {
              setInstrumentId(event.target.value ? Number(event.target.value) : null);
              setCurrentPage(1);
            }}
            className="h-11 rounded-xl border border-[#d8e4dd] bg-white px-3 text-sm text-[#365647] outline-none focus:border-[#1D6750]"
          >
            <option value="">Tất cả nhạc cụ</option>
            {instruments.map((instrument) => <option key={instrument.id} value={instrument.id}>{instrument.name}</option>)}
          </select>

          <button type="button" onClick={() => void loadReviews()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8e4dd] bg-white px-4 text-sm font-semibold text-[#1D4532] hover:bg-[#f7faf8] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </section>

      {loadError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadReviews()} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(20,61,44,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead className="bg-[#f4f8f6] text-xs uppercase tracking-wide text-[#64736b]">
              <tr>
                <th className="px-5 py-4 font-semibold">Bài học</th>
                <th className="px-5 py-4 font-semibold">Giảng viên</th>
                <th className="px-5 py-4 font-semibold">Nhạc cụ</th>
                <th className="px-5 py-4 font-semibold">Tài liệu tải lên</th>
                <th className="px-5 py-4 font-semibold">Ngày gửi</th>
                <th className="px-5 py-4 font-semibold">Trạng thái</th>
                <th className="px-5 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ef]">
              {loading ? (
                [0, 1, 2, 3].map((row) => (
                  <tr key={row}><td colSpan={7} className="px-5 py-3"><div className="h-12 animate-pulse rounded-xl bg-[#f1f5f3]" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <FileText className="mx-auto h-8 w-8 text-[#9aaba2]" />
                    <p className="mt-3 font-semibold text-[#365647]">Không có học liệu phù hợp</p>
                    <p className="mt-1 text-sm text-[#7a8780]">Thử thay đổi từ khóa hoặc bộ lọc hiện tại.</p>
                  </td>
                </tr>
              ) : items.map((item) => {
                const assets = item.assets ?? [];
                const audioCount = assets.filter(isAudioAsset).length;
                return (
                  <tr key={item.id} className="transition hover:bg-[#fafcfb]">
                    <td className="px-5 py-4">
                      <p className="max-w-64 truncate text-sm font-semibold text-[#294c3c]">{item.title || 'Chưa cập nhật tiêu đề'}</p>
                      <p className="mt-1 text-xs text-[#87938c]">ID: {item.lessonId ?? item.id}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#52655b]">{item.instructor || 'Chưa cập nhật'}</td>
                    <td className="px-5 py-4 text-sm text-[#52655b]">{item.instrument || 'Chưa cập nhật'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5f1] px-2 py-1 font-semibold text-[#416052]"><FileText className="h-3.5 w-3.5" /> {assets.length}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700"><Music2 className="h-3.5 w-3.5" /> {audioCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#64736b]">{item.date || 'Chưa cập nhật'}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{statusLabel(item.status)}</span></td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => openReview(item)} className="rounded-lg border border-[#cfded6] px-3 py-2 text-xs font-semibold text-[#1D4532] transition hover:bg-[#edf5f1]">Xem xét</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e8eeea] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#718078]">Hiển thị {displayStart}–{displayEnd} trong {pageInfo.totalElements.toLocaleString('vi-VN')} kết quả</p>
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setCurrentPage(1); }} className="h-9 rounded-lg border border-[#d8e4dd] bg-white px-2 text-sm text-[#52655b]">
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
            <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((page) => page - 1)} className="h-9 rounded-lg border border-[#d8e4dd] px-3 text-sm font-semibold text-[#52655b] disabled:opacity-40">Trước</button>
            <span className="min-w-20 text-center text-sm font-semibold text-[#365647]">{currentPage}/{pageInfo.totalPages}</span>
            <button type="button" disabled={currentPage >= pageInfo.totalPages || loading} onClick={() => setCurrentPage((page) => page + 1)} className="h-9 rounded-lg border border-[#d8e4dd] px-3 text-sm font-semibold text-[#52655b] disabled:opacity-40">Sau</button>
          </div>
        </div>
      </section>

      {selectedItem && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/35 backdrop-blur-[2px] sm:p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) closeReview(); }}>
          <aside className="flex h-full w-full max-w-3xl flex-col bg-[#f7faf8] shadow-2xl" role="dialog" aria-modal="true" aria-label={`Kiểm duyệt ${selectedItem.title}`}>
            <header className="z-10 flex shrink-0 items-start justify-between gap-4 border-b border-[#dfe9e3] bg-white px-5 py-4 md:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(selectedItem.status)}`}>{statusLabel(selectedItem.status)}</span>
                  <span className="text-xs text-[#87938c]">Bài học #{selectedItem.lessonId ?? selectedItem.id}</span>
                </div>
                <h2 className="mt-2 truncate text-xl font-bold text-[#173f2f]">{selectedItem.title || 'Chưa cập nhật tiêu đề'}</h2>
              </div>
              <button type="button" onClick={closeReview} disabled={submittingAction !== null} aria-label="Đóng" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#64736b] hover:bg-[#f1f5f3] disabled:opacity-40"><X className="h-5 w-5" /></button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 md:p-6">
              <section className="grid grid-cols-1 gap-3 rounded-2xl border border-[#dfe9e3] bg-white p-5 sm:grid-cols-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#87938c]">Giảng viên</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#365647]"><User className="h-4 w-4" /> {selectedItem.instructor || 'Chưa cập nhật'}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#87938c]">Nhạc cụ</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#365647]"><Music2 className="h-4 w-4" /> {selectedItem.instrument || 'Chưa cập nhật'}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#87938c]">Ngày gửi</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#365647]"><Clock3 className="h-4 w-4" /> {selectedItem.date || 'Chưa cập nhật'}</p></div>
              </section>

              <section className="rounded-2xl border border-[#dfe9e3] bg-white p-5">
                <h3 className="font-bold text-[#274b3b]">Nội dung bài học</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#52655b]">{selectedItem.description || 'Bài học chưa có mô tả.'}</p>
                {selectedItem.technicalNotes && selectedItem.technicalNotes !== selectedItem.description && (
                  <div className="mt-4 rounded-xl bg-[#f4f8f6] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">Ghi chú kỹ thuật</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#52655b]">{selectedItem.technicalNotes}</p></div>
                )}
              </section>

              <section className="rounded-2xl border border-[#dfe9e3] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><h3 className="font-bold text-[#274b3b]">Tài liệu âm thanh</h3><p className="mt-1 text-sm text-[#718078]">Nghe toàn bộ tệp trước khi đưa ra quyết định.</p></div>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{audioAssets.length} tệp</span>
                </div>
                {audioAssets.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-[#d7e3dc] bg-[#fafcfb] px-4 py-8 text-center text-sm text-[#718078]">Bài học không có tài liệu âm thanh đính kèm.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {audioAssets.map((asset) => (
                      <article key={asset.id} className="rounded-xl border border-[#dfe9e3] bg-[#fafcfb] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-semibold text-[#365647]">{asset.title || `Tệp âm thanh #${asset.id}`}</p>{formatDuration(asset.durationSec) && <span className="shrink-0 text-xs text-[#718078]">{formatDuration(asset.durationSec)}</span>}</div>
                        <audio className="w-full" controls preload="metadata" src={asset.assetUrl}>Trình duyệt không hỗ trợ phát tệp âm thanh.</audio>
                      </article>
                    ))}
                  </div>
                )}
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Quyết định kiểm duyệt được áp dụng đồng thời cho bài học và toàn bộ tệp âm thanh đính kèm.</p>
              </section>

              <section className="rounded-2xl border border-[#dfe9e3] bg-white p-5">
                <div className="flex items-center justify-between gap-4"><h3 className="font-bold text-[#274b3b]">Tài liệu khác</h3><span className="rounded-full bg-[#edf5f1] px-2.5 py-1 text-xs font-bold text-[#52655b]">{otherAssets.length} tệp</span></div>
                {otherAssets.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-[#d7e3dc] bg-[#fafcfb] px-4 py-8 text-center text-sm text-[#718078]">Không có tài liệu khác đính kèm.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {otherAssets.map((asset) => (
                      <article key={asset.id} className="overflow-hidden rounded-xl border border-[#dfe9e3] bg-[#fafcfb]">
                        {isImageAsset(asset) ? <img src={asset.assetUrl} alt={asset.title || 'Tài liệu hình ảnh'} className="h-40 w-full object-cover" /> : isVideoAsset(asset) ? <video src={asset.assetUrl} controls preload="metadata" className="h-40 w-full bg-black object-contain" /> : <div className="grid h-28 place-items-center"><FileText className="h-8 w-8 text-[#8c9c94]" /></div>}
                        <div className="flex items-center justify-between gap-3 p-3"><span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#365647]">{isImageAsset(asset) ? <ImageIcon className="h-4 w-4 shrink-0" /> : isVideoAsset(asset) ? <Video className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}<span className="truncate">{asset.title || `Tài liệu #${asset.id}`}</span></span><a href={asset.assetUrl} target="_blank" rel="noreferrer" aria-label="Mở tài liệu" className="text-[#1D6750]"><ExternalLink className="h-4 w-4" /></a></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {selectedItem.status === 'pending' ? (
                <section className="rounded-2xl border border-[#dfe9e3] bg-white p-5">
                  <label className="text-sm font-bold text-[#274b3b]" htmlFor="review-feedback">Phản hồi khi từ chối</label>
                  <p className="mt-1 text-xs text-[#718078]">Bắt buộc nhập nếu bài học hoặc tài liệu âm thanh cần chỉnh sửa.</p>
                  <textarea id="review-feedback" value={feedback} onChange={(event) => { setFeedback(event.target.value); if (event.target.value.trim()) setFeedbackError(''); }} rows={4} placeholder="Mô tả rõ nội dung cần chỉnh sửa..." className={`mt-3 w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#365647] outline-none ${feedbackError ? 'border-red-400' : 'border-[#cfded6] focus:border-[#1D6750]'}`} />
                  {feedbackError && <p className="mt-2 text-xs font-medium text-red-700">{feedbackError}</p>}
                </section>
              ) : (
                <section className={`rounded-2xl border p-5 ${selectedItem.status === 'approved' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                  <h3 className={`font-bold ${selectedItem.status === 'approved' ? 'text-emerald-800' : 'text-red-800'}`}>Kết quả kiểm duyệt</h3>
                  {selectedItem.status === 'approved' ? (
                    <div className="mt-3 space-y-1 text-sm text-emerald-800"><p>Người phê duyệt: {selectedItem.approvedBy || 'Chưa có thông tin'}</p><p>Thời gian: {selectedItem.approvedAt || 'Chưa có thông tin'}</p></div>
                  ) : <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-red-800">{selectedItem.feedback || 'Không có phản hồi đi kèm.'}</p>}
                </section>
              )}
            </div>

            <footer className="z-10 shrink-0 border-t border-[#dfe9e3] bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(20,61,44,0.06)] md:px-6">
              {selectedItem.status === 'pending' ? confirmApprove ? (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium text-emerald-900">Xác nhận phê duyệt bài học và toàn bộ tài liệu đính kèm?</p><div className="flex gap-2"><button type="button" disabled={submittingAction !== null} onClick={() => setConfirmApprove(false)} className="h-10 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800">Quay lại</button><button type="button" disabled={submittingAction !== null} onClick={() => void approveReview()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{submittingAction === 'approve' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Xác nhận</button></div></div>
              ) : (
                <div className="flex gap-3"><button type="button" disabled={submittingAction !== null} onClick={() => void rejectReview()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50">{submittingAction === 'reject' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Từ chối</button><button type="button" disabled={submittingAction !== null} onClick={() => setConfirmApprove(true)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1D6750] text-sm font-bold text-white transition hover:bg-[#185540] disabled:opacity-50"><Check className="h-4 w-4" /> Phê duyệt</button></div>
              ) : <button type="button" onClick={closeReview} className="h-11 w-full rounded-xl border border-[#d8e4dd] text-sm font-semibold text-[#52655b]">Đóng</button>}
            </footer>
          </aside>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default AdminReview;
