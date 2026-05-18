import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useGetNotificationsQuery } from '../../screens/notifications_screens/services/notificationsApiSlice';

export default function NotificationBell({ managerPrefix }: { managerPrefix?: string }) {
  const navigate   = useNavigate();
  const lastReadAt = useSelector((s: RootState) => s.notifications.lastReadAt);

  const { data } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000,
  });

  const unread = (data?.data ?? []).filter(
    (n) => !lastReadAt || n.createdAt > lastReadAt,
  ).length;

  return (
    <button
      onClick={() => navigate(managerPrefix ? `${managerPrefix}/notifications` : '/notifications')}
      className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
      title="Notifications"
    >
      <span className="material-symbols-outlined text-xl">notifications</span>
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
