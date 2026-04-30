import { Inter } from "next/font/google";
import "@/app/globals.css";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { LogOut, Home, CreditCard, Wrench, User as UserIcon, MessageSquare, Calendar, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import NotificationBell from "@/components/NotificationBell";
import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Portal Residente - CondoAdmin",
  description: "Portal de gestión para residentes del condominio",
};

export default async function ResidenteLayout({ children }) {
  const session = await getSession();

  return (
    <MobileNav>
      <div className={inter.className} style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
        {/* Sidebar para Residente */}
        <aside className="sidebar" style={{
          background: 'var(--gradient-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          width: '280px',
          position: 'fixed',
          height: '100vh'
        }}>
          <div className="sidebar-brand" style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{
                color: 'var(--accent-primary)',
                margin: 0,
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: 800,
                letterSpacing: '-0.5px'
              }}>
                <Home size={28} /> CondoAdmin
              </h2>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Portal Residente • Depto {session?.departamento}
              </p>
            </div>
            <NotificationBell isResidente={true} />
          </div>

          <nav className="sidebar-nav" style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link href="/residente" className="sidebar-link">
              <Home size={20} /> Inicio
            </Link>
            <Link href="/residente/perfil" className="sidebar-link">
              <UserIcon size={20} /> Mi Perfil
            </Link>
            <Link href="/residente/pagos" className="sidebar-link">
              <CreditCard size={20} /> Mis Pagos
            </Link>
            <Link href="/residente/mantenimiento" className="sidebar-link">
              <Wrench size={20} /> Mantenimiento
            </Link>

            <div style={{ margin: '1.5rem 0 0.5rem', padding: '0 1rem', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Comunidad</div>

            <Link href="/residente/muro" className="sidebar-link">
              <MessageSquare size={20} /> Muro Social
            </Link>
            <Link href="/residente/reservas" className="sidebar-link">
              <Calendar size={20} /> Reservas
            </Link>
            <Link href="/residente/conserjeria" className="sidebar-link">
              <ShieldCheck size={20} /> Conserjería
            </Link>
          </nav>

          <div className="sidebar-footer" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-color)' }}>
            <div className="sidebar-user" style={{ marginBottom: '1.25rem' }}>
              <div className="sidebar-avatar">
                {session?.nombre?.[0]}{session?.apellido?.[0]}
              </div>
              <div className="sidebar-user-info">
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{session?.nombre} {session?.apellido}</h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{session?.rol}</span>
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-danger btn-block btn-sm" style={{ gap: '0.5rem' }}>
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </form>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="main-content" style={{ flex: 1, marginLeft: '280px', backgroundColor: 'var(--bg-primary)', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </MobileNav>
  );
}
