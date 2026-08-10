import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Gauge,
  RefreshCw,
  Save,
  SlidersHorizontal,
  ToggleLeft,
} from 'lucide-react';
import { appConfigsApi, type AppConfig } from '../../api/services';
import { ApiError } from '../../api/client';

type ConfigGroup = 'scoring' | 'difficulty' | 'feature';
type ConfigValueType = 'boolean' | 'number' | 'select' | 'json' | 'unsupported';

interface Notice {
  type: 'success' | 'error';
  message: string;
}

const GROUPS: Array<{
  id: ConfigGroup;
  label: string;
  description: string;
  icon: typeof Gauge;
}> = [
  {
    id: 'scoring',
    label: 'Thông số tính điểm',
    description: 'Trọng số, ngưỡng và tham số dùng trong quá trình đánh giá phần trình diễn.',
    icon: Gauge,
  },
  {
    id: 'difficulty',
    label: 'Độ chính xác và độ khó',
    description: 'Thiết lập các ngưỡng sai số và khả năng điều chỉnh độ khó theo kết quả luyện tập. Giá trị nhỏ nghiêm ngặt hơn, giá trị lớn dễ đạt hơn.',
    icon: SlidersHorizontal,
  },
  {
    id: 'feature',
    label: 'Bật/tắt tính năng',
    description: 'Quản lý trạng thái các tính năng áp dụng cho toàn hệ thống. Thay đổi chỉ có hiệu lực sau khi được lưu.',
    icon: ToggleLeft,
  },
];

interface ConfigPresentation {
  label: string;
  helpText: string;
  unit?: string;
  order: number;
  accuracyTolerance?: boolean;
}

const CONFIG_PRESENTATION: Record<string, ConfigPresentation> = {
  'scoring.star1.threshold': {
    label: 'Ngưỡng đạt 1 sao',
    helpText: 'Người học đạt 1 sao khi tổng điểm bằng hoặc cao hơn giá trị này.',
    unit: 'điểm',
    order: 10,
  },
  'scoring.star2.threshold': {
    label: 'Ngưỡng đạt 2 sao',
    helpText: 'Người học đạt 2 sao khi tổng điểm bằng hoặc cao hơn giá trị này.',
    unit: 'điểm',
    order: 20,
  },
  'scoring.star3.threshold': {
    label: 'Ngưỡng đạt 3 sao',
    helpText: 'Người học đạt 3 sao khi tổng điểm bằng hoặc cao hơn giá trị này.',
    unit: 'điểm',
    order: 30,
  },
  'scoring.pitch_weight': { label: 'Trọng số cao độ', helpText: 'Mức đóng góp của độ chính xác cao độ vào điểm tổng.', order: 40 },
  'scoring.rhythm_weight': { label: 'Trọng số nhịp điệu', helpText: 'Mức đóng góp của độ chính xác nhịp điệu vào điểm tổng.', order: 50 },
  'scoring.tonal_weight': { label: 'Trọng số âm sắc', helpText: 'Mức đóng góp của chất lượng âm sắc vào điểm tổng.', order: 60 },
  'scoring.breath_weight': { label: 'Trọng số hơi thở', helpText: 'Mức đóng góp của kỹ thuật hơi đối với nhạc cụ hơi.', order: 70 },
  'scoring.dynamics_weight': { label: 'Trọng số sắc thái', helpText: 'Mức đóng góp của khả năng kiểm soát cường độ vào điểm tổng.', order: 80 },
  'difficulty.rolling_window': {
    label: 'Số lượt luyện tập dùng để điều chỉnh',
    helpText: 'Hệ thống dùng số lượt luyện tập gần nhất này để tính và điều chỉnh độ khó.',
    unit: 'lượt',
    order: 10,
  },
  'difficulty.pitch_matching_tolerance_cents': {
    label: 'Sai số cao độ cho phép',
    helpText: 'Độ lệch cao độ tối đa vẫn được xem là chơi đúng. Giá trị càng nhỏ thì yêu cầu càng chính xác.',
    unit: 'cent',
    order: 20,
    accuracyTolerance: true,
  },
  'difficulty.rhythm_timing_tolerance_seconds': {
    label: 'Sai số nhịp cho phép',
    helpText: 'Độ lệch thời gian tối đa giữa nốt được chơi và nhịp chuẩn. Giá trị càng nhỏ thì yêu cầu giữ nhịp càng chính xác.',
    unit: 'giây',
    order: 30,
    accuracyTolerance: true,
  },
  'feature.minigame_enabled': {
    label: 'Trò chơi nhỏ',
    helpText: 'Cho phép hoặc tạm dừng các trò chơi nhỏ đối với toàn bộ người dùng trong hệ thống.',
    order: 10,
  },
  'feature.minigames_enabled': {
    label: 'Trò chơi nhỏ',
    helpText: 'Cho phép hoặc tạm dừng các trò chơi nhỏ đối với toàn bộ người dùng trong hệ thống.',
    order: 10,
  },
  'feature.leaderboard_enabled': {
    label: 'Bảng xếp hạng',
    helpText: 'Cho phép hoặc tạm dừng bảng xếp hạng đối với toàn bộ người dùng trong hệ thống.',
    order: 20,
  },
  'feature.adaptive_difficulty': {
    label: 'Điều chỉnh độ khó thích ứng',
    helpText: 'Cho phép hệ thống tự điều chỉnh độ khó theo kết quả luyện tập của người học.',
    order: 20,
  },
};

