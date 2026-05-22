import { Users, GraduationCap, Music, Database, Gauge } from 'lucide-react';

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
  {
    icon: Database,
    iconBg: 'bg-[#091d2e]/5 text-[#091d2e]',
    label: 'Bộ nhớ đã dùng',
    value: '64.5 GB',
    sub: 'Tổng giới hạn: 100 GB',
    progress: 64.5,
    progressColor: 'bg-[#091d2e]',
  },
];

/* ── Chart bars (mockup) ──────────────────────────────────── */
const chartBars = [40, 55, 45, 70, 85, 60, 95];

/* ── System resources ─────────────────────────────────────── */
const resources = [
  { label: 'CPU Usage', value: 24, color: 'bg-primary', textColor: 'text-primary' },
  { label: 'RAM Usage', value: 58, color: 'bg-[#cca730]', textColor: 'text-[#cca730]' },
];

const cloudServices = [
  { name: 'Database Cluster', status: 'ONLINE' },
  { name: 'Media Storage', status: 'ONLINE' },
  { name: 'AI Analysis Service', status: 'ONLINE' },
];

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
        <h2 className="text-headline-lg font-bold text-primary" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
          Tổng quan Quản trị
        </h2>
        <p className="text-body-md text-[#5e5e5b]">
          Chào mừng trở lại, đây là trạng thái hiện tại của VietStage.
        </p>
      </div>

      {/* ── Stat Widgets ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-10">
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

      {/* ── Growth Chart + System Performance ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-headline-md font-bold text-on-surface" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
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
          <div className="relative h-64 w-full flex items-end gap-1">
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
          <div className="flex justify-between mt-md px-xs text-[12px] text-[#5e5e5b] uppercase tracking-widest">
            <span>Tuần 1</span><span>Tuần 2</span><span>Tuần 3</span><span>Tuần 4</span>
          </div>
        </div>

        {/* System Performance */}
        <div className="bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm flex flex-col">
          <h4 className="text-headline-md font-bold text-on-surface mb-lg" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
            Hiệu suất Hệ thống
          </h4>
          <div className="space-y-lg flex-1">
            {resources.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-label-md mb-xs">
                  <span>{r.label}</span>
                  <span className={`${r.textColor} font-bold`}>{r.value}%</span>
                </div>
                <div className="h-2 bg-[#e3efff] rounded-full overflow-hidden">
                  <div className={`${r.color} h-full rounded-full`} style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}

            {/* AI Latency */}
            <div className="p-md bg-[#edf4ff] rounded-lg border border-[#e3efff]">
              <p className="text-[12px] text-[#5e5e5b] uppercase tracking-tighter">
                AI Processing Latency
              </p>
              <div className="flex items-center gap-sm mt-xs">
                <Gauge className="w-5 h-5 text-primary" />
                <span className="text-headline-md font-bold text-on-surface">120ms</span>
                <span className="text-[12px] text-primary bg-primary/10 px-xs py-[2px] rounded">
                  Stable
                </span>
              </div>
            </div>

            {/* Cloud Services */}
            <div className="space-y-sm">
              <p className="text-label-md font-bold mb-xs">Trạng thái Dịch vụ Cloud</p>
              {cloudServices.map((svc, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center py-xs ${
                    i < cloudServices.length - 1 ? 'border-b border-[#e3efff]' : ''
                  }`}
                >
                  <span className="text-body-md text-[#5e5e5b]">{svc.name}</span>
                  <span className="flex items-center gap-xs text-[12px] text-green-600 font-bold">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity Feed + Heritage Visual ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg mt-10">
        {/* Activity Feed */}
        <div className="lg:col-span-3 bg-white p-lg rounded-xl border border-[#d1e4fb]/50 shadow-sm">
          <h4 className="text-headline-md font-bold text-on-surface mb-lg" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
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
            <h5 className="text-headline-md font-bold" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
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
