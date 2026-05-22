import React, { useState } from 'react';
import {
  BrainCircuit,
  CloudLightning,
  ShieldAlert,
  Info,
  Copy,
  RefreshCw,
  Sparkles,
  Gauge,
  Network,
} from 'lucide-react';

const AdminSettings = () => {
  const [pitchDetection, setPitchDetection] = useState<number>(85);
  const [rhythmTolerance, setRhythmTolerance] = useState<number>(120);
  const [autoOptimize, setAutoOptimize] = useState<boolean>(true);
  const [sessionTime, setSessionTime] = useState<string>('30');
  const [apiKey, setApiKey] = useState<string>(
    'vs_live_4920_kdn92_admin_stage_secret_key_6a9b8c7d'
  );

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('Đã sao chép API Key!');
  };

  const handleRegenerateKey = () => {
    const randomHex = Math.random().toString(16).substring(2, 10);
    setApiKey(`vs_live_4920_kdn92_admin_stage_secret_key_${randomHex}`);
  };

  const handleSaveChanges = () => {
    alert('Đã lưu mọi thay đổi thiết lập hệ thống!');
  };

  return (
    <div className="max-w-container-max mx-auto w-full">
      {/* Page Header */}
      <div className="mb-xl flex justify-between items-end">
        <div>
          <span className="text-primary font-label-md text-label-md uppercase tracking-widest text-sm">
            System Configuration
          </span>
          <h3
            className="text-headline-lg font-bold text-primary mt-xs"
            style={{ fontFamily: "'Libre Caslon Text', serif" }}
          >
            Cấu hình Hệ thống
          </h3>
        </div>
        <button
          onClick={handleSaveChanges}
          className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-all active:scale-95 shadow-md"
        >
          LƯU THAY ĐỔI
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-lg">
        {/* AI Parameters Section */}
        <section className="col-span-12 lg:col-span-7 bg-white p-lg rounded-xl border border-outline/10 shadow-sm">
          <div className="flex items-center gap-sm mb-lg">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <h4
              className="text-headline-md font-bold text-on-surface"
              style={{ fontFamily: "'Libre Caslon Text', serif" }}
            >
              Thông số AI &amp; Latency
            </h4>
          </div>

          <div className="space-y-xl py-md">
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <label className="font-body-md font-semibold text-on-surface">
                  Độ nhạy nhận diện cao độ (Pitch Detection)
                </label>
                <span className="bg-primary-fixed text-on-primary-fixed px-sm py-xs rounded font-label-md font-semibold">
                  {pitchDetection}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={pitchDetection}
                onChange={(e) => setPitchDetection(Number(e.target.value))}
                className="w-full h-1 bg-[#e3efff] rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-[12px] text-[#5e5e5b]">
                Điều chỉnh mức độ nhạy của thuật toán AI khi phân tích âm thanh từ
                nhạc cụ truyền thống. Mức cao sẽ nhạy với các nốt nhỏ nhưng dễ bị
                nhiễu.
              </p>
            </div>

            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <label className="font-body-md font-semibold text-on-surface">
                  Ngưỡng sai số nhịp điệu (Rhythm Tolerance)
                </label>
                <span className="bg-primary-fixed text-on-primary-fixed px-sm py-xs rounded font-label-md font-semibold">
                  {rhythmTolerance}ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={rhythmTolerance}
                onChange={(e) => setRhythmTolerance(Number(e.target.value))}
                className="w-full h-1 bg-[#e3efff] rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-[12px] text-[#5e5e5b]">
                Khoảng thời gian tối đa cho phép (latency) giữa nốt đánh thực tế và
                nhịp chuẩn. Phù hợp cho người mới bắt đầu hoặc chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="mt-xl pt-lg border-t border-outline/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <Sparkles className="w-5 h-5 text-[#735c00]" />
                <span className="font-label-md font-semibold text-on-surface">
                  Tự động tối ưu hóa theo thiết bị
                </span>
              </div>
              <div
                onClick={() => setAutoOptimize(!autoOptimize)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full p-1 cursor-pointer transition-colors ${
                  autoOptimize ? 'bg-primary' : 'bg-[#e3efff]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoOptimize ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Storage Management */}
        <section className="col-span-12 lg:col-span-5 bg-white p-lg rounded-xl border border-outline/10 shadow-sm flex flex-col">
          <div className="flex items-center gap-sm mb-lg">
            <CloudLightning className="w-6 h-6 text-primary" />
            <h4
              className="text-headline-md font-bold text-on-surface"
              style={{ fontFamily: "'Libre Caslon Text', serif" }}
            >
              Quản lý lưu trữ Cloud
            </h4>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-lg">
            {/* Custom Pie Chart Representation */}
            <div
              className="relative w-48 h-48 rounded-full border-[16px] border-[#e3efff] flex items-center justify-center shadow-md"
              style={{
                background:
                  'conic-gradient(#610000 0% 45%, #735c00 45% 75%, #5e5e5b 75% 100%)',
              }}
            >
              <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-bold text-primary">72%</span>
                <span className="text-[10px] text-[#5e5e5b] uppercase tracking-tighter">
                  Đã dùng
                </span>
              </div>
            </div>

            <div className="mt-xl w-full space-y-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-body-md text-on-surface">
                    Âm thanh (WAV/MP3)
                  </span>
                </div>
                <span className="font-label-md font-bold text-on-surface">
                  450 GB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-[#735c00]" />
                  <span className="font-body-md text-on-surface">
                    Hình ảnh &amp; Video
                  </span>
                </div>
                <span className="font-label-md font-bold text-on-surface">
                  300 GB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-[#5e5e5b]" />
                  <span className="font-body-md text-on-surface">
                    Dữ liệu người dùng
                  </span>
                </div>
                <span className="font-label-md font-bold text-on-surface">
                  250 GB
                </span>
              </div>
            </div>
          </div>

          <button className="mt-auto w-full border border-primary text-primary font-label-md text-label-md py-md rounded hover:bg-primary/5 transition-colors">
            NÂNG CẤP DUNG LƯỢNG
          </button>
        </section>

        {/* Security & API */}
        <section className="col-span-12 lg:col-span-8 bg-white p-lg rounded-xl border border-outline/10 shadow-sm">
          <div className="flex items-center gap-sm mb-lg">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h4
              className="text-headline-md font-bold text-on-surface"
              style={{ fontFamily: "'Libre Caslon Text', serif" }}
            >
              Bảo mật &amp; API Key
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            <div className="space-y-md">
              <label className="font-body-md font-semibold block text-on-surface">
                Thời gian Session (Phút)
              </label>
              <select
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full bg-[#edf4ff] border border-outline/20 rounded-lg p-md focus:ring-1 focus:ring-primary outline-none text-body-md"
              >
                <option value="30">30 phút (Khuyên dùng)</option>
                <option value="60">60 phút</option>
                <option value="120">120 phút</option>
                <option value="480">8 giờ</option>
              </select>
              <p className="text-[12px] text-[#5e5e5b]">
                Tự động đăng xuất sau một khoảng thời gian không hoạt động để bảo vệ
                tài khoản admin.
              </p>
            </div>

            <div className="space-y-md">
              <label className="font-body-md font-semibold block text-on-surface">
                Xác thực 2 yếu tố (2FA)
              </label>
              <div className="flex items-center gap-md p-md bg-[#ffe088]/10 border border-[#ffe088]/20 rounded-lg">
                <ShieldAlert className="w-8 h-8 text-[#735c00]" />
                <div className="flex-1">
                  <span className="block font-label-md text-[#735c00] font-bold">
                    Đang hoạt động
                  </span>
                  <span className="text-[12px] text-[#5e5e5b]">
                    Lớp bảo vệ tăng cường cho Admin
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-xl">
            <label className="font-body-md font-semibold block mb-md text-on-surface">
              Quản lý API Key (Production)
            </label>
            <div className="flex items-center gap-md">
              <div className="flex-1 bg-[#edf4ff] border border-outline/20 rounded-lg p-md font-mono text-sm overflow-hidden whitespace-nowrap">
                {apiKey.substring(0, 35)}********
              </div>
              <button
                onClick={handleCopyKey}
                className="bg-[#e1dfdb] p-md rounded-lg text-[#63635f] hover:bg-[#c8c6c2] transition-colors"
                title="Sao chép"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={handleRegenerateKey}
                className="bg-error-container p-md rounded-lg text-on-error-container hover:bg-error/10 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* System Info Card */}
        <section className="col-span-12 lg:col-span-4 bg-primary text-on-primary p-lg rounded-xl flex flex-col relative overflow-hidden shadow-lg justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-sm mb-lg opacity-80">
              <Info className="w-5 h-5" />
              <h4 className="font-label-md text-label-md uppercase tracking-widest text-sm font-semibold">
                Trạng thái Hệ thống
              </h4>
            </div>
            <div className="space-y-xl">
              <div>
                <span className="text-on-primary/60 text-[12px]">
                  Server Latency
                </span>
                <div className="flex items-baseline gap-xs">
                  <span className="text-4xl font-bold">24</span>
                  <span className="text-xl font-semibold">ms</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <span className="text-on-primary/60 text-[12px]">Uptime</span>
                  <p className="font-label-md font-semibold">99.98%</p>
                </div>
                <div>
                  <span className="text-on-primary/60 text-[12px]">Khu vực</span>
                  <p className="font-label-md font-semibold">Asia (VN)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Icon Overlay Decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-4 right-4 opacity-10">
            <Network className="w-20 h-20" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
