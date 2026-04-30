import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Shield, User, Clock, Info } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Auditoría de Sistema - Admin' };

export default async function AuditoriaPage({ searchParams }) {
  const { search } = await searchParams;
  const session = await getSession();
  if (!session || session.rol !== 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const where = {};
  if (search) {
    where.OR = [
      { userEmail: { contains: search, mode: 'insensitive' } },
      { accion: { contains: search, mode: 'insensitive' } },
      { detalles: { contains: search, mode: 'insensitive' } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🛡️ Auditoría de Sistema</h1>
          <p>Registro histórico de acciones y eventos críticos</p>
        </div>
      </div>

      <div className="toolbar">
        <form className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            name="search" 
            type="text" 
            placeholder="Buscar por email, acción o detalles..." 
            defaultValue={search || ''} 
          />
          <button type="submit" className="btn btn-primary btn-sm" style={{ marginLeft: '8px' }}>Filtrar</button>
        </form>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>Últimos 50 eventos</h3>
        </div>
        <div className="data-table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Detalles</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} className="text-muted" />
                      {formatDate(log.createdAt)} {log.createdAt.toLocaleTimeString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{log.userEmail || 'Sistema'}</span>
                      <span className="badge badge-default" style={{ fontSize: '10px', width: 'fit-content' }}>{log.userType || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      log.accion.includes('LOGIN') ? 'badge-info' : 
                      log.accion.includes('ELIMINAR') ? 'badge-danger' : 
                      log.accion.includes('CREAR') ? 'badge-success' : 'badge-default'
                    }`}>
                      {log.accion}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{log.detalles}</td>
                  <td>
                    <pre style={{ fontSize: '10px', margin: 0, opacity: 0.7 }}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    No hay registros de auditoría aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
