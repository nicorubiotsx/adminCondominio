'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEstadoEncomienda, registrarEncomienda } from '@/actions/conserjeria';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ConserjePaquetesClient({ pendientes, entregados, departamentos }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);

  const handleEntregar = async (id) => {
    setLoadingId(id);
    const res = await updateEstadoEncomienda(id, 'ENTREGADA');
    if (res.success) {
      toast.success('✅ Paquete entregado y registrado correctamente');
      router.refresh();
    } else {
      toast.error('Error al registrar la entrega');
    }
    setLoadingId(null);
  };

  const handleNuevaPaquete = async (e) => {
    e.preventDefault();
    setSavingNew(true);
    const formData = new FormData(e.target);
    const res = await registrarEncomienda(formData);
    setSavingNew(false);
    if (res.success) {
      toast.success(res.message || 'Paquete registrado');
      setShowModal(false);
      router.refresh();
    } else {
      toast.error(res.error || 'Error al registrar');
    }
  };

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>📦 Paquetes y Encomiendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{pendientes.length} paquete(s) esperando retiro</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📦 Registrar Nuevo Paquete
        </button>
      </div>

      {/* Paquetes pendientes */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        ⏳ Pendientes de Retiro
      </h2>

      {pendientes.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '50px', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', opacity: 0.4, marginBottom: '12px' }}>📦</div>
          <p style={{ color: 'var(--text-muted)' }}>No hay paquetes pendientes de entrega.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {pendientes.map(e => (
            <div key={e.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px' }}>📦</div>
                <span style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                  EN CONSERJERÍA
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Depto {e.residente?.departamento?.numero || 'N/A'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {e.residente?.nombre} {e.residente?.apellido}
              </div>
              {e.empresaDelivery && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  🚚 {e.empresaDelivery}
                </div>
              )}
              {e.descripcion && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  📝 {e.descripcion}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Recibido: {formatDateTime(e.fechaRecepcion)}
              </div>

              <button
                disabled={loadingId === e.id}
                onClick={() => handleEntregar(e.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {loadingId === e.id ? '⏳ Procesando...' : '✅ Entregar al Residente'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Entregados recientes */}
      {entregados.length > 0 && (
        <>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ✅ Entregados (últimos 3 días)
          </h2>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['Depto', 'Residente', 'Empresa', 'Entregado'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entregados.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Depto {e.residente?.departamento?.numero || '-'}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{e.residente?.nombre}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>{e.empresaDelivery || '—'}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>{e.fechaEntrega ? formatDateTime(e.fechaEntrega) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal nuevo paquete */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>📦 Registrar Nuevo Paquete</h2>
            <form onSubmit={handleNuevaPaquete}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Departamento Destinatario *
                </label>
                <select name="departamentoId" required style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
                  <option value="">Seleccionar departamento...</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>
                      Depto {d.numero}{d.residentes?.[0] ? ` — ${d.residentes[0].nombre} ${d.residentes[0].apellido}` : ' (Sin residente)'}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Empresa de Delivery</label>
                  <input name="empresaDelivery" placeholder="Chilexpress, Starken..." style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Descripción</label>
                  <input name="descripcion" placeholder="Caja pequeña, sobre..." style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={savingNew} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {savingNew ? '⏳ Registrando...' : '📦 Registrar Paquete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
