import { useState, useCallback } from 'react';
import {
  Users,
  BookOpen,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useAxiosRequest } from '../../hooks/useAxiosRequest';
import {
  instructorStudentsApi,
  lessonsApi,
  reviewsApi,
  instructorDashboardApi,
} from '../../api/services';
import type { Lesson, ReviewItem } from '../../api/types';

const InstructorDashboard = () => {
  // 1. Fetch dashboard stats from backend
  const fetchStats = useCallback(() => instructorDashboardApi.getStats(), []);
  const { data: dashboardStats } = useAxiosRequest(fetchStats, { auto: true });

  // 2. Fallbacks: Fetch all students to count
  const fetchStudents = useCallback(() => instructorStudentsApi.listStudents(), []);
  const { data: studentsResponse } = useAxiosRequest(fetchStudents, { auto: true });
  const studentsCount = (studentsResponse || []).filter(
    (u: any) =>
      u.role === 'Người học' ||
      u.role === 'LEARNER' ||
      u.role === 'learner' ||
      u.role === 'Learner'
  ).length;

  // 3. Fallbacks: Fetch all lessons to count
  const fetchLessons = useCallback(
    () => lessonsApi.list(new URLSearchParams({ size: '100' })),
    []
  );
  const { data: lessonsResponse } = useAxiosRequest(fetchLessons, { auto: true });
  const lessonsCount = lessonsResponse?.content?.length || 0;

  // 4. Fetch reviews list for activities & pending count
  const fetchReviews = useCallback(() => reviewsApi.list(), []);
  const { data: reviewsResponse, loading: reviewsLoading } = useAxiosRequest(
    fetchReviews,
    { auto: true }
  );

  const reviews = reviewsResponse || [];
  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending').length;

  // Stats calculation with fallback mechanism
  const totalStudents = dashboardStats?.students ?? dashboardStats?.totalLearners ?? studentsCount;
  const totalLessons = dashboardStats?.courses ?? dashboardStats?.activeLessons ?? lessonsCount;
  const pendingReviews = pendingReviewsCount;

  const statsList = [
    {
      icon: Users,
      iconBg: 'bg-primary/5 text-primary',
      label: 'Tổng số học viên',
      value: String(totalStudents),
      badge: '+4%',
      trending: true,
    },
    {
      icon: BookOpen,
      iconBg: 'bg-secondary/10 text-secondary',
      label: 'Tổng bài giảng',
      value: String(totalLessons),
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-error/5 text-error',
      label: 'Bài tập chờ nhận xét',
      value: String(pendingReviews),
      highlightBorder: true,
    },
  ];

  // Map reviews to student activities
  const activities = reviews.slice(0, 5).map((r) => ({
    name: r.instructor || 'Học viên',
    lesson: r.title || 'Bài thực hành nhạc cụ',
    accuracy: r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : 'Từ chối',
    accuracyBg:
      r.status === 'pending'
        ? 'bg-amber-50 text-amber-700'
        : r.status === 'approved'
        ? 'bg-green-50 text-green-700'
        : 'bg-red-50 text-red-700',
    time: r.date || 'Gần đây',
    id: r.id,
  }));

  return (
    <>
      {/* Dashboard Header */}
      <header className="mb-xl">
        <h2 className="text-headline-lg font-bold text-primary mb-xs">
          Chào buổi sáng, Giảng viên
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Đây là những cập nhật mới nhất từ lớp học nhạc cụ dân tộc của bạn.
        </p>
      </header>

      {/* Bento Stats Widgets */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-xl">
        {statsList.map((s, idx) => (
          <div
            key={idx}
            className={`bg-white p-lg rounded-xl shadow-sm border border-outline-variant/5 flex flex-col gap-sm relative overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${s.iconBg}`}>
                <s.icon className="w-5 h-5" />
              </div>
              {s.badge && (
                <span className="text-green-600 font-label-sm text-label-sm flex items-center gap-xs font-semibold">
                  {s.badge}
                  {s.trending && <span className="text-[12px] font-bold">↑</span>}
                </span>
              )}
            </div>
            <div>
              <p className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-headline-lg font-bold text-primary">{s.value}</p>
            </div>
            {s.highlightBorder && (
              <div className="absolute bottom-0 right-0 w-16 h-1 bg-error/20" />
            )}
          </div>
        ))}
      </section>

      {/* Weekly Trend Chart */}
      <section className="bg-white p-xl rounded-xl shadow-sm border border-outline-variant/5 mb-xl">
        <div className="flex justify-between items-center mb-xl">
          <h3 className="text-headline-md font-bold text-primary">
            Xu hướng học tập trong tuần
          </h3>
          <select className="bg-surface-container border-none text-label-md font-label-md rounded-lg focus:ring-secondary py-1 px-3 outline-none cursor-pointer">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
          </select>
        </div>

        <div className="relative h-[300px] w-full mt-lg">
          {/* SVG Chart */}
          <svg className="w-full h-full" viewBox="0 0 800 300">
            {/* Grid Lines */}
            <line stroke="#e4e2dd" strokeDasharray="4" x1="0" x2="800" y1="50" y2="50" />
            <line stroke="#e4e2dd" strokeDasharray="4" x1="0" x2="800" y1="150" y2="150" />
            <line stroke="#e4e2dd" strokeDasharray="4" x1="0" x2="800" y1="250" y2="250" />

            {/* Main Line */}
            <path
              d="M0,220 C100,200 150,260 250,180 S400,100 500,140 S650,40 800,80"
              fill="none"
              stroke="#610000"
              strokeLinecap="round"
              strokeWidth="4"
            />

            {/* Area fill */}
            <path
              d="M0,220 C100,200 150,260 250,180 S400,100 500,140 S650,40 800,80 V300 H0 Z"
              fill="url(#grad1)"
              opacity="0.1"
            />

            <defs>
              <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#610000', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#610000', stopOpacity: 0 }} />
              </linearGradient>
            </defs>

            {/* Data dots */}
            <circle cx="250" cy="180" fill="#610000" r="6" stroke="white" strokeWidth="2" />
            <circle cx="500" cy="140" fill="#610000" r="6" stroke="white" strokeWidth="2" />
            <circle cx="800" cy="80" fill="#610000" r="6" stroke="white" strokeWidth="2" />
          </svg>

          {/* X-Axis Labels */}
          <div className="flex justify-between mt-md px-2 font-label-sm text-[12px] text-on-surface-variant">
            <span>Thứ 2</span>
            <span>Thứ 3</span>
            <span>Thứ 4</span>
            <span>Thứ 5</span>
            <span>Thứ 6</span>
            <span>Thứ 7</span>
            <span>Chủ Nhật</span>
          </div>
        </div>
      </section>

      {/* Latest Activities Table */}
      <section className="mt-xl bg-white rounded-xl shadow-sm border border-outline-variant/5 overflow-hidden">
        <div className="p-xl border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="text-headline-md font-bold text-primary">
            Hoạt động mới nhất
          </h3>
          <button 
            onClick={() => window.location.href = '/instructor/students'}
            className="flex items-center gap-xs text-secondary font-label-md text-label-md hover:underline font-semibold"
          >
            Xem toàn bộ →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[12px]">
                  Người thực hiện
                </th>
                <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[12px]">
                  Tên yêu cầu / Bài học
                </th>
                <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center text-[12px]">
                  Trạng thái
                </th>
                <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[12px]">
                  Thời gian
                </th>
                <th className="px-xl py-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {reviewsLoading ? (
                <tr>
                  <td colSpan={5} className="px-xl py-lg text-center text-on-surface-variant">
                    Đang tải hoạt động mới nhất...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-xl py-lg text-center text-on-surface-variant">
                    Chưa có hoạt động nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                activities.map((act, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-xl py-lg flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-primary/10 font-bold text-primary flex items-center justify-center text-xs">
                        {act.name.charAt(0)}
                      </div>
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {act.name}
                      </span>
                    </td>
                    <td className="px-xl py-lg text-body-md text-on-surface">
                      {act.lesson}
                    </td>
                    <td className="px-xl py-lg text-center">
                      <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold ${act.accuracyBg}`}>
                        {act.accuracy}
                      </span>
                    </td>
                    <td className="px-xl py-lg text-body-md text-on-surface-variant">
                      {act.time}
                    </td>
                    <td className="px-xl py-lg text-right">
                      <button 
                        onClick={() => window.location.href = `/instructor/students`}
                        className="text-primary hover:text-primary-container font-semibold"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating Action Button */}
      <button 
        onClick={() => window.location.href = '/instructor/lessons'}
        className="fixed bottom-xl right-xl w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </>
  );
};

export default InstructorDashboard;
