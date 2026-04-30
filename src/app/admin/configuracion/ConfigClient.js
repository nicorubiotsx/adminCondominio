'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { updateConfiguracion } from '@/actions/configuracion';
import { generarDeudasMensuales } from '@/actions/finanzas';
import { createConserje, toggleConserjeActivo } from '@/actions/conserjes';
import { getCurrentMonth } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ConfigClient({ config, conserjes = [] }) {
  const [showConserjeModal, setShowConserjeModal] = useState(false);
  const [conserjeState, conserjeAction, conserjePending] = useActionState(createConserje, { success: false });
  const [state, formAction, pending] = useActionState(updateConfiguracion, { success: false });

  if (state.success) {
    state.success = false;
    toast.success(state.message);
  }

  if (conserjeState.success) {
    conserjeState.success = false;
    setShowConserjeModal(false);
    toast.success(conserjeState.message || 'Conserje creado exitosamente');
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>⚙️ Configuración</h1>
          <p>Ajustes generales del sistema y parámetros del condominio</p>
        </div>
      </div>

      <div className="data-card" style={{ maxWidth: '800px' }}>
        <form action={formAction}>
          <div className="modal-body">
            <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Datos del Condominio
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre del Condominio</label>
                <input name="nombreCondominio" className="form-input" defaultValue={config.nombreCondominio} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input name="telefono" className="form-input" defaultValue={config.telefono || ''} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <textarea name="direccion" className="form-textarea" defaultValue={config.direccion || ''} style={{ minHeight: '60px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Email de Contacto</label>
              <input name="emailContacto" type="email" className="form-input" defaultValue={config.emailContacto || ''} />
            </div>

            <h3 style={{ marginBottom: '16px', marginTop: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Configuración Financiera
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cuota Base Mensual (CLP)</label>
                <input name="cuotaBase" type="number" className="form-input" defaultValue={config.cuotaBase} required />
              </div>
              <div className="form-group">
                <label className="form-label">Días de Gracia (Morosidad)</label>
                <input name="diasMorosidad" type="number" className="form-input" defaultValue={config.diasMorosidad} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tasa de Mora (%)</label>
                <input name="tasaMora" type="number" className="form-input" defaultValue={config.tasaMora} />
              </div>
              <div className="form-group">
                <label className="form-label">Moneda Principal</label>
                <select name="moneda" className="form-select" defaultValue={config.moneda}>
                  <option value="CLP">Peso Chileno (CLP)</option>
                  <option value="USD">Dólar (USD)</option>
                </select>
              </div>
            </div>

            <h3 style={{ marginBottom: '16px', marginTop: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Datos Bancarios (Para transferencias)
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Banco</label>
                <input name="bancoNombre" className="form-input" defaultValue={config.bancoNombre || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Titular</label>
                <input name="bancoTitular" className="form-input" defaultValue={config.bancoTitular || ''} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cuenta</label>
                <input name="bancoCuenta" className="form-input" defaultValue={config.bancoCuenta || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">RUT</label>
                <input name="bancoRut" className="form-input" defaultValue={config.bancoRut || ''} />
              </div>
            </div>
          </div>
          
          <div className="modal-footer" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <div className="data-card" style={{ maxWidth: '800px', marginTop: '24px', border: '1px solid var(--primary-light)', backgroundColor: 'var(--bg-main)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>🚀 Acciones Administrativas</h3>
        <p style={{ fontSize: '14px', marginBottom: '20px' }}>
          Usa esta herramienta para generar las deudas mensuales de todos los departamentos. 
          Esto fijará el monto según la cuota base y alícuota actual para el mes seleccionado.
        </p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Mes a Facturar</label>
            <input type="month" id="mesFacturar" className="form-input" defaultValue={getCurrentMonth()} />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={async () => {
              const mes = document.getElementById('mesFacturar').value;
              if (!confirm(`¿Estás seguro de generar los cobros para ${mes}?`)) return;
              
              toast.loading('Generando cobros...', { id: 'gen-deudas' });
              const res = await generarDeudasMensuales(mes);
              if (res.success) {
                toast.success(res.message, { id: 'gen-deudas' });
              } else {
                toast.error(res.error, { id: 'gen-deudas' });
              }
            }}
          >
            📊 Generar Cobros del Mes
          </button>
        </div>
      </div>

      {/* Gestión de Conserjes */}
      <div className="data-card" style={{ maxWidth: '800px', marginTop: '24px' }}>
        <div className="data-card-header">
          <h3>👮 Usuarios Conserje</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowConserjeModal(true)}>
            + Nuevo Conserje
          </button>
        </div>
        {conserjes.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px' }}>
            <p>No hay conserjes registrados. Crea el primero.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {conserjes.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                  <td>{c.email}</td>
                  <td>
                    <span className={`badge ${c.activo ? 'badge-success' : 'badge-danger'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${c.activo ? 'btn-danger' : 'btn-success'}`}
                      onClick={async () => {
                        await toggleConserjeActivo(c.id);
                        toast.success('Estado actualizado');
                      }}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear conserje */}
      {showConserjeModal && (
        <div className="modal-overlay" onClick={() => setShowConserjeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👮 Nuevo Conserje</h2>
              <button className="modal-close" onClick={() => setShowConserjeModal(false)}>✕</button>
            </div>
            <form action={conserjeAction}>
              <div className="modal-body">
                {conserjeState.error && <p className="form-error" style={{ marginBottom: '12px' }}>{conserjeState.error}</p>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input name="nombre" className="form-input" required placeholder="Pedro" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input name="apellido" className="form-input" required placeholder="Gómez" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input name="email" type="email" className="form-input" required placeholder="conserje@condominio.cl" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña Inicial *</label>
                  <input name="password" type="password" className="form-input" required minLength={6} placeholder="Mínimo 6 caracteres" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConserjeModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={conserjePending}>
                  {conserjePending ? '⏳ Creando...' : '👮 Crear Conserje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
