import { useAxiosRequest } from '../hooks/useAxiosRequest';
import { notificationApi, type Notification } from '../api/management';

// Hook tổng hợp thông báo: tải danh sách, đếm chưa đọc, đánh dấu đã đọc (1 cái / tất cả)
export const useNotifications = () => {
  const {
    data: notifications,
    loading,
    error,
    setData,
  } = useAxiosRequest<Notification[]>((signal) => notificationApi.list({ signal }));

  // Số thông báo chưa đọc
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  // Đánh dấu 1 thông báo đã đọc (cập nhật local sau khi gọi API thành công)
  const markAsRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setData((prev) =>
      prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? []
    );
  };

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setData((prev) => prev?.map((n) => ({ ...n, read: true })) ?? []);
  };

  return { notifications, loading, error, unread, markAsRead, markAllAsRead };
};
