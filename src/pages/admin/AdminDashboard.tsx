import { BarChart3, Clock3, Music2, Repeat2, UsersRound } from 'lucide-react';
import { dashboardApi, type DashboardStats } from '../../api/management';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

const numberFormat = new Intl.NumberFormat('vi-VN');

const EmptyData = ({ label }: { label: string }) => (
  <div className="min-h-32 grid place-items-center rounded-lg border border-dashed border-[#CFE3D8] bg-[#FAFCFB] px-4 text-center text-sm text-[#6B7280]">
    Chưa có dữ liệu {label.toLocaleLowerCase('vi-VN')} cho kỳ báo cáo.
  </div>
);

const AdminDashboard = () => {
  const { data: stats, error, loading } = useAxiosRequest<DashboardStats>((signal) => dashboardApi.get({ signal }));
  const instruments = stats?.popularInstruments ?? [];
  const sessions = stats?.sessionDuration ?? [];
  const retention = stats?.retention ?? [];

  const activeUsers = typeof stats?.activeUsers === 'number' ? stats.activeUsers : null;
  const topInstrument = instruments[0];
  const latestSession = sessions.at(-1);
  const latestRetention = retention.at(-1);

  if (loading) {
    return <div className="p-xl text-center text-[#1D4532]">Đang tải phân tích hệ thống...</div>;
  }

  const cards = [
    {
      label: 'Người dùng hoạt động',
      value: activeUsers === null ? '—' : numberFormat.format(activeUsers),
      icon: UsersRound,
    },
    {
      label: 'Nhạc cụ phổ biến nhất',
      value: topInstrument ? (topInstrument.instrumentName ?? topInstrument.name ?? '—') : '—',
      icon: Music2,
    },
    {
      label: 'Thời lượng phiên trung bình',
      value: latestSession?.averageDurationMinutes === undefined ? '—' : `${numberFormat.format(latestSession.averageDurationMinutes)} phút`,
      icon: Clock3,
    },
    {
      label: 'Tỷ lệ duy trì gần nhất',
      value: latestRetention?.retentionRate === undefined ? '—' : `${latestRetention.retentionRate}%`,
      icon: Repeat2,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-headline-lg font-bold text-[#1D4532]">Phân tích hệ thống</h2>
        <p className="mt-1 text-on-surface-variant">
          Theo dõi người dùng hoạt động, nhạc cụ phổ biến, thời lượng phiên học và chỉ số duy trì.
        </p>
      </div>

      {error && <div className="rounded-lg bg-error-container text-on-error-container p-md">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-[#DCEBE3] bg-white p-5 shadow-sm">
            <card.icon className="mb-4 h-6 w-6 text-[#1D4532]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#65746C]">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#1D4532]">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-[#DCEBE3] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#1D4532]">Nhạc cụ phổ biến</h3>
          <p className="mt-1 text-sm text-on-surface-variant">Xếp hạng theo số lượt luyện tập.</p>
          <div className="mt-5 space-y-3">
            {instruments.length === 0 ? <EmptyData label="nhạc cụ phổ biến" /> : instruments.map((item, index) => {
              const value = item.practiceCount ?? item.value ?? 0;
              return (
                <div key={`${item.instrumentId ?? item.instrumentName ?? item.name}-${index}`} className="flex items-center justify-between rounded-lg bg-[#F6FAF8] px-4 py-3">
                  <span className="font-medium text-[#1D4532]">{item.instrumentName ?? item.name ?? 'Chưa xác định'}</span>
                  <span className="text-sm font-semibold text-[#1D4532]">{numberFormat.format(value)} lượt</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-[#DCEBE3] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#1D4532]">Thời lượng phiên học</h3>
          <p className="mt-1 text-sm text-on-surface-variant">Thời lượng trung bình theo từng kỳ báo cáo.</p>
          <div className="mt-5 space-y-3">
            {sessions.length === 0 ? <EmptyData label="thời lượng phiên học" /> : sessions.map((item, index) => {
              const minutes = item.averageDurationMinutes ?? item.value;
              return (
                <div key={`${item.period ?? item.name}-${index}`} className="flex items-center justify-between rounded-lg bg-[#F6FAF8] px-4 py-3">
                  <span className="font-medium text-[#1D4532]">{item.period ?? item.name ?? 'Kỳ báo cáo'}</span>
                  <span className="text-sm font-semibold text-[#1D4532]">{minutes === undefined ? '—' : `${numberFormat.format(minutes)} phút`}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-[#DCEBE3] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#1D4532]" />
            <h3 className="text-lg font-bold text-[#1D4532]">Chỉ số duy trì người dùng</h3>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">Tỷ lệ người dùng tiếp tục hoạt động theo kỳ báo cáo.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {retention.length === 0 ? <div className="sm:col-span-2 lg:col-span-4"><EmptyData label="chỉ số duy trì" /></div> : retention.map((item, index) => {
              const rate = item.retentionRate ?? item.value;
              return (
                <div key={`${item.period ?? item.name}-${index}`} className="rounded-lg border border-[#DCEBE3] px-4 py-3">
                  <p className="text-sm text-[#65746C]">{item.period ?? item.name ?? 'Kỳ báo cáo'}</p>
                  <p className="mt-1 text-xl font-bold text-[#1D4532]">{rate === undefined ? '—' : `${rate}%`}</p>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
