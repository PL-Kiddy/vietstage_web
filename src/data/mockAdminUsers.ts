export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Giảng viên' | 'Người học';
  registeredAt: string;
  status: 'active' | 'locked';
  avatar?: string;
  initials?: string;
  specialty?: string;
  stats?: { courses: number; students: string; rating: number };
  instruments?: string[];
  activities?: { title: string; time: string }[];
}

export const mockAdminUsers: AdminUser[] = [
  {
    id: 'VS-2024-089',
    name: 'Nguyễn Văn Linh',
    email: 'linh.nv@example.com',
    role: 'Giảng viên',
    registeredAt: '12/03/2024',
    status: 'active',
    initials: 'NL',
    specialty: 'Giảng viên Đàn Bầu',
    stats: { courses: 12, students: '450+', rating: 4.9 },
    instruments: ['Đàn Bầu', 'Đàn Tranh', 'Đàn Tỳ Bà', 'Sáo Trúc'],
    activities: [
      {
        title: 'Đăng tải bài giảng mới: Kỹ thuật rung Đàn Bầu',
        time: 'Hôm nay, 14:20 • Module 4 - Khóa học Trung cấp',
      },
      {
        title: 'Phê duyệt 15 bài nộp của học viên',
        time: 'Hôm qua, 09:15',
      },
      {
        title: 'Cập nhật thông tin hồ sơ nghệ sĩ',
        time: '15/04/2024',
      },
    ],
  },
  {
    id: 'VS-2024-112',
    name: 'Trần Thị Mai',
    email: 'mai.tt@example.com',
    role: 'Người học',
    registeredAt: '05/04/2024',
    status: 'locked',
    initials: 'TM',
    stats: { courses: 3, students: '0', rating: 0 },
    instruments: ['Đàn Tranh'],
    activities: [
      { title: 'Đăng ký khóa học Đàn Tranh cơ bản', time: '05/04/2024' },
    ],
  },
  {
    id: 'VS-2024-125',
    name: 'Phạm Hoàng',
    email: 'hoang.p@example.com',
    role: 'Người học',
    registeredAt: '10/04/2024',
    status: 'active',
    initials: 'PH',
    stats: { courses: 5, students: '0', rating: 0 },
    instruments: ['Sáo Trúc', 'Đàn Nguyệt'],
    activities: [
      { title: 'Hoàn thành bài kiểm tra Module 2', time: '18/04/2024' },
      { title: 'Nộp bài tập thực hành Sáo Trúc', time: '15/04/2024' },
    ],
  },
  {
    id: 'VS-2024-003',
    name: 'Lê Quang Minh',
    email: 'minh.lq@example.com',
    role: 'Admin',
    registeredAt: '01/01/2024',
    status: 'active',
    initials: 'LM',
    stats: { courses: 0, students: '0', rating: 0 },
    instruments: [],
    activities: [
      { title: 'Cấu hình hệ thống sao lưu tự động', time: '20/04/2024' },
      { title: 'Phê duyệt 8 tài khoản Giảng viên mới', time: '18/04/2024' },
    ],
  },
  {
    id: 'VS-2024-078',
    name: 'Vũ Thị Hạnh',
    email: 'hanh.vt@example.com',
    role: 'Giảng viên',
    registeredAt: '20/02/2024',
    status: 'active',
    initials: 'VH',
    specialty: 'Giảng viên Đàn Tranh',
    stats: { courses: 8, students: '320+', rating: 4.7 },
    instruments: ['Đàn Tranh', 'Đàn Nhị'],
    activities: [
      { title: 'Tải lên video hướng dẫn Đàn Tranh nâng cao', time: 'Hôm nay, 10:30' },
      { title: 'Trả lời 12 câu hỏi từ học viên', time: 'Hôm qua, 16:45' },
    ],
  },
  {
    id: 'VS-2024-140',
    name: 'Đỗ Minh Tuấn',
    email: 'tuan.dm@example.com',
    role: 'Người học',
    registeredAt: '15/04/2024',
    status: 'active',
    initials: 'DT',
    stats: { courses: 2, students: '0', rating: 0 },
    instruments: ['Đàn Bầu'],
    activities: [
      { title: 'Đăng ký khóa học Đàn Bầu nâng cao', time: '16/04/2024' },
    ],
  },
];
