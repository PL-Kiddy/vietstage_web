import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  CalendarDays, Camera, Check,
  Edit2, Eye, EyeOff, KeyRound, Lock, Mail, Save, Shield, User, X,
} from 'lucide-react';
import { profileApi, type UserProfile } from '../../api/management';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

interface ProfilePageProps {
  accentClass?: string;
  roleLabel: string;
  isGreenTheme?: boolean;
}

type Tab = 'profile' | 'password';

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const ProfilePage = ({
  accentClass = 'bg-[#edf4ff]',
  roleLabel,
  isGreenTheme = false,
}: ProfilePageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile tab state ──
  const [fullName, setFullName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // ── Avatar state ──
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Password tab state ──
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const {
    data: profile,
    error: loadError,
    loading,
    setData: setProfile,
  } = useAxiosRequest<UserProfile>((signal) => profileApi.get({ signal }));

  // ─── Avatar handlers ───
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    setProfileError('');
    try {
      const updated = await profileApi.updateAvatar(avatarFile, profile.fullName);
      setProfile(updated);
      setAvatarFile(null);
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Profile save handler ───
  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const updated = await profileApi.update(fullName.trim());
      setProfile(updated);
      setFullName(updated.fullName);
      setEditing(false);
      setProfileSuccess('Cập nhật thông tin thành công!');
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Password save handler ───
  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    setPwSaving(true);
    try {
      await profileApi.changePassword(oldPassword, newPassword);
      setPwSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (reason) {
      setPwError(reason instanceof Error ? reason.message : 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setPwSaving(false);
    }
  };

  // ─── Loading / error states ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-[#5e5e5b] text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-500">{loadError || 'Không tìm thấy hồ sơ.'}</p>
      </div>
    );
  }

  const avatarSrc = avatarPreview ?? (profile as any).avatarUrl ?? null;

  // ─── Reusable password field ───
  const PasswordField = ({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder?: string;
  }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-[#5e5e5b]">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e5e5b]" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 bg-[#f7f9ff] border border-[#d1e4fb] rounded-xl text-sm outline-none focus:ring-2 transition ${
            isGreenTheme ? 'focus:ring-[#1D4532]/20' : 'focus:ring-primary/20'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#5e5e5b] transition-colors ${
            isGreenTheme ? 'hover:text-[#1D4532]' : 'hover:text-primary'
          }`}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  // ─── Render ───
  return (
    <div className="space-y-6">
      {/* ─── Hero card ─── */}
      <div className={`relative rounded-3xl overflow-hidden shadow-xl text-white ${isGreenTheme ? 'bg-[#1D4532]' : 'bg-primary'}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative p-8 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`w-28 h-28 rounded-full border-4 border-white/30 shadow-xl overflow-hidden ${accentClass} flex items-center justify-center`}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-3xl font-bold ${isGreenTheme ? 'text-[#1D4532]' : 'text-primary'}`}>{initialsOf(profile.fullName)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${
                isGreenTheme ? 'text-[#1D4532]' : 'text-primary'
              }`}
              title="Thay đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name & role */}
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-2xl font-bold text-[#ffe088]">{profile.fullName}</h1>
            <p className="text-white/80 mt-1">{roleLabel}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold border border-white/20">
              Mã tài khoản: {profile.userCode}
            </span>
          </div>
        </div>

        {/* Avatar upload confirmation bar */}
        {avatarFile && (
          <div className="relative px-8 pb-4 flex items-center gap-3 text-sm">
            <span className="text-white/80">Ảnh mới: <strong>{avatarFile.name}</strong></span>
            <button
              onClick={handleUploadAvatar}
              disabled={uploadingAvatar}
              className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {uploadingAvatar ? 'Đang lưu...' : 'Lưu ảnh'}
            </button>
            <button onClick={handleCancelAvatar} className="text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Tab card ─── */}
      <div className="bg-white rounded-3xl shadow-md border border-[#d1e4fb]/60 overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-[#d1e4fb]">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? isGreenTheme
                  ? 'text-[#1D4532] border-b-2 border-[#1D4532] bg-[#EDF7F2]'
                  : 'text-primary border-b-2 border-primary bg-[#f0f7ff]'
                : isGreenTheme
                ? 'text-[#5e5e5b] hover:text-[#1D4532] hover:bg-[#EDF7F2]/50'
                : 'text-[#5e5e5b] hover:text-primary hover:bg-[#f7f9ff]'
            }`}
          >
            <User className="w-4 h-4" />
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'password'
                ? isGreenTheme
                  ? 'text-[#1D4532] border-b-2 border-[#1D4532] bg-[#EDF7F2]'
                  : 'text-primary border-b-2 border-primary bg-[#f0f7ff]'
                : isGreenTheme
                ? 'text-[#5e5e5b] hover:text-[#1D4532] hover:bg-[#EDF7F2]/50'
                : 'text-[#5e5e5b] hover:text-primary hover:bg-[#f7f9ff]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Đổi mật khẩu
          </button>
        </div>

        {/* ── Tab: Profile info ── */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
            {profileError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />{profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5e5e5b]">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e5e5b]" />
                  <input
                    value={editing ? fullName : profile.fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!editing}
                    required
                    placeholder="Nhập họ và tên..."
                    className={`w-full pl-10 pr-4 py-3 bg-[#f7f9ff] border border-[#d1e4fb] rounded-xl text-sm outline-none focus:ring-2 disabled:opacity-70 transition ${
                      isGreenTheme ? 'focus:ring-[#1D4532]/20' : 'focus:ring-primary/20'
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5e5e5b]">Email đăng nhập</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e5e5b]" />
                  <input
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-[#f7f9ff] border border-[#d1e4fb] rounded-xl text-sm opacity-70"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 rounded-xl bg-[#f7f9ff] border border-[#d1e4fb] px-4 py-3">
                <Shield className={`w-5 h-5 flex-shrink-0 ${isGreenTheme ? 'text-[#1D4532]' : 'text-primary'}`} />
                <div>
                  <p className="text-xs text-[#5e5e5b]">Trạng thái</p>
                  <p className={`text-sm font-semibold ${profile.active ? 'text-green-600' : 'text-red-500'}`}>
                    {profile.active ? '● Đang hoạt động' : '● Đã khóa'}
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-3 rounded-xl bg-[#f7f9ff] border border-[#d1e4fb] px-4 py-3">
                <CalendarDays className={`w-5 h-5 flex-shrink-0 ${isGreenTheme ? 'text-[#1D4532]' : 'text-primary'}`} />
                <div>
                  <p className="text-xs text-[#5e5e5b]">Ngày tạo</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {new Date(profile.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#d1e4fb]/60">
              <button
                type="button"
                onClick={() => {
                  setFullName(profile.fullName);
                  setEditing((v) => !v);
                  setProfileError('');
                  setProfileSuccess('');
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  editing
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : isGreenTheme
                    ? 'bg-[#EDF7F2] text-[#1D4532] hover:bg-[#EDF7F2]/80 border border-[#1D4532]/30'
                    : 'bg-[#edf4ff] text-primary hover:bg-[#dceeff] border border-[#d1e4fb]'
                }`}
              >
                {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
              </button>

              {editing && (
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                    isGreenTheme ? 'bg-[#1D4532] hover:bg-[#1D4532]/90' : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── Tab: Change password ── */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="p-8 space-y-5">
            {pwError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{pwError}</div>
            )}
            {pwSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />{pwSuccess}
              </div>
            )}

            <PasswordField
              label="Mật khẩu hiện tại"
              value={oldPassword}
              onChange={setOldPassword}
              show={showOld}
              onToggle={() => setShowOld((v) => !v)}
              placeholder="Nhập mật khẩu hiện tại..."
            />
            <PasswordField
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              placeholder="Ít nhất 6 ký tự..."
            />
            <PasswordField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder="Nhập lại mật khẩu mới..."
            />

            {/* Password strength */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 w-8 rounded-full transition-colors ${
                        newPassword.length >= level * 3
                          ? newPassword.length >= 12 ? 'bg-green-500'
                          : newPassword.length >= 9 ? 'bg-yellow-500'
                          : 'bg-orange-400'
                          : isGreenTheme ? 'bg-[#EDF7F2]' : 'bg-[#d1e4fb]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[#5e5e5b]">
                  {newPassword.length < 6 ? 'Quá ngắn'
                    : newPassword.length < 9 ? 'Trung bình'
                    : newPassword.length < 12 ? 'Mạnh'
                    : 'Rất mạnh'}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#d1e4fb]/60">
              <button
                type="submit"
                disabled={pwSaving}
                className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                  isGreenTheme ? 'bg-[#1D4532] hover:bg-[#1D4532]/90' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                {pwSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
