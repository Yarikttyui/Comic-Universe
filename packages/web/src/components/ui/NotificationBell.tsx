import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} д назад`;
}

export function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    initSocket,
    destroySocket,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      initSocket();
    } else {
      destroySocket();
    }
    return () => {
      destroySocket();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const handleNotifClick = (n: any) => {
    if (!n.isRead) markRead(n.id);
    if (n.payload?.comicId) {
      navigate(`/comic/${n.payload.comicId}`);
      setOpen(false);
    }
  };

  return (
    <div className="notification-bell-wrap" ref={ref}>
      <button
        className="notification-bell-btn"
        onClick={() => setOpen(!open)}
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span className="notification-dropdown-title">Уведомления</span>
            <div className="cluster" style={{ gap: 4 }}>
              {notifications.length > 0 && (
                <>
                  <button
                    className="notification-action-btn"
                    onClick={() => markAllRead()}
                    title="Прочитать все"
                  >
                    <CheckCheck size={16} />
                  </button>
                  <button
                    className="notification-action-btn"
                    onClick={() => clearAll()}
                    title="Очистить все"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              <button
                className="notification-action-btn"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Нет уведомлений</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.isRead ? '' : 'notification-item--unread'}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="notification-item-content">
                    <div className="notification-item-title">{n.title}</div>
                    <div className="notification-item-body">{n.body}</div>
                    <div className="notification-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <div className="notification-item-actions">
                    {!n.isRead && (
                      <button
                        className="notification-action-btn"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        title="Прочитано"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      className="notification-action-btn"
                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                      title="Удалить"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
