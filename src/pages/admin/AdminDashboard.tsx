import { Users, GraduationCap, Music } from 'lucide-react';

/* ── Stat Widgets ─────────────────────────────────────────── */
const stats = [
  {
    icon: Users,
    iconBg: 'bg-primary/5 text-primary',
    label: 'Tổng người dùng',
    value: '1,842',
    sub: '/ 2,000 mục tiêu',
    badge: '+12%',
    badgeClass: 'text-[#cca730] bg-[#735c00]/10',
    progress: 92.1,
    progressColor: 'bg-primary',
  },
  {
    icon: GraduationCap,
    iconBg: 'bg-[#5e5e5b]/5 text-[#5e5e5b]',
    label: 'Giảng viên hoạt động',
    value: '48',
    sub: 'Đang trực tuyến: 12',
    badge: 'Hot',
    badgeClass: 'text-on-error-container bg-error-container',
  },
  {
    icon: Music,
    iconBg: 'bg-[#735c00]/5 text-[#735c00]',
    label: 'Bài giảng đã duyệt',
    value: '1,250',
    sub: 'Chờ duyệt: 14 bản ghi',
    badge: 'Mới',
    badgeClass: 'text-primary-container bg-primary/10',
  },
];

/* ── Chart bars (mockup) ──────────────────────────────────── */
const chartBars = [40, 55, 45, 70, 85, 60, 95];

/* ── Activity feed ────────────────────────────────────────── */
const activities = [
  {
    dot: 'bg-primary',
    text: (
      <>
        <span className="font-bold">Giảng viên Trần Nam</span> vừa tải lên bài giảng
        mới: &quot;Kỹ thuật gảy đàn Bầu cơ bản&quot;.
      </>
    ),
    time: '5 phút trước',
    tag: 'Chờ duyệt',
    tagClass: 'text-primary',
  },
  {
    dot: 'bg-[#cca730]',
    text: (
      <>
        <span className="font-bold">Hệ thống</span> đã tự động sao lưu dữ liệu thành
        công.
      </>
    ),
    time: '42 phút trước',
    tag: 'Thành công',
    tagClass: 'text-on-secondary-fixed-variant',
  },
  {
    dot: 'bg-[#091d2e]',
    text: (
      <>
        <span className="font-bold">Người dùng Nguyễn An</span> vừa đăng ký tài khoản
        Premium qua MoMo.
      </>
    ),
    time: '1 giờ trước',
    tag: 'Thanh toán',
    tagClass: 'text-on-primary-fixed-variant',
  },
];

/* ════════════════════════════════════════════════════════════ */

