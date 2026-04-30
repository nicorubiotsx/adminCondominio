'use client';

import { useState, useActionState } from 'react';
import { createMantenimiento } from '@/actions/mantenimiento';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ResidenteMantenimientoClient({ mantenimientos, residenteId, departamentoId }) {
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, pending] = useActionState(createMantenimiento, { errors: {}, success: false });

  if (state.success && showModal) {
    setShowModal(false);
    state.success = false;
    toast.success('Solicitud enviada exitosamente.');
    setTimeout(() => window.location.reload(), 1500);
  }

  const estadoColors = { PENDIENTE: 'badge-warning', EN_PROGRESO: 'badge-info', COMPLETADO: 'badge-success', CANCELADO: 'badge-default' };
  const prioridadColors = { BAJA: 'badge-default', NORMAL: 'badge-info', ALTA: 'badge-warning', URGENTE: 'badge-danger' };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>🔧 Solicitudes de Mantenimiento</h1>
          <p>Reporta problemas en tu departamento o áreas comunes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Crear Solicitud
        </button>
      </div>

      <div className="data-card">
        {mantenimientos.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Título / Detalle</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha Reporte</th>
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.titulo}</span>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '300px' }}>
                        {m.descripcion}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-default">{m.categoria}</span></td>
                  <td><span className={`badge ${prioridadColors[m.prioridad]}`}>{m.prioridad}</span></td>
                  <td><span className={`badge ${estadoColors[m.estado]}`}>{m.estado.replace('_', ' ')}</span></td>
                  <td>{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">🔧</div>
            <h3>No tienes solicitudes activas</h3>
            <p>Si hay algún desperfecto, repórtalo aquí para que administración lo resuelva.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Reportar Problema</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              {/* Ocultos */}
              <input type="hidden" name="residenteId" value={residenteId} />
              <input type="hidden" name="departamentoId" value={departamentoId} />

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título del Problema *</label>
                  <input name="titulo" className="form-input" placeholder="Ej: Fuga de agua en lavaplatos" required />
                  {state.errors?.titulo && <p className="form-error">{state.errors.titulo}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción Detallada *</label>
                  <textarea name="descripcion" className="form-textarea" placeholder="Explica exactamente qué sucede..." required rows={4} />
                  {state.errors?.descripcion && <p className="form-error">{state.errors.descripcion}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select name="categoria" className="form-select">
                      <option value="GENERAL">General</option>
                      <option value="PLOMERIA">Plomería</option>
                      <option value="ELECTRICIDAD">Electricidad</option>
                      <option value="PINTURA">Pintura / Paredes</option>
                      <option value="AREAS_COMUNES">Áreas Comunes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgencia *</label>
                    <select name="prioridad" className="form-select">
                      <option value="BAJA">Puede esperar (Baja)</option>
                      <option value="NORMAL" selected>Normal</option>
                      <option value="ALTA">Afecta mi estadía (Alta)</option>
                      <option value="URGENTE">Emergencia (Urgente)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
