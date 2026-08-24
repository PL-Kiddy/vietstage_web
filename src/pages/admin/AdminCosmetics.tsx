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
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cosmeticsApi, uploadApi, type CosmeticItem, type CosmeticRequest } from '../../api/services';

// ─── Types ───────────────────────────────────────────────────────────────────
type UnlockType = 'DEFAULT' | 'STARS' | 'POINTS' | 'ACHIEVEMENT';

const UNLOCK_TYPE_LABELS: Record<UnlockType, string> = {
  DEFAULT: 'Mặc định (miễn phí)',
  STARS: 'Mở khóa bằng Sao ⭐',
  POINTS: 'Mở khóa bằng Điểm 💎',
  ACHIEVEMENT: 'Thành tích đặc biệt 🏆',
};

const UNLOCK_TYPE_ICONS: Record<UnlockType, React.ReactNode> = {
  DEFAULT: <Sparkles className="w-3.5 h-3.5" />,
  STARS: <Star className="w-3.5 h-3.5" />,
  POINTS: <Zap className="w-3.5 h-3.5" />,
  ACHIEVEMENT: <Trophy className="w-3.5 h-3.5" />,
};

const UNLOCK_TYPE_COLORS: Record<UnlockType, string> = {
  DEFAULT: 'bg-emerald-100 text-emerald-700',
  STARS: 'bg-amber-100 text-amber-700',
  POINTS: 'bg-blue-100 text-blue-700',
  ACHIEVEMENT: 'bg-purple-100 text-purple-700',
};

const emptyForm: CosmeticRequest = {
  name: '',
  itemType: 'ROOM_DECOR',
  assetUrl: '',
  unlockType: 'DEFAULT',
  unlockValue: undefined,
};

