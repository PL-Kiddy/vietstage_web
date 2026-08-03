import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UserPlus,
  Lock,
  LockOpen,
  X,
  Music,
  ChevronLeft,
  ChevronRight,
  Check,
  MoreVertical,
  Edit2,
  Key,
  UserCheck,
  Search,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { masterDataApi, usersApi } from '../../api/services';
import type { AdminUser as ApiAdminUser, Instrument } from '../../api/types';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';

// Extended type to support 'pending' status
export interface ExtendedAdminUser extends Omit<ApiAdminUser, 'id' | 'status'> {
  id: string;
  status: 'active' | 'locked' | 'pending';
}

const INSTRUMENT_OPTIONS = [
  'Đàn Bầu',
  'Đàn Tranh',
  'Sáo Trúc',
  'Trống'
];

/* ── Role badge colours ───────────────────────────────────── */
const roleBadge: Record<string, string> = {
  Admin: 'bg-[#1D4532]/10 text-[#1D4532]',
  'Giảng viên': 'bg-[#ffe088] text-[#241a00]',
  'Người học': 'bg-[#d1e4fb] text-[#1D4532]',
};

const getAvatarStyle = (role: string) => {
  switch (role) {
    case 'Admin':
      return 'bg-[#1D4532]/15 text-[#1D4532] border border-[#1D4532]/30';
    case 'Giảng viên':
      return 'bg-[#ffe088]/30 text-[#8c6700] border border-[#ffe088]';
    case 'Người học':
      return 'bg-[#d1e4fb]/40 text-[#1D4532] border border-[#d1e4fb]';
    default:
      return 'bg-[#ffb4a8]/30 text-[#1D4532] border border-outline-variant';
  }
};

/* ════════════════════════════════════════════════════════════ */

const normalizeRole = (user: any): 'Admin' | 'Giảng viên' | 'Người học' => {
  // Handle numeric roleId from database (1=Admin, 2=Instructor/Giảng viên, 3=Learner)
  const roleId = user.roleId ?? user.role_id ?? user.RoleId;
  if (roleId !== undefined && roleId !== null) {
    const id = Number(roleId);
    if (id === 1) return 'Admin';
    if (id === 2) return 'Giảng viên';
    if (id === 3) return 'Người học';
  }

  // Handle string role field
  const rawRole = user.role ?? user.roleName ?? user.userRole ?? user.roleCode ?? '';
  if (!rawRole) return 'Người học';
  const r = String(rawRole).trim().toUpperCase();
  if (r.includes('ADMIN')) return 'Admin';
  if (r.includes('INSTRUCTOR') || r.includes('TEACHER') || r.includes('GIANG_VIEN') || r.includes('GIẢNG')) return 'Giảng viên';
  if (r === 'Admin' || r === 'ADMIN') return 'Admin';
  if (r === 'Giảng viên' || r === 'GIẢNG VIÊN') return 'Giảng viên';
  return 'Người học';
};

const mapExtendedUser = (user: ApiAdminUser): ExtendedAdminUser => ({
  ...user,
  name: (user as any).fullName || user.name || 'Chưa cập nhật',
  email: user.email || (user as any).emailAddress || '',
  role: normalizeRole(user),
  id: String((user as any).userId ?? (user as any).user_id ?? user.id),
});

