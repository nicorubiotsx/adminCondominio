'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateAdminProfile, changeAdminPassword } from '@/actions/adminPerfil';
import toast from 'react-hot-toast';

export default function AdminPerfilClient({ user }) {
  const [profileState, profileAction, profilePending] = useActionState(updateAdminProfile, { success: false, errors: {} });
  const [passwordState, passwordAction, passwordPending] = useActionState(changeAdminPassword, { success: false, errors: {} });
  const passFormRef = useRef(null);

  if (profileState.success) {
    profileState.success = false;
    toast.success(profileState.message);
  }

  if (passwordState.success) {
    passwordState.success = false;
    toast.success(passwordState.message);
    if (passFormRef.current) {
      passFormRef.current.reset();
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>👤 Mi Perfil</h1>
          <p>Gestiona tu información personal y seguridad</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="data-card">
          <div className="data-card-header">
            <h3>Información Básica</h3>
          </div>
          <form action={profileAction} style={{ padding: '24px' }}>
            {profileState.errors?.general && (
              <div className="alert-banner alert-error">
                {profileState.errors.general}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input name="nombre" className="form-input" defaultValue={user.nombre} required />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input name="apellido" className="form-input" defaultValue={user.apellido} required />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input name="email" type="email" className="form-input" defaultValue={user.email} required />
              {profileState.errors?.email && <p className="form-error">{profileState.errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Rol del Sistema</label>
              <input type="text" className="form-input" defaultValue={user.rol} disabled style={{ backgroundColor: 'var(--bg-secondary)', opacity: 0.7 }} />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={profilePending}>
                {profilePending ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>Cambiar Contraseña</h3>
          </div>
          <form action={passwordAction} ref={passFormRef} style={{ padding: '24px' }}>
            {passwordState.errors?.general && (
              <div className="alert-banner alert-error">
                {passwordState.errors.general}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Contraseña Actual</label>
              <input name="currentPassword" type="password" className="form-input" required />
              {passwordState.errors?.currentPassword && <p className="form-error">{passwordState.errors.currentPassword}</p>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Nueva Contraseña</label>
              <input name="newPassword" type="password" className="form-input" required minLength={6} />
              {passwordState.errors?.newPassword && <p className="form-error">{passwordState.errors.newPassword}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Nueva Contraseña</label>
              <input name="confirmPassword" type="password" className="form-input" required />
              {passwordState.errors?.confirmPassword && <p className="form-error">{passwordState.errors.confirmPassword}</p>}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-warning" disabled={passwordPending}>
                {passwordPending ? '⏳ Actualizando...' : '🔐 Actualizar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
