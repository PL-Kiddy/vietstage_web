import React, { useState } from 'react';
import { User, Mail, Shield, Award, Edit, Save } from 'lucide-react';

const AdminProfile = () => {
  const [name, setName] = useState('Trần Thu Hà');
  const [title, setTitle] = useState('Quản trị viên hệ thống');
  const [email, setEmail] = useState('admin@fpt.edu.vn');
  const [phone, setPhone] = useState('0912 345 678');
  const [isEditing, setIsEditing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && newPassword) {
      if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
      }
      alert('Đã cập nhật thông tin hồ sơ Admin và mật khẩu thành công!');
    } else {
      alert('Đã cập nhật hồ sơ Admin thành công!');
    }
    setIsEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden mt-6">
      {/* Top Banner section */}
      <div className="bg-primary p-xl text-on-primary flex flex-col sm:flex-row items-center gap-xl">
        <div className="w-24 h-24 rounded-full border-4 border-secondary-fixed/50 bg-[#edf4ff] text-primary text-3xl font-bold flex items-center justify-center shadow-lg">
          TH
        </div>
        <div className="text-center sm:text-left flex-grow">
          <h2 className="text-headline-lg font-bold text-[#ffe088]">{name}</h2>
          <p className="text-body-md text-on-primary/80 mt-xs">{title}</p>
          <span className="inline-block mt-sm px-3 py-1 bg-primary-container/30 rounded-full text-label-sm font-semibold border border-on-primary/10">
            Mã QTV: VS-ADM-2023
          </span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-xs bg-[#735c00] hover:bg-[#735c00]/90 text-white px-lg py-md rounded-lg font-label-md transition-all cursor-pointer shadow-md active:scale-95 text-[14px]"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4" />
              Hủy chỉnh sửa
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              Chỉnh sửa hồ sơ
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="p-xl space-y-xl">
        <h3 className="text-headline-md font-bold text-primary border-l-4 border-primary pl-md mb-lg">
          Thông tin quản trị viên
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Chức danh/Vai trò
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                disabled={!isEditing}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="email"
                disabled={!isEditing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Số điện thoại
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        {isEditing && (
          <div className="pt-xl border-t border-[#d1e4fb] space-y-xl">
            <h3 className="text-headline-md font-bold text-primary border-l-4 border-primary pl-md">
              Đổi mật khẩu tài khoản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-on-surface"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-on-surface"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant font-semibold">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-md bg-[#f7f9ff] border border-[#d1e4fb] rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-on-surface"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end pt-lg border-t border-[#d1e4fb]">
            <button
              type="submit"
              className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95"
            >
              Lưu thay đổi
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminProfile;
