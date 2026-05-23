import { useState, useMemo } from 'react';
import {
  UserPlus,
  ShieldCheck,
  Lock,
  LockOpen,
  X,
  Music,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockAdminUsers, type AdminUser } from '../../data/mockAdminUsers';

/* ── Role badge colours ───────────────────────────────────── */
const roleBadge: Record<string, string> = {
  Admin: 'bg-primary/10 text-primary',
  'Giảng viên': 'bg-[#ffe088] text-[#241a00]',
  'Người học': 'bg-[#d1e4fb] text-primary',
};

/* ════════════════════════════════════════════════════════════ */

const AdminUsers = () => {
  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Add User Drawer State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Giảng viên' | 'Người học'>('Người học');
  const [newUserEmail, setNewUserEmail] = useState('');

  // Initialize from LocalStorage
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('vietstage_admin_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing admin users from localStorage:', e);
      }
    }
    return mockAdminUsers;
  });

  const saveUsers = (updatedUsers: AdminUser[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('vietstage_admin_users', JSON.stringify(updatedUsers));
  };

  /* ── Filter ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (roleFilter === 'Tất cả') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [roleFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageUsers = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  /* ── Toggle lock (mock) ──────────────────────────────────── */
  const toggleLock = (user: AdminUser) => {
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, status: u.status === 'active' ? ('locked' as const) : ('active' as const) } : u
    );
    saveUsers(updated);
    
    // Update selected user sidebar detail if matching
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'active' ? 'locked' : 'active',
            }
          : null
      );
    }
  };

  /* ── Create User Drawer Trigger ──────────────────────────── */
  const handleAddUserClick = () => {
    setNewUserName('');
    setNewUserRole('Người học');
    setNewUserEmail('');
    setIsAddDrawerOpen(true);
  };

  const handleNameChange = (val: string) => {
    setNewUserName(val);
    const noAccents = val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, (char) => (char === 'đ' ? 'd' : 'D'));
    const emailPrefix = noAccents.toLowerCase().replace(/\s+/g, '');
    setNewUserEmail(emailPrefix ? `${emailPrefix}@vietstage.com` : '');
  };

  const submitAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      alert('Vui lòng nhập họ và tên');
      return;
    }
    if (!newUserEmail.trim()) {
      alert('Vui lòng nhập email');
      return;
    }

    const initials = newUserName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser: AdminUser = {
      id: `VS-2024-${Math.floor(100 + Math.random() * 900)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      registeredAt: new Date().toLocaleDateString('vi-VN'),
      status: 'active',
      initials: initials || 'VS',
      stats: { courses: 0, students: '0', rating: 0 },
      instruments: [],
      activities: [{ title: 'Đăng ký tài khoản mới trên hệ thống', time: 'Vừa xong' }],
    };

    const updated = [newUser, ...users];
    saveUsers(updated);
    setIsAddDrawerOpen(false);
    alert('Đã thêm thành viên mới thành công!');
  };

  /* ── Upgrade Role ────────────────────────────────────────── */
  const handleUpgradeRole = (user: AdminUser) => {
    const currentRole = user.role;
    let nextRole: 'Admin' | 'Giảng viên' | 'Người học' = 'Giảng viên';

    if (currentRole === 'Người học') nextRole = 'Giảng viên';
    else if (currentRole === 'Giảng viên') nextRole = 'Admin';
    else nextRole = 'Người học';

    if (confirm(`Bạn có muốn đổi vai trò của ${user.name} từ [${currentRole}] sang [${nextRole}] không?`)) {
      const updated = users.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u));
      saveUsers(updated);
      setSelectedUser((prev) => (prev ? { ...prev, role: nextRole } : null));
    }
  };

  /* ── Edit Profile Name ───────────────────────────────────── */
  const handleEditProfile = (user: AdminUser) => {
    const newName = prompt('Nhập họ và tên mới:', user.name);
    if (!newName || !newName.trim()) return;

    const updated = users.map((u) => (u.id === user.id ? { ...u, name: newName.trim() } : u));
    saveUsers(updated);
    setSelectedUser((prev) => (prev ? { ...prev, name: newName.trim() } : null));
  };

  return (
    <>
      {/* ── Page Header & Filters ────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg mb-10">
        <div>
          <h2
            className="text-headline-lg font-bold text-primary mb-xs"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Quản lý người dùng
          </h2>
          <p className="text-body-md text-[#5e5e5b]">
            Danh sách tất cả các tài khoản đang tham gia nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-md">
          {/* Role Filter */}
          <div className="flex items-center gap-xs px-md py-sm bg-white border border-outline-variant rounded-lg">
            <span className="font-label-md text-[#5e5e5b]">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-label-md font-semibold text-primary focus:ring-0 cursor-pointer"
            >
              <option>Tất cả</option>
              <option>Admin</option>
              <option>Giảng viên</option>
              <option>Người học</option>
            </select>
          </div>

          {/* Add New */}
          <button
            onClick={handleAddUserClick}
            className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md hover:opacity-90 transition-all flex items-center gap-xs shadow-sm"
          >
            <UserPlus className="w-[18px] h-[18px]" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#d1e4fb]/50 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#e3efff]">
            <tr>
              {['Họ và Tên', 'Vai trò', 'Ngày đăng ký', 'Trạng thái', ''].map(
                (h, i) => (
                  <th
                    key={i}
                    className={`px-lg py-md font-label-md text-[#5e5e5b] uppercase tracking-wider ${
                      i === 4 ? 'text-right' : ''
                    }`}
                  >
                    {h || 'Thao tác'}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#d1e4fb]/50">
            {pageUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="hover:bg-[#edf4ff] transition-colors cursor-pointer"
              >
                {/* Name + Avatar */}
                <td className="px-lg py-md">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-[#ffb4a8] flex items-center justify-center font-bold text-primary text-sm border border-outline-variant">
                      {user.initials}
                    </div>
                    <div>
                      <div className="font-label-md text-on-surface">
                        {user.name}
                      </div>
                      <div className="text-[12px] text-[#5e5e5b]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role Badge */}
                <td className="px-lg py-md">
                  <span
                    className={`px-sm py-1 text-[12px] font-bold rounded-lg ${
                      roleBadge[user.role] ?? ''
                    }`}
                  >
                    {user.role}
                  </span>
                </td>

                {/* Date */}
                <td className="px-lg py-md text-[#5e5e5b] text-[12px]">
                  {user.registeredAt}
                </td>

                {/* Status */}
                <td className="px-lg py-md">
                  {user.status === 'active' ? (
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-[#5e5e5b]">
                      <span className="w-2 h-2 rounded-full bg-error" />
                      Bị khóa
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-lg py-md text-right space-x-sm">
                  <button
                    title="Đổi vai trò nhanh"
                    className="text-[#735c00] hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgradeRole(user);
                    }}
                  >
                    <ShieldCheck className="w-5 h-5 inline" />
                  </button>
                  <button
                    title={
                      user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'
                    }
                    className={`hover:scale-105 transition-transform ${
                      user.status === 'active' ? 'text-error' : 'text-[#5e5e5b]'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(user);
                    }}
                  >
                    {user.status === 'active' ? (
                      <Lock className="w-5 h-5 inline" />
                    ) : (
                      <LockOpen className="w-5 h-5 inline" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────── */}
      <div className="mt-lg flex justify-between items-center text-[12px] text-[#5e5e5b]">
        <p>
          Hiển thị {(currentPage - 1) * perPage + 1} -{' '}
          {Math.min(currentPage * perPage, filtered.length)} trong tổng số{' '}
          {filtered.length} người dùng
        </p>
        <div className="flex gap-xs">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 border border-outline-variant rounded hover:bg-[#e3efff] transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                p === currentPage
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant hover:bg-[#e3efff]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 border border-outline-variant rounded hover:bg-[#e3efff] transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
           USER DETAIL SLIDE-IN PANEL
         ═══════════════════════════════════════════════════════ */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-end p-lg"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-white shadow-2xl rounded-xl flex flex-col border-l border-outline-variant animate-[slideIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-lg border-b border-[#d1e4fb] flex justify-between items-center">
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full border-2 border-primary bg-[#ffb4a8] flex items-center justify-center text-primary font-bold text-xl">
                  {selectedUser.initials}
                </div>
                <div>
                  <h3
                    className="text-headline-md font-bold text-primary"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {selectedUser.name}
                  </h3>
                  <p className="text-[12px] text-[#5e5e5b]">
                    {selectedUser.specialty ?? selectedUser.role} • ID:{' '}
                    {selectedUser.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-[#e3efff] rounded-full transition-colors text-[#5e5e5b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-lg space-y-10 custom-scrollbar">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-md">
                {[
                  { label: 'Khóa học', value: selectedUser.stats?.courses ?? 0 },
                  {
                    label: 'Học viên',
                    value: selectedUser.stats?.students ?? '0',
                  },
                  {
                    label: 'Đánh giá',
                    value: selectedUser.stats?.rating ?? '-',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="p-md bg-[#e3efff] rounded-lg border border-outline-variant"
                  >
                    <div className="text-[12px] text-[#5e5e5b] mb-1">
                      {s.label}
                    </div>
                    <div className="text-headline-md font-bold text-primary">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Timeline */}
              {selectedUser.activities && selectedUser.activities.length > 0 && (
                <section>
                  <div className="flex items-center gap-sm mb-md">
                    <span className="w-1 h-6 bg-primary rounded-full" />
                    <h4 className="font-label-md text-primary uppercase tracking-wider">
                      Lịch sử hoạt động
                    </h4>
                  </div>
                  <div className="space-y-md">
                    {selectedUser.activities.map((act, i) => (
                      <div key={i} className="flex gap-md">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              i === 0 ? 'bg-[#cca730]' : 'bg-outline-variant'
                            }`}
                          />
                          {i < (selectedUser.activities?.length ?? 0) - 1 && (
                            <div className="w-[1px] flex-1 bg-outline-variant my-1" />
                          )}
                        </div>
                        <div className="pb-md">
                          <div className="font-label-md text-on-surface">
                            {act.title}
                          </div>
                          <div className="text-[12px] text-[#5e5e5b]">
                            {act.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Instruments */}
              {selectedUser.instruments &&
                selectedUser.instruments.length > 0 && (
                  <section>
                    <div className="flex items-center gap-sm mb-md">
                      <span className="w-1 h-6 bg-primary rounded-full" />
                      <h4 className="font-label-md text-primary uppercase tracking-wider">
                        Nhạc cụ quan tâm
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-sm">
                      {selectedUser.instruments.map((inst) => (
                        <span
                          key={inst}
                          className="px-md py-sm bg-white border border-outline-variant rounded-full text-label-md text-primary flex items-center gap-xs"
                        >
                          <Music className="w-[18px] h-[18px]" />
                          {inst}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
            </div>

            {/* Modal Actions */}
            <div className="p-lg border-t border-[#d1e4fb] bg-[#edf4ff] flex gap-md justify-end">
              <button
                onClick={() => handleEditProfile(selectedUser)}
                className="px-lg py-sm border border-primary text-primary font-label-md rounded-lg hover:bg-primary/5 transition-colors"
              >
                Sửa hồ sơ
              </button>
              <button
                onClick={() => handleUpgradeRole(selectedUser)}
                className="px-lg py-sm bg-[#cca730] text-[#574500] font-label-md rounded-lg hover:opacity-90 transition-opacity"
              >
                Cấp quyền / Vai trò
              </button>
              <button
                onClick={() => toggleLock(selectedUser)}
                className={`px-lg py-sm font-label-md rounded-lg hover:opacity-90 transition-opacity text-white ${
                  selectedUser.status === 'active' ? 'bg-error' : 'bg-[#5e5e5b]'
                }`}
              >
                {selectedUser.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD USER DRAWER ─────────────────────────────────── */}
      <AnimatePresence>
        {isAddDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDrawerOpen(false)}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[65%] md:w-[55%] lg:w-[45%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl z-50 overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-[#8b0000] font-sans">
                    Thêm thành viên mới
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    Tạo tài khoản quản trị, giảng viên hoặc học viên mới.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-md hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Body */}
              <form onSubmit={submitAddUser} className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar flex flex-col justify-between">
                <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                  {/* Name Input */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] transition-all outline-none text-on-surface"
                      placeholder="Nhập đầy đủ họ và tên..."
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Email đăng nhập
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] transition-all outline-none text-on-surface"
                      placeholder="Nhập email đăng nhập..."
                    />
                  </div>

                  {/* Role Select */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Vai trò chuyên môn
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] transition-all outline-none text-on-surface cursor-pointer font-medium"
                    >
                      <option value="Người học">Người học (Học viên)</option>
                      <option value="Giảng viên">Giảng viên (Instructor)</option>
                      <option value="Admin">Admin (Quản trị viên)</option>
                    </select>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="flex-1 flex items-center justify-center gap-sm bg-[#ba1a1a] text-white py-lg rounded-xl font-bold hover:bg-[#a61717] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <X className="w-5 h-5" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-sm bg-[#1b5e20] text-white py-lg rounded-xl font-bold hover:bg-[#154618] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                    Xác nhận
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminUsers;
