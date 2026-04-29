'use client';

import { useState } from 'react';
import { createVehiculo, deleteVehiculo } from '@/actions/vehiculos';
import { toast } from 'react-hot-toast';

export default function VehiculosClient({ initialVehiculos, residentes }) {
  const [vehiculos, setVehiculos] = useState(initialVehiculos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    const res = await createVehiculo(formData);
    if (res.success) {
      toast.success(res.message);
      setIsModalOpen(false);
      // Recargar datos (en una app real usaríamos router.refresh() o un state local más complejo)
      window.location.reload(); 
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm('¿Seguro que deseas eliminar este vehículo?')) return;
    
    const res = await deleteVehiculo(id);
    if (res.success) {
      setVehiculos(vehiculos.filter(v => v.id !== id));
      toast.success('Vehículo eliminado');
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>🚗 Gestión de Vehículos</h1>
          <p>Control de patentes y estacionamientos registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Registrar Vehículo
        </button>
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patente</th>
              <th>Vehículo</th>
              <th>Color</th>
              <th>Propietario</th>
              <th>Depto</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map((v) => (
              <tr key={v.id}>
                <td>
                  <span style={{ 
                    background: '#1e293b', 
                    color: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    border: '1px solid #475569'
                  }}>
                    {v.patente}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{v.marca}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.modelo}</div>
                </td>
                <td>{v.color || '-'}</td>
                <td>{v.residente.nombre} {v.residente.apellido}</td>
                <td>{v.departamento.numero}</td>
                <td>
                  <span className={`badge badge-info`}>
                    {v.tipo}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleDelete(v.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {vehiculos.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay vehículos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Registrar Nuevo Vehículo</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Residente / Propietario</label>
                <select name="residenteId" className="form-control" required>
                  <option value="">Seleccionar residente...</option>
                  {residentes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} {r.apellido} (Depto {r.departamento?.numero})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Patente</label>
                  <input name="patente" type="text" className="form-control" placeholder="ABC-123" required />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="tipo" className="form-control">
                    <option value="AUTO">Auto</option>
                    <option value="MOTO">Moto</option>
                    <option value="CAMIONETA">Camioneta</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Marca</label>
                  <input name="marca" type="text" className="form-control" placeholder="Ej: Toyota" required />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input name="modelo" type="text" className="form-control" placeholder="Ej: Corolla" required />
                </div>
              </div>

              <div className="form-group">
                <label>Color</label>
                <input name="color" type="text" className="form-control" placeholder="Ej: Gris Metálico" />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-card);
          padding: 24px;
          border-radius: 12px;
          width: 100%;
          border: 1px solid var(--border-color);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
