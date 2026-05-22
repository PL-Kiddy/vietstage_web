import React, { useState } from 'react';
import { User, Mail, Shield, Award, Edit, Save } from 'lucide-react';

const InstructorProfile = () => {
  const [name, setName] = useState('NSND Thanh Hải');
  const [title, setTitle] = useState('Giảng viên cao cấp');
  const [email, setEmail] = useState('instructor@fpt.edu.vn');
  const [phone, setPhone] = useState('0987 654 321');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    alert('Đã cập nhật hồ sơ giảng viên thành công!');
  };

  return (
    <div className="max-w-[900px] mx-auto bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div className="bg-primary p-xl text-on-primary flex flex-col sm:flex-row items-center gap-xl">
        <div className="w-24 h-24 rounded-full border-4 border-secondary-fixed/50 bg-[#ffe088] text-primary text-3xl font-bold flex items-center justify-center shadow-lg">
          TH
        </div>
        <div className="text-center sm:text-left flex-grow">
          <h2 className="text-headline-lg font-bold text-[#ffe088]">{name}</h2>
          <p className="text-body-md text-on-primary/80 mt-xs">{title}</p>
          <span className="inline-block mt-sm px-3 py-1 bg-primary-container/30 rounded-full text-label-sm font-semibold border border-on-primary/10">
            Mã GV: VS-INST-2023
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
          Thông tin chi tiết
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
                className="w-full pl-10 pr-4 py-md bg-[#fbf9f4] border border-outline/20 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Chức danh chuyên môn
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                disabled={!isEditing}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#fbf9f4] border border-outline/20 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="email"
                disabled={!isEditing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#fbf9f4] border border-outline/20 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <label className="font-label-md text-on-surface-variant font-semibold">
              Số điện thoại liên hệ
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-md bg-[#fbf9f4] border border-outline/20 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none disabled:opacity-75 transition-all text-on-surface"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-lg border-t border-outline-variant/10">
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

export default InstructorProfile;
