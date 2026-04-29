'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createPago, updatePagoEstado, deletePago } from '@/actions/pagos';
import { formatCurrency, formatDate, getCurrentMonth } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { FileText } from 'lucide-react';

export default function PagosClient({ pagos, residentes, departamentos, total, pages, currentPage, search, filtroEstado }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState(search);
  const [state, formAction, pending] = useActionState(createPago, { errors: {}, success: false });

  if (state.success && showModal) { 
    setShowModal(false); 
    state.success = false; 
    toast.success('Pago registrado con éxito');
  }

  const handleSearch = (e) => { e.preventDefault(); router.push(`/admin/pagos?search=${searchValue}&estado=${filtroEstado}`); };
  const handleFilterEstado = (estado) => { router.push(`/admin/pagos?search=${search}&estado=${estado}`); };
  const handleUpdateEstado = async (id, estado) => { 
    await updatePagoEstado(id, estado); 
    toast.success(`Pago marcado como ${estado}`);
    router.refresh(); 
  };
  const handleDelete = async (id) => { 
    if (confirm('¿Eliminar este pago?')) { 
      await deletePago(id); 
      toast.success('Pago eliminado');
      router.refresh(); 
    } 
  };

  const generateReceipt = (pago) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("RECIBO DE PAGO - CONDOMINIO", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Recibo N°: ${pago.id.substring(0, 8).toUpperCase()}`, 20, 40);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 20, 50);
    
    doc.text(`Residente: ${pago.residente.nombre} ${pago.residente.apellido}`, 20, 70);
    doc.text(`Cédula: ${pago.residente.cedula}`, 20, 80);
    doc.text(`Departamento: ${pago.departamento.numero}`, 20, 90);
    
    doc.text(`Mes Correspondiente: ${pago.mesPago}`, 20, 110);
    doc.text(`Monto: $${pago.monto.toFixed(2)}`, 20, 120);
    doc.text(`Método de Pago: ${pago.metodoPago}`, 20, 130);
    doc.text(`Referencia: ${pago.referencia || 'N/A'}`, 20, 140);
    
    doc.text("¡Gracias por su pago puntual!", 105, 170, { align: "center" });
    
    doc.save(`Recibo_${pago.departamento.numero}_${pago.mesPago}.pdf`);
    toast.success('Recibo PDF generado');
  };

  const handleConciliacion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { read, utils } = await import('xlsx');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws);
        
        toast.success(`Leídas ${data.length} filas de la cartola. En un sistema real, aquí emparejaríamos el RUT de la transferencia con los residentes y marcaríamos pagos PENDIENTES como VERIFICADOS automáticamente.`);
        console.log("Cartola procesada:", data);
      } catch (err) {
        toast.error('Error al procesar el Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div className="page-header">
        <div><h1>💰 Pagos</h1><p>{total} pagos registrados</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} /> Subir Cartola (Excel)
            <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} onChange={handleConciliacion} />
          </label>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Nuevo Pago</button>
        </div>
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Buscar por referencia, residente o depto..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
        </form>
        <select className="form-select" style={{ width: '180px' }} value={filtroEstado} onChange={(e) => handleFilterEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VERIFICADO">Verificado</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
      </div>

      <div className="data-card">
        {pagos.length > 0 ? (
          <>
            <table className="data-table">
              <thead><tr><th>Residente</th><th>Depto</th><th>Mes</th><th>Monto</th><th>Método</th><th>Referencia</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.residente.nombre} {p.residente.apellido}</td>
                    <td>{p.departamento.numero}</td>
                    <td>{p.mesPago}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-success)' }}>{formatCurrency(p.monto)}</td>
                    <td><span className="badge badge-default">{p.metodoPago}</span></td>
                    <td>{p.referencia || '—'}</td>
                    <td>
                      <span className={`badge ${p.estado === 'VERIFICADO' ? 'badge-success' : p.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td>{formatDate(p.fechaPago)}</td>
                    <td>
                      <div className="action-btns">
                        {p.estado === 'PENDIENTE' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleUpdateEstado(p.id, 'VERIFICADO')} title="Verificar">✅</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleUpdateEstado(p.id, 'RECHAZADO')} title="Rechazar">❌</button>
                          </>
                        )}
                        {p.estado === 'VERIFICADO' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => generateReceipt(p)} title="Generar Recibo PDF" style={{ display: 'flex', alignItems: 'center' }}>
                            <FileText size={14} />
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="pagination">
                <Link href={`/admin/pagos?page=${currentPage - 1}&search=${search}&estado=${filtroEstado}`} className="pagination-btn" style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.4 : 1 }}>← Anterior</Link>
                <span className="pagination-info">Página {currentPage} de {pages}</span>
                <Link href={`/admin/pagos?page=${currentPage + 1}&search=${search}&estado=${filtroEstado}`} className="pagination-btn" style={{ pointerEvents: currentPage >= pages ? 'none' : 'auto', opacity: currentPage >= pages ? 0.4 : 1 }}>Siguiente →</Link>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><div className="icon">💰</div><h3>No hay pagos</h3><p>Registra el primer pago del condominio</p></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>➕ Registrar Pago</h2><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Residente *</label>
                    <select name="residenteId" className="form-select" required>
                      <option value="">Seleccionar...</option>
                      {residentes.filter(r => r.activo).map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre} {r.apellido} ({r.cedula})</option>
                      ))}
                    </select>
                    {state.errors?.residenteId && <p className="form-error">{state.errors.residenteId}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Departamento *</label>
                    <select name="departamentoId" className="form-select" required>
                      <option value="">Seleccionar...</option>
                      {departamentos.map((d) => (
                        <option key={d.id} value={d.id}>{d.numero} - Piso {d.piso}</option>
                      ))}
                    </select>
                    {state.errors?.departamentoId && <p className="form-error">{state.errors.departamentoId}</p>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto ($) *</label>
                    <input name="monto" type="number" step="0.01" className="form-input" placeholder="150.00" required />
                    {state.errors?.monto && <p className="form-error">{state.errors.monto}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mes de Pago *</label>
                    <input name="mesPago" type="month" className="form-input" defaultValue={getCurrentMonth()} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Método de Pago *</label>
                    <select name="metodoPago" className="form-select">
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="DEPOSITO">Depósito</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Referencia</label>
                    <input name="referencia" className="form-input" placeholder="Nro. de referencia" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea name="notas" className="form-textarea" placeholder="Observaciones..." />
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
