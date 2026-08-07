import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, Gauge, RefreshCw, Save, SlidersHorizontal, ToggleLeft } from 'lucide-react';
import { appConfigsApi, type AppConfig } from '../../api/services';

type ConfigGroup = 'scoring' | 'difficulty' | 'feature';

const groups: Array<{ id: ConfigGroup; label: string; description: string; icon: typeof Gauge }> = [
  { id: 'scoring', label: 'Tham số chấm điểm', description: 'Các hệ số và ngưỡng phục vụ chấm điểm biểu diễn.', icon: Gauge },
  { id: 'difficulty', label: 'Thiết lập độ khó', description: 'Các tham số điều chỉnh độ khó và lộ trình thích ứng.', icon: SlidersHorizontal },
  { id: 'feature', label: 'Bật/tắt tính năng', description: 'Các cờ bật hoặc tắt tính năng hệ thống.', icon: ToggleLeft },
];

const toConfigGroup = (value?: string): ConfigGroup | null => {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'scoring') return 'scoring';
  if (normalized === 'difficulty' || normalized === 'difficulty_curve') return 'difficulty';
  if (normalized === 'feature' || normalized === 'features' || normalized === 'feature_toggle' || normalized === 'feature_toggles') return 'feature';
  return null;
};

const isBoolean = (value: string) => /^(true|false)$/i.test(value.trim());
const isNumber = (value: string) => /^-?\d+(\.\d+)?$/.test(value.trim());

const AdminSettings = () => {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<ConfigGroup>('scoring');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const loadConfigs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await appConfigsApi.list(undefined, { signal });
      if (signal?.aborted) return;
      setConfigs(data);
      setDrafts(Object.fromEntries(data.map((config) => [config.key, config.value ?? ''])));
    } catch (error) {
      if (!signal?.aborted) setLoadError(error instanceof Error ? error.message : 'Không thể tải cấu hình hệ thống.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadConfigs(controller.signal);
    return () => controller.abort();
  }, [loadConfigs]);

  const groupedConfigs = useMemo(
    () => configs.filter((config) => toConfigGroup(config.config_group) === selectedGroup),
    [configs, selectedGroup],
  );

  const saveConfig = async (config: AppConfig) => {
    const value = drafts[config.key] ?? '';
    setSavingKey(config.key);
    setNotice('');
    try {
      const updated = await appConfigsApi.update(config.key, value);
      setConfigs((current) => current.map((item) => item.key === config.key ? updated : item));
      setDrafts((current) => ({ ...current, [config.key]: updated.value ?? value }));
      setNotice(`Đã cập nhật cấu hình “${config.description || config.key}”.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể cập nhật cấu hình.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <div className="p-xl text-center text-[#1D4532]">Đang tải cấu hình hệ thống...</div>;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <header>
        <h2 className="text-headline-lg font-bold text-[#1D4532]">Cấu hình hệ thống</h2>
        <p className="mt-1 text-on-surface-variant">Quản trị tham số chấm điểm, thiết lập độ khó và các tính năng hệ thống.</p>
      </header>

      {loadError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <span>{loadError}</span>
          <button onClick={() => void loadConfigs()} className="inline-flex items-center gap-2 font-semibold underline">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-[#CFE3D8] bg-[#EDF7F2] px-5 py-4 text-[#1D4532]">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {groups.map((group) => {
          const Icon = group.icon;
          const count = configs.filter((config) => toConfigGroup(config.config_group) === group.id).length;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroup(group.id)}
              className={`rounded-xl border p-5 text-left transition-colors ${
                selectedGroup === group.id ? 'border-[#1D4532] bg-[#EDF7F2]' : 'border-[#DCEBE3] bg-white hover:bg-[#FAFCFB]'
              }`}
            >
              <Icon className="mb-3 h-6 w-6 text-[#1D4532]" />
              <p className="font-bold text-[#1D4532]">{group.label}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{group.description}</p>
              <p className="mt-3 text-xs font-semibold text-[#1D4532]">{count} cấu hình</p>
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-[#DCEBE3] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3 border-b border-[#E5EEE9] pb-5">
          {(() => {
            const group = groups.find((item) => item.id === selectedGroup)!;
            const Icon = group.icon;
            return <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#1D4532]" />;
          })()}
          <div>
            <h3 className="text-lg font-bold text-[#1D4532]">{groups.find((group) => group.id === selectedGroup)?.label}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{groups.find((group) => group.id === selectedGroup)?.description}</p>
          </div>
        </div>

        {groupedConfigs.length === 0 ? (
          <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-[#CFE3D8] bg-[#FAFCFB] px-5 text-center text-sm text-on-surface-variant">
            Backend chưa cung cấp cấu hình thuộc nhóm này.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedConfigs.map((config) => {
              const value = drafts[config.key] ?? '';
              const changed = value !== (config.value ?? '');
              const booleanValue = isBoolean(value);
              return (
                <article key={config.key} className="rounded-xl border border-[#E1EBE5] bg-[#FAFCFB] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1D4532]">{config.description || config.key}</p>
                      <p className="mt-1 font-mono text-xs text-on-surface-variant">{config.key}</p>
                      {config.updated_at && <p className="mt-2 text-xs text-on-surface-variant">Cập nhật: {config.updated_at}{config.updated_by ? ` · ${config.updated_by}` : ''}</p>}
                    </div>

                    <div className="flex w-full items-center gap-3 lg:w-auto">
                      {booleanValue ? (
                        <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#1D4532]">
                          <input
                            type="checkbox"
                            checked={value.toLowerCase() === 'true'}
                            onChange={(event) => setDrafts((current) => ({ ...current, [config.key]: String(event.target.checked) }))}
                            className="h-5 w-5 accent-[#1D4532]"
                          />
                          {value.toLowerCase() === 'true' ? 'Đang bật' : 'Đang tắt'}
                        </label>
                      ) : (
                        <input
                          type={isNumber(value) ? 'number' : 'text'}
                          value={value}
                          onChange={(event) => setDrafts((current) => ({ ...current, [config.key]: event.target.value }))}
                          className="min-w-0 flex-1 rounded-lg border border-[#CFE3D8] bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-[#1D4532] lg:w-64 lg:flex-none"
                        />
                      )}
                      <button
                        type="button"
                        disabled={!changed || savingKey === config.key}
                        onClick={() => void saveConfig(config)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1D4532] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#163526] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Save className="h-4 w-4" /> {savingKey === config.key ? 'Đang lưu' : 'Cập nhật'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Giao diện sử dụng kiểu dữ liệu do API hiện công bố. Backend cần trả metadata kiểu dữ liệu và giới hạn giá trị để hệ thống có thể kiểm tra chính xác hơn.</p>
      </div>
    </div>
  );
};

export default AdminSettings;
