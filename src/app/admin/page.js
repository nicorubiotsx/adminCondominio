import { getDashboardStats } from '@/actions/dashboard';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

import DashboardCharts from './dashboard/DashboardCharts';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Vista general del condominio</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card indigo">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Residentes Activos</div>
              <div className="stat-card-value">{stats.totalResidentes}</div>
            </div>
            <div className="stat-card-icon">👥</div>
          </div>
          <div className="stat-card-sub">Registrados en el sistema</div>
        </div>

        <div className="stat-card cyan">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Departamentos</div>
              <div className="stat-card-value">{stats.totalDepartamentos}</div>
            </div>
            <div className="stat-card-icon">🏠</div>
          </div>
          <div className="stat-card-sub">Total de unidades</div>
        </div>

        <div className="stat-card green">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Ingresos del Mes</div>
              <div className="stat-card-value">{formatCurrency(stats.ingresosMes)}</div>
            </div>
            <div className="stat-card-icon">💰</div>
          </div>
          <div className="stat-card-sub">{stats.cantidadPagosMes} pagos recibidos</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Gastos del Mes</div>
              <div className="stat-card-value">{formatCurrency(stats.gastosMes)}</div>
            </div>
            <div className="stat-card-icon">📋</div>
          </div>
          <div className="stat-card-sub">{stats.cantidadGastosMes} gastos registrados</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Balance del Mes</div>
              <div className="stat-card-value">{formatCurrency(stats.balance)}</div>
            </div>
            <div className="stat-card-icon">📈</div>
          </div>
          <div className="stat-card-sub">Ingresos - Gastos</div>
        </div>

        <div className="stat-card red">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Pagos Pendientes</div>
              <div className="stat-card-value">{stats.pagosPendientes}</div>
            </div>
            <div className="stat-card-icon">⏳</div>
          </div>
          <div className="stat-card-sub">Por verificar</div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card green">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Pagos Verificados</div>
              <div className="stat-card-value">{stats.pagosVerificados}</div>
            </div>
            <div className="stat-card-icon">✅</div>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Mantenimiento</div>
              <div className="stat-card-value">{stats.mantenimientoPendiente}</div>
            </div>
            <div className="stat-card-icon">🔧</div>
          </div>
          <div className="stat-card-sub">Solicitudes activas</div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Anuncios Activos</div>
              <div className="stat-card-value">{stats.anunciosActivos}</div>
            </div>
            <div className="stat-card-icon">📢</div>
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
                      <span className={`badge ${m.prioridad === 'URGENTE' ? 'badge-danger' : m.prioridad === 'ALTA' ? 'badge-warning' : 'badge-info'}`}>
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
