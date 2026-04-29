'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportesClient({ data, morosidad, mesInicio, mesFin }) {
  const router = useRouter();
  const [inicio, setInicio] = useState(mesInicio);
  const [fin, setFin] = useState(mesFin);

  const handleFilter = (e) => {
    e.preventDefault();
    router.push(`/admin/reportes?mesInicio=${inicio}&mesFin=${fin}`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte Financiero de Condominio', 14, 22);
    doc.setFontSize(11);
    doc.text(`Período: ${mesInicio} a ${mesFin}`, 14, 30);
    doc.text(`Total Ingresos: ${formatCurrency(data.resumen.totalIngresos)}`, 14, 38);
    doc.text(`Total Gastos: ${formatCurrency(data.resumen.totalGastos)}`, 14, 46);
    doc.text(`Balance: ${formatCurrency(data.resumen.balance)}`, 14, 54);

    if (morosidad.length > 0) {
      doc.text('Top Deudores', 14, 70);
      doc.autoTable({
        startY: 75,
        head: [['Residente', 'Depto', 'Deuda']],
        body: morosidad.slice(0, 10).map(m => [m.residente, m.departamento, `$${m.deuda.toFixed(2)}`]),
      });
    }

    doc.save(`Reporte_Financiero_${mesInicio}_${mesFin}.pdf`);
    toast.success('Reporte PDF descargado');
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Resumen
    const wsResumen = XLSX.utils.json_to_sheet([{
      'Período': `${mesInicio} a ${mesFin}`,
      'Total Ingresos': data.resumen.totalIngresos,
      'Total Gastos': data.resumen.totalGastos,
      'Balance': data.resumen.balance,
      'Nro Pagos': data.resumen.cantidadPagos,
      'Nro Gastos': data.resumen.cantidadGastos,
    }]);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Pagos
    const wsPagos = XLSX.utils.json_to_sheet(data.pagos.map(p => ({
      Fecha: formatDate(p.fechaPago),
      Monto: p.monto,
      Mes: p.mesPago,
      Metodo: p.metodoPago,
      Referencia: p.referencia || '',
      Departamento: p.departamento?.numero || ''
    })));
    XLSX.utils.book_append_sheet(wb, wsPagos, 'Ingresos');

    // Gastos
    const wsGastos = XLSX.utils.json_to_sheet(data.gastos.map(g => ({
      Fecha: formatDate(g.fecha),
      Concepto: g.concepto,
      Monto: g.monto,
      Categoria: g.categoria,
      Proveedor: g.proveedor || ''
    })));
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

    // Morosidad
    if (morosidad.length > 0) {
      const wsMorosidad = XLSX.utils.json_to_sheet(morosidad.map(m => ({
        Residente: m.residente,
        Departamento: m.departamento,
        Deuda: m.deuda
      })));
      XLSX.utils.book_append_sheet(wb, wsMorosidad, 'Morosidad');
    }

    XLSX.writeFile(wb, `Reporte_Financiero_${mesInicio}_${mesFin}.xlsx`);
    toast.success('Reporte Excel descargado');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📊 Reportes Financieros</h1>
          <p>Análisis detallado de ingresos, gastos y morosidad</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportPDF}>
            <Download size={18} /> Exportar PDF
          </button>
          <button className="btn btn-success" onClick={exportExcel}>
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="toolbar" style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mes Inicio</label>
            <input type="month" className="form-input" value={inicio} onChange={e => setInicio(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mes Fin</label>
            <input type="month" className="form-input" value={fin} onChange={e => setFin(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Filtrar</button>
        </form>
      </div>

      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="stat-card green">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Ingresos</div>
              <div className="stat-card-value">{formatCurrency(data.resumen.totalIngresos)}</div>
            </div>
          </div>
          <div className="stat-card-sub">{data.resumen.cantidadPagos} pagos verificados</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Total Gastos</div>
              <div className="stat-card-value">{formatCurrency(data.resumen.totalGastos)}</div>
            </div>
          </div>
          <div className="stat-card-sub">{data.resumen.cantidadGastos} gastos registrados</div>
        </div>
        <div className={`stat-card ${data.resumen.balance >= 0 ? 'indigo' : 'red'}`}>
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Balance Neto</div>
              <div className="stat-card-value">{formatCurrency(data.resumen.balance)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="data-card">
          <div className="data-card-header">
            <h3>📈 Flujo Mensual</h3>
          </div>
          <div style={{ height: 300, padding: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mensual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} tickFormatter={val => `$${val}`} />
                <Tooltip formatter={val => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-card">
          <div className="data-card-header">
            <h3>📑 Distribución de Gastos</h3>
          </div>
          <div style={{ height: 300, padding: '20px' }}>
            {data.gastosPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.gastosPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.gastosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={val => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No hay gastos en este período</p>
              </div>
            )}
          </div>
        </div>

        <div className="data-card" style={{ gridColumn: '1 / -1' }}>
          <div className="data-card-header">
            <h3>⚠️ Índice de Morosidad</h3>
          </div>
          {morosidad.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Depto</th>
                  <th>Residente</th>
                  <th>Deuda Estimada</th>
                </tr>
              </thead>
              <tbody>
                {morosidad.slice(0, 10).map((m, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-default">{m.departamento}</span></td>
                    <td>{m.residente}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(m.deuda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No se registran deudas pendientes</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
