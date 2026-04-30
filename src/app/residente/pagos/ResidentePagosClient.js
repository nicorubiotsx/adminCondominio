'use client';

import { useState, useActionState, useEffect } from 'react';
import { createPago } from '@/actions/pagos';
import { createPaymentPreference } from '@/actions/checkout';
import { getDesgloseGastos } from '@/actions/finanzas';
import { formatCurrency, formatDate, getCurrentMonth } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CreditCard, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function ResidentePagosClient({ pagos, deudas = [], residenteId, departamentoId }) {
  // Estados de vista: 'LIST' o 'CHECKOUT'
  const [view, setView] = useState('LIST');
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showDesglose, setShowDesglose] = useState(false);
  const [desgloseData, setDesgloseData] = useState([]);
  const [loadingDesglose, setLoadingDesglose] = useState(false);
  const [onlineProcessing, setOnlineProcessing] = useState(false);
  const [state, formAction, pending] = useActionState(createPago, { errors: {}, success: false });

  useEffect(() => {
    if (state.success && view === 'CHECKOUT') {
      toast.success('Reporte enviado correctamente');
      setTimeout(() => window.location.reload(), 1500);
    }
  }, [state.success, view]);

  const handleStartCheckout = (debt) => {
    setSelectedDebt(debt);
    setView('CHECKOUT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerDesglose = async (mes) => {
    setLoadingDesglose(true);
    setShowDesglose(true);
    try {
      const data = await getDesgloseGastos(mes);
      setDesgloseData(data);
    } catch (error) {
      toast.error('No se pudo cargar el detalle');
    } finally {
      setLoadingDesglose(false);
    }
  };

  const handleOnlinePayment = async (formData) => {
    const monto = formData.get('monto');
    const mesPago = formData.get('mesPago');

    setOnlineProcessing(true);
    toast.loading('Conectando con pasarela de pago...', { id: 'mp' });

    try {
      const result = await createPaymentPreference({ monto, mesPago, departamentoId, residenteId });
      if (result.success && result.initPoint) {
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

  // PANTALLA DE CHECKOUT (TRASLADO DE INFORMACIÓN)
  if (view === 'CHECKOUT') {
    return (
      <div className="checkout-screen fade-in">
        <button className="btn-link" onClick={() => setView('LIST')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Volver a mis deudas
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Columna 1: Resumen del Pago */}
          <div>
            <div className="data-card" style={{ padding: '25px', borderLeft: '5px solid var(--primary)' }}>
              <h2 style={{ marginBottom: '20px' }}>Finalizar Pago</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Concepto:</span>
                  <span style={{ fontWeight: 600 }}>Gasto Común - {selectedDebt?.mes || 'Pago General'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Departamento:</span>
                  <span style={{ fontWeight: 600 }}>N° {departamentoId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(selectedDebt?.monto || 0)}</span>
                </div>
              </div>

              <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--primary)' }}>
                  <CreditCard size={20} /> Pago Automático (Recomendado)
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Usa Mercado Pago para pagar con Webpay o Tarjetas y que tu deuda se marque como pagada al instante.
                </p>
                <form action={handleOnlinePayment}>
                  <input type="hidden" name="monto" value={selectedDebt?.monto || 0} />
                  <input type="hidden" name="mesPago" value={selectedDebt?.mes || ''} />
                  <button type="submit" className="btn btn-primary btn-block" disabled={onlineProcessing} style={{ background: '#009ee3', borderColor: '#009ee3' }}>
                    {onlineProcessing ? 'Procesando...' : 'Pagar con Mercado Pago'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Columna 2: Reporte de Transferencia */}
          <div>
            <div className="data-card" style={{ padding: '25px' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} /> Reportar Transferencia
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Si ya hiciste una transferencia bancaria, ingresa el número de referencia aquí para que el administrador la verifique.
              </p>
              
              <form action={formAction}>
                <input type="hidden" name="residenteId" value={residenteId} />
                <input type="hidden" name="departamentoId" value={departamentoId} />
                <input type="hidden" name="monto" value={selectedDebt?.monto || 0} />
                <input type="hidden" name="mesPago" value={selectedDebt?.mes || ''} />

                <div className="form-group">
                  <label className="form-label">Método de Pago</label>
                  <select name="metodoPago" className="form-select">
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="DEPOSITO">Depósito en Efectivo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Número de Operación / Referencia</label>
                  <input name="referencia" type="text" className="form-input" placeholder="Ej: 12345678" required />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>* El número que aparece en tu comprobante bancario.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas (Opcional)</label>
                  <textarea name="notas" className="form-textarea" rows="3" placeholder="Mensaje para el administrador..." />
                </div>

                {state.errors?.general && <p className="form-error">{state.errors.general}</p>}

                <button type="submit" className="btn btn-secondary btn-block" disabled={pending || onlineProcessing} style={{ marginTop: '10px' }}>
                  {pending ? 'Enviando Reporte...' : 'Enviar Reporte de Transferencia'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA DE LISTA (PANTALLA PRINCIPAL)
  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>💳 Mis Pagos</h1>
          <p>Historial y gestión de gastos comunes</p>
        </div>
      </div>

      {deudas.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔔 Cuentas por Pagar
            <span className="badge badge-danger">{deudas.length}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {deudas.map((d) => (
              <div key={d.id} className="data-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-danger)', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Periodo: {d.mes}</h4>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Deuda Pendiente</p>
                  </div>
                  <span className="badge badge-warning">POR PAGAR</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(d.monto)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleVerDesglose(d.mes)}>
                      Ver Detalle
                    </button>
                    <button className="btn btn-primary" onClick={() => handleStartCheckout(d)}>
                      Pagar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Desglose de Gastos */}
      {showDesglose && (
        <div className="modal-overlay" onClick={() => setShowDesglose(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Detalle de Gastos - {desgloseData[0]?.fecha ? new Date(desgloseData[0].fecha).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Periodo'}</h2>
              <button className="modal-close" onClick={() => setShowDesglose(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingDesglose ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Cargando detalles...</div>
              ) : desgloseData.length > 0 ? (
                <>
                  <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    A continuación se detallan todos los gastos compartidos del edificio para este periodo. Tu cobro corresponde al porcentaje de alícuota de tu propiedad sobre este total.
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th>Categoría</th>
                        <th style={{ textAlign: 'right' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {desgloseData.map((g) => (
                        <tr key={g.id}>
                          <td>{g.concepto}</td>
                          <td><span className="badge badge-default">{g.categoria}</span></td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(g.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>TOTAL GASTOS COMUNES:</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {formatCurrency(desgloseData.reduce((acc, g) => acc + g.monto, 0))}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">No hay detalles disponibles para este periodo.</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDesglose(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

      <div className="data-card">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Historial de Reportes</span>
          <button className="btn btn-secondary btn-sm" onClick={() => handleStartCheckout(null)}>Reportar otro pago</button>
        </div>
        {pagos.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Monto G.C.</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.mesPago}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(p.monto)}</td>
                  <td>{p.metodoPago === 'EFECTIVO' ? 'Pago en Oficina' : p.metodoPago}</td>
                  <td><code>{p.referencia || '—'}</code></td>
                  <td>
                    <span className={`badge ${p.estado === 'VERIFICADO' ? 'badge-success' : p.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'}`}>
                      {p.estado === 'VERIFICADO' ? '✓ Verificado' : p.estado === 'PENDIENTE' ? '⏳ Pendiente' : '✕ Rechazado'}
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
            <h3>Sin movimientos</h3>
            <p>Tus pagos reportados aparecerán aquí.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .checkout-screen { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .btn-block { width: 100%; padding: 12px; border-radius: 8px; font-weight: 700; }
      `}</style>
    </div>
  );
}
