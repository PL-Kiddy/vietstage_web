import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CalendarDays,
  Music2,
  RefreshCw,
  Repeat2,
  Timer,
  Users,
} from 'lucide-react';
import { adminDashboardApi } from '../../api/services';
import type {
  AdminDashboardStats,
  DashboardGranularity,
  RetentionStat,
  SessionDurationStat,
} from '../../api/types';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

interface DashboardViewData {
  analytics?: AdminDashboardStats;
}

interface DashboardFilters {
  fromDate: string;
  toDate: string;
  granularity: DashboardGranularity;
}

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toVietnamDateTime = (date: string, endOfDay = false) =>
  `${date}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`;

const createInitialFilters = (): DashboardFilters => {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 29);
  return {
    fromDate: toDateInputValue(fromDate),
    toDate: toDateInputValue(toDate),
    granularity: 'DAY',
  };
};

const formatNumber = (value?: number) =>
  value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString('vi-VN');

const formatDecimal = (value?: number, suffix = '') =>
  value === undefined || !Number.isFinite(value)
    ? '—'
    : `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}${suffix}`;

const formatPeriod = (period: string) => {
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(period);
  if (dayMatch) return `${dayMatch[3]}/${dayMatch[2]}`;
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(period);
  if (monthMatch) return `Tháng ${Number(monthMatch[2])}/${monthMatch[1]}`;
  return period;
};