// ─── Component ───────────────────────────────────────────────────────────────
// Trang Admin quản lý vật phẩm trang trí phòng học ảo Godot: CRUD + upload ảnh PNG cắt nền lên Cloudinary
const AdminCosmetics = () => {
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  // Drawer
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
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách vật phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  // ── Filter + Pagination ──
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.unlockType.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const pagedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ── Drawer helpers ──
  const openAddDrawer = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPreviewUrl(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: CosmeticItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      itemType: item.itemType || 'ROOM_DECOR',
      assetUrl: item.assetUrl ?? '',
      unlockType: item.unlockType,
      unlockValue: item.unlockValue,
    });
    setPreviewUrl(item.assetUrl ?? null);
    setIsDrawerOpen(true);
    setOpenActionMenu(null);
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
    // Preview local ngay lập tức
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

  // ── Delete ──
  const handleDelete = async (id: number) => {
    setOpenActionMenu(null);
    if (!confirm('Xóa vật phẩm này? Thao tác không thể hoàn tác.')) return;
    try {
      await cosmeticsApi.remove(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa vật phẩm.');
    }
  };

  // ── Style classes ──
  const fieldClass =
    'w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface';
  const labelClass = 'font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs';

  return (
    <div className="w-full max-w-[1300px] mx-auto flex-1 flex flex-col">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-headline-lg font-bold text-[#1D4532]">Vật phẩm trang trí</h2>
          <p className="text-on-surface-variant mt-1">
            Quản lý các vật phẩm trang trí trong phòng học ảo hiển thị trong ứng dụng Godot.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#d1e4fb] rounded-lg w-full sm:w-72 shadow-sm focus-within:ring-1 focus-within:ring-[#1D4532] transition-all">
            <Search className="w-4 h-4 text-[#5e5e5b] flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên vật phẩm..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-sm w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="text-[#5e5e5b] hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={openAddDrawer}
            className="ml-auto bg-[#1D4532] text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-[#1D4532]/90 transition-all flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Thêm vật phẩm
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {/* ── Grid Content ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <div className="w-8 h-8 border-2 border-[#1D4532] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Đang tải vật phẩm...</span>
          </div>
        </div>
      ) : pagedItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-on-surface-variant gap-4">
          <div className="w-16 h-16 bg-[#EDF7F2] rounded-2xl flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#1D4532]/40" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base text-on-surface">Chưa có vật phẩm nào</p>
            <p className="text-sm mt-1">
              {searchQuery
                ? 'Không tìm thấy kết quả phù hợp.'
                : 'Thêm vật phẩm trang trí phòng đầu tiên.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={openAddDrawer}
              className="bg-[#1D4532] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#1D4532]/90 transition-all flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Thêm ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
          {pagedItems.map((item) => {
            const unlockType = item.unlockType as UnlockType;
            return (
              <div
                key={item.id}
                className="group bg-white border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative"
              >
                {/* Image area */}
                <div className="aspect-square bg-[#f4f6f8] relative overflow-hidden">
                  {item.assetUrl ? (
                    <img
                      src={item.assetUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-[#9CA3AF]/50" />
                    </div>
                  )}

                  {/* Action menu trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenu(openActionMenu === item.id ? null : item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <MoreVertical className="w-4 h-4 text-[#374151]" />
                  </button>

                  {/* Dropdown */}
                  {openActionMenu === item.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)} />
                      <div className="absolute top-9 right-2 w-40 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1 z-20">
                        <button
                          onClick={() => openEditDrawer(item)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#1D4532]" /> Sửa vật phẩm
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-[13px] text-red-600 transition-colors border-t border-[#e5e7eb]/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Card info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-on-surface truncate leading-tight">{item.name}</p>
                  <div
                    className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      UNLOCK_TYPE_COLORS[unlockType] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {UNLOCK_TYPE_ICONS[unlockType]}
                    {unlockType === 'STARS' && item.unlockValue
                      ? `${item.unlockValue} sao`
                      : unlockType === 'POINTS' && item.unlockValue
                      ? `${item.unlockValue} điểm`
                      : unlockType === 'DEFAULT'
                      ? 'Miễn phí'
                      : 'Thành tích'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {filteredItems.length > 0 && (
        <div className="mt-auto pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-[#5e5e5b] border-t border-outline-variant/10">
          <div className="flex items-center gap-4">
            <p>
              Hiển thị {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredItems.length)} / {filteredItems.length} vật phẩm
            </p>
            <div className="flex items-center gap-1.5">
              <span>Mỗi trang:</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border border-outline-variant rounded px-2 py-1 outline-none cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
          <div className="flex gap-1.5">
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
                  p === currentPage ? 'bg-[#1D4532] text-white' : 'border border-outline-variant hover:bg-[#EDF7F2]'
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

      {/* ── DRAWER (Portal) ─────────────────────────────────────────── */}
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
                      Upload ảnh PNG cắt nền + điền thông tin để Godot nhận vật phẩm trang trí phòng.
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
                              PNG (khuyến nghị cắt nền), JPG, WEBP<br />Tự động upload lên Cloudinary
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
                        type="url"
                        placeholder="https://res.cloudinary.com/..."
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
                        placeholder="Ví dụ: Đèn lồng đỏ, Chậu cây phong cách cổ truyền..."
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className={fieldClass}
                      />
                    </div>

                    {/* Điều kiện mở khóa */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>
                        Điều kiện mở khóa <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={form.unlockType}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, unlockType: e.target.value, unlockValue: undefined }))
                        }
                        className={`${fieldClass} cursor-pointer`}
                      >
                        {(Object.keys(UNLOCK_TYPE_LABELS) as UnlockType[]).map((ut) => (
                          <option key={ut} value={ut}>{UNLOCK_TYPE_LABELS[ut]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Số sao / điểm cần (chỉ khi STARS hoặc POINTS) */}
                    {(form.unlockType === 'STARS' || form.unlockType === 'POINTS') && (
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>
                          Số {form.unlockType === 'STARS' ? 'Sao ⭐' : 'Điểm 💎'} cần có{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min={1}
                          step={1}
                          placeholder={form.unlockType === 'STARS' ? 'Ví dụ: 50' : 'Ví dụ: 500'}
                          value={form.unlockValue ?? ''}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, unlockValue: Number(e.target.value) || undefined }))
                          }
                          className={fieldClass}
                        />
                      </div>
                    )}

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
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Trang trí phòng
                          </p>
                          <div
                            className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              UNLOCK_TYPE_COLORS[form.unlockType as UnlockType] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {UNLOCK_TYPE_ICONS[form.unlockType as UnlockType]}
                            {form.unlockType === 'DEFAULT'
                              ? 'Miễn phí'
                              : form.unlockValue
                              ? `${form.unlockValue} ${form.unlockType === 'STARS' ? 'sao' : 'điểm'}`
                              : UNLOCK_TYPE_LABELS[form.unlockType as UnlockType]}
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

