'use client';

import { useState, useMemo } from 'react';
import { createVehiculo, deleteVehiculo, updateVehiculo } from '@/actions/vehiculos';
import { toast } from 'react-hot-toast';
import { Search, Filter, FileText, Download, Edit2, Trash2, Car, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function VehiculosClient({ initialVehiculos, residentes }) {
  const [vehiculos, setVehiculos] = useState(initialVehiculos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Filtering logic
  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter(v => {
      const searchStr = `${v.patente} ${v.marca} ${v.modelo} ${v.residente?.nombre} ${v.residente?.apellido} ${v.departamento?.numero}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo ? v.tipo === filterTipo : true;
      return matchesSearch && matchesTipo;
    });
  }, [vehiculos, searchTerm, filterTipo]);

  const openModalForNew = () => {
    setEditingVehiculo(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (vehiculo) => {
    setEditingVehiculo(vehiculo);
    setIsModalOpen(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    let res;
    if (editingVehiculo) {
      res = await updateVehiculo(editingVehiculo.id, formData);
    } else {
      res = await createVehiculo(formData);
    }

    if (res.success) {
      toast.success(res.message);
      setIsModalOpen(false);
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

  // Exports
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Vehículos - Condominio', 14, 15);
    
    const tableData = filteredVehiculos.map(v => [
      v.patente,
      `${v.marca} ${v.modelo}`,
      v.color || '-',
      `${v.residente?.nombre} ${v.residente?.apellido}`,
      v.departamento?.numero,
      v.numeroEstacionamiento || '-',
      v.tipo
    ]);

    doc.autoTable({
      startY: 20,
      head: [['Patente', 'Vehículo', 'Color', 'Propietario', 'Depto', 'Estac.', 'Tipo']],
      body: tableData,
    });

    doc.save('vehiculos-condominio.pdf');
  };

  const exportToExcel = () => {
    const data = filteredVehiculos.map(v => ({
      Patente: v.patente,
      Marca: v.marca,
      Modelo: v.modelo,
      Color: v.color || '',
      Tipo: v.tipo,
      Propietario: `${v.residente?.nombre} ${v.residente?.apellido}`,
      Departamento: v.departamento?.numero,
      'N° Estacionamiento': v.numeroEstacionamiento || '',
      Notas: v.notas || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehículos");
    XLSX.writeFile(wb, "vehiculos-condominio.xlsx");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1><Car className="inline-block mr-2 mb-1" /> Gestión de Vehículos</h1>
          <p>Control de patentes, estacionamientos y vehículos registrados</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportToExcel} title="Exportar Excel">
            <Download size={18} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={exportToPDF} title="Exportar PDF">
            <FileText size={18} /> PDF
          </button>
          <button className="btn btn-primary" onClick={openModalForNew}>
            + Registrar Vehículo
          </button>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por patente, marca, modelo, residente o depto..." 
              className="form-control w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-48 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select 
              className="form-control w-full pl-10"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos los Tipos</option>
              <option value="AUTO">Auto</option>
              <option value="MOTO">Moto</option>
              <option value="CAMIONETA">Camioneta</option>
              <option value="BICICLETA">Bicicleta</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Vehículo</th>
                <th>Color</th>
                <th>Propietario / Depto</th>
                <th>Estacionamiento</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehiculos.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span style={{ 
                      background: '#1e293b', 
                      color: '#f8fafc', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      border: '1px solid #334155',
                      letterSpacing: '1px'
                    }}>
                      {v.patente}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.marca} {v.modelo}</div>
                    {v.notas && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Info size={12} /> {v.notas}
                      </div>
                    )}
                  </td>
                  <td>{v.color || '-'}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{v.residente?.nombre} {v.residente?.apellido}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Depto {v.departamento?.numero}</div>
                  </td>
                  <td>
                    {v.numeroEstacionamiento ? (
                      <span className="badge badge-warning" style={{ background: 'var(--bg-warning)', color: 'var(--text-warning)' }}>
                        #{v.numeroEstacionamiento}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No asignado</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-info`}>
                      {v.tipo}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModalForEdit(v)}
                        className="btn-icon"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="btn-icon text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVehiculos.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No se encontraron vehículos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingVehiculo ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Residente / Propietario</label>
                <select name="residenteId" className="form-control" required defaultValue={editingVehiculo?.residenteId || ''}>
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
                  <input name="patente" type="text" className="form-control" placeholder="ABC-123" required defaultValue={editingVehiculo?.patente || ''} />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="tipo" className="form-control" defaultValue={editingVehiculo?.tipo || 'AUTO'}>
                    <option value="AUTO">Auto</option>
                    <option value="MOTO">Moto</option>
                    <option value="CAMIONETA">Camioneta</option>
                    <option value="BICICLETA">Bicicleta</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Marca</label>
                  <input name="marca" type="text" className="form-control" placeholder="Ej: Toyota" required defaultValue={editingVehiculo?.marca || ''} />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input name="modelo" type="text" className="form-control" placeholder="Ej: Corolla" required defaultValue={editingVehiculo?.modelo || ''} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Color</label>
                  <input name="color" type="text" className="form-control" placeholder="Ej: Gris Metálico" defaultValue={editingVehiculo?.color || ''} />
                </div>
                <div className="form-group">
                  <label>N° Estacionamiento (Opcional)</label>
                  <input name="numeroEstacionamiento" type="text" className="form-control" placeholder="Ej: E-45" defaultValue={editingVehiculo?.numeroEstacionamiento || ''} />
                </div>
              </div>

              <div className="form-group">
                <label>Notas / Observaciones (Opcional)</label>
                <textarea 
                  name="notas" 
                  className="form-control" 
                  rows="2" 
                  placeholder="Ej: Vehículo grande, ocupa dos puestos..."
                  defaultValue={editingVehiculo?.notas || ''}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : (editingVehiculo ? 'Actualizar Vehículo' : 'Guardar Vehículo')}
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
          max-height: 90vh;
          overflow-y: auto;
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
        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: var(--bg-hover);
          color: var(--text-color);
        }
        .flex { display: flex; }
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .items-center { align-items: center; }
        .flex-1 { flex: 1; }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .left-3 { left: 0.75rem; }
        .top-1\\/2 { top: 50%; }
        .transform { transform: translateY(-50%); }
        .pl-10 { padding-left: 2.5rem; }
        .w-full { width: 100%; }
        .w-48 { width: 12rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .text-gray-400 { color: #9ca3af; }
        .text-red-500 { color: #ef4444; }
        .mr-2 { margin-right: 0.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .inline-block { display: inline-block; }
      `}</style>
    </>
  );
}
