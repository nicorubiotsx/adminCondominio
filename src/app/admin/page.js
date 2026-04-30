import { getDashboardStats } from '@/actions/dashboard';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import './admin-dashboard.css';
import DashboardCharts from './dashboard/DashboardCharts';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Panel de Control</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>Bienvenido al centro de mando de tu condominio</p>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS - PREMIUM UI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '2.5rem' }}>
        <Link href="/admin/pagos" className="action-button" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
          <span style={{ fontSize: '1.5rem' }}>💰</span>
          <div>
            <div style={{ fontWeight: 700 }}>Registrar Pago</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Nuevo ingreso manual</div>
          </div>
        </Link>
        <Link href="/admin/anuncios" className="action-button" style={{ backgroundColor: 'var(--accent-indigo)', color: 'white' }}>
          <span style={{ fontSize: '1.5rem' }}>📢</span>
          <div>
            <div style={{ fontWeight: 700 }}>Nuevo Anuncio</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Notificar residentes</div>
          </div>
        </Link>
        <Link href="/admin/mantenimiento" className="action-button" style={{ backgroundColor: 'var(--accent-amber)', color: 'white' }}>
          <span style={{ fontSize: '1.5rem' }}>🔧</span>
          <div>
            <div style={{ fontWeight: 700 }}>Mantención</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Solicitud técnica</div>
          </div>
        </Link>
        <Link href="/admin/residentes" className="action-button" style={{ backgroundColor: 'var(--accent-cyan)', color: 'white' }}>
          <span style={{ fontSize: '1.5rem' }}>👤</span>
          <div>
            <div style={{ fontWeight: 700 }}>Residentes</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Gestionar accesos</div>
          </div>
        </Link>
      </div>

      {/* ALERTAS CRÍTICAS */}
      {stats.pagosPendientes > 0 && (
        <div className="alert-banner fade-in" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '2rem', animation: 'pulse 2s infinite' }}>🔔</div>
            <div>
              <h3 style={{ margin: 0 }}>Atención: Pagos por Verificar</h3>
              <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Tienes <strong>{stats.pagosPendientes}</strong> pagos reportados por residentes esperando tu revisión.</p>
            </div>
          </div>
          <Link href="/admin/pagos?estado=PENDIENTE" className="btn btn-primary" style={{ backgroundColor: 'white', color: 'var(--accent-danger)', border: 'none' }}>Revisar Ahora</Link>
        </div>
      )}

      {/* MÉTRICAS PRINCIPALES */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card indigo-glass">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Balance General</div>
              <div className="stat-card-value" style={{ fontSize: '2.2rem' }}>{formatCurrency(stats.balance)}</div>
            </div>
            <div className="stat-card-icon">🏛️</div>
          </div>
          <div className="stat-card-sub">Utilidad neta del mes</div>
        </div>

        <div className="stat-card green-glass">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Ingresos Mensuales</div>
              <div className="stat-card-value">{formatCurrency(stats.ingresosMes)}</div>
            </div>
            <div className="stat-card-icon">↗️</div>
          </div>
          <div className="stat-card-sub">{stats.cantidadPagosMes} pagos verificados</div>
        </div>

        <div className="stat-card red-glass">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Gastos Mensuales</div>
              <div className="stat-card-value">{formatCurrency(stats.gastosMes)}</div>
            </div>
            <div className="stat-card-icon">↘️</div>
          </div>
          <div className="stat-card-sub">{stats.cantidadGastosMes} facturas pagadas</div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
        <div className="stat-card-mini">
          <span className="mini-icon">👥</span>
          <div>
            <div className="mini-label">Residentes</div>
            <div className="mini-value">{stats.totalResidentes}</div>
          </div>
        </div>
        <div className="stat-card-mini">
          <span className="mini-icon">🏠</span>
          <div>
            <div className="mini-label">Deptos</div>
            <div className="mini-value">{stats.totalDepartamentos}</div>
          </div>
        </div>
        <div className="stat-card-mini">
          <span className="mini-icon">🔧</span>
          <div>
            <div className="mini-label">Solicitudes</div>
            <div className="mini-value">{stats.mantenimientoPendiente}</div>
          </div>
        </div>
        <div className="stat-card-mini">
          <span className="mini-icon">📢</span>
          <div>
            <div className="mini-label">Anuncios</div>
            <div className="mini-value">{stats.anunciosActivos}</div>
          </div>
        </div>
      </div>

      {/* AQUÍ AGREGAMOS EL GRÁFICO */}
      <DashboardCharts data={stats.chartData} balance={stats.balance} />

      <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
        <div className="data-card">
          <div className="data-card-header">
            <h3>💰 Últimos Pagos</h3>
            <Link href="/admin/pagos" className="btn btn-secondary btn-sm">Ver todos</Link>
          </div>
          {stats.ultimosPagos.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Residente</th>
                  <th>Depto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosPagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.residente.nombre} {pago.residente.apellido}</td>
                    <td>{pago.departamento.numero}</td>
                    <td>{formatCurrency(pago.monto)}</td>
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
            <div className="empty-state">
              <p>No hay pagos registrados</p>
            </div>
          )}
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>🔧 Solicitudes Recientes</h3>
            <Link href="/admin/mantenimiento" className="btn btn-secondary btn-sm">Ver todas</Link>
          </div>
          {stats.ultimosMantenimientos.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Depto</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosMantenimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{m.titulo}</td>
                    <td>{m.departamento?.numero || '-'}</td>
                    <td>
                      <span className={`badge ${m.prioridad === 'URGENTE' ? 'badge-danger' : m.prioridad === 'ALTA' ? 'badge-warning' : m.prioridad === 'ALTA' ? 'badge-warning' : 'badge-info'}`}>
                        {m.prioridad}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${m.estado === 'COMPLETADO' ? 'badge-success' : m.estado === 'EN_PROGRESO' ? 'badge-info' : 'badge-warning'}`}>
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No hay solicitudes</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
