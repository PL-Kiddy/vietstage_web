import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CalendarDays,
  Music2,
  RefreshCw,
  Timer,
  Users,
  UserRoundCheck,
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

const MAX_DASHBOARD_RANGE_DAYS = 365;

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toVietnamDateTime = (date: string, endOfDay = false) =>
  `${date}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`;

const parseDateInputUtc = (value: string) => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!matched) return Number.NaN;
  return Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
};

const addDaysToDateInput = (value: string, days: number) => {
  const timestamp = parseDateInputUtc(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Date(timestamp + days * 86_400_000).toISOString().slice(0, 10);
};

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
  const weekMatch = /^(\d{4})-W(\d{1,2})$/i.exec(period);
  if (weekMatch) return `T${Number(weekMatch[2])}/${weekMatch[1]}`;
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(period);
  if (monthMatch) return `Tháng ${Number(monthMatch[2])}/${monthMatch[1]}`;
  return period;
};

const EmptyAnalytics = ({ message }: { message: string }) => (
  <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[#d7e6df] bg-[#f8faf9] px-5 text-center">
    <div>
      <Activity className="mx-auto h-7 w-7 text-[#9aaba2]" />
      <p className="mt-2 text-sm text-[#6b7a72]">{message}</p>
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
  const padding = { top: 30, right: 14, bottom: 42, left: 42 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const rawMax = Math.max(...data.map((item) => item.value), 0);
  const maxValue = fixedMax ?? Math.max(1, Math.ceil(rawMax / 5) * 5);
  const xFor = (index: number) => padding.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const yFor = (value: number) => padding.top + innerHeight - (Math.min(Math.max(value, 0), maxValue) / maxValue) * innerHeight;
  const points = data.map((item, index) => `${xFor(index)},${yFor(item.value)}`).join(' ');
  const areaPoints = `${padding.left},${padding.top + innerHeight} ${points} ${padding.left + innerWidth},${padding.top + innerHeight}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const pointRadius = data.length > 12 ? 4 : 7;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`Biểu đồ xu hướng ${unit}`}
        className="h-[185px] w-full"
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
              <line x1={padding.left} x2={padding.left + innerWidth} y1={y} y2={y} stroke="#e3ebe6" strokeDasharray="4 5" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="12" fill="#687870">
                {formatDecimal(maxValue * ratio)}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <text x={padding.left} y="14" fontSize="12" fontWeight="600" fill="#687870">Đơn vị: {unit.trim()}</text>
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((item, index) => {
          const x = xFor(index);
          const y = yFor(item.value);
          return (
            <g key={`${item.period}-${index}`}>
              <circle cx={x} cy={y} r={pointRadius} fill="white" stroke={color} strokeWidth={data.length > 12 ? 2 : 3}>
                <title>{`${formatPeriod(item.period)}: ${formatDecimal(item.value, unit)}`}</title>
              </circle>
              {index === data.length - 1 && (
                <text x={x} y={Math.max(14, y - 13)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#183d2d">
                  {formatDecimal(item.value, unit)}
                </text>
              )}
              {(index % labelStep === 0 || index === data.length - 1) && (
                <text x={x} y={chartHeight - 14} textAnchor="middle" fontSize="12" fill="#687870">
                  {formatPeriod(item.period)}
                </text>
              )}
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
    color="#3F6FB5"
  />
);

const RetentionChart = ({ data }: { data: RetentionStat[] }) => (
  <AnalyticsLineChart
    data={data.map((item) => ({ period: item.period, value: item.retentionRate }))}
    unit="%"
    emptyMessage="Chưa có dữ liệu duy trì trong khoảng đã chọn."
    gradientId="retention-gradient"
    color="#17805E"
    fixedMax={100}
  />
);

// Dashboard Admin: thống kê hệ thống với bộ lọc ngày + granularity (DAY/WEEK/MONTH)
const AdminDashboard = () => {
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>(createInitialFilters);
  const [filters, setFilters] = useState<DashboardFilters>(createInitialFilters);

  // Gọi GET /api/admin/dashboard theo bộ lọc đã áp dụng
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
  const durations = [...(analytics?.sessionDuration ?? [])].sort((a, b) => a.period.localeCompare(b.period));
  const retention = [...(analytics?.retention ?? [])].sort((a, b) => a.period.localeCompare(b.period));
  // Chỉ thống kê nhạc cụ thật sự có hoạt động luyện tập trong kỳ đã chọn.
  // Nhạc cụ đang phát triển hoặc chưa phát sinh lượt tập không bị hiểu nhầm là
  // một nhạc cụ đã mở học nhưng có "0 lượt".
  const visibleInstruments = [...instruments]
    .filter((item) => item.practiceCount > 0)
    .sort((a, b) => b.practiceCount - a.practiceCount)
    .slice(0, 5);
  const latestDuration = durations.length > 0 ? durations[durations.length - 1] : undefined;
  const latestRetention = retention.length > 0 ? retention[retention.length - 1] : undefined;
  const topInstrument = visibleInstruments[0];
  const maxPracticeCount = Math.max(...visibleInstruments.map((item) => item.practiceCount), 0);
  const selectedRangeDays = Math.round(
    (parseDateInputUtc(draftFilters.toDate) - parseDateInputUtc(draftFilters.fromDate)) / 86_400_000,
  );
  const dateRangeError = !draftFilters.fromDate || !draftFilters.toDate
    ? 'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.'
    : draftFilters.fromDate > draftFilters.toDate
      ? 'Ngày bắt đầu không được sau ngày kết thúc.'
      : selectedRangeDays > MAX_DASHBOARD_RANGE_DAYS
        ? `Khoảng thời gian truy vấn không được vượt quá ${MAX_DASHBOARD_RANGE_DAYS} ngày.`
        : '';
  const invalidDateRange = dateRangeError !== '';
  const isDashboardLoading = loading || !data;

  const cards = useMemo(() => [
    {
      icon: Users,
      label: 'Người dùng hoạt động',
      value: formatNumber(analytics?.activeUsers),
    },
    {
      icon: Music2,
      label: 'Nhạc cụ được luyện tập nhiều nhất',
      value: topInstrument?.instrumentName || 'Chưa có',
    },
    {
      icon: Timer,
      label: 'Thời lượng sử dụng trung bình',
      value: formatDecimal(latestDuration?.averageDurationMinutes, ' phút'),
    },
    {
      icon: UserRoundCheck,
      label: 'Tỷ lệ duy trì người dùng',
      value: formatDecimal(latestRetention?.retentionRate, '%'),
    },
  ], [analytics, latestDuration, latestRetention, topInstrument]);

  // Chỉ áp dụng khi bộ lọc hợp lệ (không lỗi khoảng ngày)
  const applyFilters = () => {
    if (!invalidDateRange) setFilters(draftFilters);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-3 pb-3">
      <header className="space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#183d2d] md:text-4xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-1 text-sm text-[#687870] md:text-base">
            Theo dõi mức độ sử dụng, hoạt động luyện tập và khả năng quay lại của người học.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-[#e1e9e4] bg-white p-2.5 shadow-[0_6px_22px_rgba(24,61,45,0.045)]">
          <div className="grid w-full grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="w-full text-xs font-semibold text-[#64736b]">
            Từ ngày
            <input
              type="date"
              value={draftFilters.fromDate}
              max={draftFilters.toDate}
              min={addDaysToDateInput(draftFilters.toDate, -MAX_DASHBOARD_RANGE_DAYS)}
              onChange={(event) => setDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
              className="mt-1 block h-9 w-full rounded-lg border border-[#dce7e1] bg-white px-3 text-sm font-medium text-[#234738] outline-none focus:border-[#17805E]"
            />
          </label>
          <label className="w-full text-xs font-semibold text-[#64736b]">
            Đến ngày
            <input
              type="date"
              value={draftFilters.toDate}
              min={draftFilters.fromDate}
              max={addDaysToDateInput(draftFilters.fromDate, MAX_DASHBOARD_RANGE_DAYS)}
              onChange={(event) => setDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
              className="mt-1 block h-9 w-full rounded-lg border border-[#dce7e1] bg-white px-3 text-sm font-medium text-[#234738] outline-none focus:border-[#17805E]"
            />
          </label>
          <label className="w-full text-xs font-semibold text-[#64736b]">
            Nhóm theo
            <select
              value={draftFilters.granularity}
              onChange={(event) => setDraftFilters((current) => ({ ...current, granularity: event.target.value as DashboardGranularity }))}
              className="mt-1 block h-9 w-full rounded-lg border border-[#dce7e1] bg-white px-3 text-sm font-medium text-[#234738] outline-none focus:border-[#17805E]"
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
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#1E4D39] px-5 text-sm font-semibold text-white shadow-[0_3px_8px_rgba(24,77,57,0.18)] transition hover:bg-[#163A2B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" /> Áp dụng
          </button>
          </div>
          {invalidDateRange && (
            <p className="mt-2 text-sm font-medium text-red-700">{dateRangeError}</p>
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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số phân tích hệ thống">
        {cards.map((card) => (
          <article key={card.label} className="flex min-h-[108px] items-center gap-3 rounded-2xl border border-[#e1e9e4] bg-white p-3 shadow-[0_6px_20px_rgba(24,61,45,0.045)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#1E4D39]">
              <card.icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold tracking-tight text-[#183d2d]" title={card.value}>
                {isDashboardLoading ? '—' : card.value}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-5 text-[#55675e]">{card.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[minmax(230px,0.56fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <article className="h-full rounded-2xl border border-[#e1e9e4] bg-white p-3 shadow-[0_6px_20px_rgba(24,61,45,0.045)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#183d2d]">Nhạc cụ được luyện tập nhiều nhất</h2>
              <p className="mt-1 text-sm text-[#6b7a72]">Top 5 nhạc cụ có lượt luyện tập trong khoảng đã chọn.</p>
            </div>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f2f6f3]" />)}</div>
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
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f8f0df] text-xs font-bold text-[#a66a12]">{index + 1}</span>
                        <span className="truncate text-sm font-semibold text-[#6e542d]">{instrument.instrumentName}</span>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#183d2d]">{formatNumber(instrument.practiceCount)} lượt</span>
                    </div>
                    <div className="ml-10 h-2 overflow-hidden rounded-full bg-[#f5ead4]">
                      <div className="h-full rounded-full bg-[#b7791f]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="h-full rounded-2xl border border-[#e1e9e4] bg-white p-3 shadow-[0_6px_20px_rgba(24,61,45,0.045)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#183d2d]">Xu hướng duy trì</h2>
              <p className="mt-1 text-sm text-[#6b7a72]">Tỷ lệ người dùng quay lại hoạt động trong khoảng đã chọn.</p>
            </div>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f2f6f3]" />)}</div>
          ) : (
            <RetentionChart data={retention} />
          )}
        </article>
      <article className="h-full rounded-2xl border border-[#e1e9e4] bg-white p-3 shadow-[0_6px_20px_rgba(24,61,45,0.045)]">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#183d2d]">Thời lượng phiên trung bình</h2>
            <p className="mt-1 text-sm text-[#6b7a72]">Thời gian hoạt động trung bình trong mỗi phiên theo khoảng đã chọn.</p>
          </div>
        </div>
        {isDashboardLoading ? (
          <div className="space-y-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-xl bg-[#f2f6f3]" />)}</div>
          ) : (
          <SessionDurationChart data={durations} />
        )}
      </article>
      </section>

    </div>
  );
};

export default AdminDashboard;
