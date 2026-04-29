'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function DashboardCharts({ data, balance }) {
  // Datos para el gráfico circular de estado de mantenimiento (ejemplo estático o dinámico)
  const pieData = [
    { name: 'Ingresos', value: data.reduce((acc, curr) => acc + curr.ingresos, 0) },
    { name: 'Gastos', value: data.reduce((acc, curr) => acc + curr.gastos, 0) },
  ];

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
      <div className="data-card">
        <div className="data-card-header">
          <h3>📈 Comparativa Mensual (Ingresos vs Gastos)</h3>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                formatter={(value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)}
              />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>💰 Distribución Financiera</h3>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Balance Histórico</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: balance >= 0 ? '#10b981' : '#ef4444' }}>
            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
