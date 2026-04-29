'use client';

import { useState, useActionState, useEffect } from 'react';
import { createPublicacion, deletePublicacion } from '@/actions/muro';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Trash2, Megaphone, Tag, Briefcase, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MuroClient({ publicaciones, currentUserId, isAdmin }) {
  const [showModal, setShowModal] = useState(false);
  const [state, formAction, pending] = useActionState(createPublicacion, { success: false, errors: {} });

  useEffect(() => {
    if (state.success) {
      toast.success('Publicado en el muro');
      setShowModal(false);
      state.success = false;
    }
  }, [state]);

  const handleDelete = async (id) => {
    if (confirm('¿Seguro que deseas eliminar esta publicación?')) {
      const result = await deletePublicacion(id);
      if (result.success) toast.success('Publicación eliminada');
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'VENTA': return <Tag size={18} color="var(--primary)" />;
      case 'SERVICIO': return <Briefcase size={18} color="var(--success)" />;
      case 'PERDIDO': return <HelpCircle size={18} color="var(--danger)" />;
      default: return <Megaphone size={18} color="var(--warning)" />;
    }
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>💬 Muro de la Comunidad</h1>
          <p>Avisos, ventas y servicios entre vecinos</p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <MessageSquare size={18} /> Nueva Publicación
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {publicaciones.map(pub => (
          <div key={pub.id} className="data-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {pub.residente.nombre[0]}{pub.residente.apellido[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{pub.residente.nombre} {pub.residente.apellido}</p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Depto: {pub.residente.departamento?.numero || 'N/A'}</p>
              </div>
              {(isAdmin || pub.residenteId === currentUserId) && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(pub.id)} style={{ padding: '6px' }}>
                  <Trash2 size={16} color="var(--danger)" />
                </button>
              )}
            </div>
            <div style={{ padding: '16px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {getTipoIcon(pub.tipo)}
                <span className="badge badge-default">{pub.tipo}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {formatDate(pub.createdAt)}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{pub.titulo}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {pub.contenido}
              </p>
            </div>
          </div>
        ))}

        {publicaciones.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="icon">📢</div>
            <h3>No hay publicaciones recientes</h3>
            <p>Sé el primero en compartir algo con tus vecinos.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Escribir en el Muro</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form action={formAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo de Publicación</label>
                  <select name="tipo" className="form-select">
                    <option value="AVISO">Aviso General</option>
                    <option value="VENTA">Venta de Artículos</option>
                    <option value="SERVICIO">Ofrecer Servicio (Ej: Gasfíter)</option>
                    <option value="PERDIDO">Objeto Perdido/Encontrado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Título breve</label>
                  <input name="titulo" className="form-input" placeholder="Ej: Vendo bicicleta aro 26" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contenido / Detalles</label>
                  <textarea name="contenido" className="form-textarea" placeholder="Describe los detalles, precio, o cómo contactarte..." required />
                  {state.errors?.form && <p className="form-error">{state.errors.form}</p>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
