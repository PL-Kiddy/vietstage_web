import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, GraduationCap, RefreshCw, Users, WalletCards } from 'lucide-react';
import { dashboardApi, type DashboardStats } from '../../api/management';

const numberFormat = new Intl.NumberFormat('vi-VN');
const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = () => {
    setLoading(true);
    setError('');
    void dashboardApi.get()
      .then(setStats)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Không thể tải tổng quan.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void dashboardApi.get()
      .then(setStats)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Không thể tải tổng quan.');
      })
      .finally(() => setLoading(false));
  }, []);

  const maxUsers = useMemo(
    () => Math.max(1, ...(stats?.chartData.map((point) => point.users) ?? [])),
    [stats],
  );

  if (loading) return <div className="p-xl text-center">Đang tải tổng quan...</div>;

  const cards = [
    { label: 'Tổng người dùng', value: numberFormat.format(stats?.totalUsers ?? 0), icon: Users },
    { label: 'Giảng viên hoạt động', value: numberFormat.format(stats?.activeInstructors ?? 0), icon: GraduationCap },
    { label: 'Tổng bài giảng', value: numberFormat.format(stats?.totalLessons ?? 0), icon: BookOpenCheck },
    { label: 'Tổng doanh thu', value: moneyFormat.format(stats?.totalRevenue ?? 0), icon: WalletCards },
  ];

  return (
    <div className="space-y-xl">
      <div className="flex items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-primary">Tổng quan Quản trị</h2>
          <p className="text-on-surface-variant">Dữ liệu thống kê trực tiếp từ hệ thống VietStage.</p>
        </div>
        <button onClick={loadDashboard} className="flex items-center gap-sm border border-primary text-primary px-md py-sm rounded-lg">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {error && <div className="rounded-lg bg-error-container text-on-error-container p-md">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-lg">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-outline-variant/20 shadow-sm p-lg">
            <card.icon className="w-6 h-6 text-primary mb-md" />
            <p className="uppercase tracking-wider text-xs text-on-surface-variant font-semibold">{card.label}</p>
            <p className="text-headline-md font-bold text-on-surface mt-xs">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-outline-variant/20 shadow-sm p-lg">
        <h3 className="text-headline-md font-bold text-on-surface">Tăng trưởng người dùng</h3>
        <p className="text-sm text-on-surface-variant mb-lg">Số người dùng theo kỳ báo cáo từ backend.</p>
        {stats?.chartData.length ? (
          <div className="h-72 flex items-end gap-md border-b border-outline-variant/30 px-md">
            {stats.chartData.map((point) => (
              <div key={point.name} className="flex-1 h-full flex flex-col justify-end items-center gap-sm">
                <span className="text-xs font-semibold">{numberFormat.format(point.users)}</span>
                <div
                  className="w-full max-w-16 bg-primary/80 rounded-t-md hover:bg-primary transition-colors"
                  style={{ height: `${Math.max(4, (point.users / maxUsers) * 80)}%` }}
                  title={`${point.name}: ${numberFormat.format(point.users)} người dùng`}
                />
                <span className="text-xs text-on-surface-variant pb-sm">{point.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 grid place-items-center text-on-surface-variant">Chưa có dữ liệu biểu đồ.</div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
