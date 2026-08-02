import { useAxiosRequest } from '../hooks/useAxiosRequest';
import { notificationApi, type Notification } from '../api/management';

export const useNotifications = () => {
  const {
    data: notifications,
    loading,
    error,
    setData,
  } = useAxiosRequest<Notification[]>((signal) => notificationApi.list({ signal }));

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  const markAsRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setData((prev) =>
      prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? []
    );
  };

  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setData((prev) => prev?.map((n) => ({ ...n, read: true })) ?? []);
  };

  return { notifications, loading, error, unread, markAsRead, markAllAsRead };
};
