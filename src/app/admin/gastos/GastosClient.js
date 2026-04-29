'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createGasto, deleteGasto } from '@/actions/gastos';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function GastosClient({ gastos, total, pages, currentPage, search }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState(search);
  const [state, formAction, pending] = useActionState(createGasto, { errors: {}, success: false });

  if (state.success && showModal) { 
    setShowModal(false); 
    state.success = false; 
    toast.success('Gasto registrado con éxito');
  }

  const handleSearch = (e) => { e.preventDefault(); router.push(`/admin/gastos?search=${searchValue}`); };
  const handleDelete = async (id) => { 
    if (confirm('¿Eliminar este gasto?')) { 
      await deleteGasto(id); 
      toast.success('Gasto eliminado');
      router.refresh(); 
    } 
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Título y encabezado
    doc.setFontSize(18);
    doc.text("Reporte de Gastos Comunes", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-CL')}`, 14, 22);
    
    const tableColumn = ["Concepto", "Categoría", "Monto", "Proveedor", "Fecha"];
    const tableRows = gastos.map(g => [
      g.concepto, 
      g.categoria, 
      formatCurrency(g.monto), 
      g.proveedor || '-', 
      formatDate(g.fecha)
    ]);

    doc.autoTable({ 
      head: [tableColumn], 
      body: tableRows, 
      startY: 28,
      styles: { fontSize: 9 },
      headStyles: { fillStyle: 'bold', fillColor: [99, 102, 241] }
    });

    doc.save(`gastos_condominio_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte PDF descargado');
  };

  const exportToExcel = () => {
    const data = gastos.map(g => ({
      Concepto: g.concepto,
      Categoría: g.categoria,
      Monto: g.monto,
      Proveedor: g.proveedor || '-',
      Factura: g.factura || '-',
      Fecha: formatDate(g.fecha)
    }));
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Nuevo Gasto</button>
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
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>🗑️</button></td>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>➕ Nuevo Gasto</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Concepto *</label>
                  <input name="concepto" className="form-input" placeholder="Ej: Servicio de electricidad" required />
                  {state.errors?.concepto && <p className="form-error">{state.errors.concepto}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea name="descripcion" className="form-textarea" placeholder="Detalles del gasto..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto ($) *</label>
                    <input name="monto" type="number" step="0.01" className="form-input" placeholder="500.00" required />
                    {state.errors?.monto && <p className="form-error">{state.errors.monto}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input name="fecha" type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select name="categoria" className="form-select">
                      <option value="SERVICIOS">Servicios</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="SEGUROS">Seguros</option>
                      <option value="OTROS">Otros</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proveedor</label>
                    <input name="proveedor" className="form-input" placeholder="Nombre del proveedor" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">N° Factura</label>
                  <input name="factura" className="form-input" placeholder="FAC-001" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? '⏳ Guardando...' : '💾 Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
