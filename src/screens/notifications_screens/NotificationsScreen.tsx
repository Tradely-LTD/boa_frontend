import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { markAllRead } from '../../store/notificationsSlice';
import { useGetNotificationsQuery } from './services/notificationsApiSlice';

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  new_application:     { label: 'Application',  icon: 'assignment_add',  color: 'bg-blue-100 text-blue-600'     },
  status_change:       { label: 'Status',        icon: 'update',          color: 'bg-amber-100 text-amber-600'   },
  collection_assigned: { label: 'Collection',    icon: 'assignment_ind',  color: 'bg-purple-100 text-purple-600' },
  collection_completed:{ label: 'Collection',    icon: 'check_circle',    color: 'bg-emerald-100 text-emerald-600'},
  marketplace_order:   { label: 'Order',         icon: 'shopping_bag',    color: 'bg-orange-100 text-orange-600' },
};

const FILTER_TYPES = [
  { key: 'all',                 label: 'All'         },
  { key: 'collection_assigned', label: 'Collections' },
  { key: 'collection_completed',label: 'Collected'   },
  { key: 'marketplace_order',   label: 'Orders'      },
  { key: 'status_change',       label: 'Status'      },
  { key: 'new_application',     label: 'Applications'},
];

export default function NotificationsScreen() {
  const dispatch   = useDispatch();
  const lastReadAt = useSelector((s: RootState) => s.notifications.lastReadAt);
  const [filter,   setFilter] = useState('all');

  const { data, isLoading, refetch } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000,
  });

  const all         = data?.data ?? [];
  const unreadCount = all.filter(n => !lastReadAt || n.createdAt > lastReadAt).length;
  const filtered    = filter === 'all' ? all : all.filter(n => n.type === filter);

  return (
    <div className="p-6 md:p-10">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Activity and alerts for your centre
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-sm transition"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllRead())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total"    value={all.length}    icon="notifications" color="bg-slate-50 border-slate-200 text-slate-700" />
        <SummaryCard label="Unread"   value={unreadCount}   icon="mark_chat_unread" color="bg-emerald-50 border-emerald-200 text-emerald-700" />
        <SummaryCard label="Orders"   value={all.filter(n => n.type === 'marketplace_order').length}    icon="shopping_bag"  color="bg-orange-50 border-orange-200 text-orange-700" />
        <SummaryCard label="Collections" value={all.filter(n => n.type.startsWith('collection')).length} icon="local_shipping" color="bg-purple-50 border-purple-200 text-purple-700" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TYPES.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap
              ${filter === f.key
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({all.filter(n => n.type === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 block mb-2">notifications_none</span>
            <p className="text-slate-400 text-sm">No notifications{filter !== 'all' ? ' in this category' : ' yet'}</p>
          </div>
        ) : (
          <>
            {/* Table header — desktop */}
            <div className="hidden md:grid grid-cols-[44px_1fr_140px_160px_10px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div />
              <div>Message</div>
              <div>Type</div>
              <div>Time</div>
              <div />
            </div>

            <ul className="divide-y divide-slate-50">
              {filtered.map((notif) => {
                const isUnread = !lastReadAt || notif.createdAt > lastReadAt;
                const meta = TYPE_META[notif.type] ?? { label: notif.type, icon: 'info', color: 'bg-slate-100 text-slate-500' };

                return (
                  <li
                    key={notif.id}
                    className={`grid grid-cols-[44px_1fr] md:grid-cols-[44px_1fr_140px_160px_10px] gap-4 items-center px-6 py-4 transition-colors
                      ${isUnread ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                      <span className="material-symbols-outlined text-base">{meta.icon}</span>
                    </div>

                    {/* Message + mobile meta */}
                    <div className="min-w-0">
                      <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                        {notif.message}
                      </p>
                      {/* Ref + mobile-only type + time */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 md:hidden">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                        {notif.applicationRefId && (
                          <span className="font-mono text-xs text-slate-400">{notif.applicationRefId}</span>
                        )}
                        <span className="text-xs text-slate-400">{formatTime(notif.createdAt)}</span>
                      </div>
                    </div>

                    {/* Type badge — desktop only */}
                    <div className="hidden md:flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{meta.icon}</span>
                        {meta.label}
                      </span>
                    </div>

                    {/* Time + ref — desktop only */}
                    <div className="hidden md:block">
                      <p className="text-sm text-slate-500">{formatTime(notif.createdAt)}</p>
                      {notif.applicationRefId && (
                        <p className="font-mono text-xs text-slate-400 mt-0.5">{notif.applicationRefId}</p>
                      )}
                    </div>

                    {/* Unread dot */}
                    <div className="hidden md:flex justify-end">
                      {isUnread && <span className="w-2 h-2 rounded-full bg-boa-green shrink-0" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="material-symbols-outlined text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now   = new Date();
  const diff  = now.getTime() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
