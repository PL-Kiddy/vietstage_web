import { useCallback, useEffect, useRef, useState, useMemo, type FormEvent } from 'react';
import {
  Edit2,
  Plus,
  Trash2,
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
import { mockCosmetics } from '../../data/mockCosmetics';

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

  // Action Menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

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
      const data = await cosmeticsApi.list('ROOM_DECOR');
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        setItems(mockCosmetics);
      }
    } catch {
      setItems(mockCosmetics);
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
    setOpenActionMenuId(null);
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
        try {
          await cosmeticsApi.update(editingId, payload);
        } catch {
          setItems((prev) =>
            prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)),
          );
        }
      } else {
        try {
          const res = await cosmeticsApi.create(payload);
          if (res) {
            await loadItems();
          }
        } catch {
          const newItem: CosmeticItem = {
            id: Date.now(),
            name: payload.name,
            itemType: payload.itemType,
            assetUrl: payload.assetUrl,
            unlockType: 'STARS',
            unlockValue: payload.unlockValue,
            status: payload.status,
          };
          setItems((prev) => [newItem, ...prev]);
        }
      }
      closeDrawer();
      if (!editingId) {
        await loadItems();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu vật phẩm.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: number) => {
    setOpenActionMenuId(null);
    if (!confirm('Xóa vật phẩm này khỏi hệ thống? Thao tác không thể hoàn tác.')) return;
    try {
      try {
        await cosmeticsApi.remove(id);
      } catch {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa vật phẩm.');
    }
  };

  const fieldClass =
    'w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface';
  const labelClass = 'font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs';

  return (
    <div className="w-full max-w-[1300px] mx-auto flex-1 flex flex-col justify-between">
      <div className="flex-grow">
        {/* ── Page Header & Info ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h2
              className="text-headline-lg font-bold text-[#1D4532] mb-xs"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Quản lý vật phẩm trang trí
            </h2>
            <p className="text-body-md text-[#5e5e5b]">
              Quản lý danh mục vật phẩm trang trí trong phòng học ảo hiển thị trên ứng dụng VietStage (Godot).
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
                        <td className="px-6 py-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)}
                            className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface mx-auto"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openActionMenuId === item.id && (
                            <>
                              <div
                                className="fixed inset-0 z-[1100]"
                                onClick={() => setOpenActionMenuId(null)}
                              />
                              <div className="absolute right-6 mt-1 w-44 bg-white border border-[#d1e4fb] rounded-xl shadow-xl py-1 z-[1101] text-left">
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setSelectedItem(item);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-[#1D4532]" />
                                  Xem chi tiết
                                </button>
                                <button
                                  onClick={() => openEditDrawer(item)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors border-t border-[#d1e4fb]/40"
                                >
                                  <Edit2 className="w-4 h-4 text-[#1D4532]" />
                                  Sửa vật phẩm
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination Bar ──────────────────────────────────────────── */}
        <div className="mt-lg flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b] pt-4">
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           ITEM DETAIL SLIDE-IN PANEL
         ═══════════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="fixed top-0 right-0 h-full w-[100%] sm:w-[60%] md:w-[50%] lg:w-[40%] bg-white border-l border-[#d1e4fb] shadow-2xl z-[1000] overflow-hidden flex flex-col animate-[slideIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-xl py-lg border-b border-[#d1e4fb] flex justify-between items-center bg-[#EDF7F2]">
              <div className="flex items-center gap-md">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#d1e4fb] flex items-center justify-center p-2 shadow-sm">
                  {selectedItem.assetUrl ? (
                    <img
                      src={selectedItem.assetUrl}
                      alt={selectedItem.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#9CA3AF]" />
                  )}
                </div>
                <div>
                  <h3
                    className="text-headline-md font-bold text-[#1D4532]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {selectedItem.name}
                  </h3>
                  <p className="text-[12px] text-[#5e5e5b]">
                    Mã hệ thống: DECOR-{selectedItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-white/70 rounded-full transition-colors text-[#5e5e5b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-xl space-y-6 bg-white custom-scrollbar">
              {/* Preview lớn */}
              <div className="rounded-2xl border border-[#d1e4fb] bg-[#FAF8F5] p-6 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="w-48 h-48 flex items-center justify-center">
                  {selectedItem.assetUrl ? (
                    <img
                      src={selectedItem.assetUrl}
                      alt={selectedItem.name}
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-[#9CA3AF]/40" />
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-2">
                  Texture PNG hiển thị trực tiếp trong VirtualMusicRoom (Godot)
                </p>
              </div>

              {/* Thông tin chi tiết */}
              <section className="rounded-xl border border-[#d1e4fb] bg-white p-lg space-y-4">
                <h4 className="text-label-md font-bold uppercase tracking-wider text-[#1D4532] border-b border-[#d1e4fb]/40 pb-2">
                  Thông tin chi tiết vật phẩm
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#5e5e5b]">Tên vật phẩm</p>
                    <p className="mt-1 font-semibold text-on-surface">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5e5e5b]">Trạng thái</p>
                    <div className="mt-1">
                      {selectedItem.status !== 'INACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5e5e5b] bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          Tạm khóa / Ẩn
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#5e5e5b]">Điều kiện mở khóa</p>
                    <div className="mt-1">
                      {(selectedItem.unlockValue ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          {selectedItem.unlockValue} Sao ⭐
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Mặc định (Miễn phí)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#5e5e5b]">Phân loại</p>
                    <p className="mt-1 font-medium text-[#1D4532]">Trang trí phòng học ảo</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-[#5e5e5b]">Đường dẫn asset (URL)</p>
                    <p className="mt-1 font-mono text-xs text-on-surface break-all bg-gray-50 p-2 rounded-lg border border-gray-200">
                      {selectedItem.assetUrl || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Thao tác nhanh */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const item = selectedItem;
                    setSelectedItem(null);
                    openEditDrawer(item);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1D4532] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1D4532]/90 transition-all shadow-sm"
                >
                  <Edit2 className="w-4 h-4" /> Chỉnh sửa thông tin
                </button>
                <button
                  onClick={() => {
                    const id = selectedItem.id;
                    setSelectedItem(null);
                    void handleDelete(id);
                  }}
                  className="px-5 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
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
                className="fixed top-0 right-0 h-full w-full sm:w-[60%] md:w-[50%] lg:w-[42%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl flex flex-col overflow-hidden"
                style={{ zIndex: 1000 }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30 flex-shrink-0">
                  <div>
                    <h4 className="text-lg font-bold text-[#1D4532]">
                      {editingId ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm mới'}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Upload ảnh PNG cắt nền + đặt số Sao để mở khóa trong phòng học ảo.
                    </p>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="p-2 hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={(e) => void handleSubmit(e)} className="flex-grow flex flex-col overflow-hidden">
                  <div className="p-6 space-y-5 flex-grow overflow-y-auto">
                    {/* Image Upload zone */}
                    <div className="flex flex-col gap-2">
                      <label className={labelClass}>
                        Ảnh vật phẩm (PNG cắt nền) <span className="text-red-500">*</span>
                      </label>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          uploadingImage
                            ? 'border-[#1D4532]/40 bg-[#EDF7F2]/40'
                            : previewUrl
                            ? 'border-[#1D4532]/30 bg-transparent'
                            : 'border-outline-variant/40 hover:border-[#1D4532]/50 bg-white hover:bg-[#EDF7F2]/20'
                        }`}
                      >
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-[#1D4532]">
                            <div className="w-7 h-7 border-2 border-[#1D4532] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium">Đang upload lên Cloudinary...</span>
                          </div>
                        ) : previewUrl ? (
                          <>
                            <img
                              src={previewUrl}
                              alt="preview"
                              className="w-full h-full object-contain p-4"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                              <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" /> Thay ảnh
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-on-surface-variant p-6">
                            <div className="w-12 h-12 bg-[#EDF7F2] rounded-xl flex items-center justify-center">
                              <Upload className="w-6 h-6 text-[#1D4532]" />
                            </div>
                            <span className="text-sm font-medium text-[#1D4532]">Nhấn để chọn ảnh</span>
                            <span className="text-xs text-center leading-relaxed opacity-70">
                              PNG (khuyến nghị cắt nền), JPG, WEBP
                              <br />
                              Tự động upload lên Cloudinary
                            </span>
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleFileChange(e)}
                      />

                      {/* URL fallback */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-px flex-1 bg-outline-variant/20" />
                        <span className="text-xs text-on-surface-variant">hoặc nhập URL trực tiếp</span>
                        <div className="h-px flex-1 bg-outline-variant/20" />
                      </div>
                      <input
                        type="text"
                        placeholder="https://res.cloudinary.com/... hoặc /decorations/..."
                        value={form.assetUrl ?? ''}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, assetUrl: e.target.value }));
                          setPreviewUrl(e.target.value || null);
                        }}
                        className={fieldClass}
                      />
                    </div>

                    {/* Tên vật phẩm */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>
                        Tên vật phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        placeholder="Ví dụ: Đèn lồng đỏ, Chậu sen nhỏ, Bàn trà đạo..."
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className={fieldClass}
                      />
                    </div>

                    {/* Số sao mở khóa */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>
                        Số Sao ⭐ yêu cầu để mở khóa <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Nhập 0 nếu là vật phẩm mặc định (miễn phí)"
                        value={form.unlockValue ?? 0}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, unlockValue: Number(e.target.value) || 0 }))
                        }
                        className={fieldClass}
                      />
                      <span className="text-xs text-[#5e5e5b]">
                        * Đặt <strong>0 Sao</strong> nếu muốn vật phẩm được mở khóa sẵn mặc định.
                      </span>
                    </div>

                    {/* Trạng thái hoạt động */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>
                        Trạng thái hoạt động <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.status || 'ACTIVE'}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                        className={`${fieldClass} cursor-pointer`}
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Tạm khóa / Ẩn khỏi cửa hàng</option>
                      </select>
                    </div>

                    {/* Preview card nhỏ */}
                    {previewUrl && form.name && (
                      <div className="bg-[#EDF7F2]/60 border border-[#1D4532]/15 rounded-xl p-4 flex gap-4 items-center">
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-16 h-16 object-contain rounded-lg bg-white border border-outline-variant/20 p-1 flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-sm text-[#1D4532]">{form.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Trang trí phòng học ảo</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                              {(form.unlockValue ?? 0) > 0 ? `${form.unlockValue} Sao` : 'Mặc định (Miễn phí)'}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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

                  {/* Footer actions */}
                  <div className="px-6 py-4 border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#e1dfdb] text-on-surface py-3 rounded-xl font-bold text-sm hover:bg-[#c8c6c2] transition-all border border-outline-variant/30"
                    >
                      <X className="w-4 h-4" /> Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploadingImage}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1D4532] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1D4532]/90 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
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



