'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/actions/auth';
import NotificationBell from '@/components/NotificationBell';
import { useDarkMode } from '@/hooks/useLocalStorage';

const menuItems = [
  { section: 'Principal', items: [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/reportes', label: 'Reportes', icon: '📈' },
  ]},
  { section: 'Gestión', items: [
    { href: '/admin/residentes', label: 'Residentes', icon: '👥' },
    { href: '/admin/departamentos', label: 'Departamentos', icon: '🏠' },
    { href: '/admin/pagos', label: 'Pagos', icon: '💰' },
    { href: '/admin/gastos', label: 'Gastos Comunes', icon: '📋' },
  ]},
  { section: 'Comunicación', items: [
    { href: '/admin/anuncios', label: 'Anuncios', icon: '📢' },
    { href: '/admin/mantenimiento', label: 'Mantenimiento', icon: '🔧' },
    { href: '/admin/muro', label: 'Muro Social', icon: '💬' },
  ]},
  { section: 'Servicios', items: [
    { href: '/admin/reservas', label: 'Áreas Comunes', icon: '🏊' },
    { href: '/admin/vehiculos', label: 'Vehículos', icon: '🚗' },
  ]},
  { section: 'Sistema', items: [
    { href: '/admin/perfil', label: 'Mi Perfil', icon: '👤' },
    { href: '/admin/auditoria', label: 'Auditoría', icon: '🛡️' },
    { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
  ]},
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const { isDark, toggle } = useDarkMode();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🏢 CondoAdmin</h2>
          <span>Panel de Administración</span>
        </div>
        <NotificationBell />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.nombre?.[0] || 'A'}
          </div>
          <div className="sidebar-user-info">
            <h4>{user?.nombre} {user?.apellido}</h4>
            <span>{user?.rol}</span>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-secondary btn-sm btn-block">
            🚪 Cerrar Sesión
          </button>
        </form>
        <button
          onClick={toggle}
          className="btn btn-secondary btn-sm btn-block"
          style={{ marginTop: '8px' }}
        >
          {isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </div>
    </aside>
  );
}
