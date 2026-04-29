'use client';

import { useState, useActionState } from 'react';
import { createPago } from '@/actions/pagos';
import { createPaymentPreference } from '@/actions/checkout';
import { formatCurrency, formatDate, getCurrentMonth } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';

export default function ResidentePagosClient({ pagos, residenteId, departamentoId }) {
  const [showModal, setShowModal] = useState(false);
  const [onlineProcessing, setOnlineProcessing] = useState(false);
  const [state, formAction, pending] = useActionState(createPago, { errors: {}, success: false });

  if (state.success && showModal) { 
    setShowModal(false); 
    state.success = false; 
    toast.success('Pago reportado exitosamente. Esperando verificación.');
    setTimeout(() => window.location.reload(), 1500);
  }

  const handleOnlinePayment = async (e) => {
    e.preventDefault();
    const form = e.target.closest('form');
    if (!form.reportValidity()) {
      return;
    }

    const monto = form.monto.value;
    const mesPago = form.mesPago.value;

    setOnlineProcessing(true);
    toast.loading('Conectando con Mercado Pago...', { id: 'mp' });

    try {
      const result = await createPaymentPreference({ monto, mesPago, departamentoId, residenteId });
      
      if (result.success && result.initPoint) {
        toast.success('Redirigiendo a pago seguro...', { id: 'mp' });
        // Redirigir al usuario al flujo de pago de MercadoPago / Webpay
        window.location.href = result.initPoint;
      } else {
        toast.error(result.error || 'Error al iniciar el pago', { id: 'mp' });
        setOnlineProcessing(false);
      }
    } catch (error) {
      toast.error('Error de conexión', { id: 'mp' });
      setOnlineProcessing(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>💳 Mis Pagos</h1>
          <p>Historial de pagos de condominio</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Reportar o Pagar Online
        </button>
      </div>

      <div className="data-card">
        {pagos.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td>{p.mesPago}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(p.monto)}</td>
                  <td>{p.metodoPago}</td>
                  <td>{p.referencia || '—'}</td>
                  <td>
                    <span className={`badge ${p.estado === 'VERIFICADO' ? 'badge-success' : p.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td>{formatDate(p.fechaPago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">💳</div>
            <h3>No tienes pagos registrados</h3>
            <p>Reporta tu primer pago de condominio aquí.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Pagar Gastos Comunes</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              {/* Campos ocultos requeridos por la action */}
              <input type="hidden" name="residenteId" value={residenteId} />
              <input type="hidden" name="departamentoId" value={departamentoId} />
              
              <div className="modal-body">
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: 'var(--primary)' }}>Opción 1: Pagar Online Ahora</p>
                  <p style={{ margin: '0 0 15px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Paga de forma instantánea y segura usando Webpay Plus (Redcompra, Tarjeta de Crédito) o Mach mediante Mercado Pago. El pago se verificará automáticamente.
                  </p>
                  <button type="button" onClick={handleOnlinePayment} disabled={onlineProcessing || pending} className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', backgroundColor: '#009ee3', borderColor: '#009ee3' }}>
                    <CreditCard size={18} /> {onlineProcessing ? 'Conectando...' : 'Pagar Online (Webpay/Tarjetas)'}
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--bg-card)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px' }}>O REPORTAR PAGO PREVIO</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto (CLP) *</label>
                    <input name="monto" type="number" className="form-input" placeholder="Ej: 150000" required />
                    {state.errors?.monto && <p className="form-error">{state.errors.monto}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mes que Paga *</label>
                    <input name="mesPago" type="month" className="form-input" defaultValue={getCurrentMonth()} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Método de Pago *</label>
                    <select name="metodoPago" className="form-select">
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="EFECTIVO">Efectivo (Entregado a Adm.)</option>
                      <option value="TARJETA">Tarjeta / Punto de Venta local</option>
                      <option value="DEPOSITO">Depósito</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nro. Referencia *</label>
                    <input name="referencia" className="form-input" placeholder="Obligatorio para transferencias" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas Adicionales</label>
                  <textarea name="notas" className="form-textarea" placeholder="¿Algo que debamos saber sobre este pago?" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-secondary" disabled={pending || onlineProcessing}>
                  {pending ? '⏳ Enviando...' : '📤 Enviar Reporte Manual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
