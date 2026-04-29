'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/actions/auth';

export default function ConserjeNav({ user }) {
  const pathname = usePathname();

  const links = [
    { href: '/conserje', label: '🏠 Inicio', exact: true },
    { href: '/conserje/visitas', label: '🚪 Visitas' },
    { href: '/conserje/paquetes', label: '📦 Paquetes' },
  ];

  return (
    <header style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      borderBottom: '1px solid rgba(99,102,241,0.3)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div>
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a5b4fc, #67e8f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            👮 Conserjería
          </span>
        </div>

        {/* Links de navegación */}
        <nav style={{ display: 'flex', gap: '4px' }}>
          {links.map(link => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive ? 'rgba(165,180,252,0.2)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.7)',
                  border: isActive ? '1px solid rgba(165,180,252,0.3)' : '1px solid transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Usuario y logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
            {user?.nombre} {user?.apellido}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Conserje
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🚪 Salir
          </button>
        </form>
      </div>
    </header>
  );
}