const AdminUsers = () => {
  const location = useLocation();
  const isLearnersMode = location.pathname.includes('/learners');

  const [roleFilter, setRoleFilter] = useState('Tất cả');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset filters when switching between modes
  useEffect(() => {
    setRoleFilter('Tất cả');
    setStatusFilter('Tất cả');
    setSearchQuery('');
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLearnersMode]);
  const [selectedUser, setSelectedUser] = useState<ExtendedAdminUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Add User Drawer State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Giảng viên'>('Giảng viên');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newBiography, setNewBiography] = useState('');
  const [newYearsExperience, setNewYearsExperience] = useState<number>(1);
  const [authMethod, setAuthMethod] = useState<'invite' | 'password'>('password');
  const [newPassword, setNewPassword] = useState('');

  // Edit User Drawer State
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedAdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInstrument, setEditInstrument] = useState<string>('Đàn Bầu');

  // Confirmation Modal State
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'lock' | 'unlock' | 'reset_password' | 'activate';
    user: ExtendedAdminUser;
  } | null>(null);

  // Action Menu state
  const [openActionMenuUserId, setOpenActionMenuUserId] = useState<string | null>(null);

  const {
    data: usersData = [],
    error: usersError,
    loading: isLoading,
    execute: loadUsers,
  } = useAxiosRequest<ApiAdminUser[]>((signal) => usersApi.list({ signal }), { initialData: [] });

  const { data: instruments = [] } = useAxiosRequest<Instrument[]>(
    (signal) => masterDataApi.instruments({ signal }),
    { initialData: [] },
  );

  const users = useMemo(() => {
    // usersData may be: paginated {content:[]} OR array [] depending on API
    let rawList: any[] = [];
    if (Array.isArray(usersData)) {
      rawList = usersData;
    } else if ((usersData as any)?.content) {
      rawList = (usersData as any).content;
    } else if ((usersData as any)?.data?.content) {
      rawList = (usersData as any).data.content;
    }
    // DEBUG: log raw API response
    if (rawList.length > 0) {
      console.log('[AdminUsers] Total users from API:', rawList.length);
      console.log('[AdminUsers] Sample user keys:', Object.keys(rawList[0]));
      console.log('[AdminUsers] Sample user role field:', rawList[0].role, '| roleId:', rawList[0].roleId, '| role_id:', rawList[0].role_id);
    } else {
      console.log('[AdminUsers] usersData raw value:', usersData);
    }
    return rawList.map(mapExtendedUser);
  }, [usersData]);

  useEffect(() => {
    if (usersError) {
      alert(usersError);
    }
  }, [usersError]);

  const instrumentOptions = instruments.length > 0
    ? instruments.map((instrument) => instrument.name)
    : INSTRUMENT_OPTIONS;

  /* ── Filter ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = users;

    if (isLearnersMode) {
      result = result.filter((u) => u.role === 'Người học');
    } else {
      result = result.filter((u) => u.role === 'Admin' || u.role === 'Giảng viên');
    }

    if (roleFilter !== 'Tất cả') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (statusFilter !== 'Tất cả') {
      if (statusFilter === 'Hoạt động') {
        result = result.filter((u) => u.status === 'active');
      } else if (statusFilter === 'Đã khóa') {
        result = result.filter((u) => u.status === 'locked');
      } else if (statusFilter === 'Chờ kích hoạt') {
        result = result.filter((u) => u.status === 'pending');
      }
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [isLearnersMode, roleFilter, statusFilter, searchQuery, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageUsers = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  /* ── Validation helpers ──────────────────────────────────── */
  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isAddFormValid = 
    newUserName.trim() !== '' && 
    isEmailValid(newUserEmail) && 
    (authMethod === 'invite' || newPassword.length >= 6);

  const isEditFormValid = 
    editName.trim() !== '' && 
    isEmailValid(editEmail) && 
    (editingUser ? (
      editName !== editingUser.name || 
      editEmail !== editingUser.email || 
      (editingUser.role === 'Giảng viên' && (editingUser.specialty !== `Giảng viên ${editInstrument}`))
    ) : false);

  /* ── Handlers ────────────────────────────────────────────── */
  const triggerConfirmModal = (type: 'lock' | 'unlock' | 'reset_password' | 'activate', user: ExtendedAdminUser) => {
    setConfirmModalData({ type, user });
  };

  const handleConfirmAction = async () => {
    if (!confirmModalData) return;
    const { type, user } = confirmModalData;

    try {
      if (type === 'lock' || type === 'unlock' || type === 'activate') {
        const status = type === 'lock' ? 'locked' : 'active';
        await usersApi.updateStatus(Number(user.id), status);
        await loadUsers();
        setSelectedUser((current) => current?.id === user.id ? { ...current, status } : current);
      } else {
        alert('Luồng đặt lại mật khẩu quản trị sẽ sử dụng API quên mật khẩu.');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setConfirmModalData(null);
    }
  };

  const handleAddUserClick = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Giảng viên');
    setNewBiography('');
    setNewYearsExperience(1);
    setAuthMethod('password');
    setNewPassword('');
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

  const submitAddUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAddFormValid) return;

    const passwordToSubmit = authMethod === 'password'
      ? newPassword
      : `Vs@${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;

    try {
      if (newUserRole === 'Giảng viên') {
        // Swagger: POST /api/admin/create-instructor
        // Payload: { email, password, fullName, biography, yearsExperience }
        await usersApi.createInstructor({
          email: newUserEmail.trim(),
          password: passwordToSubmit,
          fullName: newUserName.trim(),
          biography: newBiography.trim() || undefined,
          yearsExperience: Number(newYearsExperience) || 0,
        });
      } else {
        // Swagger: POST /api/admin/create-admin
        // Payload: { email, password, fullName }
        await usersApi.createAdmin({
          email: newUserEmail.trim(),
          password: passwordToSubmit,
          fullName: newUserName.trim(),
        });
      }
      await loadUsers();
      setIsAddDrawerOpen(false);
      alert(`Tạo tài khoản ${newUserRole} thành công!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể tạo tài khoản.');
    }
  };

  const handleEditUserClick = (user: ExtendedAdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    
    // Parse primary instrument from specialty or instruments
    let defaultInst = 'Đàn Bầu';
    if (user.instruments && user.instruments.length > 0) {
      defaultInst = user.instruments[0];
    } else if (user.specialty) {
      const found = instrumentOptions.find(inst => user.specialty?.includes(inst));
      if (found) defaultInst = found;
    }
    setEditInstrument(defaultInst);
    setIsEditDrawerOpen(true);
  };

  const submitEditUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!isEditFormValid || !editingUser) return;

