import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  FileText,
  ChevronRight,
  Clock,
  Check,
} from '../components/icons';
import { api } from '../services/api';
import { User } from '../types';

interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPageProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error('Failed to mark all read:', err);
    }
  };

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ACCESS_GRANTED':
        return <KeyRound className="h-4 w-4 text-emerald-600" />;
      case 'ACCESS_REVOKED':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="h-4 w-4 text-amber-600" />;
      default:
        return <FileText className="h-4 w-4 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-sky-600 transition cursor-pointer"
            >
              Dashboard
            </button>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">Notifications</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-sky-600" />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time notifications for file access grants, instant revocations, and security alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'all'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Notifications</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] text-slate-700 border border-slate-200">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'unread'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="inline-block animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mb-2"></div>
            <div className="text-xs">Loading notifications...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications found."
                : 'No notification activity has been generated for your account yet.'}
            </p>
          </div>
        ) : (
          filteredList.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 shadow-2xs ${
                n.isRead
                  ? 'bg-white border-slate-200'
                  : 'bg-gradient-to-r from-sky-50/60 via-white to-pink-50/30 border-sky-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5 shadow-2xs">
                  {getTypeIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[9px] font-black uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-xs transition cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                {n.resourceId && (
                  <button
                    onClick={() => onNavigate('document-details', { documentId: n.resourceId })}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    View File
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

