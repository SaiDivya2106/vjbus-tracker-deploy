import React, { useEffect, useState, useRef } from 'react';
import api from '../api';

function NotificationsDropdown({ userEmail, onClose, onMarkedRead, onNavigateToMou }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/notifications', { params: { email: userEmail } });
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const onClickAway = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose && onClose();
      }
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read', { email: userEmail });
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      onMarkedRead && onMarkedRead();
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await api.post('/api/notifications/mark-read', { email: userEmail, ids: [id] });
      setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      onMarkedRead && onMarkedRead();
    } catch {}
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const iconFor = (type) => {
    switch (type) {
      case 'comment': return '💬';
      case 'activity': return '🗓️';
      case 'like': return '❤️';
      default: return '🔔';
    }
  };

  return (
    <div className="notif-dropdown" ref={ref}>
      <div className="notif-header">
        <span>Notifications</span>
        <button className="notif-action" onClick={markAllRead}>Mark all read</button>
      </div>
      <div className="notif-list">
        {loading ? (
          <div className="notif-loading">Loading...</div>
        ) : items.length === 0 ? (
          <div className="notif-empty">You're all caught up!</div>
        ) : (
          items.map(n => (
            <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
              <div className="notif-icon">{iconFor(n.type)}</div>
              <div className="notif-content">
                <div className="notif-message">{n.message}</div>
                <div className="notif-meta">
                  <button
                    className="notif-link"
                    title="Open MoU"
                    onClick={() => {
                      onNavigateToMou && onNavigateToMou(n.prefix, n.type);
                      onClose && onClose();
                    }}
                  >
                    {n.title || n.prefix}
                  </button>
                  <span>•</span>
                  <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  {!n.read && (
                    <>
                      <span>•</span>
                      <button className="notif-action" onClick={() => markOneRead(n.id)}>Mark read</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsDropdown;
