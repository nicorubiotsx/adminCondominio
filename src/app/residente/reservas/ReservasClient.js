'use client';

import { useState, useActionState, useEffect } from 'react';
import { createReserva } from '@/actions/reservas';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils';
import { Calendar, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReservasClient({ reservas, areasComunes }) {
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, pending] = useActionState(createReserva, { success: false, errors: {} });

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setShowModal(false);
      state.success = false;
    }
  }, [state]);

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>🏊 Reservas de Áreas Comunes</h1>
          <p>Solicita el uso de quinchos, salas de eventos, etc.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Calendar size={18} /> Nueva Reserva
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="data-card">
          <div className="data-card-header">
            <h3>Mis Reservas</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {reservas.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Área Común</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.areaComun.nombre}</strong></td>
                      <td>{formatDate(r.fecha)}</td>
                      <td>{r.horaInicio} - {r.horaFin}</td>
                      <td>
                        <span className={`badge badge-${r.estado === 'APROBADA' ? 'success' : r.estado === 'PENDIENTE' ? 'warning' : 'danger'}`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No tienes reservas registradas.</p>
            )}
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>Áreas Disponibles</h3>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {areasComunes.length > 0 ? (
              areasComunes.map(a => (
                <div key={a.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', gap: '16px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{a.nombre}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{a.descripcion}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Capacidad: {a.capacidad || 'N/A'} pers.</span>
                      <span>Costo: {a.costoReserva > 0 ? formatCurrency(a.costoReserva) : 'Gratis'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No hay áreas comunes configuradas por administración.</p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Solicitar Reserva</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Área Común *</label>
                  <select name="areaComunId" className="form-select" required>
                    <option value="">Seleccionar área...</option>
                    {areasComunes.filter(a => a.activa).map(a => (
                      <option key={a.id} value={a.id}>{a.nombre} ({a.costoReserva > 0 ? formatCurrency(a.costoReserva) : 'Gratis'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" name="fecha" className="form-input" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hora Inicio *</label>
                    <input type="time" name="horaInicio" className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Fin *</label>
                    <input type="time" name="horaFin" className="form-input" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo de la reserva</label>
                  <input name="motivo" className="form-input" placeholder="Ej: Cumpleaños de mi hijo" />
                  {state.errors?.form && <p className="form-error">{state.errors.form}</p>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? 'Procesando...' : 'Solicitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
