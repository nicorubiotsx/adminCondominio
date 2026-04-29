import prisma from '@/lib/prisma';
import Link from 'next/link';
import ConserjeStatsCards from './ConserjeStatsCards';

export const metadata = { title: 'Inicio - Conserjería' };

export default async function ConserjeHomePage() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [visitasEsperadas, visitasActivas, paquetesPendientes, entregadosHoy] = await Promise.all([
    prisma.visita.count({ where: { estado: 'PRE_AUTORIZADA' } }),
    prisma.visita.count({ where: { estado: 'INGRESADA' } }),
    prisma.encomienda.count({ where: { estado: 'EN_CONSERJERIA' } }),
    prisma.encomienda.count({ 
      where: { 
        estado: 'ENTREGADA',
        fechaEntrega: { gte: hoy }
      } 
    }),
  ]);

  const cards = [
    {
      href: '/conserje/visitas',
      icon: '🚪',
      label: 'Visitas Esperadas',
      value: visitasEsperadas,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
      desc: 'Pre-autorizadas por residentes',
    },
    {
      href: '/conserje/visitas',
      icon: '✅',
      label: 'Personas en Edificio',
      value: visitasActivas,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.3)',
      desc: 'Visitas actualmente dentro',
    },
    {
      href: '/conserje/paquetes',
      icon: '📦',
      label: 'Paquetes Pendientes',
      value: paquetesPendientes,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
      border: 'rgba(99,102,241,0.3)',
      desc: 'En espera de retiro',
    },
    {
      href: '/conserje/paquetes',
      icon: '🚀',
      label: 'Entregados Hoy',
      value: entregadosHoy,
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.1)',
      border: 'rgba(6,182,212,0.3)',
      desc: 'Paquetes ya entregados',
    },
  ];

  return (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          👮 Panel de Conserjería
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tarjetas resumen */}
      <ConserjeStatsCards cards={cards} />

      {/* Acciones rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Link href="/conserje/visitas" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{ fontSize: '32px' }}>🚪</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Gestionar Visitas</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registrar ingresos y salidas</div>
            </div>
          </div>
        </Link>
        <Link href="/conserje/paquetes" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{ fontSize: '32px' }}>📦</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Gestionar Paquetes</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registrar y entregar encomiendas</div>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
