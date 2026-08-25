import { useCallback, useEffect, useRef, useState, useMemo, type FormEvent } from 'react';
import {
  Edit2,
  Plus,
  X,
  Check,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Search,
  Star,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cosmeticsApi, uploadApi, type CosmeticItem, type CosmeticRequest } from '../../api/services';

const emptyForm: CosmeticRequest = {
  name: '',
  itemType: 'ROOM_DECOR',
  assetUrl: '',
  unlockType: 'STARS',
  unlockValue: 0,
};

// ─── Component ───────────────────────────────────────────────────────────────
// Trang Admin quản lý vật phẩm trang trí phòng học ảo: Mở khóa bằng Sao ⭐
const AdminCosmetics = () => {
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Detail Modal / Slide-in Panel
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  // Action Menu state (Lưu trữ id và toạ độ nút bấm để render qua Portal ra ngoài body)
  const [activeMenu, setActiveMenu] = useState<{ id: number; item: CosmeticItem; top: number; left: number } | null>(null);

  // Add / Edit Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CosmeticRequest>(emptyForm);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load data ──
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cosmeticsApi.list({ itemType: 'ROOM_DECOR' });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách vật phẩm từ máy chủ.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  // ── Filter + Search ──
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        item.id.toString().includes(searchQuery.trim());
      
      const val = item.unlockValue ?? 0;
      let matchStar = true;
      if (starFilter === 'FREE') matchStar = val === 0;
      if (starFilter === 'PAID') matchStar = val > 0;

      const itemStatus = item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = itemStatus === statusFilter;
      }

      return matchSearch && matchStar && matchStatus;
    });
  }, [items, searchQuery, starFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const pagedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ── Drawer helpers ──
  const openAddDrawer = () => {
    setEditingId(null);
    setForm({ ...emptyForm, status: 'ACTIVE' });
    setPreviewUrl(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: CosmeticItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      itemType: item.itemType || 'ROOM_DECOR',
      assetUrl: item.assetUrl ?? '',
      unlockType: 'STARS',
      unlockValue: item.unlockValue ?? 0,
      status: item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setPreviewUrl(item.assetUrl ?? null);
    setIsDrawerOpen(true);
    setActiveMenu(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setPreviewUrl(null);
  };

  // ── Image Upload lên Cloudinary ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh (PNG, JPG, WEBP...)');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadingImage(true);
    setError('');
    try {
      const url = await uploadApi.uploadFile(file);
      setForm((prev) => ({ ...prev, assetUrl: url }));
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload ảnh thất bại.');
      setPreviewUrl(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Submit (create / update) ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload: CosmeticRequest = {
        ...form,
        itemType: 'ROOM_DECOR',
        unlockType: 'STARS',
        unlockValue: Number(form.unlockValue) || 0,
        status: form.status || 'ACTIVE',
      };
      if (editingId) {
        await cosmeticsApi.update(editingId, payload);
      } else {
        await cosmeticsApi.create(payload);
      }
      closeDrawer();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu vật phẩm.');
    } finally {
      setSaving(false);
    }
  };

  // ── Đổi nhanh trạng thái hoạt động (ACTIVE <-> INACTIVE) ──
  const handleToggleStatus = async (item: CosmeticItem) => {
    setOpenActionMenuId(null);
    const nextStatus = item.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const statusText = nextStatus === 'ACTIVE' ? 'Kích hoạt lại' : 'Tạm khóa / Ẩn';
    if (!confirm(`Bạn có muốn ${statusText} vật phẩm "${item.name}"?`)) return;
    try {
      await cosmeticsApi.update(item.id, {
        name: item.name,
        itemType: item.itemType || 'ROOM_DECOR',
        assetUrl: item.assetUrl,
        unlockType: item.unlockType || 'STARS',
        unlockValue: item.unlockValue ?? 0,
        status: nextStatus,
      });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái vật phẩm.');
    }
  };

  const labelClass = 'font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs';

  return (
    <div className="w-full max-w-[1300px] mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-between">
      <div className="flex-grow flex flex-col">
        {/* ── Page Header & Info ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h2
              className="text-headline-lg font-bold text-[#1D4532] mb-xs"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Quản lý vật phẩm
            </h2>
            <p className="text-body-md text-[#5e5e5b]">
              Quản lý danh mục vật phẩm trong phòng học ảo hiển thị trên ứng dụng VietStage (Godot).
            </p>
          </div>

          {/* ── Toolbar & Filter Bar ──────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-sm w-full mt-1">
            {/* Search */}
            <div className="flex items-center gap-xs px-md py-sm bg-white border border-[#d1e4fb] rounded-lg flex-1 min-w-[16rem] shadow-sm focus-within:ring-1 focus-within:ring-[#1D4532] transition-all">
              <Search className="w-5 h-5 text-[#5e5e5b]" />
              <input
                type="text"
                placeholder="Tìm theo tên vật phẩm, mã ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none outline-none text-body-md w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="text-[#5e5e5b] hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Star Filter */}
            <div className="flex items-center gap-1.5 px-3 py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
              <span className="font-label-md text-[#5e5e5b]">Yêu cầu Sao:</span>
              <select
                value={starFilter}
                onChange={(e) => {
                  setStarFilter(e.target.value as 'ALL' | 'FREE' | 'PAID');
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none py-0 pl-0 pr-4 text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả vật phẩm</option>
                <option value="FREE">Mặc định (0 Sao / Miễn phí)</option>
                <option value="PAID">Cần đổi bằng Sao ⭐</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 px-3 py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
              <span className="font-label-md text-[#5e5e5b]">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none py-0 pl-0 pr-4 text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm khóa / Ẩn</option>
              </select>
            </div>

            {/* Add Button */}
            <button
              onClick={openAddDrawer}
              className="bg-[#1D4532] text-white px-md py-sm rounded-lg font-label-md hover:bg-[#1D4532]/95 transition-all flex items-center gap-xs shadow-md whitespace-nowrap ml-auto"
            >
              <Plus className="w-[18px] h-[18px]" />
              Thêm vật phẩm
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        {/* ── Table Container ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#d1e4fb]/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead className="bg-[#EDF7F2]">
                <tr className="border-b border-[#d1e4fb]/60">
                  <th className="px-6 py-4 font-label-md text-[#1D4532] font-semibold uppercase tracking-wider w-28 text-center">
                    Ảnh vật phẩm
                  </th>
                  <th className="px-6 py-4 font-label-md text-[#1D4532] font-semibold uppercase tracking-wider w-36 text-left">
                    Mã vật phẩm
                  </th>
                  <th className="px-6 py-4 font-label-md text-[#1D4532] font-semibold uppercase tracking-wider text-left">
                    Tên vật phẩm
                  </th>
                  <th className="px-6 py-4 font-label-md text-[#1D4532] font-semibold uppercase tracking-wider w-48 text-left">
                    Điều kiện mở khóa
                  </th>
                  <th className="px-6 py-4 font-label-md text-[#1D4532] font-semibold uppercase tracking-wider w-48 text-left">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-label-md text-[#1D4532] font-semibold uppercase tracking-wider text-center w-24">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#d1e4fb]/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-xl text-body-md text-[#5e5e5b]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-[#1D4532] border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải danh mục vật phẩm...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-xl text-body-md text-[#5e5e5b]">
                      Không tìm thấy vật phẩm phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item) => {
                    const stars = item.unlockValue ?? 0;
                    const isActive = item.status !== 'INACTIVE';
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="hover:bg-[#EDF7F2]/50 transition-colors cursor-pointer"
                      >
                        {/* 1. Ảnh xem trước thumbnail */}
                        <td className="px-6 py-3.5 text-center">
                          <div className="w-20 h-20 rounded-2xl bg-[#FAF8F5] border border-outline-variant/30 flex items-center justify-center mx-auto overflow-hidden p-2 shadow-sm transition-transform duration-200 hover:scale-105">
                            {item.assetUrl ? (
                              <img
                                src={item.assetUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-[#9CA3AF]" />
                            )}
                          </div>
                        </td>

                        {/* 2. Mã vật phẩm */}
                        <td className="px-6 py-3.5 text-left">
                          <span className="font-mono text-xs font-bold text-[#1D4532] bg-[#EDF7F2] px-2.5 py-1 rounded-md border border-[#1D4532]/20 inline-block">
                            DECOR-{item.id}
                          </span>
                        </td>

                        {/* 3. Tên vật phẩm */}
                        <td className="px-6 py-3.5 text-left">
                          <div className="font-semibold text-base text-on-surface hover:text-[#1D4532] transition-colors">
                            {item.name}
                          </div>
                        </td>

                        {/* 4. Điều kiện mở khóa (Số Sao ⭐) */}
                        <td className="px-6 py-3.5 text-left">
                          {stars > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap">
                              <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                              {stars} Sao
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <Star className="w-4 h-4 text-emerald-600" />
                              Mặc định (Miễn phí)
                            </span>
                          )}
                        </td>

                        {/* 5. Cột Trạng thái */}
                        <td className="px-6 py-3.5 text-left">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5e5e5b] bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200 whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                              Tạm khóa / Ẩn
                            </span>
                          )}
                        </td>

                        {/* 6. Thao tác */}
                        <td className="px-6 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              if (activeMenu?.id === item.id) {
                                setActiveMenu(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveMenu({
                                  id: item.id,
                                  item,
                                  top: rect.bottom + 4,
                                  left: rect.right - 180, // w-44 is 176px
                                });
                              }
                            }}
                            className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface mx-auto"
                            title="Thao tác"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Action Menu Portal (Nổi lên trên cùng toàn màn hình, không bao giờ bị cắt do overflow) ── */}
        {activeMenu && typeof document !== 'undefined' && createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setActiveMenu(null)}
            />
            <div
              style={{
                position: 'fixed',
                top: `${activeMenu.top}px`,
                left: `${Math.max(10, activeMenu.left)}px`,
              }}
              className="w-44 bg-white border border-[#d1e4fb] rounded-xl shadow-2xl py-1.5 z-[9999] text-left animate-[fadeIn_0.15s_ease-out]"
            >
              <button
                type="button"
                onClick={() => {
                  const item = activeMenu.item;
                  setActiveMenu(null);
                  setSelectedItem(item);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#EDF7F2] text-[13px] font-medium text-on-surface transition-colors"
              >
                <Eye className="w-4 h-4 text-[#1D4532]" />
                Xem chi tiết
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = activeMenu.item;
                  setActiveMenu(null);
                  openEditDrawer(item);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#EDF7F2] text-[13px] font-medium text-on-surface transition-colors border-t border-[#d1e4fb]/40"
              >
                <Edit2 className="w-4 h-4 text-[#1D4532]" />
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = activeMenu.item;
                  setActiveMenu(null);
                  void handleToggleStatus(item);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors border-t border-[#d1e4fb]/40 ${
                  activeMenu.item.status === 'INACTIVE'
                    ? 'hover:bg-emerald-50 text-emerald-700'
                    : 'hover:bg-amber-50 text-amber-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeMenu.item.status === 'INACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {activeMenu.item.status === 'INACTIVE' ? 'Kích hoạt lại' : 'Tạm khóa / Ẩn'}
              </button>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* ── Pagination Bar (Luôn ở dưới cùng) ──────────────────────────── */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b] pt-4 border-t border-[#d1e4fb]/30 flex-shrink-0">
        <div className="flex items-center gap-lg">
          <p>
            Hiển thị {filteredItems.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, filteredItems.length)} trong tổng số {filteredItems.length} vật phẩm
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

      {/* ═══════════════════════════════════════════════════════════════
           ITEM DETAIL SLIDE-IN PANEL (Vừa vặn 1 màn hình, không cần cuộn)
         ═══════════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[540px] bg-white border-l border-[#d1e4fb] shadow-2xl z-[1000] overflow-hidden flex flex-col animate-[slideIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#d1e4fb] flex justify-between items-center bg-[#EDF7F2] flex-shrink-0">
              <div>
                <h3
                  className="text-base font-bold text-[#1D4532] leading-snug"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {selectedItem.name}
                </h3>
                <p className="text-[11px] text-[#5e5e5b] mt-0.5">
                  Mã vật phẩm: <span className="font-semibold text-on-surface">DECOR-{selectedItem.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 hover:bg-white/70 rounded-full transition-colors text-[#5e5e5b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Tự động co giãn theo chiều cao, hiển thị trọn vẹn */}
            <div className="flex-1 flex flex-col justify-between p-5 space-y-3.5 bg-white overflow-y-auto">
              {/* Preview ảnh vừa vặn */}
              <div className="rounded-xl border border-[#d1e4fb] bg-[#FAF8F5] p-3 flex flex-col items-center justify-center text-center shadow-inner shrink-0">
                <div className="w-28 h-28 flex items-center justify-center">
                  {selectedItem.assetUrl ? (
                    <img
                      src={selectedItem.assetUrl}
                      alt={selectedItem.name}
                      className="max-w-full max-h-full object-contain drop-shadow-sm"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-[#9CA3AF]/40" />
                  )}
                </div>
                <p className="text-[11px] text-[#5e5e5b] mt-1 font-medium">
                  Texture PNG hiển thị trong phòng học ảo (Godot)
                </p>
              </div>

              {/* Thông tin chi tiết */}
              <section className="rounded-xl border border-[#d1e4fb] bg-white p-4 space-y-2.5 flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D4532] border-b border-[#d1e4fb]/40 pb-1.5">
                  Thông tin chi tiết vật phẩm
                </h4>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <div>
                    <p className="text-[#5e5e5b]">Tên vật phẩm</p>
                    <p className="mt-0.5 font-semibold text-on-surface text-sm">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-[#5e5e5b]">Trạng thái</p>
                    <div className="mt-0.5">
                      {selectedItem.status !== 'INACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5e5e5b] bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Tạm khóa / Ẩn
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-[#5e5e5b]">Điều kiện mở khóa</p>
                    <div className="mt-0.5">
                      {(selectedItem.unlockValue ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          {selectedItem.unlockValue} Sao ⭐
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Mặc định (Miễn phí)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-[#5e5e5b]">Đường dẫn asset (URL)</p>
                    <p className="mt-0.5 font-mono text-[11px] text-on-surface break-all bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                      {selectedItem.assetUrl || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Thao tác nhanh */}
              <div className="pt-1 flex-shrink-0">
                <button
                  onClick={() => {
                    const item = selectedItem;
                    setSelectedItem(null);
                    openEditDrawer(item);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#1D4532] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#1D4532]/90 transition-all shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
           ADD / EDIT DRAWER (Slide-in Form)
         ═══════════════════════════════════════════════════════════════ */}
      {createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                style={{ zIndex: 999 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeDrawer}
              />

              {/* Slide-in panel */}
              <motion.div
                className="fixed top-0 right-0 h-full w-full sm:w-[520px] md:w-[560px] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl flex flex-col overflow-hidden"
                style={{ zIndex: 1000 }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/40 flex-shrink-0">
                  <div>
                    <h4 className="text-base font-bold text-[#1D4532]">
                      {editingId ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm mới'}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Upload ảnh PNG cắt nền + đặt số Sao để mở khóa trong phòng học ảo.
                    </p>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="p-1.5 hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form: Bố cục gọn gàng, hiển thị trọn vẹn */}
                <form onSubmit={(e) => void handleSubmit(e)} className="flex-grow flex flex-col justify-between overflow-hidden">
                  <div className="p-5 space-y-3.5 flex-grow overflow-y-auto">
                    {/* Khu vực Upload ảnh + Xem trước (Side-by-Side gọn gàng) */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>
                        Ảnh vật phẩm (PNG cắt nền) <span className="text-red-500">*</span>
                      </label>

                      <div className="flex gap-3 items-stretch">
                        {/* Box ảnh xem trước */}
                        <div className="w-24 h-24 rounded-xl bg-white border border-outline-variant/30 flex items-center justify-center p-2 shadow-sm shrink-0 overflow-hidden">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-[#9CA3AF]">
                              <ImageIcon className="w-8 h-8 opacity-40" />
                              <span className="text-[10px] mt-0.5 opacity-60">Chưa có ảnh</span>
                            </div>
                          )}
                        </div>

                        {/* Dropzone Upload */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex-1 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer p-3 transition-all ${
                            uploadingImage
                              ? 'border-[#1D4532]/40 bg-[#EDF7F2]/40'
                              : 'border-outline-variant/40 hover:border-[#1D4532]/60 bg-white hover:bg-[#EDF7F2]/20'
                          }`}
                        >
                          {uploadingImage ? (
                            <div className="flex items-center gap-2 text-[#1D4532]">
                              <div className="w-4 h-4 border-2 border-[#1D4532] border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-medium">Đang tải lên...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <div className="w-8 h-8 bg-[#EDF7F2] rounded-lg flex items-center justify-center text-[#1D4532] mb-1">
                                <Upload className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-[#1D4532]">
                                {previewUrl ? 'Thay đổi hình ảnh' : 'Tải lên ảnh PNG'}
                              </span>
                              <span className="text-[10px] text-on-surface-variant opacity-70 mt-0.5">
                                Tự động upload Cloudinary
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleFileChange(e)}
                      />

                      {/* URL input nhỏ gọn */}
                      <input
                        type="text"
                        placeholder="Hoặc dán URL: https://... hoặc /decorations/..."
                        value={form.assetUrl ?? ''}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, assetUrl: e.target.value }));
                          setPreviewUrl(e.target.value || null);
                        }}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] outline-none text-on-surface font-mono"
                      />
                    </div>

                    {/* Tên vật phẩm */}
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>
                        Tên vật phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        placeholder="Ví dụ: Đèn lồng đỏ, Chậu sen nhỏ, Bàn trà đạo..."
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-white border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface font-medium"
                      />
                    </div>

                    {/* Grid 2 cột: Số Sao + Trạng thái */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Số sao mở khóa */}
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>
                          Số Sao ⭐ <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0 = Miễn phí"
                          value={form.unlockValue ?? 0}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, unlockValue: Number(e.target.value) || 0 }))
                          }
                          className="w-full bg-white border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface font-medium"
                        />
                        <span className="text-[10px] text-[#5e5e5b]">
                          * <strong>0 Sao</strong>: Miễn phí
                        </span>
                      </div>

                      {/* Trạng thái hoạt động */}
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>
                          Trạng thái <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.status || 'ACTIVE'}
                          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-white border border-outline-variant/30 rounded-xl px-3.5 py-2 text-sm focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface font-medium cursor-pointer"
                        >
                          <option value="ACTIVE">Đang hoạt động</option>
                          <option value="INACTIVE">Tạm khóa / Ẩn</option>
                        </select>
                      </div>
                    </div>

                    {/* Preview kết quả tóm tắt */}
                    {previewUrl && form.name && (
                      <div className="bg-[#EDF7F2] border border-[#1D4532]/15 rounded-xl p-2.5 flex gap-3 items-center">
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-11 h-11 object-contain rounded-lg bg-white border border-outline-variant/20 p-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-[#1D4532] truncate">{form.name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                              {(form.unlockValue ?? 0) > 0 ? `${form.unlockValue} Sao` : 'Miễn phí'}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                form.status !== 'INACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {form.status !== 'INACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer actions: Nút Hủy bỏ & Cập nhật / Tạo mới */}
                  <div className="px-5 py-3.5 border-t border-outline-variant/10 bg-[#f5f3ee]/50 flex items-center justify-end gap-2.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="px-4 py-2 bg-white text-[#5e5e5b] hover:text-on-surface rounded-lg font-semibold text-xs hover:bg-[#eae8e3] transition-all border border-outline-variant/40 shadow-xs"
                    >
                      <span className="flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Hủy bỏ
                      </span>
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploadingImage}
                      className="px-5 py-2 bg-[#1D4532] text-white rounded-lg font-bold text-xs hover:bg-[#1D4532]/90 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          {editingId ? 'Cập nhật' : 'Tạo vật phẩm'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default AdminCosmetics;