alert('Backend hiện chưa cung cấp endpoint cập nhật thông tin người dùng. Bạn vẫn có thể khóa hoặc mở khóa tài khoản.');
    setIsEditDrawerOpen(false);
  };

  return (
    <>
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex-grow">
        {/* ── Page Header & Filters ────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2
            className="text-headline-lg font-bold text-[#1D4532] mb-xs"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {isLearnersMode ? 'Quản lý học viên' : 'Quản lý thành viên'}
          </h2>
          <p className="text-body-md text-[#5e5e5b]">
            {isLearnersMode
              ? 'Danh sách tất cả các học viên đang tham gia học tập trên nền tảng.'
              : 'Danh sách các tài khoản quản trị viên và giảng viên hệ thống.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-md w-full">
          {/* Search bar */}
          <div className="flex items-center gap-xs px-md py-sm bg-white border border-[#d1e4fb] rounded-lg w-full sm:w-80 shadow-sm focus-within:ring-1 focus-within:ring-[#1D4532] transition-all">
            <Search className="w-5 h-5 text-[#5e5e5b]" />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-body-md w-full text-on-surface focus:ring-0 placeholder:text-[#5e5e5b]/50"
            />
          </div>

          {/* Role Filter */}
          {!isLearnersMode && (
            <div className="flex items-center gap-xs px-md py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
              <span className="font-label-md text-[#5e5e5b]">Vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer"
              >
                <option>Tất cả</option>
                <option>Admin</option>
                <option>Giảng viên</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-xs px-md py-sm bg-white border border-outline-variant rounded-lg shadow-sm">
            <span className="font-label-md text-[#5e5e5b]">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-label-md font-semibold text-[#1D4532] focus:ring-0 cursor-pointer"
            >
              <option>Tất cả</option>
              <option>Hoạt động</option>
              <option>Đã khóa</option>
              <option>Chờ kích hoạt</option>
            </select>
          </div>

          {/* Add New */}
          {!isLearnersMode && (
            <button
              onClick={handleAddUserClick}
              className="bg-[#1D4532] text-white px-lg py-sm rounded-lg font-label-md hover:bg-[#1D4532]/95 transition-all flex items-center gap-xs shadow-md ml-auto"
            >
              <UserPlus className="w-[18px] h-[18px]" />
              Thêm mới
            </button>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#d1e4fb]/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#EDF7F2]">
              <tr>
                {(isLearnersMode
                  ? ['Họ và Tên', 'Email', 'Ngày đăng ký', 'Trạng thái', 'Thao tác']
                  : ['Họ và Tên', 'Vai trò', 'Ngày đăng ký', 'Trạng thái', 'Thao tác']
                ).map(
                  (h, i) => (
                    <th
                      key={i}
                      className={`px-lg py-md font-label-md text-[#1D4532] font-semibold uppercase tracking-wider ${
                        i === 4 ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#d1e4fb]/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-xl text-body-md text-[#5e5e5b]">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-xl text-body-md text-[#5e5e5b]">
                    {isLearnersMode ? 'Không tìm thấy học viên phù hợp.' : 'Không tìm thấy thành viên phù hợp.'}
                  </td>
                </tr>
              ) : (
                pageUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-[#EDF7F2] transition-colors cursor-pointer"
                  >
                    {/* Name + Avatar */}
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-md">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarStyle(user.role)}`}>
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

                    {/* Role Badge or Email (depending on mode) */}
                    <td className="px-lg py-md">
                      {isLearnersMode ? (
                        <span className="text-[12px] text-[#5e5e5b]">{user.email}</span>
                      ) : (
                        <span
                          className={`px-sm py-1 text-[12px] font-bold rounded-lg ${
                            roleBadge[user.role] ?? ''
                          }`}
                        >
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-lg py-md text-[#5e5e5b] text-[12px]">
                      {user.registeredAt}
                    </td>

                    {/* Status */}
                    <td className="px-lg py-md">
                      {user.status === 'active' && (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Đang hoạt động
                        </span>
                      )}
                      {user.status === 'locked' && (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-[#1D4532]">
                          <span className="w-2.5 h-2.5 rounded-full bg-error" />
                          Bị khóa
                        </span>
                      )}
                      {user.status === 'pending' && (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-[#cca730]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ffe088] animate-pulse" />
                          Chờ xác nhận
                        </span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-lg py-md text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenActionMenuUserId(openActionMenuUserId === user.id ? null : user.id)}
                        className="p-2 hover:bg-[#EDF7F2] rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openActionMenuUserId === user.id && (
                        <>
                          {/* Menu Backdrop */}
                          <div className="fixed inset-0 z-10" onClick={() => setOpenActionMenuUserId(null)} />
                          <div className="absolute right-4 mt-1 w-48 bg-white border border-[#d1e4fb] rounded-xl shadow-lg py-1 z-20 text-left">
                            <button
                              onClick={() => {
                                setOpenActionMenuUserId(null);
                                setSelectedUser(user);
                              }}
                              className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                            >
                              <UserCheck className="w-4 h-4 text-[#1D4532]" />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionMenuUserId(null);
                                handleEditUserClick(user);
                              }}
                              className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-[#1D4532]" />
                              Sửa thông tin
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionMenuUserId(null);
                                triggerConfirmModal('reset_password', user);
                              }}
                              className="w-full flex items-center gap-xs px-4 py-2 hover:bg-[#EDF7F2] text-[13px] text-on-surface transition-colors"
                            >
                              <Key className="w-4 h-4 text-[#5e5e5b]" />
                              Đặt lại mật khẩu
                            </button>
                            
                            {user.status === 'pending' ? (
                              <button
                                onClick={() => {
                                  setOpenActionMenuUserId(null);
                                  triggerConfirmModal('activate', user);
                                }}
                                className="w-full flex items-center gap-xs px-4 py-2 hover:bg-emerald-50 text-[13px] text-emerald-700 font-bold transition-colors border-t border-[#d1e4fb]/40"
                              >
                                <Check className="w-4 h-4" />
                                Kích hoạt tài khoản
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setOpenActionMenuUserId(null);
                                  triggerConfirmModal(user.status === 'active' ? 'lock' : 'unlock', user);
                                }}
                                className={`w-full flex items-center gap-xs px-4 py-2 hover:bg-amber-50 text-[13px] font-semibold transition-colors border-t border-[#d1e4fb]/40 ${
                                  user.status === 'active' ? 'text-[#ba1a1a]' : 'text-emerald-700'
                                }`}
                              >
                                {user.status === 'active' ? (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Khóa tài khoản
                                  </>
                                ) : (
                                  <>
                                    <LockOpen className="w-4 h-4" />
                                    Mở khóa tài khoản
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* ── Pagination ───────────────────────────────────────── */}
      <div className="mt-lg flex flex-col sm:flex-row justify-between items-center gap-md text-[12px] text-[#5e5e5b] pt-4">
        <div className="flex items-center gap-lg">
          <p>
            Hiển thị {(currentPage - 1) * perPage + 1} -{' '}
            {Math.min(currentPage * perPage, filtered.length)} trong tổng số{' '}
            {filtered.length} người dùng
          </p>

          <div className="flex items-center gap-xs">
            <span>Số dòng mỗi trang:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-outline-variant rounded px-2 py-1 text-label-md cursor-pointer outline-none"
            >
              <option value={5}>5 dòng</option>
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>
        </div>

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
                  ? 'bg-[#1D4532] text-white'
                  : 'border border-outline-variant hover:bg-[#e3efff]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 border border-outline-variant rounded hover:bg-[#e3efff] transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${getAvatarStyle(selectedUser.role)}`}>
                  {selectedUser.initials}
                </div>
                <div>
                  <h3
                    className="text-headline-md font-bold text-[#1D4532]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {selectedUser.name}
                  </h3>
                  <p className="text-[12px] text-[#5e5e5b]">
                    {(selectedUser.role === 'Người học' ? 'Người học' : (selectedUser.specialty ?? selectedUser.role))} • ID:{' '}
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
              {/* Status Header Badge */}
              <div className="flex justify-between items-center bg-[#EDF7F2] p-md rounded-lg border border-[#d1e4fb]/40">
                <span className="text-body-md font-semibold text-on-surface">Trạng thái hệ thống:</span>
                {selectedUser.status === 'active' && (
                  <span className="bg-emerald-100 text-emerald-800 px-lg py-sm rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                    ĐANG HOẠT ĐỘNG
                  </span>
                )}
                {selectedUser.status === 'locked' && (
                  <span className="bg-red-100 text-red-800 px-lg py-sm rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-error rounded-full inline-block" />
                    ĐÃ BỊ KHÓA
                  </span>
                )}
                {selectedUser.status === 'pending' && (
                  <span className="bg-amber-100 text-amber-800 px-lg py-sm rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-[#cca730] rounded-full inline-block animate-pulse" />
                    CHỜ XÁC NHẬN
                  </span>
                )}
              </div>

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
                    <div className="text-headline-md font-bold text-[#1D4532]">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Timeline */}
              {selectedUser.activities && selectedUser.activities.length > 0 && (
                <section>
                  <div className="flex items-center gap-sm mb-md">
                    <span className="w-1 h-6 bg-[#1D4532] rounded-full" />
                    <h4 className="font-label-md text-[#1D4532] uppercase tracking-wider">
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
              {selectedUser.role !== 'Người học' && selectedUser.instruments &&
                selectedUser.instruments.length > 0 && (
                  <section>
                    <div className="flex items-center gap-sm mb-md">
                      <span className="w-1 h-6 bg-[#1D4532] rounded-full" />
                      <h4 className="font-label-md text-[#1D4532] uppercase tracking-wider">
                        Nhạc cụ chuyên môn / quan tâm
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-sm">
                      {selectedUser.instruments.map((inst) => (
                        <span
                          key={inst}
                          className="px-md py-sm bg-white border border-outline-variant rounded-full text-label-md text-[#1D4532] flex items-center gap-xs"
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
            <div className="p-lg border-t border-[#d1e4fb] bg-[#EDF7F2] flex gap-md justify-end">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  handleEditUserClick(selectedUser);
                }}
                className="px-lg py-sm border border-[#1D4532] text-[#1D4532] font-label-md rounded-lg hover:bg-[#1D4532]/5 transition-colors"
              >
                Sửa thông tin
              </button>
              {selectedUser.status === 'pending' ? (
                <button
                  onClick={() => triggerConfirmModal('activate', selectedUser)}
                  className="px-lg py-sm font-label-md rounded-lg hover:opacity-90 bg-emerald-700 text-white transition-opacity"
                >
                  Kích hoạt
                </button>
              ) : (
                <button
                  onClick={() => triggerConfirmModal(selectedUser.status === 'active' ? 'lock' : 'unlock', selectedUser)}
                  className={`px-lg py-sm font-label-md rounded-lg hover:opacity-90 transition-opacity text-white ${
                    selectedUser.status === 'active' ? 'bg-error' : 'bg-[#5e5e5b]'
                  }`}
                >
                  {selectedUser.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD USER DRAWER ─────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {isAddDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: 999 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDrawerOpen(false)}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[65%] md:w-[55%] lg:w-[45%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl z-[1000] overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-[#1D4532] font-sans">
                    Thêm thành viên mới
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    Tạo tài khoản quản trị hoặc giảng viên mới trên hệ thống.
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
                      Họ và tên <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface"
                      placeholder="Nhập đầy đủ họ và tên..."
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs flex justify-between">
                      <span>Email đăng nhập <span className="text-error">*</span></span>
                      {newUserEmail && !isEmailValid(newUserEmail) && (
                        <span className="text-[11px] text-error font-normal">Định dạng email không hợp lệ</span>
                      )}
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className={`w-full bg-[#fbf9f4] border rounded-xl p-md text-body-md transition-all outline-none text-on-surface ${
                        newUserEmail && !isEmailValid(newUserEmail) 
                          ? 'border-error focus:border-error focus:ring-error' 
                          : 'border-outline-variant/30 focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532]'
                      }`}
                      placeholder="Nhập email đăng nhập..."
                    />
                  </div>

                  {/* Role Select (Only Admin & Giảng viên) */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Vai trò trên hệ thống
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'Admin' | 'Giảng viên')}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface cursor-pointer font-medium"
                    >
                      <option value="Giảng viên">Giảng viên (Instructor)</option>
                      <option value="Admin">Admin (Quản trị viên)</option>
                    </select>
                  </div>

                  {/* Instructor Specific Fields: Biography & Years of Experience */}
                  {newUserRole === 'Giảng viên' && (
                    <>
                      <div className="flex flex-col gap-xs animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Số năm kinh nghiệm giảng dạy (yearsExperience)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={newYearsExperience}
                          onChange={(e) => setNewYearsExperience(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="Ví dụ: 5"
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface font-medium"
                        />
                      </div>

                      <div className="flex flex-col gap-xs animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                          Tiểu sử &amp; Giới thiệu bản thân (biography)
                        </label>
                        <textarea
                          rows={3}
                          value={newBiography}
                          onChange={(e) => setNewBiography(e.target.value)}
                          placeholder="Nhập giới thiệu tóm tắt về giảng viên..."
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Authentication Configuration */}
                  <div className="border-t border-outline-variant/10 pt-lg space-y-md">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Phương thức kích hoạt
                    </label>
                    <div className="space-y-sm">
                      <label className="flex items-center gap-xs cursor-pointer text-body-md text-on-surface">
                        <input
                          type="radio"
                          name="authMethod"
                          checked={authMethod === 'invite'}
                          onChange={() => setAuthMethod('invite')}
                          className="accent-[#1D4532]"
                        />
                        <span>Gửi liên kết kích hoạt qua Email</span>
                      </label>
                      <label className="flex items-center gap-xs cursor-pointer text-body-md text-on-surface">
                        <input
                          type="radio"
                          name="authMethod"
                          checked={authMethod === 'password'}
                          onChange={() => setAuthMethod('password')}
                          className="accent-[#1D4532]"
                        />
                        <span>Đặt mật khẩu khởi tạo tạm thời</span>
                      </label>
                    </div>

                    {authMethod === 'password' && (
                      <div className="flex flex-col gap-xs animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="font-label-sm text-on-surface-variant font-semibold text-xs">
                          Mật khẩu tạm thời <span className="text-error">*</span> (Tối thiểu 6 ký tự)
                        </label>
                        <input
                          type="password"
                          required={authMethod === 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu cho tài khoản..."
                          className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface"
                        />
                      </div>
                    )}

                    <div className="bg-[#EDF7F2] p-md rounded-xl text-[11px] text-[#1D4532]/80 flex items-start gap-xs">
                      <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {authMethod === 'invite' ? (
                        <p>
                          * <strong>Lưu ý:</strong> Hệ thống sẽ gửi thư chào mừng chứa liên kết kích hoạt đến email người dùng. Tài khoản sẽ hiển thị ở trạng thái <strong>Chờ xác nhận</strong> cho đến khi người dùng kích hoạt link thành công.
                        </p>
                      ) : (
                        <p>
                          * <strong>Lưu ý:</strong> Tài khoản sẽ hoạt động ngay lập tức. Admin cần chuyển thông tin đăng nhập và mật khẩu tạm cho người dùng một cách an toàn.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="flex-1 flex items-center justify-center gap-sm bg-[#e1dfdb] text-on-surface py-lg rounded-xl font-bold hover:bg-[#c8c6c2] active:scale-[0.98] transition-all border border-outline-variant/30"
                  >
                    <X className="w-5 h-5" />
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={!isAddFormValid}
                    className={`flex-1 flex items-center justify-center gap-sm py-lg rounded-xl font-bold active:scale-[0.98] transition-all shadow-md ${
                      isAddFormValid 
                        ? 'bg-[#1D4532] text-white hover:bg-[#1D4532]/95 cursor-pointer' 
                        : 'bg-[#1D4532]/40 text-white/60 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    Xác nhận
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── EDIT USER DRAWER ────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {isEditDrawerOpen && editingUser && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditDrawerOpen(false)}
            />

            {/* Slide-in Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-[100%] sm:w-[65%] md:w-[55%] lg:w-[45%] bg-[#fbf9f4] border-l border-outline-variant/15 shadow-2xl z-[1000] overflow-hidden flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="px-xl py-lg border-b border-outline-variant/10 flex justify-between items-center bg-[#f5f3ee]/30">
                <div>
                  <h4 className="text-headline-md font-bold text-[#1D4532] font-sans">
                    Sửa thông tin thành viên
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-xs">
                    Cập nhật hồ sơ, tên hiển thị hoặc chuyên môn nhạc cụ của tài khoản.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditDrawerOpen(false)}
                  className="p-md hover:bg-[#eae8e3]/80 rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Body */}
              <form onSubmit={submitEditUser} className="flex-1 overflow-y-auto p-xl space-y-xl custom-scrollbar flex flex-col justify-between">
                <div className="bg-white/95 backdrop-blur-md border border-outline-variant/10 rounded-2xl p-lg shadow-sm space-y-lg">
                  {/* ID Field (Read-only) */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant/70 font-semibold uppercase tracking-wider text-xs">
                      Mã thành viên (ID)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingUser.id}
                      className="w-full bg-[#f1efe9] border border-outline-variant/20 rounded-xl p-md text-body-md text-on-surface-variant/80 select-none outline-none"
                    />
                  </div>

                  {/* Name Input */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                      Họ và tên <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs flex justify-between">
                      <span>Email đăng nhập <span className="text-error">*</span></span>
                      {editEmail && !isEmailValid(editEmail) && (
                        <span className="text-[11px] text-error font-normal">Định dạng email không hợp lệ</span>
                      )}
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={`w-full bg-[#fbf9f4] border rounded-xl p-md text-body-md transition-all outline-none text-on-surface ${
                        editEmail && !isEmailValid(editEmail) 
                          ? 'border-error focus:border-error focus:ring-error' 
                          : 'border-outline-variant/30 focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532]'
                      }`}
                      placeholder="Nhập email đăng nhập..."
                    />
                  </div>

                  {/* Role Display (Read-only) */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-sm text-on-surface-variant/70 font-semibold uppercase tracking-wider text-xs">
                      Vai trò trên hệ thống (Cố định)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingUser.role}
                      className="w-full bg-[#f1efe9] border border-outline-variant/20 rounded-xl p-md text-body-md text-on-surface-variant/80 select-none outline-none font-bold"
                    />
                  </div>

                  {/* Instrument Specialty Selection (Visible only for Giảng viên) */}
                  {editingUser.role === 'Giảng viên' && (
                    <div className="flex flex-col gap-xs animate-in fade-in duration-200">
                      <label className="font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider text-xs">
                        Chuyên môn nhạc cụ (Theo Đàn)
                      </label>
                      <select
                        value={editInstrument}
                        onChange={(e) => setEditInstrument(e.target.value)}
                        className="w-full bg-[#fbf9f4] border border-outline-variant/30 rounded-xl p-md text-body-md focus:border-[#1D4532] focus:ring-1 focus:ring-[#1D4532] transition-all outline-none text-on-surface cursor-pointer font-medium"
                      >
                        {instrumentOptions.map((inst) => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="px-xl py-lg border-t border-outline-variant/10 bg-[#f5f3ee]/40 flex gap-md -mx-xl -mb-xl mt-xl">
                  <button
                    type="button"
                    onClick={() => setIsEditDrawerOpen(false)}
                    className="flex-1 flex items-center justify-center gap-sm bg-[#e1dfdb] text-on-surface py-lg rounded-xl font-bold hover:bg-[#c8c6c2] active:scale-[0.98] transition-all border border-outline-variant/30"
                  >
                    <X className="w-5 h-5" />
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={!isEditFormValid}
                    className={`flex-1 flex items-center justify-center gap-sm py-lg rounded-xl font-bold active:scale-[0.98] transition-all shadow-md ${
                      isEditFormValid 
                        ? 'bg-[#1D4532] text-white hover:bg-[#1D4532]/95 cursor-pointer' 
                        : 'bg-[#1D4532]/40 text-white/60 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    Lưu cấu hình
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* ── CONFIRMATION MODALS ──────────────────────────────── */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-xl shadow-2xl border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-md mb-md">
              <div className={`p-md rounded-full flex-shrink-0 ${
                confirmModalData.type === 'lock'
                  ? 'bg-error/10 text-error'
                  : 'bg-[#1D4532]/10 text-[#1D4532]'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-headline-md font-bold text-on-surface">
                  {confirmModalData.type === 'lock' && 'Khóa tài khoản?'}
                  {confirmModalData.type === 'unlock' && 'Mở khóa tài khoản?'}
                  {confirmModalData.type === 'reset_password' && 'Đặt lại mật khẩu?'}
                  {confirmModalData.type === 'activate' && 'Kích hoạt tài khoản?'}
                </h4>
                <p className="text-body-md text-on-surface-variant mt-sm">
                  {confirmModalData.type === 'lock' && (
                    <>Bạn có chắc chắn muốn khóa tài khoản của <strong>{confirmModalData.user.name}</strong>? Người dùng này sẽ tạm thời không thể đăng nhập vào hệ thống.</>
                  )}
                  {confirmModalData.type === 'unlock' && (
                    <>Mở khóa tài khoản của <strong>{confirmModalData.user.name}</strong>? Người dùng sẽ lấy lại quyền đăng nhập vào nền tảng.</>
                  )}
                  {confirmModalData.type === 'reset_password' && (
                    <>Bạn có muốn đặt lại mật khẩu tạm thời cho <strong>{confirmModalData.user.name}</strong>? Mật khẩu sẽ được reset về mặc định là <strong>123456</strong>.</>
                  )}
                  {confirmModalData.type === 'activate' && (
                    <>Kích hoạt và xác nhận tài khoản cho <strong>{confirmModalData.user.name}</strong>? Tài khoản sẽ chuyển sang trạng thái Đang hoạt động.</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-md mt-lg">
              <button
                onClick={() => setConfirmModalData(null)}
                className="bg-[#e1dfdb] hover:bg-[#c8c6c2] text-on-surface font-label-md px-lg py-md rounded-lg transition-colors border border-outline-variant/30"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmAction}
                className={`text-white font-label-md px-lg py-md rounded-lg transition-colors ${
                  confirmModalData.type === 'lock'
                    ? 'bg-[#ba1a1a] hover:bg-[#a61717]'
                    : 'bg-[#1D4532] hover:bg-[#1D4532]/95'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;

