'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createAnuncio, toggleAnuncio, deleteAnuncio } from '@/actions/anuncios';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function AnunciosClient({ anuncios, total, pages, currentPage }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, pending] = useActionState(createAnuncio, { errors: {}, success: false });

  if (state.success && showModal) { setShowModal(false); state.success = false; }

  const handleToggle = async (id) => { await toggleAnuncio(id); router.refresh(); };
  const handleDelete = async (id) => { if (confirm('¿Eliminar este anuncio?')) { await deleteAnuncio(id); router.refresh(); } };

  const prioridadColors = { BAJA: 'badge-default', NORMAL: 'badge-info', ALTA: 'badge-warning', URGENTE: 'badge-danger' };

  return (
    <>
      <div className="page-header">
        <div><h1>📢 Anuncios</h1><p>{total} anuncios en el sistema</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Nuevo Anuncio</button>
      </div>

      <div className="data-card">
        {anuncios.length > 0 ? (
          <>
            <table className="data-table">
              <thead><tr><th>Título</th><th>Prioridad</th><th>Autor</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead>
              <tbody>
                {anuncios.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.titulo}</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.contenido}
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${prioridadColors[a.prioridad]}`}>{a.prioridad}</span></td>
                    <td>{a.autor.nombre} {a.autor.apellido}</td>
                    <td><span className={`badge ${a.activo ? 'badge-success' : 'badge-default'}`}>{a.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td>{formatDateTime(a.createdAt)}</td>
                    <td>
                      <div className="action-btns">
                        <button className={`btn ${a.activo ? 'btn-warning' : 'btn-success'} btn-sm`} onClick={() => handleToggle(a.id)}>
                          {a.activo ? '⏸️' : '▶️'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="pagination">
                <Link href={`/admin/anuncios?page=${currentPage - 1}`} className="pagination-btn" style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.4 : 1 }}>← Anterior</Link>
                <span className="pagination-info">Página {currentPage} de {pages}</span>
                <Link href={`/admin/anuncios?page=${currentPage + 1}`} className="pagination-btn" style={{ pointerEvents: currentPage >= pages ? 'none' : 'auto', opacity: currentPage >= pages ? 0.4 : 1 }}>Siguiente →</Link>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="icon">📢</div><h3>No hay anuncios</h3><p>Crea el primer anuncio para los residentes</p></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>➕ Nuevo Anuncio</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input name="titulo" className="form-input" placeholder="Título del anuncio" required />
                  {state.errors?.titulo && <p className="form-error">{state.errors.titulo}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Contenido *</label>
                  <textarea name="contenido" className="form-textarea" placeholder="Contenido del anuncio..." style={{ minHeight: '150px' }} required />
                  {state.errors?.contenido && <p className="form-error">{state.errors.contenido}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prioridad *</label>
                    <select name="prioridad" className="form-select">
                      <option value="BAJA">Baja</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Expiración</label>
                    <input name="fechaFin" type="date" className="form-input" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? '⏳ Publicando...' : '📢 Publicar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
