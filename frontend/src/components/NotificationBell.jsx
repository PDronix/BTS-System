import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

const NOTIF_ICONS = {
  ASSIGNED: '👤',
  STATUS:   '🔄',
  CRITICAL: '🔴',
  REOPEN:   '⚠️',
  DEFAULT:  '🔔',
};

const NOTIF_COLORS = {
  ASSIGNED: '#1971c2',
  STATUS:   '#2f9e44',
  CRITICAL: '#e03131',
  REOPEN:   '#e67700',
  DEFAULT:  '#868e96',
};

export default function NotificationBell({ dark }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(true);
  const dropRef = useRef(null);
  const socketRef = useRef(null);
  const token = localStorage.getItem('token');

  const t = dark ? {
    bg:'#1a2035', border:'rgba(255,255,255,0.1)', text:'#e9ecef',
    textMuted:'#868e96', textDim:'#6c757d', hover:'rgba(255,255,255,0.04)',
    itemBorder:'rgba(255,255,255,0.05)', shadow:'0 20px 60px rgba(0,0,0,0.5)',
    unreadBg:'rgba(255,255,255,0.04)',
  } : {
    bg:'#ffffff', border:'rgba(0,0,0,0.1)', text:'#1a1d23',
    textMuted:'#6c757d', textDim:'#868e96', hover:'rgba(0,0,0,0.03)',
    itemBorder:'rgba(0,0,0,0.05)', shadow:'0 20px 60px rgba(0,0,0,0.15)',
    unreadBg:'rgba(30,200,120,0.05)',
  };

  useEffect(() => {
    fetchNotifications();

    // Socket.IO connection
    socketRef.current = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnread(prev => prev + 1);
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.message, icon: '/vite.svg' });
      }
    });

    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const r = await api.get('/notifications');
      setNotifications(r.data);
      setUnread(r.data.filter(n => !n.isRead).length);
    } catch(e) {}
    finally { setLoading(false); }
  };

  const handleOpen = () => { setOpen(!open); };

  const handleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id===id ? {...n,isRead:true} : n));
      setUnread(prev => Math.max(0, prev-1));
    } catch(e) {}
  };

  const handleReadAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({...n,isRead:true})));
      setUnread(0);
    } catch(e) {}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const wasUnread = notifications.find(n=>n.id===id)?.isRead===false;
      setNotifications(prev => prev.filter(n => n.id!==id));
      if (wasUnread) setUnread(prev => Math.max(0,prev-1));
    } catch(e) {}
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnread(0);
    } catch(e) {}
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <>
      <style>{`
        .bell-wrap{position:relative}
        .bell-btn{position:relative;width:36px;height:36px;border-radius:9px;background:${dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'};border:1px solid ${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.18s;color:${t.textMuted}}
        .bell-btn:hover{background:${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'};color:${t.text}}
        .bell-btn.has-notif{color:${dark?'#ffa94d':'#e67700'}}
        .bell-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;background:#e03131;color:#fff;border-radius:9px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:'Inter',sans-serif;border:2px solid ${dark?'#161b27':'#ffffff'};animation:${unread>0?'pulse-badge 2s ease-in-out infinite':'none'}}
        @keyframes pulse-badge{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        .notif-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:360px;max-height:480px;background:${t.bg};border:1px solid ${t.border};border-radius:16px;box-shadow:${t.shadow};z-index:1000;display:flex;flex-direction:column;overflow:hidden;font-family:'Inter',sans-serif;animation:dropIn 0.2s ease}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .notif-header{padding:14px 16px 12px;border-bottom:1px solid ${t.itemBorder};display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .notif-header-left{display:flex;align-items:center;gap:8px}
        .notif-title{font-size:14px;font-weight:700;color:${t.text}}
        .notif-count-badge{background:rgba(30,200,120,0.15);color:#1ec878;border:1px solid rgba(30,200,120,0.3);border-radius:10px;font-size:10px;font-weight:700;padding:2px 7px}
        .notif-header-actions{display:flex;gap:6px}
        .btn-notif-action{background:none;border:none;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:color 0.15s;padding:4px 8px;border-radius:6px}
        .btn-read-all{color:#1ec878}
        .btn-read-all:hover{background:rgba(30,200,120,0.1)}
        .btn-clear-all{color:${t.textMuted}}
        .btn-clear-all:hover{background:${dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'};color:${t.text}}
        .notif-list{overflow-y:auto;flex:1;scrollbar-width:thin;scrollbar-color:${dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'} transparent}
        .notif-item{padding:12px 16px;display:flex;gap:11px;cursor:pointer;transition:background 0.15s;border-bottom:1px solid ${t.itemBorder};position:relative}
        .notif-item:last-child{border-bottom:none}
        .notif-item:hover{background:${t.hover}}
        .notif-item.unread{background:${t.unreadBg}}
        .notif-item-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;margin-top:2px}
        .notif-item-body{flex:1;min-width:0}
        .notif-item-title{font-size:13px;font-weight:600;color:${t.text};margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .notif-item-msg{font-size:12px;color:${t.textMuted};line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .notif-item-time{font-size:10px;color:${t.textDim};margin-top:4px;font-family:'Space Mono',monospace}
        .notif-unread-dot{width:7px;height:7px;border-radius:50%;background:#1ec878;position:absolute;top:16px;right:12px;flex-shrink:0}
        .notif-del-btn{position:absolute;top:8px;right:8px;background:none;border:none;color:${t.textDim};font-size:14px;cursor:pointer;padding:2px 5px;border-radius:4px;transition:all 0.15s;opacity:0;line-height:1}
        .notif-item:hover .notif-del-btn{opacity:1}
        .notif-del-btn:hover{background:${dark?'rgba(255,107,107,0.15)':'rgba(224,49,49,0.1)'};color:${dark?'#ff6b6b':'#e03131'}}
        .notif-empty{padding:48px 20px;text-align:center}
        .notif-empty-icon{font-size:36px;margin-bottom:10px;opacity:0.3}
        .notif-empty-text{font-size:13px;color:${t.textMuted}}
        .notif-footer{padding:10px 16px;border-top:1px solid ${t.itemBorder};text-align:center;flex-shrink:0}
        .notif-footer-text{font-size:11px;color:${t.textDim}}
      `}</style>

      <div className="bell-wrap" ref={dropRef}>
        <button className={`bell-btn${unread>0?' has-notif':''}`} onClick={handleOpen} title="Notifications">
          🔔
          {unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
        </button>

        {open && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <div className="notif-header-left">
                <span className="notif-title">Notifications</span>
                {unread > 0 && <span className="notif-count-badge">{unread} new</span>}
              </div>
              <div className="notif-header-actions">
                {unread > 0 && <button className="btn-notif-action btn-read-all" onClick={handleReadAll}>✓ Read all</button>}
                {notifications.length > 0 && <button className="btn-notif-action btn-clear-all" onClick={handleClearAll}>Clear</button>}
              </div>
            </div>

            <div className="notif-list">
              {loading ? (
                <div className="notif-empty"><div className="notif-empty-icon">⏳</div><div className="notif-empty-text">Loading...</div></div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">
                  <div className="notif-empty-icon">🔔</div>
                  <div className="notif-empty-text">No notifications yet</div>
                </div>
              ) : notifications.map(n => {
                const icon  = NOTIF_ICONS[n.type]  || NOTIF_ICONS.DEFAULT;
                const color = NOTIF_COLORS[n.type] || NOTIF_COLORS.DEFAULT;
                return (
                  <div key={n.id} className={`notif-item${!n.isRead?' unread':''}`} onClick={()=>!n.isRead&&handleRead(n.id)}>
                    <div className="notif-item-icon" style={{background:`${color}18`,border:`1px solid ${color}30`}}>{icon}</div>
                    <div className="notif-item-body">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-msg">{n.message}</div>
                      <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div className="notif-unread-dot"/>}
                    <button className="notif-del-btn" onClick={(e)=>handleDelete(n.id,e)}>✕</button>
                  </div>
                );
              })}
            </div>

            {notifications.length > 0 && (
              <div className="notif-footer">
                <span className="notif-footer-text">{notifications.length} notification{notifications.length!==1?'s':''} total</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
