import { Inter } from "next/font/google";
import "@/app/globals.css";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { LogOut, Home, CreditCard, Wrench, User as UserIcon } from "lucide-react";
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
          backgroundColor: 'var(--bg-card)', 
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Home /> Mi Condo
              </h2>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Depto: {session?.departamento}
              </p>
            </div>
            <NotificationBell isResidente={true} />
          </div>

          <nav style={{ padding: '2rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link href="/residente" className="nav-item">
              <Home size={20} /> Inicio
            </Link>
            <Link href="/residente/perfil" className="nav-item">
              <UserIcon size={20} /> Mi Perfil
            </Link>
            <Link href="/residente/pagos" className="nav-item">
              <CreditCard size={20} /> Mis Pagos
            </Link>
            <Link href="/residente/mantenimiento" className="nav-item">
              <Wrench size={20} /> Mantenimiento
            </Link>
            <div style={{ margin: '1rem 0 0.5rem', padding: '0 1rem', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Comunidad</div>
            <Link href="/residente/muro" className="nav-item">
              <span style={{ fontSize: '20px', lineHeight: 1 }}>💬</span> Muro Social
            </Link>
            <Link href="/residente/reservas" className="nav-item">
              <span style={{ fontSize: '20px', lineHeight: 1 }}>🏊</span> Reservas
            </Link>
            <Link href="/residente/conserjeria" className="nav-item">
              <span style={{ fontSize: '20px', lineHeight: 1 }}>👮</span> Conserjería
            </Link>
          </nav>

          <div style={{ padding: '2rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{session?.nombre} {session?.apellido}</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{session?.email || 'Residente'}</p>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </form>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </MobileNav>
  );
}
