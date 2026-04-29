'use client';

export default function AdminReservasClient({ areasComunes, reservas }) {
  // Demo client para Admin Reservas
  return (
    <div className="page-header">
      <div>
        <h1>🏊 Gestión de Áreas Comunes</h1>
        <p>Administra los espacios y aprueba reservas</p>
      </div>
      <button className="btn btn-primary">➕ Nueva Área Común</button>
    </div>
  );
}
