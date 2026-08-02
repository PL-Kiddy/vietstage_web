import { useMemo, useState } from 'react';
import { BookOpenCheck, GraduationCap, RefreshCw, Users, WalletCards } from 'lucide-react';
import { dashboardApi, type DashboardStats } from '../../api/management';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

const numberFormat = new Intl.NumberFormat('vi-VN');
const moneyFormat = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const AdminDashboard = () => {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  const {
    data: stats,
    error,
    loading,
    execute: reloadDashboard,
  } = useAxiosRequest<DashboardStats>((signal) => dashboardApi.get({ signal }));

  const maxUsers = useMemo(
    () => Math.max(1, ...((stats?.chartData ?? []).map((point) => point.users))),
    [stats],
  );

  if (loading) return <div className="p-xl text-center text-[#1D4532]">Đang tải tổng quan...</div>;

  const cards = [
    { label: 'Tổng người dùng', value: numberFormat.format(stats?.totalUsers ?? 0), icon: Users },
    { label: 'Giảng viên hoạt động', value: numberFormat.format(stats?.activeInstructors ?? 0), icon: GraduationCap },
    { label: 'Tổng bài giảng', value: numberFormat.format(stats?.totalLessons ?? 0), icon: BookOpenCheck },
  ];

  return (
    <div className="space-y-xl">
      <div className="flex items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-bold text-[#1D4532]">Tổng quan Quản trị</h2>
          <p className="text-on-surface-variant">Dữ liệu thống kê trực tiếp từ hệ thống VietStage.</p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-error-container text-on-error-container p-md">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-outline-variant/20 shadow-sm p-lg">
            <card.icon className="w-6 h-6 text-[#1D4532] mb-md" />
            <p className="uppercase tracking-wider text-xs text-on-surface-variant font-semibold">{card.label}</p>
            <p className="text-headline-md font-bold text-on-surface mt-xs">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-outline-variant/20 shadow-sm p-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
          <div>
            <h3 className="text-headline-md font-bold text-on-surface">Tăng trưởng người dùng</h3>
            <p className="text-sm text-on-surface-variant">Số lượng người dùng theo kỳ báo cáo từ hệ thống.</p>
          </div>
          
          {/* Lọc theo ngày tháng năm */}
          <div className="flex items-center gap-sm">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Từ ngày</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm text-[#374151] focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none cursor-pointer font-medium"
              />
            </div>
            <span className="text-[#9CA3AF] self-end mb-2.5 font-medium">—</span>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Đến ngày</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm text-[#374151] focus:ring-1 focus:ring-[#1D4532] focus:border-[#1D4532] outline-none cursor-pointer font-medium"
              />
            </div>
          </div>
        </div>
        {stats?.chartData && stats.chartData.length > 0 ? (
          <div className="h-72 flex items-end gap-md border-b border-outline-variant/30 px-md">
            {stats.chartData.map((point) => (
              <div key={point.name} className="flex-1 h-full flex flex-col justify-end items-center gap-sm">
                <span className="text-xs font-semibold">{numberFormat.format(point.users)}</span>
                <div
                  className="w-full max-w-16 bg-[#1D4532]/85 rounded-t-md hover:bg-[#1D4532] transition-colors"
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
