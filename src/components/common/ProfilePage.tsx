import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Edit, Mail, Save, Shield, User } from 'lucide-react';
import { profileApi, type UserProfile } from '../../api/management';

interface ProfilePageProps {
  accentClass?: string;
  roleLabel: string;
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const ProfilePage = ({ accentClass = 'bg-[#edf4ff]', roleLabel }: ProfilePageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void profileApi.get()
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Không thể tải hồ sơ.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await profileApi.update(fullName.trim());
      setProfile(updated);
      setFullName(updated.fullName);
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-xl text-center text-on-surface-variant">Đang tải hồ sơ...</div>;
  }

  if (!profile) {
    return <div className="p-xl text-center text-error">{error || 'Không tìm thấy hồ sơ.'}</div>;
  }

  return (
    <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div className="bg-primary p-xl text-on-primary flex flex-col sm:flex-row items-center gap-xl">
        <div className={`w-24 h-24 rounded-full border-4 border-secondary-fixed/50 ${accentClass} text-primary text-3xl font-bold flex items-center justify-center shadow-lg`}>
          {initialsOf(profile.fullName)}
        </div>
        <div className="text-center sm:text-left flex-grow">
          <h2 className="text-headline-lg font-bold text-[#ffe088]">{profile.fullName}</h2>
          <p className="text-body-md text-on-primary/80 mt-xs">{roleLabel}</p>
          <span className="inline-block mt-sm px-3 py-1 bg-primary-container/30 rounded-full text-label-sm font-semibold border border-on-primary/10">
            Mã tài khoản: {profile.userCode}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setFullName(profile.fullName);
            setEditing((value) => !value);
          }}
          className="flex items-center gap-xs bg-[#735c00] hover:bg-[#735c00]/90 text-white px-lg py-md rounded-lg font-label-md"
        >
          {editing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-xl space-y-xl">
        {error && <div className="rounded-lg bg-error-container text-on-error-container p-md">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
          <label className="flex flex-col gap-sm">
            <span className="font-semibold text-on-surface-variant">Họ và tên</span>
            <span className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={!editing}
                required
                className="w-full pl-10 pr-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg disabled:opacity-75"
              />
            </span>
          </label>
          <div className="flex flex-col gap-sm">
            <span className="font-semibold text-on-surface-variant">Email đăng nhập</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input value={profile.email} disabled className="w-full pl-10 pr-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg opacity-75" />
            </div>
          </div>
          <div className="flex items-center gap-md rounded-lg bg-[#f7f9ff] border border-[#d1e4fb] p-md">
            <Shield className="w-5 h-5 text-primary" />
            <div><p className="font-semibold">Trạng thái</p><p>{profile.active ? 'Đang hoạt động' : 'Đã khóa'}</p></div>
          </div>
          <div className="flex items-center gap-md rounded-lg bg-[#f7f9ff] border border-[#d1e4fb] p-md">
            <CalendarDays className="w-5 h-5 text-primary" />
            <div><p className="font-semibold">Ngày tạo</p><p>{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</p></div>
          </div>
        </div>
        {editing && (
          <div className="flex justify-end">
            <button disabled={saving} className="bg-primary text-on-primary px-xl py-md rounded-lg font-semibold disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfilePage;
