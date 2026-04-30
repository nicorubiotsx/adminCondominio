'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createGasto, deleteGasto, updateGasto } from '@/actions/gastos';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet, Edit2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import { generarDeudasMensuales } from '@/actions/finanzas';

export default function GastosClient({ gastos, total, pages, currentPage, search, montoTotal }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [searchValue, setSearchValue] = useState(search);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const handleGenerarCobros = async () => {
    if (!confirm(`¿Estás seguro de cerrar el mes y generar los cobros para todos los residentes basados en el total de ${formatCurrency(montoTotal)}?`)) return;
    
    setIsGenerating(true);
    const res = await generarDeudasMensuales(currentMonth);
    setIsGenerating(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error);
    }
  };
  const actionToUse = editingGasto
    ? updateGasto.bind(null, editingGasto.id)
    : createGasto;

  const [state, formAction, pending] = useActionState(actionToUse, { errors: {}, success: false });

  if (state.success && showModal) { 
    setShowModal(false); 
    setEditingGasto(null);
    state.success = false; 
    toast.success(editingGasto ? 'Gasto actualizado' : 'Gasto registrado con éxito');
  }

  const handleSearch = (e) => { e.preventDefault(); router.push(`/admin/gastos?search=${searchValue}`); };
  const handleDelete = async (id) => { 
    if (confirm('¿Eliminar este gasto?')) { 
      await deleteGasto(id); 
      toast.success('Gasto eliminado');
      router.refresh(); 
    } 
  };

  const handleEdit = (gasto) => {
    setEditingGasto(gasto);
    setShowModal(true);
  };
  
  // ... (exportToPDF and exportToExcel code remains same)
  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Gastos Comunes", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CL')}`, 14, 22);
    const tableColumn = ["Concepto", "Categoría", "Monto", "Proveedor", "Fecha"];
    const tableRows = gastos.map(g => [g.concepto, g.categoria, formatCurrency(g.monto), g.proveedor || '-', formatDate(g.fecha)]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 28, styles: { fontSize: 9 }, headStyles: { fillStyle: 'bold', fillColor: [99, 102, 241] } });
    doc.save(`gastos_condominio_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte PDF descargado');
  };

  const exportToExcel = () => {
    const data = gastos.map(g => ({ Concepto: g.concepto, Categoría: g.categoria, Monto: g.monto, Proveedor: g.proveedor || '-', Factura: g.factura || '-', Fecha: formatDate(g.fecha) }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos");
    XLSX.writeFile(workbook, `gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Reporte Excel descargado');
  };

  const categoriaColors = { SERVICIOS: 'badge-info', MANTENIMIENTO: 'badge-warning', PERSONAL: 'badge-success', SEGUROS: 'badge-default', OTROS: 'badge-default' };

  return (
    <>
      <div className="page-header">
        <div><h1>📋 Gastos Comunes</h1><p>{total} gastos registrados</p></div>
        <button className="btn btn-primary" onClick={() => { setEditingGasto(null); setShowModal(true); }}>➕ Nuevo Gasto</button>
      </div>

      <div className="dashboard-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Total a Recaudar (Mes Actual)</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>{formatCurrency(montoTotal)}</h2>
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))' }}
              onClick={handleGenerarCobros}
              disabled={isGenerating || montoTotal === 0}
            >
              {isGenerating ? '⏳ Procesando...' : '⚡ Cerrar Mes y Generar Cobros'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Se usará la alícuota de cada depto sobre el total de {formatCurrency(montoTotal)}.
            </p>
          </div>
        </div>
        
        <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Estado del Periodo</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: montoTotal > 0 ? '#fbbf24' : '#10b981' }}></div>
            <span style={{ fontWeight: 600 }}>{montoTotal > 0 ? 'Periodo Abierto' : 'Sin gastos registrados'}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Registra todos los gastos del edificio antes de generar los cobros.
          </p>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearch} className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Buscar por concepto, proveedor..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
        </form>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportToPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> PDF
          </button>
          <button onClick={exportToExcel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', borderColor: 'var(--success)' }}>
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
      </div>

      <div className="data-card">
        {gastos.length > 0 ? (
          <>
            <table className="data-table">
              <thead><tr><th>Concepto</th><th>Categoría</th><th>Monto</th><th>Proveedor</th><th>Factura</th><th>Fecha</th><th>Acciones</th></tr></thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{g.concepto}</span>
                        {g.descripcion && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{g.descripcion}</div>}
                      </div>
                    </td>
                    <td><span className={`badge ${categoriaColors[g.categoria] || 'badge-default'}`}>{g.categoria}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-danger)' }}>{formatCurrency(g.monto)}</td>
                    <td>{g.proveedor || '—'}</td>
                    <td>{g.factura || '—'}</td>
                    <td>{formatDate(g.fecha)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(g)} title="Editar"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="pagination">
                <Link href={`/admin/gastos?page=${currentPage - 1}&search=${search}`} className="pagination-btn" style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.4 : 1 }}>← Anterior</Link>
                <span className="pagination-info">Página {currentPage} de {pages}</span>
                <Link href={`/admin/gastos?page=${currentPage + 1}&search=${search}`} className="pagination-btn" style={{ pointerEvents: currentPage >= pages ? 'none' : 'auto', opacity: currentPage >= pages ? 0.4 : 1 }}>Siguiente →</Link>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="icon">📋</div><h3>No hay gastos</h3><p>Registra el primer gasto común</p></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingGasto(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGasto ? '✏️ Editar Gasto' : '➕ Nuevo Gasto'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditingGasto(null); }}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Concepto *</label>
                  <input name="concepto" className="form-input" placeholder="Ej: Servicio de electricidad" defaultValue={editingGasto?.concepto || ''} required />
                  {state.errors?.concepto && <p className="form-error">{state.errors.concepto}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea name="descripcion" className="form-textarea" placeholder="Detalles del gasto..." defaultValue={editingGasto?.descripcion || ''} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto (CLP) *</label>
                    <input name="monto" type="number" step="1" className="form-input" placeholder="50.000" defaultValue={editingGasto?.monto || ''} required />
                    {state.errors?.monto && <p className="form-error">{state.errors.monto}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input name="fecha" type="date" className="form-input" defaultValue={editingGasto?.fecha ? new Date(editingGasto.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select name="categoria" className="form-select" defaultValue={editingGasto?.categoria || 'SERVICIOS'}>
                      <option value="SERVICIOS">Servicios</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="SEGUROS">Seguros</option>
                      <option value="OTROS">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proveedor</label>
                    <input name="proveedor" className="form-input" placeholder="Nombre del proveedor" defaultValue={editingGasto?.proveedor || ''} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">N° Factura</label>
                  <input name="factura" className="form-input" placeholder="FAC-001" defaultValue={editingGasto?.factura || ''} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingGasto(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? '⏳ Guardando...' : (editingGasto ? '💾 Guardar Cambios' : '💾 Registrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
