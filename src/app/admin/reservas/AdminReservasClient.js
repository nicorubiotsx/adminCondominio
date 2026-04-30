'use client';

import { useState } from 'react';
import { updateReservaEstado, createAreaComun, updateAreaComun, deleteAreaComun } from '@/actions/reservas';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminReservasClient({ areasComunes, reservas }) {
  const [activeTab, setActiveTab] = useState('reservas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [loading, setLoading] = useState(false);

  // MANEJO DE ÁREAS COMUNES
  const openModalForNewArea = () => {
    setEditingArea(null);
    setIsModalOpen(true);
  };

  const openModalForEditArea = (area) => {
    setEditingArea(area);
    setIsModalOpen(true);
  };

  const handleAreaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    // Convertir el checkbox a booleano
    formData.set('activa', formData.get('activa') ? 'true' : 'false');
    
    let res;
    if (editingArea) {
      res = await updateAreaComun(editingArea.id, formData);
    } else {
      res = await createAreaComun(formData);
    }

    if (res.success) {
      toast.success(res.message);
      setIsModalOpen(false);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleDeleteArea = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta área común?')) return;
    const res = await deleteAreaComun(id);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error);
    }
  };

  // MANEJO DE RESERVAS
  const handleUpdateReserva = async (id, estado) => {
    if (!confirm(`¿Seguro que deseas marcar la reserva como ${estado}?`)) return;
    const res = await updateReservaEstado(id, estado);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>🏊 Gestión de Áreas Comunes</h1>
          <p>Administra los espacios del condominio y aprueba o rechaza reservas de los residentes.</p>
        </div>
        {activeTab === 'areas' && (
          <button className="btn btn-primary" onClick={openModalForNewArea}>
            + Nueva Área Común
          </button>
        )}
      </div>

      <div className="tabs mb-6" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'reservas' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('reservas')}
        >
          📅 Solicitudes de Reserva
        </button>
        <button 
          className={`btn ${activeTab === 'areas' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('areas')}
        >
          🏢 Áreas Comunes
        </button>
      </div>

      {activeTab === 'reservas' && (
        <div className="data-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Área Común</th>
                  <th>Residente</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>
                        {format(new Date(r.fecha), "dd MMM yyyy", { locale: es })}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {r.horaInicio} - {r.horaFin}
                      </div>
                    </td>
                    <td>{r.areaComun.nombre}</td>
                    <td>
                      {r.residente.nombre} {r.residente.apellido}
                    </td>
                    <td>{r.motivo || '-'}</td>
                    <td>
                      <span className={`badge ${
                        r.estado === 'APROBADA' ? 'badge-success' : 
                        r.estado === 'RECHAZADA' ? 'badge-danger' : 
                        r.estado === 'CANCELADA' ? 'badge-secondary' : 
                        'badge-warning'
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      {r.estado === 'PENDIENTE' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleUpdateReserva(r.id, 'APROBADA')}
                          >
                            Aprobar
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => handleUpdateReserva(r.id, 'RECHAZADA')}
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay reservas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'areas' && (
        <div className="data-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Capacidad</th>
                  <th>Costo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {areasComunes.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 'bold' }}>{a.nombre}</td>
                    <td>{a.descripcion || '-'}</td>
                    <td>{a.capacidad ? `${a.capacidad} personas` : '-'}</td>
                    <td>{a.costoReserva > 0 ? `$${a.costoReserva}` : 'Gratis'}</td>
                    <td>
                      <span className={`badge ${a.activa ? 'badge-success' : 'badge-danger'}`}>
                        {a.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}
                        title="Editar"
                        onClick={() => openModalForEditArea(a)}
                      >
                        ✏️
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Eliminar"
                        onClick={() => handleDeleteArea(a.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {areasComunes.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay áreas comunes registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingArea ? 'Editar Área Común' : 'Nueva Área Común'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAreaSubmit}>
              <div className="form-group">
                <label>Nombre del Área</label>
                <input type="text" name="nombre" className="form-control" required defaultValue={editingArea?.nombre || ''} placeholder="Ej: Quincho 1, Piscina, Sala de Eventos" />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea name="descripcion" className="form-control" rows="2" defaultValue={editingArea?.descripcion || ''}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Capacidad Máxima</label>
                  <input type="number" name="capacidad" className="form-control" defaultValue={editingArea?.capacidad || ''} placeholder="Personas" />
                </div>
                <div className="form-group">
                  <label>Costo de Reserva</label>
                  <input type="number" name="costoReserva" className="form-control" defaultValue={editingArea?.costoReserva || '0'} min="0" />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input type="checkbox" name="activa" id="activa" defaultChecked={editingArea ? editingArea.activa : true} />
                <label htmlFor="activa" style={{ marginBottom: 0 }}>Área activa y disponible para reservas</label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card); padding: 24px; border-radius: 12px; width: 100%; max-width: 500px; border: 1px solid var(--border-color);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; }
        .mb-6 { margin-bottom: 1.5rem; }
      `}</style>
    </>
  );
}
