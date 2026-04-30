'use client';

import { useState, useActionState } from 'react';
import { updateResidente, toggleResidenteStatus, resetPassword } from '@/actions/residentes';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ResidenteDetailClient({ residente, departamentos }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const updateWithId = updateResidente.bind(null, residente.id);
  const [state, formAction, pending] = useActionState(updateWithId, { errors: {}, success: false });

  if (state.success && editing) {
    setEditing(false);
    state.success = false;
  }

  const handleToggle = async () => {
    await toggleResidenteStatus(residente.id);
    router.refresh();
  };

  const handleResetPassword = async () => {
    if (confirm('¿Resetear la contraseña de este residente a su RUT?')) {
      const res = await resetPassword(residente.id);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👤 {residente.nombre} {residente.apellido}</h1>
          <p>Detalles del residente</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/admin/residentes" className="btn btn-secondary">← Volver</Link>
          <button className="btn btn-secondary" onClick={handleResetPassword} title="Resetear contraseña al RUT">🔑 Reset Clave</button>
          <button className="btn btn-primary" onClick={() => setEditing(!editing)}>
            {editing ? '✕ Cancelar' : '✏️ Editar'}
          </button>
          <button className={`btn ${residente.activo ? 'btn-danger' : 'btn-success'}`} onClick={handleToggle}>
            {residente.activo ? '⛔ Desactivar' : '✅ Activar'}
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="grid-2">
          <div className="data-card">
            <div className="data-card-header"><h3>📋 Información Personal</h3></div>
            <div className="detail-grid">
              <div className="detail-item"><label>Cédula</label><p>{residente.cedula}</p></div>
              <div className="detail-item"><label>Tipo</label><p><span className={`badge ${residente.tipo === 'PROPIETARIO' ? 'badge-info' : 'badge-default'}`}>{residente.tipo}</span></p></div>
              <div className="detail-item"><label>Nombre</label><p>{residente.nombre}</p></div>
              <div className="detail-item"><label>Apellido</label><p>{residente.apellido}</p></div>
              <div className="detail-item"><label>Teléfono</label><p>{residente.telefono}</p></div>
              <div className="detail-item"><label>Tel. Alternativo</label><p>{residente.telefonoAlt || '—'}</p></div>
              <div className="detail-item"><label>Email</label><p>{residente.email || '—'}</p></div>
              <div className="detail-item"><label>Estado</label><p><span className={`badge ${residente.activo ? 'badge-success' : 'badge-danger'}`}>{residente.activo ? 'Activo' : 'Inactivo'}</span></p></div>
              <div className="detail-item"><label>Departamento</label><p>{residente.departamento?.numero || 'Sin asignar'}</p></div>
              <div className="detail-item"><label>Fecha Ingreso</label><p>{formatDate(residente.fechaIngreso)}</p></div>
            </div>
            {residente.notas && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Notas</label>
                <p style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>{residente.notas}</p>
              </div>
            )}
          </div>

          <div>
            <div className="data-card" style={{ marginBottom: '24px' }}>
              <div className="data-card-header"><h3>💰 Últimos Pagos</h3></div>
              {residente.pagos?.length > 0 ? (
                <table className="data-table">
                  <thead><tr><th>Mes</th><th>Monto</th><th>Estado</th></tr></thead>
                  <tbody>
                    {residente.pagos.map((p) => (
                      <tr key={p.id}>
                        <td>{p.mesPago}</td>
                        <td>{formatCurrency(p.monto)}</td>
                        <td><span className={`badge ${p.estado === 'VERIFICADO' ? 'badge-success' : 'badge-warning'}`}>{p.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state"><p>Sin pagos registrados</p></div>
              )}
            </div>

            <div className="data-card">
              <div className="data-card-header"><h3>🔧 Solicitudes de Mantenimiento</h3></div>
              {residente.mantenimientos?.length > 0 ? (
                <table className="data-table">
                  <thead><tr><th>Título</th><th>Estado</th></tr></thead>
                  <tbody>
                    {residente.mantenimientos.map((m) => (
                      <tr key={m.id}>
                        <td>{m.titulo}</td>
                        <td><span className={`badge ${m.estado === 'COMPLETADO' ? 'badge-success' : 'badge-warning'}`}>{m.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state"><p>Sin solicitudes</p></div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="data-card">
          <div className="data-card-header"><h3>✏️ Editar Residente</h3></div>
          <form action={formAction}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">RUT *</label>
                  <input name="cedula" className="form-input" defaultValue={residente.cedula} required />
                  {state.errors?.cedula && <p className="form-error">{state.errors.cedula}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select name="tipo" className="form-select" defaultValue={residente.tipo}>
                    <option value="PROPIETARIO">Propietario</option>
                    <option value="INQUILINO">Inquilino</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input name="nombre" className="form-input" defaultValue={residente.nombre} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido *</label>
                  <input name="apellido" className="form-input" defaultValue={residente.apellido} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teléfono *</label>
                  <input name="telefono" className="form-input" defaultValue={residente.telefono} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tel. Alternativo</label>
                  <input name="telefonoAlt" className="form-input" defaultValue={residente.telefonoAlt || ''} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" type="email" className="form-input" defaultValue={residente.email || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <select name="departamentoId" className="form-select" defaultValue={residente.departamentoId || ''}>
                  <option value="">Sin asignar</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero} - Piso {d.piso}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea name="notas" className="form-textarea" defaultValue={residente.notas || ''} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
