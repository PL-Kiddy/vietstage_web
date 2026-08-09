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

const SessionDurationChart = ({ data }: { data: SessionDurationStat[] }) => {
  const maxValue = Math.max(...data.map((item) => item.averageDurationMinutes), 0);
  if (data.length === 0) return <EmptyAnalytics message="Chưa có dữ liệu thời lượng phiên trong khoảng đã chọn." />;

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = maxValue > 0 ? (item.averageDurationMinutes / maxValue) * 100 : 0;
        return (
          <div key={item.period} className="grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3">
            <span className="truncate text-xs font-medium text-[#738078]" title={item.period}>{formatPeriod(item.period)}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2ef]">
              <div className="h-full rounded-full bg-[#1D6750] transition-all" style={{ width: `${width}%` }} />
            </div>
            <span className="text-right text-sm font-semibold text-[#274b3b]">
              {formatDecimal(item.averageDurationMinutes, ' phút')}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const RetentionChart = ({ data }: { data: RetentionStat[] }) => {
  if (data.length === 0) return <EmptyAnalytics message="Chưa có dữ liệu duy trì trong khoảng đã chọn." />;

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = Math.min(Math.max(item.retentionRate, 0), 100);
        return (
          <div key={item.period}>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-[#738078]" title={item.period}>{formatPeriod(item.period)}</span>
              <span className="text-sm font-semibold text-[#274b3b]">{formatDecimal(item.retentionRate, '%')}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2ef]">
              <div className="h-full rounded-full bg-[#1D6750] transition-all" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
      label: 'Thời lượng phiên',
      value: formatDecimal(latestDuration?.averageDurationMinutes, ' phút'),
      helper: latestDuration ? `Trung bình kỳ ${formatPeriod(latestDuration.period)}` : 'Chưa có dữ liệu phiên',
    },
    {
      icon: Repeat2,
      label: 'Số liệu duy trì',
      value: formatDecimal(latestRetention?.retentionRate, '%'),
      helper: latestRetention ? `Kỳ ${formatPeriod(latestRetention.period)}` : 'Chưa có dữ liệu duy trì',
    },
  ], [analytics, latestDuration, latestRetention, topInstrument]);

  const applyFilters = () => {
    if (!invalidDateRange) setFilters(draftFilters);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#163d2d] md:text-4xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-2 text-sm text-[#68736d] md:text-base">
            Theo dõi mức độ sử dụng, hoạt động luyện tập và khả năng quay lại của người học.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-end gap-3 rounded-2xl border border-[#dfe9e3] bg-white p-4 shadow-sm">
          <label className="min-w-36 text-xs font-semibold text-[#64736b]">
            Từ ngày
            <input
              type="date"
              value={draftFilters.fromDate}
              max={draftFilters.toDate}
              onChange={(event) => setDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
              className="mt-1 block h-10 w-full rounded-lg border border-[#d8e4dd] bg-white px-3 text-sm font-medium text-[#274b3b] outline-none focus:border-[#1D6750]"
            />
          </label>
          <label className="min-w-36 text-xs font-semibold text-[#64736b]">
            Đến ngày
            <input
              type="date"
              value={draftFilters.toDate}
              min={draftFilters.fromDate}
              onChange={(event) => setDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
              className="mt-1 block h-10 w-full rounded-lg border border-[#d8e4dd] bg-white px-3 text-sm font-medium text-[#274b3b] outline-none focus:border-[#1D6750]"
            />
          </label>
          <label className="min-w-32 text-xs font-semibold text-[#64736b]">
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
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1D4532] px-4 text-sm font-semibold text-white transition hover:bg-[#163a2a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" /> Áp dụng
          </button>
        </div>
      </header>

      {invalidDateRange && (
        <p className="text-right text-sm font-medium text-red-700">Vui lòng chọn khoảng ngày hợp lệ.</p>
      )}

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
          <article key={card.label} className="rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5f1] text-[#1D4532]">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-5 truncate text-3xl font-bold tracking-tight text-[#173f2f]" title={card.value}>
              {isDashboardLoading ? '—' : card.value}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#52655b]">{card.label}</p>
            <p className="mt-1 text-xs text-[#87938c]">{isDashboardLoading ? 'Đang tải dữ liệu...' : card.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)] md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
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

        <article className="rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)] md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#173f2f]">Số liệu duy trì</h2>
              <p className="mt-1 text-sm text-[#718078]">Tỷ lệ người dùng tiếp tục hoạt động theo 6 kỳ gần nhất.</p>
            </div>
            <span className="rounded-full bg-[#edf5f1] px-2.5 py-1 text-xs font-semibold text-[#466957]">6 kỳ gần nhất</span>
          </div>
          {isDashboardLoading ? (
            <div className="space-y-4">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f3]" />)}</div>
          ) : (
            <RetentionChart data={visibleRetention} />
          )}
        </article>
      </section>

      <article className="rounded-2xl border border-[#e0e9e4] bg-white p-5 shadow-[0_4px_18px_rgba(20,61,44,0.04)] md:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#173f2f]">Thời lượng phiên</h2>
            <p className="mt-1 text-sm text-[#718078]">Thời gian trung bình người dùng hoạt động trong 7 kỳ gần nhất.</p>
          </div>
          {latestDuration && (
            <div className="rounded-xl bg-[#edf5f1] px-3 py-2 text-right">
              <p className="text-xs font-medium text-[#64736b]">Tổng thời lượng kỳ gần nhất</p>
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

    </div>
  );
};

export default AdminDashboard;
