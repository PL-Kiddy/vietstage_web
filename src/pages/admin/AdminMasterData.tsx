import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Edit2,
  ListFilter,
  Plus,
  Trash2,
  X,
  Check,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  instrumentManagementApi,
  skillLevelManagementApi,
  techniqueManagementApi,
  type InstrumentInput,
  type SkillLevelInput,
  type Technique,
  type TechniqueInput,
} from '../../api/management';
import type { Instrument, SkillLevel } from '../../api/types';

type Tab = 'instruments' | 'skill-levels' | 'techniques';

const emptyInstrument: InstrumentInput = { name: '', description: '', iconUrl: '' };
const emptySkillLevel: SkillLevelInput = { levelCode: '', levelName: '', orderIndex: 1 };
const emptyTechnique: TechniqueInput = {
  name: '',
  description: '',
  guide_url: '',
  instrument_id: 0,
};

const AdminMasterData = () => {
  const [tab, setTab] = useState<Tab>('instruments');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [instrumentForm, setInstrumentForm] = useState<InstrumentInput>(emptyInstrument);
  const [instrumentEditingId, setInstrumentEditingId] = useState<number | null>(null);
  const [skillForm, setSkillForm] = useState<SkillLevelInput>(emptySkillLevel);
  const [skillEditingId, setSkillEditingId] = useState<number | null>(null);
  const [techniqueForm, setTechniqueForm] = useState<TechniqueInput>(emptyTechnique);
  const [techniqueEditingId, setTechniqueEditingId] = useState<number | null>(null);
  const [techniqueInstrumentFilter, setTechniqueInstrumentFilter] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Action Menu state
  const [openActionMenu, setOpenActionMenu] = useState<{ type: Tab; id: number } | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [instrumentData, skillData, techniqueData] = await Promise.all([
        instrumentManagementApi.list(),
        skillLevelManagementApi.list(),
        techniqueManagementApi.list(),
      ]);
      setInstruments(instrumentData);
      setSkillLevels(skillData);
      setTechniques(techniqueData);
      setTechniqueForm((current) => ({
        ...current,
        instrument_id: current.instrument_id || instrumentData[0]?.id || 0,
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu nền.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setOpenActionMenu(null);
  }, [tab]);

  // Open Drawer helpers
  const handleAddNewClick = () => {
    if (tab === 'instruments') {
      setInstrumentForm(emptyInstrument);
      setInstrumentEditingId(null);
    } else if (tab === 'skill-levels') {
      setSkillForm(emptySkillLevel);
      setSkillEditingId(null);
    } else if (tab === 'techniques') {
      setTechniqueForm({
        ...emptyTechnique,
        instrument_id: instruments[0]?.id || 0,
      });
      setTechniqueEditingId(null);
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Submit / Edit / Delete Instrument
  const submitInstrument = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (instrumentEditingId) {
        await instrumentManagementApi.update(instrumentEditingId, instrumentForm);
      } else {
        await instrumentManagementApi.create(instrumentForm);
      }
      setIsDrawerOpen(false);
      setInstrumentEditingId(null);
      setInstrumentForm(emptyInstrument);
      await loadAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu nhạc cụ.');
    }
  };

  const editInstrument = async (id: number) => {
    try {
      const item = await instrumentManagementApi.get(id);
      setInstrumentEditingId(id);
      setInstrumentForm({
        name: item.name,
        description: item.description ?? '',
        iconUrl: item.iconUrl ?? '',
      });
      setIsDrawerOpen(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải nhạc cụ.');
    }
  };

  const deleteInstrument = async (id: number) => {
    if (!confirm('Xóa nhạc cụ này? Các dữ liệu liên quan có thể khiến thao tác thất bại.')) return;
    try {
      await instrumentManagementApi.remove(id);
      await loadAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa nhạc cụ.');
    }
  };

  // Show Technique of Instrument
  const showInstrumentTechniques = async (id: number) => {
    try {
      setTechniques(await instrumentManagementApi.techniques(id));
      setTechniqueInstrumentFilter(id);
      setTab('techniques');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải kỹ thuật của nhạc cụ.');
    }
  };

  // Submit / Edit / Delete Skill Level
  const submitSkillLevel = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (skillEditingId) {
        await skillLevelManagementApi.update(skillEditingId, skillForm);
      } else {
        await skillLevelManagementApi.create(skillForm);
      }
      setIsDrawerOpen(false);
      setSkillEditingId(null);
      setSkillForm(emptySkillLevel);
      await loadAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu trình độ.');
    }
  };

  const editSkillLevel = async (id: number) => {
    try {
      const item = await skillLevelManagementApi.get(id);
      setSkillEditingId(id);
      setSkillForm(item);
      setIsDrawerOpen(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải trình độ.');
    }
  };

  const deleteSkillLevel = async (id: number) => {
    if (!confirm('Xóa trình độ này?')) return;
    try {
      await skillLevelManagementApi.remove(id);
      await loadAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa trình độ.');
    }
  };

  // Submit / Edit / Delete Technique
  const submitTechnique = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (techniqueEditingId) {
        await techniqueManagementApi.update(techniqueEditingId, {
          name: techniqueForm.name,
          description: techniqueForm.description,
          guide_url: techniqueForm.guide_url,
        });
      } else {
        await techniqueManagementApi.create(techniqueForm);
      }
      setIsDrawerOpen(false);
      setTechniqueEditingId(null);
      setTechniqueForm({ ...emptyTechnique, instrument_id: instruments[0]?.id ?? 0 });
      await loadAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu kỹ thuật.');
    }
  };

  const editTechnique = async (id: number) => {
    try {
      const item = await techniqueManagementApi.get(id);
      setTechniqueEditingId(id);
      setTechniqueForm({
        name: item.name,
        description: item.description ?? '',
        guide_url: item.guide_url ?? '',
        instrument_id: item.instrument_id,
      });
      setIsDrawerOpen(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải kỹ thuật.');
    }
  };

  const deleteTechnique = async (id: number) => {
    if (!confirm('Xóa kỹ thuật này?')) return;
    try {
      await techniqueManagementApi.remove(id);
      await loadAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa kỹ thuật.');
    }
  };

  const filterTechniques = async (instrumentId: number) => {
    setTechniqueInstrumentFilter(instrumentId);
    try {
      setTechniques(
        instrumentId
          ? await instrumentManagementApi.techniques(instrumentId)
          : await techniqueManagementApi.list(),
      );
      setCurrentPage(1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lọc kỹ thuật.');
    }
  };

  const getTabLabel = () => {
    if (tab === 'instruments') return 'nhạc cụ';
    if (tab === 'skill-levels') return 'trình độ';
    return 'kỹ thuật';
  };

  // Reusable classes
  const fieldClass =
    'w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface';
  const labelClass = 'font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs';

  // Get active dataset for pagination calculations
  const getActiveData = (): any[] => {
    if (tab === 'instruments') return instruments;
    if (tab === 'skill-levels') return skillLevels;
    return techniques;
  };

  const activeData = getActiveData();
  const totalPages = Math.max(1, Math.ceil(activeData.length / perPage));
  const pagedItems = activeData.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="max-w-[1300px] mx-auto space-y-lg">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-lg">
        <div>
          <h2 className="text-headline-lg font-bold text-[#1D4532]">Dữ liệu nền</h2>
          <p className="text-on-surface-variant">Quản lý nhạc cụ, trình độ và kỹ thuật biểu diễn.</p>
        </div>
        <div className="flex items-center gap-md w-full xl:w-auto">
          <button
            onClick={handleAddNewClick}
            className="bg-[#1D4532] text-white px-lg py-sm rounded-lg font-medium text-sm hover:bg-[#1D4532]/95 transition-all flex items-center gap-xs shadow-md"
          >
            <Plus className="w-4 h-4" /> Thêm {getTabLabel()}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-md">{error}</div>}

      {/* Tabs list */}
      <div className="flex gap-sm border-b border-outline-variant/20">
        {([
          ['instruments', 'Nhạc cụ'],
          ['skill-levels', 'Trình độ'],
          ['techniques', 'Kỹ thuật'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-lg py-md font-semibold border-b-2 transition-all ${
              tab === value ? 'border-[#1D4532] text-[#1D4532]' : 'border-transparent text-on-surface-variant hover:text-[#1D4532]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Tables Grid */}
      {loading ? (
        <div className="p-xl text-center">Đang tải dữ liệu...</div>
      ) : (
        <div className="space-y-lg">
          {tab === 'instruments' && (
            <div className="bg-white rounded-xl border border-outline-variant/20 overflow-visible shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#EDF7F2]">
                  <tr>
                    <th className="p-md font-semibold text-[#1D4532]">Mã nhạc cụ</th>
                    <th className="p-md font-semibold text-[#1D4532]">Tên nhạc cụ</th>
                    <th className="p-md font-semibold text-[#1D4532]">Mô tả</th>
                    <th className="p-md font-semibold text-[#1D4532] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {pagedItems.map((item: Instrument) => (
                    <tr key={item.id} className="hover:bg-[#EDF7F2]/30 transition-colors">
                      <td className="p-md text-sm">{item.instrumentCode}</td>
                      <td className="p-md font-semibold text-[#1D4532] text-sm">{item.name}</td>
                      <td className="p-md text-sm max-w-md truncate">{item.description || '—'}</td>
                      <td className="p-md text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu?.type === 'instruments' && openActionMenu?.id === item.id
                                ? null
                                : { type: 'instruments', id: item.id }
                            )
                          }
                          className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openActionMenu?.type === 'instruments' && openActionMenu?.id === item.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)} />
                            <div className="absolute right-4 mt-1 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left">
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  void showInstrumentTechniques(item.id);
                                }}
                                className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                              >
                                <ListFilter className="w-4 h-4 text-[#1D4532] mr-2" />
                                Xem kỹ thuật
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  void editInstrument(item.id);
                                }}
                                className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-[#1D4532] mr-2" />
                                Sửa nhạc cụ
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  void deleteInstrument(item.id);
                                }}
                                className="w-full flex items-center gap-xs px-4 py-2 hover:bg-red-50 text-[13px] text-red-700 transition-colors border-t border-[#d1e4fb]/40"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 mr-2" />
                                Xóa nhạc cụ
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'skill-levels' && (
            <div className="bg-white rounded-xl border border-outline-variant/20 overflow-visible shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#EDF7F2]">
                  <tr>
                    <th className="p-md font-semibold text-[#1D4532]">Thứ tự</th>
                    <th className="p-md font-semibold text-[#1D4532]">Mã trình độ</th>
                    <th className="p-md font-semibold text-[#1D4532]">Tên trình độ</th>
                    <th className="p-md font-semibold text-[#1D4532] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {pagedItems.map((item: SkillLevel) => (
                    <tr key={item.id} className="hover:bg-[#EDF7F2]/30 transition-colors">
                      <td className="p-md text-sm">{item.orderIndex}</td>
                      <td className="p-md text-sm">{item.levelCode}</td>
                      <td className="p-md font-semibold text-[#1D4532] text-sm">{item.levelName}</td>
                      <td className="p-md text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu?.type === 'skill-levels' && openActionMenu?.id === item.id
                                ? null
                                : { type: 'skill-levels', id: item.id }
                            )
                          }
                          className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openActionMenu?.type === 'skill-levels' && openActionMenu?.id === item.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)} />
                            <div className="absolute right-4 mt-1 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left">
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  void editSkillLevel(item.id);
                                }}
                                className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-[#1D4532] mr-2" />
                                Sửa trình độ
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionMenu(null);
                                  void deleteSkillLevel(item.id);
                                }}
                                className="w-full flex items-center gap-xs px-4 py-2 hover:bg-red-50 text-[13px] text-red-700 transition-colors border-t border-[#d1e4fb]/40"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 mr-2" />
                                Xóa trình độ
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'techniques' && (
            <div className="space-y-md">
              <div className="bg-white rounded-xl border border-outline-variant/20 p-md flex items-center gap-sm shadow-sm max-w-md">
                <ListFilter className="w-4 h-4 text-[#1D4532]" />
                <select
                  value={techniqueInstrumentFilter}
                  onChange={(event) => void filterTechniques(Number(event.target.value))}
                  className="bg-transparent border-none text-sm font-semibold text-[#1D4532] focus:ring-0 cursor-pointer outline-none w-full"
                >
                  <option value={0}>Tất cả nhạc cụ</option>
                  {instruments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-white rounded-xl border border-outline-variant/20 overflow-visible shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#EDF7F2]">
                    <tr>
                      <th className="p-md font-semibold text-[#1D4532]">Tên kỹ thuật</th>
                      <th className="p-md font-semibold text-[#1D4532]">Nhạc cụ</th>
                      <th className="p-md font-semibold text-[#1D4532]">Hướng dẫn</th>
                      <th className="p-md font-semibold text-[#1D4532] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {pagedItems.map((item: Technique) => (
                      <tr key={item.id} className="hover:bg-[#EDF7F2]/30 transition-colors">
                        <td className="p-md font-semibold text-[#1D4532] text-sm">{item.name}</td>
                        <td className="p-md text-sm">
                          {instruments.find((instrument) => instrument.id === item.instrument_id)?.name ??
                            item.instrument_id}
                        </td>
                        <td className="p-md text-sm text-ellipsis overflow-hidden">
                          {item.guide_url ? (
                            <a
                              href={item.guide_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1D4532] underline font-medium hover:opacity-80"
                            >
                              Mở hướng dẫn
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-md text-right relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setOpenActionMenu(
                                openActionMenu?.type === 'techniques' && openActionMenu?.id === item.id
                                  ? null
                                  : { type: 'techniques', id: item.id }
                              )
                            }
                            className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openActionMenu?.type === 'techniques' && openActionMenu?.id === item.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenu(null)} />
                              <div className="absolute right-4 mt-1 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left">
                                <button
                                  onClick={() => {
                                    setOpenActionMenu(null);
                                    void editTechnique(item.id);
                                  }}
                                  className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-[#1D4532] mr-2" />
                                  Sửa kỹ thuật
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenActionMenu(null);
                                    void deleteTechnique(item.id);
                                  }}
                                  className="w-full flex items-center gap-xs px-4 py-2 hover:bg-red-50 text-[13px] text-red-700 transition-colors border-t border-[#d1e4fb]/40"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 mr-2" />
                                  Xóa kỹ thuật
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pagination ───────────────────────────────────────── */}
          <div className="mt-lg flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b]">
            <div className="flex items-center gap-lg">
              <p>
                Hiển thị {activeData.length === 0 ? 0 : (currentPage - 1) * perPage + 1} -{' '}
                {Math.min(currentPage * perPage, activeData.length)} trong tổng số{' '}
                {activeData.length} {getTabLabel()}
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
      )}

      {/* ── DRAWERS ────────────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: 999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[60%] md:w-[50%] lg:w-[40%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl overflow-hidden flex flex-col"
              style={{ zIndex: 1000 }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-[#1D4532] font-sans">
                    {tab === 'instruments' && (instrumentEditingId ? 'Sửa nhạc cụ' : 'Thêm nhạc cụ mới')}
                    {tab === 'skill-levels' && (skillEditingId ? 'Sửa trình độ' : 'Thêm trình độ mới')}
                    {tab === 'techniques' && (techniqueEditingId ? 'Sửa kỹ thuật' : 'Thêm kỹ thuật mới')}
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    Điền đầy đủ các thông tin dữ liệu nền cần cập nhật.
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-md hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Body for Instruments */}
              {tab === 'instruments' && (
                <form onSubmit={submitInstrument} className="flex-grow flex flex-col justify-between overflow-y-auto p-xl space-y-xl">
                  <div className="bg-white/95 border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Tên nhạc cụ <span className="text-red-500">*</span></label>
                      <input
                        required
                        placeholder="Nhập tên nhạc cụ..."
                        value={instrumentForm.name}
                        onChange={(e) => setInstrumentForm({ ...instrumentForm, name: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Mô tả chi tiết</label>
                      <textarea
                        rows={4}
                        placeholder="Nhập mô tả của nhạc cụ..."
                        value={instrumentForm.description}
                        onChange={(e) => setInstrumentForm({ ...instrumentForm, description: e.target.value })}
                        className={`${fieldClass} resize-none`}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>URL Biểu tượng / Icon</label>
                      <input
                        placeholder="https://..."
                        value={instrumentForm.iconUrl}
                        onChange={(e) => setInstrumentForm({ ...instrumentForm, iconUrl: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                    <button
                      type="button"
                      onClick={handleCloseDrawer}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#e1dfdb] text-on-surface py-lg rounded-xl font-bold hover:bg-[#c8c6c2] transition-all border border-outline-variant/30"
                    >
                      <X className="w-5 h-5" /> Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-sm bg-[#1D4532] text-white py-lg rounded-xl font-bold hover:bg-[#1D4532]/90 transition-all shadow-md"
                    >
                      <Check className="w-5 h-5" /> Xác nhận
                    </button>
                  </div>
                </form>
              )}

              {/* Form Body for Skill Levels */}
              {tab === 'skill-levels' && (
                <form onSubmit={submitSkillLevel} className="flex-grow flex flex-col justify-between overflow-y-auto p-xl space-y-xl">
                  <div className="bg-white/95 border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Mã trình độ <span className="text-red-500">*</span></label>
                      <input
                        required
                        placeholder="Ví dụ: SL-01, SL-02..."
                        value={skillForm.levelCode}
                        onChange={(e) => setSkillForm({ ...skillForm, levelCode: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Tên trình độ <span className="text-red-500">*</span></label>
                      <input
                        required
                        placeholder="Ví dụ: Cơ bản, Trung cấp..."
                        value={skillForm.levelName}
                        onChange={(e) => setSkillForm({ ...skillForm, levelName: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Thứ tự hiển thị <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={skillForm.orderIndex}
                        onChange={(e) => setSkillForm({ ...skillForm, orderIndex: Number(e.target.value) })}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                    <button
                      type="button"
                      onClick={handleCloseDrawer}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#e1dfdb] text-on-surface py-lg rounded-xl font-bold hover:bg-[#c8c6c2] transition-all border border-outline-variant/30"
                    >
                      <X className="w-5 h-5" /> Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-sm bg-[#1D4532] text-white py-lg rounded-xl font-bold hover:bg-[#1D4532]/90 transition-all shadow-md"
                    >
                      <Check className="w-5 h-5" /> Xác nhận
                    </button>
                  </div>
                </form>
              )}

              {/* Form Body for Techniques */}
              {tab === 'techniques' && (
                <form onSubmit={submitTechnique} className="flex-grow flex flex-col justify-between overflow-y-auto p-xl space-y-xl">
                  <div className="bg-white/95 border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Chọn nhạc cụ <span className="text-red-500">*</span></label>
                      <select
                        required
                        disabled={techniqueEditingId !== null}
                        value={techniqueForm.instrument_id}
                        onChange={(e) => setTechniqueForm({ ...techniqueForm, instrument_id: Number(e.target.value) })}
                        className={`${fieldClass} cursor-pointer`}
                      >
                        {instruments.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Tên kỹ thuật biểu diễn <span className="text-red-500">*</span></label>
                      <input
                        required
                        placeholder="Ví dụ: Rung, Nhấn, Vuốt..."
                        value={techniqueForm.name}
                        onChange={(e) => setTechniqueForm({ ...techniqueForm, name: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>Mô tả kỹ thuật</label>
                      <textarea
                        rows={4}
                        placeholder="Mô tả cách thực hiện kỹ thuật..."
                        value={techniqueForm.description}
                        onChange={(e) => setTechniqueForm({ ...techniqueForm, description: e.target.value })}
                        className={`${fieldClass} resize-none`}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelClass}>URL Hướng dẫn (Video / Tài liệu)</label>
                      <input
                        placeholder="https://youtube.com/... hoặc tài liệu khác"
                        value={techniqueForm.guide_url}
                        onChange={(e) => setTechniqueForm({ ...techniqueForm, guide_url: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                    <button
                      type="button"
                      onClick={handleCloseDrawer}
                      className="flex-1 flex items-center justify-center gap-sm bg-[#e1dfdb] text-on-surface py-lg rounded-xl font-bold hover:bg-[#c8c6c2] transition-all border border-outline-variant/30"
                    >
                      <X className="w-5 h-5" /> Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-sm bg-[#1D4532] text-white py-lg rounded-xl font-bold hover:bg-[#1D4532]/90 transition-all shadow-md"
                    >
                      <Check className="w-5 h-5" /> Xác nhận
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AdminMasterData;