const TOLERANCE_PRESENTATIONS: Record<string, ConfigPresentation> = {
  'Pitch matching tolerance in cents': CONFIG_PRESENTATION['difficulty.pitch_matching_tolerance_cents'],
  'Rhythm timing tolerance in seconds': CONFIG_PRESENTATION['difficulty.rhythm_timing_tolerance_seconds'],
};

const FEATURE_PRESENTATIONS: Record<string, ConfigPresentation> = {
  'Enable or disable leaderboard globally': CONFIG_PRESENTATION['feature.leaderboard_enabled'],
  'Enable or disable minigames': CONFIG_PRESENTATION['feature.minigames_enabled'],
};

CONFIG_PRESENTATION['difficulty.pitch_tolerance_cents'] = CONFIG_PRESENTATION['difficulty.pitch_matching_tolerance_cents'];
CONFIG_PRESENTATION['difficulty.rhythm_tolerance_seconds'] = CONFIG_PRESENTATION['difficulty.rhythm_timing_tolerance_seconds'];

const getPresentation = (config: AppConfig): ConfigPresentation =>
  CONFIG_PRESENTATION[config.key]
  ?? TOLERANCE_PRESENTATIONS[config.description ?? '']
  ?? FEATURE_PRESENTATIONS[config.description ?? '']
  ?? {
  label: config.description || config.key,
  helpText: config.description || 'Cấu hình do Backend cung cấp.',
  order: 999,
};

const formatNumberVi = (value: number | string) => {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('vi-VN').format(number) : String(value);
};

const normalizeGroup = (value?: string): ConfigGroup | null => {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'scoring') return 'scoring';
  if (normalized === 'difficulty') return 'difficulty';
  if (normalized === 'feature') return 'feature';
  return null;
};

const getConfigGroup = (config: AppConfig): ConfigGroup | null => {
  return normalizeGroup(config.config_group);
};

const parseOptions = (options?: string): string[] => {
  if (!options?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(options);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Some API versions expose enum options as a comma-separated string.
  }
  return options.split(',').map((item) => item.trim()).filter(Boolean);
};

const getValueType = (config: AppConfig): ConfigValueType => {
  const declaredType = (config.valueType ?? '').trim().toLowerCase();
  if (declaredType === 'boolean') return 'boolean';
  if (declaredType === 'number') return 'number';
  if (declaredType === 'json') return 'json';
  if (declaredType === 'select' && parseOptions(config.options).length > 0) return 'select';
  return 'unsupported';
};

const normalizeValueForSave = (config: AppConfig, value: string) => {
  const type = getValueType(config);
  if (type === 'boolean') return value.trim().toLowerCase();
  if (type === 'number' || type === 'json') return value.trim();
  return value;
};

