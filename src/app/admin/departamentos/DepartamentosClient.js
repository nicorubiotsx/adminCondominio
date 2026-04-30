'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createDepartamento, deleteDepartamento, updateDepartamento } from '@/actions/departamentos';
import Link from 'next/link';

export default function DepartamentosClient({ departamentos, total, pages, currentPage, search }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingDepto, setEditingDepto] = useState(null);
  const [searchValue, setSearchValue] = useState(search);
  
  const actionToUse = editingDepto 
    ? updateDepartamento.bind(null, editingDepto.id)
    : createDepartamento;

  const [state, formAction, pending] = useActionState(actionToUse, { errors: {}, success: false });

  if (state.success && showModal) { 
    setShowModal(false); 
    setEditingDepto(null);
    state.success = false; 
  }

  const handleSearch = (e) => { e.preventDefault(); router.push(`/admin/departamentos?search=${searchValue}`); };
  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este departamento?')) {
      const result = await deleteDepartamento(id);
      if (!result.success) alert(result.error);
      router.refresh();
    }
  };

  return (
    <>
      <div className="page-header">
        <div><h1>🏠 Departamentos</h1><p>{total} departamentos registrados</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Nuevo Departamento</button>
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Buscar por número o torre..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
        </form>
      </div>

      <div className="data-card">
        {departamentos.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr><th>Número</th><th>Piso</th><th>Torre</th><th>Tipo</th><th>M²</th><th>Alícuota</th><th>Estado</th><th>Residentes</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {departamentos.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.numero}</td>
                    <td>{d.piso}</td>
                    <td>{d.torre || '—'}</td>
                    <td><span className="badge badge-info">{d.tipo}</span></td>
                    <td>{d.metrosCuadrados ? `${d.metrosCuadrados}m²` : '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{d.alicuota}%</td>
                    <td>
                      <span className={`badge ${d.estado === 'OCUPADO' ? 'badge-success' : d.estado === 'DISPONIBLE' ? 'badge-info' : 'badge-warning'}`}>
                        {d.estado}
                      </span>
                    </td>
                    <td>{d.residentes?.length || 0}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingDepto(d); setShowModal(true); }}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="pagination">
                <Link href={`/admin/departamentos?page=${currentPage - 1}&search=${search}`} className="pagination-btn" style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.4 : 1 }}>← Anterior</Link>
                <span className="pagination-info">Página {currentPage} de {pages}</span>
                <Link href={`/admin/departamentos?page=${currentPage + 1}&search=${search}`} className="pagination-btn" style={{ pointerEvents: currentPage >= pages ? 'none' : 'auto', opacity: currentPage >= pages ? 0.4 : 1 }}>Siguiente →</Link>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="icon">🏠</div><h3>No hay departamentos</h3><p>Comienza agregando departamentos al sistema</p></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingDepto(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDepto ? '✏️ Editar Departamento' : '➕ Nuevo Departamento'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingDepto(null); }}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Número *</label>
                    <input name="numero" className="form-input" placeholder="101" defaultValue={editingDepto?.numero || ''} required />
                    {state.errors?.numero && <p className="form-error">{state.errors.numero}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Piso *</label>
                    <input name="piso" type="number" className="form-input" placeholder="1" defaultValue={editingDepto?.piso || ''} required />
                    {state.errors?.piso && <p className="form-error">{state.errors.piso}</p>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Torre</label>
                    <input name="torre" className="form-input" placeholder="A" defaultValue={editingDepto?.torre || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select name="tipo" className="form-select" defaultValue={editingDepto?.tipo || 'APARTAMENTO'}>
                      <option value="APARTAMENTO">Apartamento</option>
                      <option value="PENTHOUSE">Penthouse</option>
                      <option value="LOCAL">Local</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Metros²</label>
                    <input name="metrosCuadrados" type="number" step="0.01" className="form-input" placeholder="80" defaultValue={editingDepto?.metrosCuadrados || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alícuota %</label>
                    <input name="alicuota" type="number" step="0.01" className="form-input" placeholder="2.5" defaultValue={editingDepto?.alicuota || '0'} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Habitaciones</label>
                    <input name="habitaciones" type="number" className="form-input" placeholder="3" defaultValue={editingDepto?.habitaciones || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Baños</label>
                    <input name="banos" type="number" className="form-input" placeholder="2" defaultValue={editingDepto?.banos || ''} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select name="estado" className="form-select" defaultValue={editingDepto?.estado || 'DISPONIBLE'}>
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="OCUPADO">Ocupado</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label className="form-checkbox">
                      <input type="checkbox" name="estacionamiento" defaultChecked={editingDepto?.estacionamiento || false} />
                      <span>Tiene estacionamiento</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingDepto(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? '⏳ Guardando...' : '💾 Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
