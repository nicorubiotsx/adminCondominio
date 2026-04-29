'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotificaciones, markAsRead, markAllAsRead } from '@/actions/notificaciones';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationBell({ isResidente = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      const data = await getNotificaciones();
      setNotificaciones(data.notificaciones);
      setUnreadCount(data.unreadCount);
    };
    fetchNotifs();
    // En una app real, esto usaría WebSockets o polling. Por simplicidad, lo cargamos una vez.
  }, []);

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotificaciones(notificaciones.map(n => n.id === id ? { ...n, leida: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
    setUnreadCount(0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-secondary)', 
          cursor: 'pointer',
          position: 'relative',
          padding: '8px'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '320px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          marginTop: '8px',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Notificaciones</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer' }}>
                Marcar todas leídas
              </button>
            )}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notificaciones.length > 0 ? (
              notificaciones.map(n => (
                <div 
                  key={n.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: n.leida ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onClick={() => !n.leida && handleMarkRead(n.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: n.leida ? 'normal' : 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {n.titulo}
                    </span>
                    {!n.leida && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }}></span>}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{n.mensaje}</p>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDate(n.createdAt)}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No tienes notificaciones</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