const validateValue = (config: AppConfig, value: string): string => {
  const type = getValueType(config);
  if (!value.trim()) return 'Giá trị không được để trống.';

  if (type === 'boolean' && !/^(true|false)$/i.test(value.trim())) {
    return 'Giá trị phải là true hoặc false.';
  }

  if (type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Giá trị phải là một số hợp lệ.';
    if (config.min !== undefined && number < config.min) return `Giá trị nhỏ nhất là ${config.min}.`;
    if (config.max !== undefined && number > config.max) return `Giá trị lớn nhất là ${config.max}.`;
    if (config.step !== undefined && config.step > 0) {
      const origin = config.min ?? 0;
      const quotient = (number - origin) / config.step;
      if (Math.abs(quotient - Math.round(quotient)) > 1e-8) return `Giá trị phải tăng theo bước ${config.step}.`;
    }
  }

  if (type === 'select') {
    const options = parseOptions(config.options);
    if (options.length > 0 && !options.includes(value)) return 'Giá trị không nằm trong danh sách được Backend cho phép.';
  }

  if (type === 'json') {
    try {
      JSON.parse(value);
    } catch {
      return 'Nội dung JSON không hợp lệ.';
    }
  }

  return '';
};

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const getDraftValue = (config: AppConfig) => String(config.value ?? '');

const PAGE_SIZE = 6;

