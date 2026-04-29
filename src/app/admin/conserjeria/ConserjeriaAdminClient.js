'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle, XCircle, Package, Plus, Truck } from 'lucide-react';
import { updateEstadoVisita, updateEstadoEncomienda, registrarEncomienda } from '@/actions/conserjeria';
import toast from 'react-hot-toast';

const estadoBadge = {
  PRE_AUTORIZADA: 'badge-warning',
  INGRESADA: 'badge-success',
  FINALIZADA: 'badge-default',
  RECHAZADA: 'badge-danger',
  CANCELADA: 'badge-danger',
  EN_CONSERJERIA: 'badge-warning',
  ENTREGADA: 'badge-success',
};

export default function ConserjeriaAdminClient({ visitas, encomiendas, departamentos }) {
  const router = useRouter();
  const [showEncomiendaModal, setShowEncomiendaModal] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [state, formAction, pending] = useActionState(registrarEncomienda, { success: false, error: null });

  if (state.success && showEncomiendaModal) {
    setShowEncomiendaModal(false);
    state.success = false;
    toast.success('Encomienda registrada exitosamente');
    router.refresh();
  }

  const handleVisita = async (id, estado) => {
    setLoadingId(id);
    const res = await updateEstadoVisita(id, estado);
    if (res.success) {
      toast.success(`Visita marcada como ${estado}`);
      router.refresh();
    } else {
      toast.error('Error al actualizar visita');
    }
    setLoadingId(null);
  };

  const handleEncomienda = async (id, estado) => {
    setLoadingId(id);
    const res = await updateEstadoEncomienda(id, estado);
    if (res.success) {
      toast.success('Encomienda marcada como entregada');
      router.refresh();
    } else {
      toast.error('Error al actualizar encomienda');
    }
    setLoadingId(null);
  };

  const visitasPendientes = visitas.filter(v => ['PRE_AUTORIZADA', 'INGRESADA'].includes(v.estado));
  const visitasHistorial = visitas.filter(v => ['FINALIZADA', 'RECHAZADA', 'CANCELADA'].includes(v.estado));
  const encomiendas_pendientes = encomiendas.filter(e => e.estado === 'EN_CONSERJERIA');
  const encomiendas_entregadas = encomiendas.filter(e => e.estado === 'ENTREGADA');

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>👮 Conserjería y Accesos</h1>
          <p>Control de visitas, ingresos y entrega de paquetes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowEncomiendaModal(true)}>
          <Package size={18} /> Registrar Paquete
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Visitas Esperadas</div>
              <div className="stat-card-value">{visitas.filter(v => v.estado === 'PRE_AUTORIZADA').length}</div>
            </div>
            <div className="stat-card-icon">🕐</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">En el edificio</div>
              <div className="stat-card-value">{visitas.filter(v => v.estado === 'INGRESADA').length}</div>
            </div>
            <div className="stat-card-icon">✅</div>
          </div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Paquetes Pendientes</div>
              <div className="stat-card-value">{encomiendas_pendientes.length}</div>
            </div>
            <div className="stat-card-icon">📦</div>
          </div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Entregados Hoy</div>
              <div className="stat-card-value">
                {encomiendas_entregadas.filter(e => {
                  const hoy = new Date().toDateString();
                  return new Date(e.fechaEntrega).toDateString() === hoy;
                }).length}
              </div>
            </div>
            <div className="stat-card-icon">🚀</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* VISITAS ACTIVAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="data-card">
            <div className="data-card-header">
              <h3>🚪 Visitas Activas / Esperadas</h3>
              <span className="badge badge-warning">{visitasPendientes.length} pendientes</span>
            </div>
            {visitasPendientes.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitante</th>
                    <th>Depto</th>
                    <th>Fecha Esperada</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visitasPendientes.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.nombreVisitante}</strong>
                        {v.rutVisitante && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RUT: {v.rutVisitante}</div>}
                        {v.patenteVehiculo && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🚗 {v.patenteVehiculo}</div>}
                      </td>
                      <td>{v.residente?.departamento?.numero || 'N/A'}</td>
                      <td>{formatDateTime(v.fechaEsperada)}</td>
                      <td><span className={`badge ${estadoBadge[v.estado] || 'badge-default'}`}>{v.estado.replace('_', ' ')}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {v.estado === 'PRE_AUTORIZADA' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                disabled={loadingId === v.id}
                                onClick={() => handleVisita(v.id, 'INGRESADA')}
                              >
                                ✅ Ingresar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                disabled={loadingId === v.id}
                                onClick={() => handleVisita(v.id, 'RECHAZADA')}
                              >
                                ✕ Rechazar
                              </button>
                            </>
                          )}
                          {v.estado === 'INGRESADA' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={loadingId === v.id}
                              onClick={() => handleVisita(v.id, 'FINALIZADA')}
                            >
                              🚪 Marcar Salida
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="icon">🚪</div>
                <p>No hay visitas pendientes o en curso.</p>
              </div>
            )}
          </div>

          {/* HISTORIAL VISITAS */}
          {visitasHistorial.length > 0 && (
            <div className="data-card">
              <div className="data-card-header">
                <h3>📋 Historial de Visitas Recientes</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitante</th>
                    <th>Depto</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visitasHistorial.slice(0, 10).map((v) => (
                    <tr key={v.id}>
                      <td>{v.nombreVisitante}</td>
                      <td>{v.residente?.departamento?.numero || '-'}</td>
                      <td>{formatDateTime(v.fechaEsperada)}</td>
                      <td><span className={`badge ${estadoBadge[v.estado] || 'badge-default'}`}>{v.estado.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAQUETES */}
        <div className="data-card" style={{ alignSelf: 'start' }}>
          <div className="data-card-header">
            <h3>📦 Paquetes en Conserjería</h3>
            <span className="badge badge-warning">{encomiendas_pendientes.length}</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {encomiendas_pendientes.length > 0 ? (
              encomiendas_pendientes.map(e => (
                <div key={e.id} style={{
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  borderLeft: '3px solid var(--accent-warning)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Truck size={14} style={{ color: 'var(--accent-warning)' }} />
                      <strong style={{ fontSize: '14px' }}>{e.empresaDelivery || 'Sin empresa'}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Depto {e.residente?.departamento?.numero || 'N/A'} — {e.residente?.nombre}
                    </div>
                    {e.descripcion && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{e.descripcion}</div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Recibido: {formatDateTime(e.fechaRecepcion)}
                    </div>
                  </div>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={loadingId === e.id}
                    onClick={() => handleEncomienda(e.id, 'ENTREGADA')}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    ✅ Entregar
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="icon">📦</div>
                <p>No hay paquetes pendientes.</p>
              </div>
            )}
          </div>

          {/* Entregados recientes */}
          {encomiendas_entregadas.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                Entregados recientemente
              </div>
              {encomiendas_entregadas.slice(0, 5).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <span>{e.residente?.nombre} — Depto {e.residente?.departamento?.numero}</span>
                  <span className="badge badge-success">Entregado</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR ENCOMIENDA */}
      {showEncomiendaModal && (
        <div className="modal-overlay" onClick={() => setShowEncomiendaModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📦 Registrar Nueva Encomienda</h2>
              <button className="modal-close" onClick={() => setShowEncomiendaModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Departamento Destinatario *</label>
                  <select name="departamentoId" className="form-select" required>
                    <option value="">Seleccionar departamento...</option>
                    {departamentos?.map(d => (
                      <option key={d.id} value={d.id}>
                        Depto {d.numero} — Piso {d.piso}{d.torre ? ` (Torre ${d.torre})` : ''}
                        {d.residentes?.[0] ? ` — ${d.residentes[0].nombre} ${d.residentes[0].apellido}` : ' (Sin residente)'}
                      </option>
                    ))}
                  </select>
                  {state.error && <p className="form-error">{state.error}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Empresa de Delivery</label>
                    <input name="empresaDelivery" className="form-input" placeholder="Ej: Chilexpress, Starken..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción del Paquete</label>
                    <input name="descripcion" className="form-input" placeholder="Ej: Caja mediana..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEncomiendaModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? '⏳ Registrando...' : '📦 Registrar Paquete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
