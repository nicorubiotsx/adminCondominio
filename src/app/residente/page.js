import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function ResidenteDashboard() {
  const session = await getSession();

  // Obtener estado financiero del residente
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

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>👋 Hola, {session.nombre}</h1>
          <p>Bienvenido a tu portal de residente. Depto {session.departamento}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* Sección de Anuncios del Condominio */}
        <div className="data-card" style={{ gridColumn: '1 / -1' }}>
          <div className="data-card-header">
            <h3>📢 Anuncios Importantes</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {anuncios.length > 0 ? (
              anuncios.map(anuncio => (
                <div key={anuncio.id} style={{ padding: '1rem', borderLeft: `4px solid ${anuncio.importante ? 'var(--danger)' : 'var(--primary)'}`, backgroundColor: 'var(--bg-main)', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{anuncio.titulo}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(anuncio.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px' }}>{anuncio.contenido}</p>
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
          <div style={{ marginTop: '1rem' }}>
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
                      <td style={{ fontWeight: 'bold' }}>{formatCurrency(pago.monto)}</td>
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
              <p style={{ color: 'var(--text-muted)' }}>No has registrado pagos recientemente.</p>
            )}
          </div>
        </div>

        {/* Solicitudes de Mantenimiento */}
        <div className="data-card">
          <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🔧 Mis Solicitudes</h3>
            <Link href="/residente/mantenimiento" className="btn btn-secondary btn-sm">Ver Todas</Link>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {mantenimientos.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mantenimientos.map(m => (
                  <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: 500 }}>{m.titulo}</p>
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
              <p style={{ color: 'var(--text-muted)' }}>No tienes solicitudes de mantenimiento abiertas.</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