const AdminSettings = () => {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<ConfigGroup>('scoring');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hasVersionConflict, setHasVersionConflict] = useState(false);

  const loadConfigs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError('');
    setNotice(null);
    setHasVersionConflict(false);
    try {
      const groupResponses = await Promise.all(
        GROUPS.map((group) => appConfigsApi.list(group.id, { signal })),
      );
      if (signal?.aborted) return;
      const response = groupResponses.flat().filter((config) => getConfigGroup(config) !== null);
      setConfigs(response);
      setDrafts(Object.fromEntries(response.map((config) => [config.key, getDraftValue(config)])));
    } catch (error) {
      if (!signal?.aborted) {
        setLoadError(error instanceof Error ? error.message : 'Không thể tải cấu hình hệ thống.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadConfigs(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadConfigs]);

  const groupedConfigs = useMemo(
    () => configs
      .filter((config) => getConfigGroup(config) === selectedGroup)
      .sort((a, b) => getPresentation(a).order - getPresentation(b).order || a.key.localeCompare(b.key)),
    [configs, selectedGroup],
  );

  const totalPages = Math.max(1, Math.ceil(groupedConfigs.length / PAGE_SIZE));
  const paginatedConfigs = useMemo(
    () => groupedConfigs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, groupedConfigs],
  );

  const changedKeys = useMemo(
    () => new Set(configs.filter((config) => (drafts[config.key] ?? '') !== getDraftValue(config)).map((config) => config.key)),
    [configs, drafts],
  );

  const updateDraft = (key: string, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const validateScoringRelationship = (config: AppConfig, value: string) => {
    if (!/^scoring\.star[123]\.threshold$/.test(config.key)) return '';
    const thresholdKeys = [
      'scoring.star1.threshold',
      'scoring.star2.threshold',
      'scoring.star3.threshold',
    ];
    const values = thresholdKeys.map((key) => {
      const relatedConfig = configs.find((item) => item.key === key);
      if (!relatedConfig) return Number.NaN;
      return Number(key === config.key ? value : (drafts[key] ?? relatedConfig.value));
    });
    if (values.some((item) => !Number.isFinite(item))) return '';
    return values[0] < values[1] && values[1] < values[2]
      ? ''
      : 'Ngưỡng sao phải thỏa mãn: 1 sao < 2 sao < 3 sao.';
  };

  const saveConfig = async (config: AppConfig) => {
    if (!Number.isInteger(config.version) || Number(config.version) < 0) {
      setNotice({ type: 'error', message: 'Backend chưa cung cấp version hợp lệ nên không thể cập nhật cấu hình an toàn.' });
      return;
    }
    const draftValue = drafts[config.key] ?? '';
    const value = normalizeValueForSave(config, draftValue);
    const validationError = validateValue(config, value) || validateScoringRelationship(config, value);
    if (validationError) {
      setNotice({ type: 'error', message: `${getPresentation(config).label}: ${validationError}` });
      return;
    }

    setSavingKey(config.key);
    setNotice(null);
    try {
      const updated = await appConfigsApi.update(config.key, value, Number(config.version));
      const normalized = { ...config, ...updated, value: String(updated?.value ?? value) };
      setConfigs((current) => current.map((item) => item.key === config.key ? normalized : item));
      setDrafts((current) => ({ ...current, [config.key]: getDraftValue(normalized) }));
      setHasVersionConflict(false);
      setNotice({ type: 'success', message: `Đã cập nhật “${getPresentation(config).label}”.` });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setHasVersionConflict(true);
        setNotice({
          type: 'error',
          message: 'Cấu hình đã được Admin khác cập nhật. Hãy tải lại dữ liệu trước khi tiếp tục chỉnh sửa.',
        });
        return;
      }
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không thể cập nhật cấu hình.',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const selectedGroupInfo = GROUPS.find((group) => group.id === selectedGroup) ?? GROUPS[0];
  const SelectedIcon = selectedGroupInfo.icon;

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5 pb-8">
      <header className="rounded-2xl border border-[#dfe9e3] bg-white px-6 py-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1D6750]">Quản trị ứng dụng</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#163d2d] md:text-3xl">Cấu hình hệ thống</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68736d]">
            Quản lý các tham số ảnh hưởng trực tiếp đến cách chấm điểm, độ khó và tính năng của toàn hệ thống.
          </p>
        </div>
      </header>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadConfigs()} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-5 py-4 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{notice.message}</span>
          {hasVersionConflict && (
            <button
              type="button"
              onClick={() => void loadConfigs()}
              className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 font-semibold text-red-800 hover:bg-red-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Tải lại dữ liệu
            </button>
          )}
        </div>
      )}

      <section className="grid gap-2 rounded-2xl border border-[#dfe9e3] bg-white p-2 shadow-sm md:grid-cols-3" aria-label="Nhóm cấu hình">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          const groupConfigs = configs.filter((config) => getConfigGroup(config) === group.id);
          const changedCount = groupConfigs.filter((config) => changedKeys.has(config.key)).length;
          const active = selectedGroup === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => {
                setSelectedGroup(group.id);
                setCurrentPage(1);
                setNotice(null);
              }}
              className={`flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'border-[#1D6750] bg-[#edf5f1] text-[#173f2f]'
                  : 'border-transparent bg-white text-[#64736b] hover:bg-[#f5f8f6]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{group.label}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#52655b]">{groupConfigs.length}</span>
              {changedCount > 0 && <span className="h-2 w-2 rounded-full bg-amber-500" title={`${changedCount} thay đổi chưa lưu`} />}
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(20,61,44,0.04)]">
        <div className="flex items-start gap-3 border-b border-[#e8eeea] px-5 py-4 md:px-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf5f1] text-[#1D4532]">
            <SelectedIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#173f2f]">{selectedGroupInfo.label}</h2>
            <p className="mt-1 text-sm text-[#718078]">{selectedGroupInfo.description}</p>
          </div>
          {!loading && (
            <span className="shrink-0 rounded-full bg-[#edf5f1] px-3 py-1 text-xs font-bold text-[#1D6750]">
              {groupedConfigs.length} cấu hình
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 p-5 md:p-6">
            {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-[#f1f5f3]" />)}
          </div>
        ) : groupedConfigs.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
            <div>
              <SelectedIcon className="mx-auto h-8 w-8 text-[#9aaba2]" />
              <p className="mt-3 font-semibold text-[#365647]">Chưa có cấu hình trong nhóm này</p>
              <p className="mt-1 text-sm text-[#7a8780]">Giao diện chỉ hiển thị những cấu hình Backend thực tế trả về.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 bg-[#f7faf8] p-4 md:p-5">
            {paginatedConfigs.map((config) => {
              const presentation = getPresentation(config);
              const value = drafts[config.key] ?? '';
              const valueType = getValueType(config);
              const options = parseOptions(config.options);
              const changed = changedKeys.has(config.key);
              const validationError = changed
                ? validateValue(config, value) || validateScoringRelationship(config, value)
                : '';
              const isSaving = savingKey === config.key;
              const hasValidVersion = Number.isInteger(config.version) && Number(config.version) >= 0;
              const hasRange = valueType === 'number' && config.min !== undefined && config.max !== undefined;

              return (
                <article key={config.key} className={`grid gap-5 rounded-xl border bg-white p-5 transition lg:grid-cols-[minmax(280px,1fr)_minmax(360px,0.9fr)] lg:items-center ${changed ? 'border-amber-300 shadow-[0_0_0_1px_rgba(217,119,6,0.08)]' : 'border-[#e0e9e4]'}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#274b3b]">{presentation.label}</h3>
                      {changed && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Chưa lưu</span>}
                    </div>
                    <p className="mt-1 text-sm leading-5 text-[#718078]">{presentation.helpText}</p>

                    {valueType !== 'boolean' && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#64736b]">
                        {config.min !== undefined && <span className="rounded-md bg-[#f3f6f4] px-2 py-1">Tối thiểu: {formatNumberVi(config.min)}{presentation.unit ? ` ${presentation.unit}` : ''}</span>}
                        {config.max !== undefined && <span className="rounded-md bg-[#f3f6f4] px-2 py-1">Tối đa: {formatNumberVi(config.max)}{presentation.unit ? ` ${presentation.unit}` : ''}</span>}
                        {config.step !== undefined && <span className="rounded-md bg-[#f3f6f4] px-2 py-1">Bước: {formatNumberVi(config.step)}{presentation.unit ? ` ${presentation.unit}` : ''}</span>}
                        {config.defaultValue !== undefined && <span className="rounded-md bg-[#f3f6f4] px-2 py-1">Mặc định: {formatNumberVi(config.defaultValue)}{presentation.unit ? ` ${presentation.unit}` : ''}</span>}
                      </div>
                    )}

                    <details className="mt-3 text-xs text-[#7a8780]">
                      <summary className="w-fit cursor-pointer font-semibold text-[#52655b] hover:text-[#1D6750]">Thông tin kỹ thuật</summary>
                      <div className="mt-2 space-y-1 rounded-lg bg-[#f6f8f7] px-3 py-2">
                        <p className="break-all font-mono">Key: {config.key}</p>
                        {config.version !== undefined && <p>Phiên bản: {config.version}</p>}
                        {valueType === 'boolean' && config.defaultValue !== undefined && (
                          <p>Mặc định: {String(config.defaultValue).toLowerCase() === 'true' ? 'Bật' : 'Tắt'}</p>
                        )}
                        {(config.updated_at || config.updated_by) && (
                          <p>
                            Cập nhật gần nhất{config.updated_at ? ` lúc ${formatDateTime(config.updated_at)}` : ''}
                            {config.updated_by ? ` bởi ${config.updated_by}` : ''}
                          </p>
                        )}
                      </div>
                    </details>
                  </div>

                  <div>
                    {!hasValidVersion ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Backend chưa cung cấp version hợp lệ nên không thể chỉnh sửa cấu hình an toàn.
                      </div>
                    ) : valueType === 'boolean' ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={value.toLowerCase() === 'true'}
                        onClick={() => updateDraft(config.key, String(value.toLowerCase() !== 'true'))}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D6750]/30 ${changed ? 'border-amber-300 bg-amber-50/50' : 'border-[#d8e4dd] bg-[#fafcfb]'}`}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-[#365647]">Trạng thái tính năng</span>
                          <span className="mt-0.5 block text-xs text-[#7a8780]">
                            {changed ? (value.toLowerCase() === 'true' ? 'Sẽ bật sau khi lưu' : 'Sẽ tắt sau khi lưu') : (value.toLowerCase() === 'true' ? 'Đang bật' : 'Đang tắt')}
                          </span>
                        </span>
                        <span className={`relative h-7 w-12 rounded-full transition ${value.toLowerCase() === 'true' ? 'bg-[#1D6750]' : 'bg-[#c9d3ce]'}`}>
                          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${value.toLowerCase() === 'true' ? 'left-6' : 'left-1'}`} />
                        </span>
                      </button>
                    ) : valueType === 'select' ? (
                      <select
                        value={value}
                        onChange={(event) => updateDraft(config.key, event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#cfded6] bg-white px-3 text-sm text-[#274b3b] outline-none focus:border-[#1D6750]"
                      >
                        {options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : valueType === 'unsupported' ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Backend chưa khai báo valueType hợp lệ cho cấu hình này nên không thể chỉnh sửa an toàn.
                      </div>
                    ) : valueType === 'json' ? (
                      <textarea
                        value={value}
                        onChange={(event) => updateDraft(config.key, event.target.value)}
                        rows={4}
                        spellCheck={false}
                        className="w-full rounded-xl border border-[#cfded6] bg-white px-3 py-2 font-mono text-sm text-[#274b3b] outline-none focus:border-[#1D6750]"
                      />
                    ) : (
                      <div className={hasRange ? 'space-y-3' : ''}>
                        {hasRange && (
                          <div>
                            <input
                              type="range"
                              min={config.min}
                              max={config.max}
                              step={config.step ?? 'any'}
                              value={value}
                              onChange={(event) => updateDraft(config.key, event.target.value)}
                              className="w-full accent-[#1D6750]"
                            />
                            {presentation.accuracyTolerance ? (
                              <div className="mt-1 flex justify-between gap-4 text-xs font-medium text-[#64736b]">
                                <span>Chính xác cao ← {formatNumberVi(config.min!)} {presentation.unit}</span>
                                <span className="text-right">{formatNumberVi(config.max!)} {presentation.unit} → Dễ đạt hơn</span>
                              </div>
                            ) : (
                              <div className="mt-1 flex justify-between text-xs text-[#7a8780]">
                                <span>{formatNumberVi(config.min!)}</span>
                                <span>{formatNumberVi(config.max!)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type={valueType === 'number' ? 'number' : 'text'}
                            min={config.min}
                            max={config.max}
                            step={config.step ?? 'any'}
                            value={value}
                            onChange={(event) => updateDraft(config.key, event.target.value)}
                            aria-label={`Giá trị ${presentation.label}`}
                            className="h-11 w-32 rounded-xl border border-[#cfded6] bg-white px-3 text-right text-sm font-semibold text-[#274b3b] outline-none focus:border-[#1D6750]"
                          />
                          {presentation.unit && <span className="min-w-12 text-sm font-semibold text-[#52655b]">{presentation.unit}</span>}
                        </div>
                      </div>
                    )}

                    {validationError && <p className="mt-2 text-xs font-medium text-red-700">{validationError}</p>}

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={!hasValidVersion || !changed || Boolean(validationError) || isSaving || (savingKey !== null && !isSaving)}
                        onClick={() => void saveConfig(config)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#1D6750] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#174f3e] disabled:cursor-not-allowed disabled:bg-[#a9b9b1] disabled:shadow-none"
                      >
                        {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {isSaving ? 'Đang lưu' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && groupedConfigs.length > PAGE_SIZE && (
          <div className="flex flex-col gap-3 border-t border-[#e8eeea] px-5 py-4 text-sm text-[#66756d] sm:flex-row sm:items-center sm:justify-between md:px-6">
            <span>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, groupedConfigs.length)} trong {groupedConfigs.length} cấu hình
            </span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="h-9 rounded-lg border border-[#d8e4dd] px-3 font-semibold text-[#365647] disabled:opacity-40">Trước</button>
              <span className="min-w-20 text-center font-semibold text-[#294c3c]">Trang {currentPage}/{totalPages}</span>
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="h-9 rounded-lg border border-[#d8e4dd] px-3 font-semibold text-[#365647] disabled:opacity-40">Sau</button>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

export default AdminSettings;
