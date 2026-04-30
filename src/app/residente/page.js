import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getDeudaTotal } from '@/actions/finanzas';
import Link from 'next/link';
import { CreditCard, Wrench, Calendar, Bell, MessageSquare, Package, User } from 'lucide-react';

export default async function ResidenteDashboard() {
  const session = await getSession();

  // Obtener datos del residente
  const residente = await prisma.residente.findUnique({
    where: { id: session.userId },
    include: { departamento: true }
  });

  // Obtener estado financiero
  const deuda = residente.departamento ? await getDeudaTotal(residente.departamento.id) : 0;

  const pagos = await prisma.pago.findMany({
    where: { residenteId: session.userId },
    orderBy: { fechaPago: 'desc' },
    take: 5
  });

  const anuncios = await prisma.anuncio.findMany({
    where: { activo: true },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  const mantenimientos = await prisma.mantenimiento.findMany({
    where: { residenteId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  const proximasReservas = await prisma.reserva.findMany({
    where: { 
      residenteId: session.userId,
      fecha: { gte: new Date() },
      estado: { in: ['PENDIENTE', 'APROBADA'] }
    },
    include: { areaComun: true },
    orderBy: { fecha: 'asc' },
    take: 2
  });

  const encomiendasPendientes = await prisma.encomienda.count({
    where: { residenteId: session.userId, estado: 'EN_CONSERJERIA' }
  });

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ¡Hola, {session.nombre}!
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Bienvenido a tu portal de residente • Depto {session.departamento}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/residente/perfil" className="btn btn-secondary">
            <User size={18} /> Mi Perfil
          </Link>
          <Link href="/residente/pagos" className="btn btn-primary">
            <CreditCard size={18} /> Pagar Ahora
          </Link>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="stats-grid">
        <div className={`stat-card ${deuda > 0 ? 'red' : 'green'}`}>
          <div className="stat-card-header">
            <span className="stat-card-label">Balance de Depto</span>
            <div className="stat-card-icon"><CreditCard /></div>
          </div>
          <div className="stat-card-value">{formatCurrency(deuda)}</div>
          <div className="stat-card-sub">{deuda > 0 ? 'Tienes pagos pendientes' : 'Estás al día'}</div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-card-header">
            <span className="stat-card-label">Solicitudes de Mant.</span>
            <div className="stat-card-icon"><Wrench /></div>
          </div>
          <div className="stat-card-value">{mantenimientos.length}</div>
          <div className="stat-card-sub">Registradas recientemente</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Encomiendas</span>
            <div className="stat-card-icon"><Package /></div>
          </div>
          <div className="stat-card-value">{encomiendasPendientes}</div>
          <div className="stat-card-sub">{encomiendasPendientes > 0 ? 'Paquetes en conserjería' : 'Sin paquetes pendientes'}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-label">Prox. Reservas</span>
            <div className="stat-card-icon"><Calendar /></div>
          </div>
          <div className="stat-card-value">{proximasReservas.length}</div>
          <div className="stat-card-sub">En áreas comunes</div>
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Sección de Anuncios del Condominio */}
        <div className="data-card" style={{ gridColumn: '1 / -1' }}>
          <div className="data-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} color="var(--accent-warning)" /> Anuncios Importantes</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', padding: '1.5rem' }}>
            {anuncios.length > 0 ? (
              anuncios.map(anuncio => (
                <div key={anuncio.id} style={{ 
                  padding: '1.25rem', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, bottom: 0, 
                    width: '4px', 
                    backgroundColor: anuncio.prioridad === 'URGENTE' ? 'var(--accent-danger)' : 'var(--accent-primary)' 
                  }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{anuncio.titulo}</h4>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{formatDate(anuncio.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{anuncio.contenido}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No hay anuncios nuevos.</p>
            )}
          </div>
        </div>

        {/* Últimos Pagos */}
        <div className="data-card">
          <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>💰 Mis Últimos Pagos</h3>
            <Link href="/residente/pagos" className="btn btn-secondary btn-sm">Ver Todos</Link>
          </div>
          <div style={{ marginTop: '0' }}>
            {pagos.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map(pago => (
                    <tr key={pago.id}>
                      <td>{pago.mesPago}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(pago.monto)}</td>
                      <td>
                        <span className={`badge ${pago.estado === 'VERIFICADO' ? 'badge-success' : pago.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'}`}>
                          {pago.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No has registrado pagos recientemente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Solicitudes de Mantenimiento y Reservas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Mantenimientos */}
          <div className="data-card">
            <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🔧 Mis Solicitudes</h3>
              <Link href="/residente/mantenimiento" className="btn btn-secondary btn-sm">Ver Todas</Link>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {mantenimientos.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mantenimientos.map(m => (
                    <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: '14px' }}>{m.titulo}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(m.createdAt)}</p>
                      </div>
                      <span className={`badge ${
                        m.estado === 'PENDIENTE' ? 'badge-warning' : 
                        m.estado === 'EN_PROGRESO' ? 'badge-info' : 
                        m.estado === 'COMPLETADO' ? 'badge-success' : 'badge-default'
                      }`}>
                        {m.estado.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin solicitudes abiertas.</p>
              )}
            </div>
          </div>

          {/* Próximas Reservas */}
          <div className="data-card">
            <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🏊 Próximas Reservas</h3>
              <Link href="/residente/reservas" className="btn btn-secondary btn-sm">Nueva Reserva</Link>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {proximasReservas.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {proximasReservas.map(r => (
                    <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: 'var(--accent-secondary)' }}>{r.areaComun.nombre}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <Calendar size={12} /> {formatDate(r.fecha)} • <Clock size={12} /> {r.horaInicio}
                        </p>
                      </div>
                      <span className={`badge badge-${r.estado === 'APROBADA' ? 'success' : 'warning'}`}>
                        {r.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No tienes reservas próximamente.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

const Clock = ({ size }) => <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}><Calendar size={size} /></span>;
