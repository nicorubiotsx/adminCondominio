'use client'
import { createMantenimiento, updateMantenimientoEstado, deleteMantenimiento, updateMantenimiento } from '@/actions/mantenimiento';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Edit2, Play, CheckCircle, Ban, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useActionState, useState } from 'react';

export default function MantenimientoClient({ mantenimientos, residentes, departamentos, total, pages, currentPage, search }) {
  const router = useRouter;
  const [showModal, setShowModal] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const [searchValue, setSearchValue] = useState(search);

  const actionToUse = editingMantenimiento
    ? updateMantenimiento.bind(null, editingMantenimiento.id)
    : createMantenimiento;

  const [state, formAction, pending] = useActionState(actionToUse, { errors: {}, success: false });

  if (state.success && showModal) {
    setShowModal(false);
    setEditingMantenimiento(null);
    state.success = false;
    toast.success(editingMantenimiento ? 'Solicitud actualizada' : 'Solicitud creada exitosamente');
  }

  const handleSearch = (e) => { e.preventDefault(); router.push(`/admin/mantenimiento?search=${searchValue}`); };

  const handleUpdateEstado = async (id, estado) => {
    await updateMantenimientoEstado(id, estado);
    toast.success(`Estado actualizado a ${estado.replace('_', ' ')}`);
    router.refresh();
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta solicitud?')) {
      await deleteMantenimiento(id);
      toast.success('Solicitud eliminada');
      router.refresh();
    }
  };

  const handleEdit = (m) => {
    setEditingMantenimiento(m);
    setShowModal(true);
  };

  const estadoColors = { PENDIENTE: 'badge-warning', EN_PROGRESO: 'badge-info', COMPLETADO: 'badge-success', CANCELADO: 'badge-default' };
  const prioridadColors = { BAJA: 'badge-default', NORMAL: 'badge-info', ALTA: 'badge-warning', URGENTE: 'badge-danger' };

  return (
    <>
      <div className="page-header">
        <div><h1>🔧 Mantenimiento</h1><p>{total} solicitudes registradas</p></div>
        <button className="btn btn-primary" onClick={() => { setEditingMantenimiento(null); setShowModal(true); }}>➕ Nueva Solicitud</button>
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Buscar por título o categoría..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
        </form>
      </div>

      <div className="data-card">
        {mantenimientos.length > 0 ? (
          <>
            <table className="data-table">
              <thead><tr><th>Título</th><th>Categoría</th><th>Prioridad</th><th>Depto</th><th>Residente</th><th>Estado</th><th>Costo Est.</th><th>Fecha</th><th>Acciones</th></tr></thead>
              <tbody>
                {mantenimientos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.titulo}</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</div>
                      </div>
                    </td>
                    <td><span className="badge badge-default">{m.categoria}</span></td>
                    <td><span className={`badge ${prioridadColors[m.prioridad]}`}>{m.prioridad}</span></td>
                    <td>{m.departamento?.numero || '—'}</td>
                    <td>{m.residente ? `${m.residente.nombre} ${m.residente.apellido}` : '—'}</td>
                    <td><span className={`badge ${estadoColors[m.estado]}`}>{m.estado.replace('_', ' ')}</span></td>
                    <td>{m.costoEstimado ? formatCurrency(m.costoEstimado) : '—'}</td>
                    <td>{formatDate(m.createdAt)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(m)} title="Editar"><Edit2 size={14} /></button>
                        {m.estado === 'PENDIENTE' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleUpdateEstado(m.id, 'EN_PROGRESO')} title="Iniciar"><Play size={14} /></button>
                        )}
                        {m.estado === 'EN_PROGRESO' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleUpdateEstado(m.id, 'COMPLETADO')} title="Completar"><CheckCircle size={14} /></button>
                        )}
                        {(m.estado === 'PENDIENTE' || m.estado === 'EN_PROGRESO') && (
                          <button className="btn btn-warning btn-sm" onClick={() => handleUpdateEstado(m.id, 'CANCELADO')} title="Cancelar"><Ban size={14} /></button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="pagination">
                <Link href={`/admin/mantenimiento?page=${currentPage - 1}&search=${search}`} className="pagination-btn" style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.4 : 1 }}>← Anterior</Link>
                <span className="pagination-info">Página {currentPage} de {pages}</span>
                <Link href={`/admin/mantenimiento?page=${currentPage + 1}&search=${search}`} className="pagination-btn" style={{ pointerEvents: currentPage >= pages ? 'none' : 'auto', opacity: currentPage >= pages ? 0.4 : 1 }}>Siguiente →</Link>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="icon">🔧</div><h3>No hay solicitudes</h3><p>Registra la primera solicitud de mantenimiento</p></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingMantenimiento(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMantenimiento ? '✏️ Editar Solicitud' : '➕ Nueva Solicitud'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingMantenimiento(null); }}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input name="titulo" className="form-input" placeholder="Ej: Fuga en baño del piso 3" defaultValue={editingMantenimiento?.titulo || ''} required />
                  {state.errors?.titulo && <p className="form-error">{state.errors.titulo}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción *</label>
                  <textarea name="descripcion" className="form-textarea" placeholder="Describe el problema en detalle..." defaultValue={editingMantenimiento?.descripcion || ''} required />
                  {state.errors?.descripcion && <p className="form-error">{state.errors.descripcion}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select name="categoria" className="form-select" defaultValue={editingMantenimiento?.categoria || 'GENERAL'}>
                      <option value="GENERAL">General</option>
                      <option value="PLOMERIA">Plomería</option>
                      <option value="ELECTRICIDAD">Electricidad</option>
                      <option value="PINTURA">Pintura</option>
                      <option value="AREAS_COMUNES">Áreas Comunes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prioridad *</label>
                    <select name="prioridad" className="form-select" defaultValue={editingMantenimiento?.prioridad || 'NORMAL'}>
                      <option value="BAJA">Baja</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select name="estado" className="form-select" defaultValue={editingMantenimiento?.estado || 'PENDIENTE'}>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROGRESO">En Progreso</option>
                      <option value="COMPLETADO">Completado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Costo Estimado (CLP)</label>
                    <input name="costoEstimado" type="number" step="1" className="form-input" placeholder="10.000" defaultValue={editingMantenimiento?.costoEstimado || ''} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <select name="departamentoId" className="form-select" defaultValue={editingMantenimiento?.departamentoId || ''}>
                      <option value="">Áreas comunes</option>
                      {departamentos.map((d) => (
                        <option key={d.id} value={d.id}>{d.numero} - Piso {d.piso}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Residente Solicitante</label>
                    <select name="residenteId" className="form-select" defaultValue={editingMantenimiento?.residenteId || ''}>
                      <option value="">Sin asignar</option>
                      {residentes.filter(r => r.activo || r.id === editingMantenimiento?.residenteId).map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea name="notas" className="form-textarea" placeholder="Notas adicionales..." defaultValue={editingMantenimiento?.notas || ''} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingMantenimiento(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? '⏳ Guardando...' : (editingMantenimiento ? '💾 Guardar Cambios' : '💾 Crear Solicitud')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
