'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEstadoVisita, registrarVisitaEspontanea } from '@/actions/conserjeria';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const estadoConfig = {
  PRE_AUTORIZADA: { label: 'Esperada', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  INGRESADA: { label: 'En Edificio', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  FINALIZADA: { label: 'Finalizada', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  RECHAZADA: { label: 'Rechazada', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  CANCELADA: { label: 'Cancelada', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

export default function ConserjeVisitasClient({ visitas, historial, residentes = [] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);
  const [tab, setTab] = useState('activas');
  const [showModal, setShowModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);

  const handleAction = async (id, estado) => {
    setLoadingId(id);
    const res = await updateEstadoVisita(id, estado);
    if (res.success) {
      toast.success(`Visita ${estado === 'INGRESADA' ? 'ingresada' : estado === 'FINALIZADA' ? 'finalizada' : 'rechazada'} correctamente`);
      router.refresh();
    } else {
      toast.error('Error al actualizar la visita');
    }
    setLoadingId(null);
  };

  const handleNuevaVisita = async (e) => {
    e.preventDefault();
    setSavingNew(true);
    const formData = new FormData(e.target);
    const res = await registrarVisitaEspontanea(formData);
    setSavingNew(false);
    if (res.success) {
      toast.success(res.message);
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>🚪 Control de Visitas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{visitas.length} visita(s) activa(s) ahora</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
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
          👤 Registrar Nuevo Ingreso
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ key: 'activas', label: `Activas (${visitas.length})` }, { key: 'historial', label: `Historial (${historial.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: tab === t.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border-color)',
            background: tab === t.key ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
            color: tab === t.key ? '#a5b4fc' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'activas' && (
        <>
          {visitas.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>🚪</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>No hay visitas activas ni esperadas en este momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visitas.map(v => {
                const cfg = estadoConfig[v.estado] || estadoConfig.PRE_AUTORIZADA;
                return (
                  <div key={v.id} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${cfg.color}`,
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{v.nombreVisitante}</strong>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        🏠 Depto <strong>{v.residente?.departamento?.numero || 'N/A'}</strong> — {v.residente?.nombre} {v.residente?.apellido}
                      </div>
                      {v.rutVisitante && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>RUT: {v.rutVisitante}</div>}
                      {v.patenteVehiculo && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🚗 Patente: {v.patenteVehiculo}</div>}
                      {v.notas && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>💬 {v.notas}</div>}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>📅 {formatDateTime(v.fechaEsperada)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {v.estado === 'PRE_AUTORIZADA' && (
                        <>
                          <button
                            disabled={loadingId === v.id}
                            onClick={() => handleAction(v.id, 'INGRESADA')}
                            style={{
                              padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                              color: '#10b981', cursor: 'pointer',
                            }}
                          >
                            ✅ Registrar Ingreso
                          </button>
                          <button
                            disabled={loadingId === v.id}
                            onClick={() => handleAction(v.id, 'RECHAZADA')}
                            style={{
                              padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#ef4444', cursor: 'pointer',
                            }}
                          >
                            ✕ Rechazar
                          </button>
                        </>
                      )}
                      {v.estado === 'INGRESADA' && (
                        <button
                          disabled={loadingId === v.id}
                          onClick={() => handleAction(v.id, 'FINALIZADA')}
                          style={{
                            padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#a5b4fc', cursor: 'pointer',
                          }}
                        >
                          🚪 Registrar Salida
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'historial' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Visitante', 'Depto', 'Fecha', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historial.map(v => {
                const cfg = estadoConfig[v.estado] || estadoConfig.FINALIZADA;
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{v.nombreVisitante}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>Depto {v.residente?.departamento?.numero || '-'}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>{formatDateTime(v.fechaEsperada)}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {historial.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay historial en los últimos 7 días.</div>
          )}
        </div>
      )}

      {/* Modal Nueva Visita */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>👤 Registrar Ingreso de Visita</h2>
            <form onSubmit={handleNuevaVisita}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Nombre del Visitante *
                </label>
                <input name="nombreVisitante" required placeholder="Juan Pérez" style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  RUT del Visitante
                </label>
                <input name="rutVisitante" placeholder="12.345.678-9" style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Residente de Destino *
                </label>
                <select name="residenteId" required style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
                  <option value="">Seleccionar residente...</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>
                      Depto {r.departamento?.numero} — {r.nombre} {r.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Patente (Opcional)</label>
                  <input name="patenteVehiculo" placeholder="ABCD-12" style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Notas</label>
                  <input name="notas" placeholder="Delivery, técnico, etc..." style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={savingNew} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {savingNew ? '⏳ Registrando...' : '✅ Registrar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
