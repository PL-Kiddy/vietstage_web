import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Edit2, ListFilter, Plus, RefreshCw, Trash2 } from 'lucide-react';
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

  const [instrumentForm, setInstrumentForm] = useState<InstrumentInput>(emptyInstrument);
  const [instrumentEditingId, setInstrumentEditingId] = useState<number | null>(null);
  const [skillForm, setSkillForm] = useState<SkillLevelInput>(emptySkillLevel);
  const [skillEditingId, setSkillEditingId] = useState<number | null>(null);
  const [techniqueForm, setTechniqueForm] = useState<TechniqueInput>(emptyTechnique);
  const [techniqueEditingId, setTechniqueEditingId] = useState<number | null>(null);
  const [techniqueInstrumentFilter, setTechniqueInstrumentFilter] = useState(0);

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
    void Promise.all([
      instrumentManagementApi.list(),
      skillLevelManagementApi.list(),
      techniqueManagementApi.list(),
    ])
      .then(([instrumentData, skillData, techniqueData]) => {
        setInstruments(instrumentData);
        setSkillLevels(skillData);
        setTechniques(techniqueData);
        setTechniqueForm((current) => ({
          ...current,
          instrument_id: current.instrument_id || instrumentData[0]?.id || 0,
        }));
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu nền.');
      })
      .finally(() => setLoading(false));
  }, []);

  const submitInstrument = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (instrumentEditingId) {
        await instrumentManagementApi.update(instrumentEditingId, instrumentForm);
      } else {
        await instrumentManagementApi.create(instrumentForm);
      }
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

  const showInstrumentTechniques = async (id: number) => {
    try {
      setTechniques(await instrumentManagementApi.techniques(id));
      setTechniqueInstrumentFilter(id);
      setTab('techniques');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải kỹ thuật của nhạc cụ.');
    }
  };

  const submitSkillLevel = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (skillEditingId) {
        await skillLevelManagementApi.update(skillEditingId, skillForm);
      } else {
        await skillLevelManagementApi.create(skillForm);
      }
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lọc kỹ thuật.');
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-outline-variant/30 bg-white px-md py-sm outline-none focus:border-primary';
  const actionClass = 'p-2 rounded-lg border border-outline-variant/30 hover:bg-[#edf4ff]';

  return (
    <div className="max-w-[1300px] mx-auto space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-primary">Dữ liệu nền</h2>
          <p className="text-on-surface-variant">Quản lý nhạc cụ, trình độ và kỹ thuật biểu diễn.</p>
        </div>
        <button onClick={() => void loadAll()} className="flex items-center gap-sm border border-primary text-primary px-md py-sm rounded-lg">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {error && <div className="rounded-lg bg-error-container text-on-error-container p-md">{error}</div>}

      <div className="flex gap-sm border-b border-outline-variant/20">
        {([
          ['instruments', 'Nhạc cụ'],
          ['skill-levels', 'Trình độ'],
          ['techniques', 'Kỹ thuật'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-lg py-md font-semibold border-b-2 ${tab === value ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-xl text-center">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-lg">
          {tab === 'instruments' && (
            <>
              <form onSubmit={submitInstrument} className="bg-white rounded-xl border border-outline-variant/20 p-lg space-y-md h-fit">
                <h3 className="font-bold text-lg">{instrumentEditingId ? 'Sửa nhạc cụ' : 'Thêm nhạc cụ'}</h3>
                <input required placeholder="Tên nhạc cụ" value={instrumentForm.name} onChange={(event) => setInstrumentForm({ ...instrumentForm, name: event.target.value })} className={fieldClass} />
                <textarea placeholder="Mô tả" value={instrumentForm.description} onChange={(event) => setInstrumentForm({ ...instrumentForm, description: event.target.value })} className={fieldClass} />
                <input placeholder="URL biểu tượng" value={instrumentForm.iconUrl} onChange={(event) => setInstrumentForm({ ...instrumentForm, iconUrl: event.target.value })} className={fieldClass} />
                <button className="w-full bg-primary text-on-primary rounded-lg py-sm font-semibold"><Plus className="w-4 h-4 inline mr-2" />{instrumentEditingId ? 'Cập nhật' : 'Thêm mới'}</button>
              </form>
              <div className="bg-white rounded-xl border border-outline-variant/20 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#edf4ff]"><tr><th className="p-md">Mã</th><th className="p-md">Tên</th><th className="p-md">Mô tả</th><th className="p-md text-right">Thao tác</th></tr></thead>
                  <tbody>{instruments.map((item) => (
                    <tr key={item.id} className="border-t border-outline-variant/10">
                      <td className="p-md">{item.instrumentCode}</td><td className="p-md font-semibold">{item.name}</td><td className="p-md">{item.description || '—'}</td>
                      <td className="p-md"><div className="flex justify-end gap-xs">
                        <button title="Xem kỹ thuật" onClick={() => void showInstrumentTechniques(item.id)} className={actionClass}><ListFilter className="w-4 h-4" /></button>
                        <button title="Sửa" onClick={() => void editInstrument(item.id)} className={actionClass}><Edit2 className="w-4 h-4" /></button>
                        <button title="Xóa" onClick={() => void deleteInstrument(item.id)} className={actionClass}><Trash2 className="w-4 h-4 text-error" /></button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'skill-levels' && (
            <>
              <form onSubmit={submitSkillLevel} className="bg-white rounded-xl border border-outline-variant/20 p-lg space-y-md h-fit">
                <h3 className="font-bold text-lg">{skillEditingId ? 'Sửa trình độ' : 'Thêm trình độ'}</h3>
                <input required placeholder="Mã trình độ" value={skillForm.levelCode} onChange={(event) => setSkillForm({ ...skillForm, levelCode: event.target.value })} className={fieldClass} />
                <input required placeholder="Tên trình độ" value={skillForm.levelName} onChange={(event) => setSkillForm({ ...skillForm, levelName: event.target.value })} className={fieldClass} />
                <input required type="number" min="1" value={skillForm.orderIndex} onChange={(event) => setSkillForm({ ...skillForm, orderIndex: Number(event.target.value) })} className={fieldClass} />
                <button className="w-full bg-primary text-on-primary rounded-lg py-sm font-semibold">{skillEditingId ? 'Cập nhật' : 'Thêm mới'}</button>
              </form>
              <div className="bg-white rounded-xl border border-outline-variant/20 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#edf4ff]"><tr><th className="p-md">Thứ tự</th><th className="p-md">Mã</th><th className="p-md">Tên</th><th className="p-md text-right">Thao tác</th></tr></thead>
                  <tbody>{skillLevels.map((item) => (
                    <tr key={item.id} className="border-t border-outline-variant/10">
                      <td className="p-md">{item.orderIndex}</td><td className="p-md">{item.levelCode}</td><td className="p-md font-semibold">{item.levelName}</td>
                      <td className="p-md"><div className="flex justify-end gap-xs">
                        <button onClick={() => void editSkillLevel(item.id)} className={actionClass}><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => void deleteSkillLevel(item.id)} className={actionClass}><Trash2 className="w-4 h-4 text-error" /></button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'techniques' && (
            <>
              <form onSubmit={submitTechnique} className="bg-white rounded-xl border border-outline-variant/20 p-lg space-y-md h-fit">
                <h3 className="font-bold text-lg">{techniqueEditingId ? 'Sửa kỹ thuật' : 'Thêm kỹ thuật'}</h3>
                <select required disabled={techniqueEditingId !== null} value={techniqueForm.instrument_id} onChange={(event) => setTechniqueForm({ ...techniqueForm, instrument_id: Number(event.target.value) })} className={fieldClass}>
                  {instruments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input required placeholder="Tên kỹ thuật" value={techniqueForm.name} onChange={(event) => setTechniqueForm({ ...techniqueForm, name: event.target.value })} className={fieldClass} />
                <textarea placeholder="Mô tả" value={techniqueForm.description} onChange={(event) => setTechniqueForm({ ...techniqueForm, description: event.target.value })} className={fieldClass} />
                <input placeholder="URL hướng dẫn" value={techniqueForm.guide_url} onChange={(event) => setTechniqueForm({ ...techniqueForm, guide_url: event.target.value })} className={fieldClass} />
                <button className="w-full bg-primary text-on-primary rounded-lg py-sm font-semibold">{techniqueEditingId ? 'Cập nhật' : 'Thêm mới'}</button>
              </form>
              <div className="space-y-md">
                <div className="bg-white rounded-xl border border-outline-variant/20 p-md flex items-center gap-sm">
                  <ListFilter className="w-4 h-4" />
                  <select value={techniqueInstrumentFilter} onChange={(event) => void filterTechniques(Number(event.target.value))} className={fieldClass}>
                    <option value={0}>Tất cả nhạc cụ</option>
                    {instruments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="bg-white rounded-xl border border-outline-variant/20 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#edf4ff]"><tr><th className="p-md">Tên</th><th className="p-md">Nhạc cụ</th><th className="p-md">Hướng dẫn</th><th className="p-md text-right">Thao tác</th></tr></thead>
                    <tbody>{techniques.map((item) => (
                      <tr key={item.id} className="border-t border-outline-variant/10">
                        <td className="p-md font-semibold">{item.name}</td><td className="p-md">{instruments.find((instrument) => instrument.id === item.instrument_id)?.name ?? item.instrument_id}</td>
                        <td className="p-md">{item.guide_url ? <a href={item.guide_url} target="_blank" rel="noreferrer" className="text-primary underline">Mở hướng dẫn</a> : '—'}</td>
                        <td className="p-md"><div className="flex justify-end gap-xs">
                          <button onClick={() => void editTechnique(item.id)} className={actionClass}><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => void deleteTechnique(item.id)} className={actionClass}><Trash2 className="w-4 h-4 text-error" /></button>
                        </div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMasterData;
