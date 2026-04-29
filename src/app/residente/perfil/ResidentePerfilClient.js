'use client';

import { useActionState, useState, useEffect } from 'react';
import { updateMiPerfil } from '@/actions/residentes';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Home, Mail, Phone, ShieldCheck, Edit2, X, Download, FileText, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResidentePerfilClient({ residente, deuda, cuotaBase }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateMiPerfil, { success: false, errors: {} });

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setIsEditing(false);
      state.success = false; // Reset to avoid re-triggering
    }
  }, [state]);

  const exportAccountStatement = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Estado de Cuenta - Condominio', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Residente: ${residente.nombre} ${residente.apellido}`, 14, 32);
    doc.text(`Cédula: ${residente.cedula}`, 14, 38);
    doc.text(`Departamento: ${residente.departamento?.numero || 'N/A'}`, 14, 44);
    doc.text(`Fecha de emisión: ${formatDate(new Date())}`, 14, 50);

    doc.setFontSize(14);
    doc.text(`Balance Actual`, 14, 65);
    
    if (deuda > 1) {
      doc.setTextColor(220, 38, 38); // Rojo
      doc.text(`DEUDA PENDIENTE: ${formatCurrency(deuda)}`, 14, 73);
    } else {
      doc.setTextColor(22, 163, 74); // Verde
      doc.text(`ESTÁS AL DÍA`, 14, 73);
    }
    doc.setTextColor(0, 0, 0);

    if (residente.pagos && residente.pagos.length > 0) {
      doc.text('Últimos Pagos Registrados', 14, 90);
      doc.autoTable({
        startY: 95,
        head: [['Fecha', 'Mes Pago', 'Referencia', 'Estado', 'Monto']],
        body: residente.pagos.map(p => [
          formatDate(p.fechaPago), 
          p.mesPago, 
          p.referencia || '-', 
          p.estado, 
          formatCurrency(p.monto)
        ]),
      });
    }

    doc.save(`Estado_Cuenta_${residente.cedula}.pdf`);
    toast.success('Estado de cuenta descargado');
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>👤 Mi Perfil</h1>
          <p>Información personal y estado de cuenta</p>
        </div>
        <button className="btn btn-secondary" onClick={exportAccountStatement}>
          <Download size={18} /> Exportar Estado de Cuenta
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="data-card">
          <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Datos Personales</h3>
            {!isEditing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} style={{ marginRight: '6px' }} /> Editar
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                <X size={16} style={{ marginRight: '6px' }} /> Cancelar
              </button>
            )}
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                {residente.nombre[0]}{residente.apellido[0]}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px' }}>{residente.nombre} {residente.apellido}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>RUT: {residente.cedula}</p>
                <span className="badge badge-default" style={{ marginTop: '8px' }}>{residente.tipo}</span>
              </div>
            </div>

            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Home className="text-muted" size={20} />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Departamento</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{residente.departamento?.numero || 'No asignado'} (Piso {residente.departamento?.piso})</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Mail className="text-muted" size={20} />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Correo Electrónico</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{residente.email || 'No registrado'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Phone className="text-muted" size={20} />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Teléfono</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{residente.telefono}</p>
                  </div>
                </div>
                {residente.telefonoAlt && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Phone className="text-muted" size={20} />
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Teléfono Alternativo</p>
                      <p style={{ margin: 0, fontWeight: '500' }}>{residente.telefonoAlt}</p>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ShieldCheck className="text-muted" size={20} />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Fecha de Ingreso</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{formatDate(residente.fechaIngreso)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Correo Electrónico</label>
                  <input name="email" type="email" className="form-input" defaultValue={residente.email || ''} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Teléfono</label>
                  <input name="telefono" type="text" className="form-input" defaultValue={residente.telefono} required />
                  {state.errors?.telefono && <p className="form-error">{state.errors.telefono}</p>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Teléfono Alternativo</label>
                  <input name="telefonoAlt" type="text" className="form-input" defaultValue={residente.telefonoAlt || ''} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
                    {pending ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>Estado de Cuenta</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ textAlign: 'center', padding: '30px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Deuda Actual
              </p>
              <h2 style={{ margin: '10px 0', fontSize: '42px', color: deuda > 1 ? 'var(--danger)' : 'var(--success)' }}>
                {formatCurrency(deuda)}
              </h2>
              {deuda <= 1 ? (
                <p style={{ margin: 0, color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} /> Estás al día con el condominio
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--danger)' }}>
                  Tienes pagos pendientes.
                </p>
              )}
            </div>

            {residente.departamento && (
              <div>
                <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Datos del Departamento</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Alícuota:</span>
                  <span>{residente.departamento.alicuota}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cuota Mensual Estimada:</span>
                  <span>{formatCurrency(cuotaBase * (residente.departamento.alicuota / 100))}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historial Reciente */}
        <div className="data-card" style={{ gridColumn: '1 / -1' }}>
          <div className="data-card-header">
            <h3>Historial Reciente</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '24px' }}>
            
            {/* Pagos Recientes */}
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <FileText size={18} /> Últimos Pagos
              </h4>
              {residente.pagos && residente.pagos.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {residente.pagos.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500' }}>{p.mesPago}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(p.fechaPago)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{formatCurrency(p.monto)}</p>
                        <span className={`badge badge-${p.estado === 'VERIFICADO' ? 'success' : p.estado === 'RECHAZADO' ? 'danger' : 'warning'}`}>
                          {p.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay pagos recientes.</p>
              )}
            </div>

            {/* Mantenimientos Recientes */}
            <div>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <Wrench size={18} /> Mantenimientos
              </h4>
              {residente.mantenimientos && residente.mantenimientos.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {residente.mantenimientos.map(m => (
                    <div key={m.id} style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <p style={{ margin: 0, fontWeight: '500', fontSize: '14px' }}>{m.titulo}</p>
                        <span className={`badge badge-${m.estado === 'COMPLETADO' ? 'success' : m.estado === 'EN_PROGRESO' ? 'primary' : 'warning'}`}>
                          {m.estado}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(m.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay solicitudes de mantenimiento.</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