const EmptyAnalytics = ({ message }: { message: string }) => (
  <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[#d7e3dc] bg-[#fafcfb] px-5 text-center">
    <div>
      <Activity className="mx-auto h-7 w-7 text-[#9aaba2]" />
      <p className="mt-2 text-sm text-[#718078]">{message}</p>
    </div>
  </div>
);

interface LineChartPoint {
  period: string;
  value: number;
}

interface AnalyticsLineChartProps {
  data: LineChartPoint[];
  unit: string;
  emptyMessage: string;
  gradientId: string;
  color: string;
  fixedMax?: number;
}

const AnalyticsLineChart = ({ data, unit, emptyMessage, gradientId, color, fixedMax }: AnalyticsLineChartProps) => {
  if (data.length === 0) return <EmptyAnalytics message={emptyMessage} />;

  const chartWidth = 560;
  const chartHeight = 210;
  const padding = { top: 30, right: 24, bottom: 42, left: 48 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const rawMax = Math.max(...data.map((item) => item.value), 0);
  const maxValue = fixedMax ?? Math.max(1, Math.ceil(rawMax / 5) * 5);
  const xFor = (index: number) => padding.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const yFor = (value: number) => padding.top + innerHeight - (Math.min(Math.max(value, 0), maxValue) / maxValue) * innerHeight;
  const points = data.map((item, index) => `${xFor(index)},${yFor(item.value)}`).join(' ');
  const areaPoints = `${padding.left},${padding.top + innerHeight} ${points} ${padding.left + innerWidth},${padding.top + innerHeight}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`Biểu đồ xu hướng ${unit}`}
        className="h-[190px] w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((ratio) => {
          const y = padding.top + innerHeight - ratio * innerHeight;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={padding.left + innerWidth} y1={y} y2={y} stroke="#e4ece7" strokeDasharray="4 5" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#7a8780">
                {formatDecimal(maxValue * ratio)}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <text x={padding.left} y="14" fontSize="11" fontWeight="600" fill="#6f7d75">Đơn vị: {unit.trim()}</text>
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((item, index) => {
          const x = xFor(index);
          const y = yFor(item.value);
          return (
            <g key={`${item.period}-${index}`}>
              <circle cx={x} cy={y} r="7" fill="white" stroke={color} strokeWidth="3">
                <title>{`${formatPeriod(item.period)}: ${formatDecimal(item.value, unit)}`}</title>
              </circle>
              {index === data.length - 1 && (
                <text x={x} y={Math.max(14, y - 13)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#274b3b">
                  {formatDecimal(item.value, unit)}
                </text>
              )}
              <text x={x} y={chartHeight - 14} textAnchor="middle" fontSize="11" fill="#6f7d75">
                {formatPeriod(item.period)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const SessionDurationChart = ({ data }: { data: SessionDurationStat[] }) => (
  <AnalyticsLineChart
    data={data.map((item) => ({ period: item.period, value: item.averageDurationMinutes }))}
    unit=" phút"
    emptyMessage="Chưa có dữ liệu thời lượng phiên trong khoảng đã chọn."
    gradientId="session-duration-gradient"
    color="#2563EB"
  />
);

const RetentionChart = ({ data }: { data: RetentionStat[] }) => (
  <AnalyticsLineChart
    data={data.map((item) => ({ period: item.period, value: item.retentionRate }))}
    unit="%"
    emptyMessage="Chưa có dữ liệu duy trì trong khoảng đã chọn."
    gradientId="retention-gradient"
    color="#1D6750"
    fixedMax={100}
  />
);

const AdminDashboard = () => {
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>(createInitialFilters);
  const [filters, setFilters] = useState<DashboardFilters>(createInitialFilters);

  const fetchDashboard = useCallback(async (signal?: AbortSignal): Promise<DashboardViewData> => {
    const analytics = await adminDashboardApi.get({
      fromDate: toVietnamDateTime(filters.fromDate),
      toDate: toVietnamDateTime(filters.toDate, true),
      granularity: filters.granularity,
    }, { signal });

    return {
      analytics,
    };
  }, [filters]);

  const { data, error: dashboardError, loading, execute } = useAxiosRequest(fetchDashboard, { auto: false });
  const requestedFilterRef = useRef('');

  useEffect(() => {
    const requestKey = `${filters.fromDate}|${filters.toDate}|${filters.granularity}`;
    if (requestedFilterRef.current === requestKey) return;
    requestedFilterRef.current = requestKey;
    void execute().catch(() => undefined);
  }, [execute, fetchDashboard, filters]);

  const analytics = data?.analytics;
  const instruments = analytics?.popularInstruments ?? [];
  const durations = analytics?.sessionDuration ?? [];
  const retention = analytics?.retention ?? [];
  const visibleInstruments = instruments.slice(0, 5);
  const visibleDurations = durations.slice(-7);
  const visibleRetention = retention.slice(-6);
  const latestDuration = durations.length > 0 ? durations[durations.length - 1] : undefined;
  const latestRetention = retention.length > 0 ? retention[retention.length - 1] : undefined;
  const topInstrument = instruments[0];
  const maxPracticeCount = Math.max(...instruments.map((item) => item.practiceCount), 0);
  const invalidDateRange = !draftFilters.fromDate || !draftFilters.toDate || draftFilters.fromDate > draftFilters.toDate;
  const isDashboardLoading = loading || !data;

  const cards = useMemo(() => [
    {
      icon: Users,
      label: 'Người dùng hoạt động',
      value: formatNumber(analytics?.activeUsers),
      helper: 'Trong khoảng đã chọn',
    },
    {
      icon: Music2,
      label: 'Nhạc cụ phổ biến',
      value: topInstrument?.instrumentName || '—',
      helper: topInstrument ? `${formatNumber(topInstrument.practiceCount)} lượt luyện tập` : 'Chưa có dữ liệu luyện tập',
    },
    {
      icon: Timer,
      label: 'Thời lượng phiên TB',
      value: formatDecimal(latestDuration?.averageDurationMinutes, ' phút'),
      helper: latestDuration ? `Trung bình kỳ ${formatPeriod(latestDuration.period)}` : 'Chưa có dữ liệu phiên',
    },
    {
      icon: Repeat2,
      label: 'Tỷ lệ duy trì',
      value: formatDecimal(latestRetention?.retentionRate, '%'),
      helper: latestRetention ? `Kỳ ${formatPeriod(latestRetention.period)}` : 'Chưa có dữ liệu duy trì',
    },
  ], [analytics, latestDuration, latestRetention, topInstrument]);

  const applyFilters = () => {
    if (!invalidDateRange) setFilters(draftFilters);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 pb-4">
      <header className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#163d2d] md:text-4xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-2 text-sm text-[#68736d] md:text-base">
            Theo dõi mức độ sử dụng, hoạt động luyện tập và khả năng quay lại của người học.
          </p>
        </div>

        <div className="rounded-2xl border border-[#dfe9e3] bg-white p-3 shadow-sm">
          <div className="flex w-full flex-wrap items-end gap-3">
          <label className="w-full text-xs font-semibold text-[#64736b] sm:w-auto sm:min-w-44">
            Từ ngày
            <input
              type="date"
              value={draftFilters.fromDate}
              max={draftFilters.toDate}
              onChange={(event) => setDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
              className="mt-1 block h-10 w-full rounded-lg border border-[#d8e4dd] bg-white px-3 text-sm font-medium text-[#274b3b] outline-none focus:border-[#1D6750]"
            />
          </label>
          <label className="w-full text-xs font-semibold text-[#64736b] sm:w-auto sm:min-w-44">
            Đến ngày
            <input
              type="date"
              value={draftFilters.toDate}
              min={draftFilters.fromDate}
              onChange={(event) => setDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
              className="mt-1 block h-10 w-full rounded-lg border border-[#d8e4dd] bg-white px-3 text-sm font-medium text-[#274b3b] outline-none focus:border-[#1D6750]"
            />
          </label>
          <label className="w-full text-xs font-semibold text-[#64736b] sm:w-auto sm:min-w-40">
            Nhóm theo
            <select
              value={draftFilters.granularity}
              onChange={(event) => setDraftFilters((current) => ({ ...current, granularity: event.target.value as DashboardGranularity }))}
              className="mt-1 block h-10 w-full rounded-lg border border-[#d8e4dd] bg-white px-3 text-sm font-medium text-[#274b3b] outline-none focus:border-[#1D6750]"
            >
              <option value="DAY">Ngày</option>
              <option value="WEEK">Tuần</option>
              <option value="MONTH">Tháng</option>
            </select>
          </label>
          <button
            type="button"
            disabled={invalidDateRange || isDashboardLoading}
            onClick={applyFilters}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1D4532] px-5 text-sm font-semibold text-white transition hover:bg-[#163a2a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <CalendarDays className="h-4 w-4" /> Áp dụng
          </button>
          </div>
          <p className="mt-2 text-xs text-[#718078]">
            Khoảng ngày áp dụng cho toàn bộ chỉ số và biểu đồ. “Nhóm theo” điều chỉnh cách hiển thị dữ liệu theo thời gian.
          </p>
          {invalidDateRange && (
            <p className="mt-2 text-sm font-medium text-red-700">Vui lòng chọn khoảng ngày hợp lệ.</p>
          )}
        </div>
      </header>

      {dashboardError && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Chưa thể tải số liệu phân tích từ hệ thống. Vui lòng thử lại sau.</span>
          <button type="button" onClick={() => void execute()} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số phân tích hệ thống">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-[#e0e9e4] bg-white p-4 shadow-[0_4px_18px_rgba(20,61,44,0.04)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf5f1] text-[#1D4532]">
              <card.icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-3 truncate text-2xl font-bold tracking-tight text-[#173f2f]" title={card.value}>
              {isDashboardLoading ? '—' : card.value}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#52655b]">{card.label}</p>
            <p className="mt-1 text-xs text-[#87938c]">{isDashboardLoading ? 'Đang tải dữ liệu...' : card.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <article className="h-full rounded-2xl border border-[#e0e9e4] bg-white p-4 shadow-[0_4px_18px_rgba(20,61,44,0.04)] xl:col-span-3">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#173f2f]">Nhạc cụ phổ biến</h2>
              <p className="mt-1 text-sm text-[#718078]">Top 5 theo số lượt luyện tập trong khoảng đã chọn.</p>
            </div>
            <span className="rounded-full bg-[#edf5f1] px-2.5 py-1 text-xs font-semibold text-[#466957]">Top 5</span>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f3]" />)}</div>
          ) : visibleInstruments.length === 0 ? (
            <EmptyAnalytics message="Chưa có dữ liệu luyện tập theo nhạc cụ trong khoảng đã chọn." />
          ) : (
            <div className="space-y-5">
              {visibleInstruments.map((instrument, index) => {
                const width = maxPracticeCount > 0 ? (instrument.practiceCount / maxPracticeCount) * 100 : 0;
                return (
                  <div key={instrument.instrumentId}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#edf5f1] text-xs font-bold text-[#1D4532]">{index + 1}</span>
                        <span className="truncate text-sm font-semibold text-[#355647]">{instrument.instrumentName}</span>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#173f2f]">{formatNumber(instrument.practiceCount)} lượt</span>
                    </div>
                    <div className="ml-10 h-2 overflow-hidden rounded-full bg-[#edf2ef]">
                      <div className="h-full rounded-full bg-[#1D6750]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="h-full rounded-2xl border border-[#e0e9e4] bg-white p-4 shadow-[0_4px_18px_rgba(20,61,44,0.04)] xl:col-span-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#173f2f]">Xu hướng duy trì người dùng</h2>
              <p className="mt-1 text-sm text-[#718078]">Tỷ lệ người dùng quay lại hoạt động trong 6 kỳ gần nhất.</p>
            </div>
            <span className="rounded-full bg-[#edf5f1] px-2.5 py-1 text-xs font-semibold text-[#466957]">6 kỳ gần nhất</span>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f3]" />)}</div>
          ) : (
            <RetentionChart data={visibleRetention} />
          )}
        </article>
      <article className="h-full rounded-2xl border border-[#e0e9e4] bg-white p-4 shadow-[0_4px_18px_rgba(20,61,44,0.04)] xl:col-span-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#173f2f]">Xu hướng thời lượng phiên trung bình</h2>
            <p className="mt-1 text-sm text-[#718078]">Thời gian hoạt động trung bình trong mỗi phiên qua 7 kỳ gần nhất.</p>
          </div>
          {latestDuration && (
            <div className="rounded-xl bg-[#edf5f1] px-3 py-2 text-right">
              <p className="text-xs font-medium text-[#64736b]">Tổng thời gian hoạt động · kỳ gần nhất</p>
              <p className="text-sm font-bold text-[#173f2f]">{formatDecimal(latestDuration.totalDurationMinutes, ' phút')}</p>
            </div>
          )}
        </div>
        {isDashboardLoading ? (
          <div className="space-y-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-xl bg-[#f1f5f3]" />)}</div>
          ) : (
          <SessionDurationChart data={visibleDurations} />
        )}
      </article>
      </section>

    </div>
  );
};

export default AdminDashboard;
