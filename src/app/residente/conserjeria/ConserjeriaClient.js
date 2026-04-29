'use client';

import { useState, useActionState, useEffect } from 'react';
import { createVisita, deleteVisita } from '@/actions/conserjeria';
import { formatDateTime } from '@/lib/utils';
import { UserCheck, Trash2, Package, Car } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConserjeriaClient({ visitas, encomiendas }) {
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, pending] = useActionState(createVisita, { success: false, errors: {} });

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setShowModal(false);
      state.success = false;
    }
  }, [state]);

  const handleDelete = async (id) => {
    if (confirm('¿Cancelar autorización de esta visita?')) {
      const result = await deleteVisita(id);
      if (result.success) toast.success('Autorización cancelada');
    }
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>👮 Conserjería</h1>
          <p>Autoriza visitas y revisa tus encomiendas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserCheck size={18} /> Pre-autorizar Visita
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="data-card">
          <div className="data-card-header">
            <h3>Mis Visitas Autorizadas</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {visitas.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitante</th>
                    <th>Fecha Esperada</th>
                    <th>Estado</th>
                    <th>Opciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visitas.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.nombreVisitante}</strong>
                        {v.patenteVehiculo && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}><Car size={12}/> {v.patenteVehiculo}</div>}
                      </td>
                      <td>{formatDateTime(v.fechaEsperada)}</td>
                      <td>
                        <span className={`badge badge-${v.estado === 'PRE_AUTORIZADA' ? 'warning' : v.estado === 'INGRESADA' ? 'success' : 'default'}`}>
                          {v.estado}
                        </span>
                      </td>
                      <td>
                        {v.estado === 'PRE_AUTORIZADA' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(v.id)}>
                            <Trash2 size={16} color="var(--danger)" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No tienes visitas autorizadas próximamente.</p>
            )}
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>Mis Encomiendas</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {encomiendas.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {encomiendas.map(e => (
                  <div key={e.id} style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: e.estado === 'EN_CONSERJERIA' ? 'var(--warning)' : 'var(--success)', color: 'white', borderRadius: '50%' }}>
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>{e.empresaDelivery || 'Paquete'}</h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{e.descripcion}</p>
                      <span className={`badge badge-${e.estado === 'EN_CONSERJERIA' ? 'warning' : 'success'}`}>
                        {e.estado.replace('_', ' ')}
                      </span>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Recibido: {formatDateTime(e.fechaRecepcion)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No tienes paquetes en conserjería.</p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Autorizar Nueva Visita</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Visitante *</label>
                  <input name="nombreVisitante" className="form-input" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">RUT / Pasaporte</label>
                    <input name="rutVisitante" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Patente (Si viene en auto)</label>
                    <input name="patenteVehiculo" className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha y Hora Esperada *</label>
                  <input type="datetime-local" name="fechaEsperada" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas Adicionales</label>
                  <input name="notas" className="form-input" placeholder="Ej: Viene a reparar la lavadora" />
                  {state.errors?.form && <p className="form-error">{state.errors.form}</p>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? 'Procesando...' : 'Autorizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
