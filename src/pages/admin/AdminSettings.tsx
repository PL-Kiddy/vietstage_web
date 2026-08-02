import { useState } from 'react';
import {
  BrainCircuit,
  CloudLightning,
  ShieldAlert,
  Info,
  Copy,
  RefreshCw,
  Sparkles,
  Network,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const DEFAULT_ADMIN_API_KEY = import.meta.env.VITE_ADMIN_DEFAULT_API_KEY ?? '';

const AdminSettings = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('global');

  // Load instrument-specific settings or use default values
  const [instrumentSettings, setInstrumentSettings] = useState<Record<string, { pitch: number; rhythm: number; optimize: boolean }>>(() => {
    const saved = localStorage.getItem('vietstage_instrument_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing instrument settings:', e);
      }
    }
    // Return default map
    return {
      global: {
        pitch: Number(localStorage.getItem('vietstage_setting_pitch')) || 85,
        rhythm: Number(localStorage.getItem('vietstage_setting_rhythm')) || 120,
        optimize: localStorage.getItem('vietstage_setting_optimize') !== 'false'
      },
      dan_bau: { pitch: 90, rhythm: 100, optimize: true },
      dan_tranh: { pitch: 80, rhythm: 130, optimize: true },
      sao_truc: { pitch: 75, rhythm: 150, optimize: false },
    };
  });

  const [sessionTime, setSessionTime] = useState<string>(() => {
    const saved = localStorage.getItem('vietstage_setting_session');
    return saved ? saved : '30';
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('vietstage_setting_apikey');
    return saved ? saved : DEFAULT_ADMIN_API_KEY;
  });

  const [apiKeyCreatedAt, setApiKeyCreatedAt] = useState<string>(() => {
    const saved = localStorage.getItem('vietstage_setting_apikey_created');
    return saved ? saved : '15/06/2026 10:24';
  });

  const [apiKeyLastUsed] = useState<string>(() => {
    const saved = localStorage.getItem('vietstage_setting_apikey_used');
    return saved ? saved : '18/06/2026 15:45';
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const currentConfig = instrumentSettings[selectedInstrument] || instrumentSettings['global'];

  const getInstrumentLabel = (key: string) => {
    switch (key) {
      case 'global': return 'Cấu hình chung';
      case 'dan_bau': return 'Đàn Bầu';
      case 'dan_tranh': return 'Đàn Tranh';
      case 'sao_truc': return 'Sáo Trúc';
      default: return 'Cấu hình chung';
    }
  };

  const updateCurrentConfig = (
    key: 'pitch' | 'rhythm' | 'optimize',
    value: number | boolean,
  ) => {
    setInstrumentSettings((prev) => {
      const next = {
        ...prev,
        [selectedInstrument]: {
          ...prev[selectedInstrument],
          [key]: value,
        },
      };
      setIsDirty(true);
      return next;
    });
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('Đã sao chép API Key vào clipboard!');
  };

  const handleRegenerateKey = () => {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newKey = `vs_live_4920_kdn92_admin_stage_secret_key_${randomHex}`;
    setApiKey(newKey);
    
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setApiKeyCreatedAt(formattedDate);
    
    setIsDirty(true);
    setShowRegenModal(false);
  };

  const handleRestoreDefaults = () => {
    const defaults: Record<string, { pitch: number; rhythm: number; optimize: boolean }> = {
      global: { pitch: 85, rhythm: 120, optimize: true },
      dan_bau: { pitch: 90, rhythm: 100, optimize: true },
      dan_tranh: { pitch: 80, rhythm: 130, optimize: true },
      sao_truc: { pitch: 75, rhythm: 150, optimize: false },
    };
    
    setInstrumentSettings((prev) => ({
      ...prev,
      [selectedInstrument]: { ...defaults[selectedInstrument] },
    }));
    setIsDirty(true);
    alert(`Đã khôi phục thông số mặc định cho ${getInstrumentLabel(selectedInstrument)}!`);
  };

  const handleSaveChanges = () => {
    localStorage.setItem('vietstage_instrument_settings', JSON.stringify(instrumentSettings));
    
    // Backwards compatibility
    localStorage.setItem('vietstage_setting_pitch', String(instrumentSettings.global.pitch));
    localStorage.setItem('vietstage_setting_rhythm', String(instrumentSettings.global.rhythm));
    localStorage.setItem('vietstage_setting_optimize', String(instrumentSettings.global.optimize));
    
    localStorage.setItem('vietstage_setting_session', sessionTime);
    localStorage.setItem('vietstage_setting_apikey', apiKey);
    localStorage.setItem('vietstage_setting_apikey_created', apiKeyCreatedAt);
    localStorage.setItem('vietstage_setting_apikey_used', apiKeyLastUsed);
    
    setIsDirty(false);
    alert('Đã lưu mọi thay đổi thiết lập hệ thống thành công!');
  };

  return (
    <div className="max-w-container-max mx-auto w-full relative">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-outline-variant/20 pb-md mb-lg">
        <div>
          <span className="text-[#1D4532] font-label-md text-label-md uppercase tracking-widest text-sm">
            System Configuration
          </span>
          <h3
            className="text-headline-lg font-bold text-[#1D4532] mt-xs"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Cấu hình Hệ thống
          </h3>
        </div>
        <button
          onClick={handleSaveChanges}
          className={`relative px-lg py-md rounded-lg font-label-md text-label-md transition-all active:scale-95 shadow-md flex items-center gap-2 ${
            isDirty 
              ? 'bg-[#1D4532] text-white hover:bg-[#1D4532]/95 cursor-pointer' 
              : 'bg-[#1D4532]/40 text-white/60 cursor-not-allowed'
          }`}
          disabled={!isDirty}
        >
          LƯU THAY ĐỔI
          {isDirty && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe088] inline-block animate-ping" />
          )}
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-lg">
        {/* AI Parameters Section */}
        <section className="col-span-12 lg:col-span-7 bg-white p-lg rounded-xl border border-outline/10 shadow-sm">
          <div className="flex items-center justify-between mb-lg flex-wrap gap-md">
            <div className="flex items-center gap-sm">
              <BrainCircuit className="w-6 h-6 text-[#1D4532]" />
              <h4
                className="text-headline-md font-bold text-on-surface"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Thông số AI &amp; Latency
              </h4>
            </div>

            {/* Instrument Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-body-md text-on-surface-variant font-medium">Nhạc cụ:</span>
              <select
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                className="bg-[#EDF7F2] border border-outline/20 rounded-lg py-1 px-3 focus:ring-1 focus:ring-[#1D4532] outline-none text-body-md font-semibold text-[#1D4532]"
              >
                <option value="global">Cấu hình chung</option>
                <option value="dan_bau">Đàn Bầu</option>
                <option value="dan_tranh">Đàn Tranh</option>
                <option value="sao_truc">Sáo Trúc</option>
              </select>
            </div>
          </div>

          <div className="space-y-xl py-md">
            {/* Pitch Detection */}
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <label className="font-body-md font-semibold text-on-surface">
                  Độ nhạy nhận diện cao độ (Pitch Detection)
                </label>
                <span className="bg-[#1D4532]-fixed text-white-fixed px-sm py-xs rounded font-label-md font-semibold">
                  {currentConfig.pitch}%
                </span>
              </div>

              <div className="flex items-center gap-md">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={currentConfig.pitch}
                  onChange={(e) => updateCurrentConfig('pitch', Number(e.target.value))}
                  className="flex-1 h-1 bg-[#e3efff] rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={currentConfig.pitch}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 50) val = 50;
                      if (val > 100) val = 100;
                      updateCurrentConfig('pitch', val);
                    }}
                    className="w-16 bg-[#EDF7F2] border border-outline/20 rounded px-2 py-1 text-center font-bold text-[#1D4532] outline-none"
                  />
                  <span className="text-on-surface-variant font-semibold">%</span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-[#5e5e5b] -mt-2">
                <span>Tối thiểu (50%)</span>
                <span>Tối đa (100%)</span>
              </div>

              <p className="text-[12px] text-[#5e5e5b]">
                Điều chỉnh mức độ nhạy của thuật toán AI khi phân tích âm thanh từ{' '}
                <span className="font-bold text-[#1D4532]">{getInstrumentLabel(selectedInstrument)}</span>. Mức cao sẽ nhạy với các nốt nhỏ nhưng dễ bị nhiễu.
              </p>
            </div>

            {/* Rhythm Tolerance */}
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <label className="font-body-md font-semibold text-on-surface">
                  Ngưỡng sai số nhịp điệu (Rhythm Tolerance)
                </label>
                <span className="bg-[#1D4532]-fixed text-white-fixed px-sm py-xs rounded font-label-md font-semibold">
                  {currentConfig.rhythm}ms
                </span>
              </div>

              <div className="flex items-center gap-md">
                <input
                  type="range"
                  min="50"
                  max="250"
                  value={currentConfig.rhythm}
                  onChange={(e) => updateCurrentConfig('rhythm', Number(e.target.value))}
                  className="flex-1 h-1 bg-[#e3efff] rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={currentConfig.rhythm}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 50) val = 50;
                      if (val > 250) val = 250;
                      updateCurrentConfig('rhythm', val);
                    }}
                    className="w-16 bg-[#EDF7F2] border border-outline/20 rounded px-2 py-1 text-center font-bold text-[#1D4532] outline-none"
                  />
                  <span className="text-on-surface-variant font-semibold">ms</span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-[#5e5e5b] -mt-2">
                <span>Tối thiểu (50ms)</span>
                <span>Tối đa (250ms)</span>
              </div>

              <p className="text-[12px] text-[#5e5e5b]">
                Khoảng thời gian tối đa cho phép (latency) giữa nốt đánh thực tế của{' '}
                <span className="font-bold text-[#1D4532]">{getInstrumentLabel(selectedInstrument)}</span> và nhịp chuẩn. Phù hợp cho người mới bắt đầu hoặc chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="mt-xl pt-lg border-t border-outline/10 flex justify-between items-center flex-wrap gap-md">
            <button
              onClick={handleRestoreDefaults}
              className="flex items-center gap-2 border border-outline text-[#5a403c] font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-[#EDF7F2] transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Khôi phục mặc định
            </button>

            <div className="flex items-center justify-between gap-xl">
              <div className="flex items-center gap-sm">
                <Sparkles className="w-5 h-5 text-[#735c00]" />
                <span className="font-label-md font-semibold text-on-surface">
                  Tự động tối ưu hóa theo thiết bị
                </span>
              </div>
              <div
                onClick={() => updateCurrentConfig('optimize', !currentConfig.optimize)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full p-1 cursor-pointer transition-colors ${
                  currentConfig.optimize ? 'bg-[#1D4532]' : 'bg-[#e3efff]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentConfig.optimize ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Storage Management */}
        <section className="col-span-12 lg:col-span-5 bg-white p-lg rounded-xl border border-outline/10 shadow-sm flex flex-col">
          <div className="flex items-center gap-sm mb-lg">
            <CloudLightning className="w-6 h-6 text-[#1D4532]" />
            <h4
              className="text-headline-md font-bold text-on-surface"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
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
              <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner text-center">
                <span className="text-3xl font-bold text-[#1D4532]">72%</span>
                <span className="text-[10px] text-[#5e5e5b] font-bold">720 GB / 1 TB</span>
                <span className="text-[9px] text-[#5e5e5b]/70 uppercase tracking-tighter mt-1 block">
                  Đã dùng
                </span>
              </div>
            </div>

            <div className="mt-xl w-full space-y-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-[#1D4532]" />
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

          <button className="mt-auto w-full border border-[#1D4532] text-[#1D4532] font-label-md text-label-md py-md rounded hover:bg-[#1D4532]/5 transition-colors">
            NÂNG CẤP DUNG LƯỢNG
          </button>
        </section>

        {/* Security & API */}
        <section className="col-span-12 lg:col-span-8 bg-white p-lg rounded-xl border border-outline/10 shadow-sm">
          <div className="flex items-center gap-sm mb-lg">
            <ShieldAlert className="w-6 h-6 text-[#1D4532]" />
            <h4
              className="text-headline-md font-bold text-on-surface"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Bảo mật &amp; API Key
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            {/* Session Timeout */}
            <div className="space-y-md">
              <label className="font-body-md font-semibold block text-on-surface">
                Thời gian Session (Phút)
              </label>
              <select
                value={sessionTime}
                onChange={(e) => { setSessionTime(e.target.value); setIsDirty(true); }}
                className="w-full bg-[#EDF7F2] border border-outline/20 rounded-lg p-md focus:ring-1 focus:ring-[#1D4532] outline-none text-body-md"
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

            {/* 2FA Section */}
            <div className="space-y-md">
              <label className="font-body-md font-semibold block text-on-surface">
                Xác thực 2 yếu tố (2FA)
              </label>
              <div className="flex items-center justify-between gap-md p-md bg-[#ffe088]/10 border border-[#ffe088]/20 rounded-lg">
                <div className="flex items-center gap-md">
                  <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="block font-label-md text-green-700 font-bold">
                      Đang hoạt động (Bắt buộc)
                    </span>
                    <span className="text-[12px] text-[#5e5e5b] block leading-tight">
                      Bắt buộc đối với vai trò quản trị viên hệ thống để nâng cao bảo mật.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => alert('Chức năng cấu hình 2FA hiện đang bảo trì. Vui lòng thử lại sau!')}
                  className="bg-white border border-outline text-on-surface px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#EDF7F2] transition-colors"
                >
                  Cấu hình lại
                </button>
              </div>
            </div>
          </div>

          {/* API Key management */}
          <div className="mt-xl">
            <label className="font-body-md font-semibold block mb-md text-on-surface">
              Quản lý API Key (Production)
            </label>
            <div className="flex items-center gap-md">
              <div className="flex-1 bg-[#EDF7F2] border border-outline/20 rounded-lg p-md font-mono text-sm overflow-hidden whitespace-nowrap relative flex items-center justify-between h-[48px]">
                <span className="select-all">
                  {showApiKey ? apiKey : `vs_live_••••••••••••••••••••••••${apiKey.slice(-4)}`}
                </span>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-on-surface-variant hover:text-on-surface ml-2"
                  title={showApiKey ? "Ẩn khóa" : "Hiển thị khóa"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleCopyKey}
                className="bg-[#e1dfdb] p-md rounded-lg text-[#63635f] hover:bg-[#c8c6c2] transition-colors"
                title="Sao chép"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowRegenModal(true)}
                className="bg-error-container p-md rounded-lg text-on-error-container hover:bg-error/10 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            {/* API Key Metadata */}
            <div className="mt-2 text-[11px] text-[#5e5e5b]/80 flex justify-between">
              <span>Ngày tạo: <strong className="text-on-surface">{apiKeyCreatedAt}</strong></span>
              <span>Lần cuối sử dụng: <strong className="text-on-surface">{apiKeyLastUsed}</strong></span>
            </div>
          </div>
        </section>

        {/* System Info Card */}
        <section className="col-span-12 lg:col-span-4 bg-[#1D4532] text-white p-lg rounded-xl flex flex-col relative overflow-hidden shadow-lg justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-sm mb-lg opacity-80">
              <Info className="w-5 h-5" />
              <h4 className="font-label-md text-label-md uppercase tracking-widest text-sm font-semibold">
                Trạng thái Hệ thống
              </h4>
            </div>
            <div className="space-y-xl">
              <div>
                <span className="text-white/60 text-[12px]">
                  Server Latency
                </span>
                <div className="flex items-baseline gap-xs">
                  <span className="text-4xl font-bold">24</span>
                  <span className="text-xl font-semibold">ms</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <span className="text-white/60 text-[12px]">Uptime</span>
                  <p className="font-label-md font-semibold">99.98%</p>
                </div>
                <div>
                  <span className="text-white/60 text-[12px]">Khu vực</span>
                  <p className="font-label-md font-semibold">Asia (VN)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-4 right-4 opacity-10">
            <Network className="w-20 h-20" />
          </div>
        </section>
      </div>

      {/* Regeneration Confirmation Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-xl shadow-2xl border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-md mb-md">
              <div className="bg-error/10 p-md rounded-full text-error flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-headline-md font-bold text-on-surface">Xác nhận đổi API Key?</h4>
                <p className="text-body-md text-on-surface-variant mt-sm">
                  Bạn có chắc muốn tạo key mới? <strong>Key cũ sẽ ngừng hoạt động ngay lập tức</strong>, có thể làm sập các tích hợp đang chạy trên production.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-md mt-lg">
              <button
                onClick={() => setShowRegenModal(false)}
                className="bg-[#e1dfdb] hover:bg-[#c8c6c2] text-on-surface font-label-md px-lg py-md rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRegenerateKey}
                className="bg-error text-white font-label-md px-lg py-md rounded-lg hover:bg-error/90 transition-colors"
              >
                Xác nhận tạo mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