const AdminDashboard = () => {
  return (
    <>
      {/* Page Heading */}
      <div className="mb-10">
        <h2 className="text-headline-lg font-bold text-primary" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Tổng quan Quản trị
        </h2>
        <p className="text-body-md text-[#5e5e5b]">
          Chào mừng trở lại, đây là trạng thái hiện tại của VietStage.
        </p>
      </div>

      {/* ── Stat Widgets ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-10">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-md">
              <div className={`p-sm rounded-lg ${s.iconBg}`}>
                <s.icon className="w-5 h-5" />
              </div>
              {s.badge && (
                <span className={`text-[12px] font-semibold px-sm py-[2px] rounded-full ${s.badgeClass}`}>
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-[#5e5e5b] font-label-md text-label-md uppercase">
              {s.label}
            </p>
            <div className="flex items-baseline gap-xs mt-xs">
              <h3 className="text-headline-md font-bold text-on-surface">{s.value}</h3>
              {s.sub && <span className="text-[12px] text-[#5e5e5b]">{s.sub}</span>}
            </div>
            {s.progress !== undefined && (
              <div className="w-full bg-[#e3efff] h-1 rounded-full mt-md overflow-hidden">
                <div className={`${s.progressColor} h-full rounded-full`} style={{ width: `${s.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Growth & Retention Charts ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-headline-md font-bold text-on-surface" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Tăng trưởng người dùng
              </h4>
              <div className="flex gap-sm">
                <button className="px-md py-sm bg-[#e3efff] text-label-md rounded-lg hover:bg-[#d1e4fb] transition-colors">
                  7 ngày
                </button>
                <button className="px-md py-sm bg-primary text-on-primary text-label-md rounded-lg">
                  Tháng này
                </button>
              </div>
            </div>
            {/* Bar Chart */}
            <div className="relative h-56 w-full flex items-end gap-1 mt-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-b border-[#d1e4fb] w-full h-px" />
                ))}
              </div>
              {chartBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/10 border-t-2 border-primary rounded-t-sm transition-all hover:bg-primary/20"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-md px-xs text-[12px] text-[#5e5e5b] uppercase tracking-widest border-t border-outline-variant/10 pt-sm">
            <span>Tuần 1</span><span>Tuần 2</span><span>Tuần 3</span><span>Tuần 4</span>
          </div>
        </div>

        {/* Retention & Sessions Metrics */}
        <div className="bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-headline-md font-bold text-on-surface mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Phiên học &amp; Giữ chân
            </h4>
            <p className="text-body-sm text-[#5e5e5b] mb-6">
              Phân tích thói quen hoạt động và tần suất quay lại của người học.
            </p>
          </div>

          <div className="space-y-md">
            {/* Session Duration */}
            <div className="bg-[#edf4ff] p-md rounded-lg border border-outline-variant/10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-label-sm text-primary font-bold text-[13px]">Thời lượng phiên trung bình</span>
                <span className="text-[11px] text-emerald-700 bg-emerald-100 px-sm py-[2px] rounded-full font-bold">+2.4m</span>
              </div>
              <div className="flex items-baseline gap-xs">
                <span className="text-headline-md font-bold text-primary">34.5m</span>
                <span className="text-body-sm text-[#5e5e5b] font-medium">/ 30m mục tiêu</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white h-1.5 rounded-full overflow-hidden mt-md">
                <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Retention Rates (D1, D7, D30) */}
            <div className="space-y-sm">
              <h5 className="font-label-sm text-on-surface font-bold uppercase tracking-wider text-[11px]">
                Tỷ lệ quay lại (Retention Rate)
              </h5>
              <div className="space-y-sm">
                {/* D1 */}
                <div className="space-y-xs">
                  <div className="flex justify-between text-[12px]">
                    <span className="font-medium text-on-surface-variant">Ngày 1 (D1)</span>
                    <span className="font-bold text-primary">82.5%</span>
                  </div>
                  <div className="w-full bg-[#edf4ff] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '82.5%' }} />
                  </div>
                </div>
                {/* D7 */}
                <div className="space-y-xs">
                  <div className="flex justify-between text-[12px]">
                    <span className="font-medium text-on-surface-variant">Ngày 7 (D7)</span>
                    <span className="font-bold text-[#735c00]">68.2%</span>
                  </div>
                  <div className="w-full bg-[#edf4ff] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#cca730] h-full rounded-full" style={{ width: '68.2%' }} />
                  </div>
                </div>
                {/* D30 */}
                <div className="space-y-xs">
                  <div className="flex justify-between text-[12px]">
                    <span className="font-medium text-on-surface-variant">Ngày 30 (D30)</span>
                    <span className="font-bold text-error">45.1%</span>
                  </div>
                  <div className="w-full bg-[#edf4ff] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: '45.1%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity Feed + Heritage Visual ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg mt-10">
        {/* Activity Feed */}
        <div className="lg:col-span-3 bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm">
          <h4 className="text-headline-md font-bold text-on-surface mb-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Hoạt động gần đây
          </h4>
          <div className="space-y-md">
            {activities.map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-md p-md rounded-lg hover:bg-[#edf4ff] transition-colors"
              >
                <div className={`mt-1 w-2 h-2 rounded-full ${act.dot} shrink-0`} />
                <div>
                  <p className="text-body-md">{act.text}</p>
                  <p className="text-[12px] text-[#5e5e5b] mt-xs">
                    {act.time} •{' '}
                    <span className={`${act.tagClass} font-bold`}>{act.tag}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cultural Visual Anchor */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-xl border border-[#d1e4fb]/50 min-h-[300px] flex items-end">
          <img
            src="/admin-heritage-bg.png"
            alt="Đàn Bầu - Nhạc cụ truyền thống"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          <div className="relative p-lg text-on-primary">
            <h5 className="text-headline-md font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Bảo tồn Âm nhạc
            </h5>
            <p className="text-body-md opacity-90 mt-xs">
              Hệ thống quản lý đang hỗ trợ 12 loại nhạc cụ dân tộc Việt Nam với
              độ chính xác AI 98%.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
