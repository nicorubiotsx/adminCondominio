'use client';

import { useState, useActionState, useEffect } from 'react';
import { unifiedLoginAction, checkRut, createPassword, recoverPassword } from '@/actions/auth';

export default function LoginPage() {
  // UI states
  const [isActivating, setIsActivating] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [detectedType, setDetectedType] = useState('UNKNOWN'); // UNKNOWN, RESIDENT, STAFF
  
  // Login state
  const [loginState, loginAction, loginPending] = useActionState(unifiedLoginAction, { errors: {}, success: false });

  // Activation states
  const [activationStep, setActivationStep] = useState(1);
  const [activationRut, setActivationRut] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Identificador (Email o RUT)
  const [identifier, setIdentifier] = useState('');

  // Efecto para detectar tipo mientras escribe
  useEffect(() => {
    if (!identifier) {
      setDetectedType('UNKNOWN');
      return;
    }

    if (identifier.includes('@')) {
      setDetectedType('STAFF');
    } else if (/^[0-9.kK-]+$/.test(identifier) && identifier.length > 5) {
      setDetectedType('RESIDENT');
    } else {
      setDetectedType('UNKNOWN');
    }
  }, [identifier]);

  const handleCheckRut = async (e) => {
    e.preventDefault();
    setActivationError('');
    setActivationLoading(true);

    const res = await checkRut(activationRut);
    if (res.success) {
      if (res.requiresPassword) setActivationStep(2);
      else setActivationError('Este usuario ya tiene una contraseña configurada.');
    } else {
      setActivationError(res.error || 'No encontrado.');
    }
    setActivationLoading(false);
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setActivationError('');
    setActivationLoading(true);
    const res = await recoverPassword(activationRut);
    if (res.success) {
      setActivationSuccess(res.message);
      setTimeout(() => setIsRecovering(false), 5000);
    } else {
      setActivationError(res.error);
    }
    setActivationLoading(false);
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword || newPassword.length < 6) {
      setActivationError('Validar contraseñas (mínimo 6 caracteres y que coincidan)');
      return;
    }
    setActivationLoading(true);
    const res = await createPassword(activationRut, newPassword);
    if (res.success) {
      setActivationSuccess('¡Contraseña creada! Ya puedes entrar.');
      setActivationStep(1);
      setTimeout(() => { setIsActivating(false); setActivationSuccess(''); }, 3000);
    } else {
      setActivationError(res.error || 'Error.');
    }
    setActivationLoading(false);
  };

  const activeColor = detectedType === 'RESIDENT' ? '#10b981' : detectedType === 'STAFF' ? '#6366f1' : '#94a3b8';

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '440px', borderTop: `5px solid ${activeColor}`, transition: 'all 0.4s ease' }}>
        <div className="login-logo" style={{ marginBottom: '30px' }}>
          <h1 style={{ color: activeColor, transition: 'color 0.4s' }}>🏢 CondoAdmin</h1>
          <p>Portal Único de Acceso</p>
        </div>

        {isActivating ? (
          <div className="fade-in">
            <h2 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>✨ Activa tu Cuenta</h2>
            {activationSuccess && <div className="badge-success" style={{ padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>{activationSuccess}</div>}
            
            {activationStep === 1 ? (
              <form onSubmit={handleCheckRut}>
                <div className="form-group">
                  <label className="form-label">RUT o Email registrado</label>
                  <input type="text" className="form-input" value={activationRut} onChange={e => setActivationRut(e.target.value)} required />
                </div>
                {activationError && <p className="form-error">{activationError}</p>}
                <button type="submit" className="btn btn-primary btn-block" disabled={activationLoading}>Verificar</button>
              </form>
            ) : (
              <form onSubmit={handleCreatePassword}>
                <div className="form-group"><label className="form-label">Nueva Clave</label><input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Confirmar Clave</label><input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                {activationError && <p className="form-error">{activationError}</p>}
                <button type="submit" className="btn btn-success btn-block" disabled={activationLoading}>Crear Contraseña</button>
              </form>
            )}
            <button className="btn-link" onClick={() => setIsActivating(false)} style={{ marginTop: '15px', width: '100%' }}>Volver al Login</button>
          </div>
        ) : isRecovering ? (
          <div className="fade-in">
            <h2 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>🔑 Recuperar Clave</h2>
            {activationSuccess ? <p style={{ textAlign: 'center' }}>{activationSuccess}</p> : (
              <form onSubmit={handleRecover}>
                <div className="form-group"><label className="form-label">Tu RUT o Email</label><input type="text" className="form-input" value={activationRut} onChange={e => setActivationRut(e.target.value)} required /></div>
                {activationError && <p className="form-error">{activationError}</p>}
                <button type="submit" className="btn btn-primary btn-block" disabled={activationLoading}>Enviar Instrucciones</button>
              </form>
            )}
            <button className="btn-link" onClick={() => setIsRecovering(false)} style={{ marginTop: '15px', width: '100%' }}>Volver</button>
          </div>
        ) : (
          <form action={loginAction} className="fade-in">
            <div className="form-group">
              <label className="form-label">Identificación</label>
              <input 
                name="identifier" 
                type="text" 
                className="form-input" 
                placeholder="RUT o Correo Electrónico" 
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required 
              />
            </div>

            {detectedType === 'RESIDENT' && (
              <div className="form-group slide-down">
                <label className="form-label">N° de Departamento</label>
                <input name="departamento" type="text" className="form-input" placeholder="Ej: 101" required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input name="password" type="password" className="form-input" placeholder="••••••••" required />
            </div>

            {loginState.errors?.general && <p className="form-error" style={{ marginBottom: '15px' }}>{loginState.errors.general}</p>}

            <button type="submit" className="btn btn-lg btn-block" disabled={loginPending} style={{
              background: activeColor,
              color: 'white',
              boxShadow: `0 4px 12px ${activeColor}44`,
              transition: 'all 0.4s'
            }}>
              {loginPending ? '⏳ Ingresando...' : 'Entrar al Sistema'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" className="btn-link" onClick={() => setIsRecovering(true)}>¿Olvidaste tu contraseña?</button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '10px 0' }}></div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>¿Primera vez aquí?</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsActivating(true)}>✨ Activar mi cuenta</button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .slide-down { animation: slideDown 0.3s ease-out; overflow: hidden; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 100px; } }
        .btn-link { background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline; font-size: 13px; }
        .btn-block { width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; }
        .badge-success { background: rgba(16,185,129,0.1); color: #10b981; }
      `}</style>
    </div>
  );
}
