'use client';

import { useState, useActionState } from 'react';
import { loginAction, loginResidenteAction } from '@/actions/auth';

const tabs = [
  { key: 'admin', label: '⚙️ Administrador', icon: '⚙️' },
  { key: 'conserje', label: '👮 Conserjería', icon: '👮' },
  { key: 'residente', label: '🏠 Residente', icon: '🏠' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('admin');

  const [adminState, adminAction, adminPending] = useActionState(loginAction, { errors: {}, success: false });
  const [conserjeState, conserjeAction, conserjePending] = useActionState(loginAction, { errors: {}, success: false });
  const [resState, resAction, resPending] = useActionState(loginResidenteAction, { errors: {}, success: false });

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '460px' }}>
        <div className="login-logo">
          <h1>🏢 CondoAdmin</h1>
          <p>Sistema de Gestión de Condominio</p>
        </div>

        {/* Tabs de 3 portales */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '28px',
          gap: '4px',
        }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '9px 6px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                transition: 'all 0.2s',
                background: tab === t.key
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'transparent',
                color: tab === t.key ? 'white' : 'var(--text-muted)',
                boxShadow: tab === t.key ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Portal ADMIN */}
        {tab === 'admin' && (
          <form action={adminAction}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '20px', padding: '12px 16px',
              background: 'rgba(99,102,241,0.08)', borderRadius: '8px',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <span style={{ fontSize: '20px' }}>⚙️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Portal Administrador</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Acceso completo al sistema</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">Correo Electrónico</label>
              <input id="admin-email" name="email" type="email" className="form-input" placeholder="admin@condominio.com" required />
              {adminState.errors?.email && <p className="form-error">{adminState.errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">Contraseña</label>
              <input id="admin-password" name="password" type="password" className="form-input" placeholder="••••••••" required />
              {adminState.errors?.password && <p className="form-error">{adminState.errors.password}</p>}
            </div>
            {adminState.errors?.email && adminState.errors.email.includes('nválidas') && (
              <p className="form-error" style={{ marginBottom: '10px' }}>{adminState.errors.email}</p>
            )}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={adminPending}>
              {adminPending ? '⏳ Ingresando...' : '🔐 Iniciar Sesión'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
              Credenciales por defecto: admin@condominio.com / admin123
            </p>
          </form>
        )}

        {/* Portal CONSERJE */}
        {tab === 'conserje' && (
          <form action={conserjeAction}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '20px', padding: '12px 16px',
              background: 'rgba(245,158,11,0.08)', borderRadius: '8px',
              border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <span style={{ fontSize: '20px' }}>👮</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Portal Conserjería</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Acceso a visitas y encomiendas</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conserje-email">Correo Electrónico</label>
              <input id="conserje-email" name="email" type="email" className="form-input" placeholder="conserje@condominio.cl" required />
              {conserjeState.errors?.email && <p className="form-error">{conserjeState.errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="conserje-password">Contraseña</label>
              <input id="conserje-password" name="password" type="password" className="form-input" placeholder="••••••••" required />
              {conserjeState.errors?.password && <p className="form-error">{conserjeState.errors.password}</p>}
            </div>
            <button type="submit" className="btn btn-lg btn-block" disabled={conserjePending} style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
            }}>
              {conserjePending ? '⏳ Ingresando...' : '👮 Entrar a Conserjería'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
              El administrador debe crear tu usuario en Configuración.
            </p>
          </form>
        )}

        {/* Portal RESIDENTE */}
        {tab === 'residente' && (
          <form action={resAction}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '20px', padding: '12px 16px',
              background: 'rgba(16,185,129,0.08)', borderRadius: '8px',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <span style={{ fontSize: '20px' }}>🏠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Portal Residente</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pagos, visitas y mantenimiento</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cedula">RUT</label>
              <input id="cedula" name="cedula" type="text" className="form-input" placeholder="12.345.678-9" required />
              {resState.errors?.cedula && <p className="form-error">{resState.errors.cedula}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="departamento">N° de Departamento</label>
              <input id="departamento" name="departamento" type="text" className="form-input" placeholder="Ej: 101" required />
              {resState.errors?.departamento && <p className="form-error">{resState.errors.departamento}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password-res">Contraseña</label>
              <input id="password-res" name="password" type="password" className="form-input" placeholder="••••••••" required />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Por defecto es su RUT sin puntos ni guión.</p>
            </div>
            {resState.errors?.general && <p className="form-error" style={{ marginBottom: '10px' }}>{resState.errors.general}</p>}
            <button type="submit" className="btn btn-lg btn-block" disabled={resPending} style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}>
              {resPending ? '⏳ Ingresando...' : '🏠 Entrar al Portal'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
              Ingrese su RUT registrado y el número de su departamento.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
