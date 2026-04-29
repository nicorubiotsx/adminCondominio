'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createResidente, deleteResidente } from '@/actions/residentes';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSearchHistory, useLastDepartamento } from '@/hooks/useLocalStorage';

export default function ResidentesClient({ residentes, departamentos, total, pages, currentPage, search }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchValue, setSearchValue] = useState(search);
  const [state, formAction, pending] = useActionState(createResidente, { errors: {}, success: false });
  const { history, addSearch, clearHistory } = useSearchHistory('residente_search_history');
  const { last } = useLastDepartamento();

  if (state.success && showModal) {
    setShowModal(false);
    state.success = false;
    toast.success('Residente creado con éxito');
  }

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const tipo = document.getElementById('filtroTipo')?.value || '';
    const activo = document.getElementById('filtroActivo')?.value || '';
    if (searchValue.trim()) addSearch(searchValue.trim());
    setShowHistory(false);
    router.push(`/admin/residentes?search=${searchValue}&tipo=${tipo}&activo=${activo}`);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Desactivar este residente?')) {
      await deleteResidente(id);
      toast.success('Residente desactivado');
      router.refresh();
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👥 Residentes</h1>
          <p>{total} residentes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Nuevo Residente
        </button>
      </div>

      <div className="toolbar">
        {/* Buscador con historial */}
        <div style={{ position: 'relative', flex: 2, minWidth: '280px' }}>
          <form onSubmit={handleSearch} className="search-box" style={{ flex: 'unset', minWidth: 'unset', width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o teléfono..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            />
          </form>
          {showHistory && history.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', zIndex: 50, marginTop: '4px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Búsquedas recientes</span>
                <button style={{ fontSize: '11px', color: 'var(--accent-danger)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={clearHistory}>Limpiar</button>
              </div>
              {history.map((h, i) => (
                <button key={i} style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                }} onClick={() => { setSearchValue(h); handleSearch(); }}>
                  🔍 {h}
                </button>
              ))}
            </div>
          )}
        </div>
        <select id="filtroTipo" className="form-select" style={{ width: '150px' }} onChange={() => handleSearch()}>
          <option value="">Todos los Tipos</option>
          <option value="PROPIETARIO">Propietario</option>
          <option value="INQUILINO">Inquilino</option>
        </select>
        <select id="filtroActivo" className="form-select" style={{ width: '150px' }} onChange={() => handleSearch()}>
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <div className="data-card">
        {residentes.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Departamento</th>
                  <th>Estado</th>
                  <th>Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {residentes.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.cedula}</td>
                    <td>
                      <div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {r.nombre} {r.apellido}
                        </span>
                        {r.email && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.email}</div>
                        )}
                      </div>
                    </td>
                    <td>{r.telefono}</td>
                    <td>
                      <span className={`badge ${r.tipo === 'PROPIETARIO' ? 'badge-info' : 'badge-default'}`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td>{r.departamento?.numero || '—'}</td>
                    <td>
                      <span className={`badge ${r.activo ? 'badge-success' : 'badge-danger'}`}>
                        {r.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{formatDate(r.fechaIngreso)}</td>
                    <td>
                      <div className="action-btns">
                        <Link href={`/admin/residentes/${r.id}`} className="btn btn-secondary btn-sm">👁️</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div className="pagination">
                <Link
                  href={`/admin/residentes?page=${currentPage - 1}&search=${search}`}
                  className={`pagination-btn ${currentPage <= 1 ? 'disabled' : ''}`}
                  style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto' }}
                >
                  ← Anterior
                </Link>
                <span className="pagination-info">Página {currentPage} de {pages}</span>
                <Link
                  href={`/admin/residentes?page=${currentPage + 1}&search=${search}`}
                  className={`pagination-btn ${currentPage >= pages ? 'disabled' : ''}`}
                  style={{ pointerEvents: currentPage >= pages ? 'none' : 'auto' }}
                >
                  Siguiente →
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="icon">👥</div>
            <h3>No hay residentes</h3>
            <p>Comienza agregando el primer residente al sistema</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Nuevo Residente</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">RUT *</label>
                    <input name="cedula" className="form-input" placeholder="12.345.678-9" required />
                    {state.errors?.cedula && <p className="form-error">{state.errors.cedula}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select name="tipo" className="form-select" required>
                      <option value="PROPIETARIO">Propietario</option>
                      <option value="INQUILINO">Inquilino</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input name="nombre" className="form-input" placeholder="Juan" required />
                    {state.errors?.nombre && <p className="form-error">{state.errors.nombre}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input name="apellido" className="form-input" placeholder="Pérez" required />
                    {state.errors?.apellido && <p className="form-error">{state.errors.apellido}</p>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input name="telefono" className="form-input" placeholder="0414-1234567" required />
                    {state.errors?.telefono && <p className="form-error">{state.errors.telefono}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono Alt.</label>
                    <input name="telefonoAlt" className="form-input" placeholder="0212-1234567" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-input" placeholder="juan@email.com" />
                  {state.errors?.email && <p className="form-error">{state.errors.email}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <select name="departamentoId" className="form-select">
                    <option value="">Sin asignar</option>
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.numero} - Piso {d.piso} {d.torre ? `(Torre ${d.torre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea name="notas" className="form-textarea" placeholder="Observaciones adicionales..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? '⏳ Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
