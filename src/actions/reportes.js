'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function requireAuth() {
  const session = await getSession();
  if (!session || session.rol === 'RESIDENTE') throw new Error('No autorizado');
  return session;
}

export async function getReportesData(mesInicio, mesFin) {
  await requireAuth();

  const [startYear, startMonth] = mesInicio.split('-');
  const [endYear, endMonth] = mesFin.split('-');
  
  const startDate = new Date(startYear, parseInt(startMonth) - 1, 1);
  const endDate = new Date(endYear, parseInt(endMonth), 0); // último día del mes

  const pagos = await prisma.pago.findMany({
    where: { 
      fechaPago: { gte: startDate, lte: endDate },
      estado: 'VERIFICADO'
    },
    include: { departamento: true }
  });

  const gastos = await prisma.gastoComun.findMany({
    where: { 
      fecha: { gte: startDate, lte: endDate }
    }
  });

  const totalIngresos = pagos.reduce((acc, p) => acc + p.monto, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  // Agrupar gastos por categoria
  const gastosCategoriaMap = {};
  gastos.forEach(g => {
    gastosCategoriaMap[g.categoria] = (gastosCategoriaMap[g.categoria] || 0) + g.monto;
  });
  
  const gastosPorCategoria = Object.entries(gastosCategoriaMap).map(([name, value]) => ({
    name, value
  }));

  // Agrupar ingresos y gastos por mes
  const mensualMap = {};
  
  let curr = new Date(startDate);
  while (curr <= endDate) {
    const monthKey = curr.toISOString().substring(0, 7); // YYYY-MM
    mensualMap[monthKey] = { mes: monthKey, ingresos: 0, gastos: 0 };
    curr.setMonth(curr.getMonth() + 1);
  }

  pagos.forEach(p => {
    const monthKey = p.fechaPago.toISOString().substring(0, 7);
    if (mensualMap[monthKey]) mensualMap[monthKey].ingresos += p.monto;
  });

  gastos.forEach(g => {
    const monthKey = g.fecha.toISOString().substring(0, 7);
    if (mensualMap[monthKey]) mensualMap[monthKey].gastos += g.monto;
  });

  return {
    resumen: {
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
      cantidadPagos: pagos.length,
      cantidadGastos: gastos.length
    },
    gastosPorCategoria,
    mensual: Object.values(mensualMap).sort((a, b) => a.mes.localeCompare(b.mes)),
    pagos,
    gastos
  };
}

export async function getMorosidad() {
  await requireAuth();
  // Obtener residentes con sus pagos y cuota base
  const residentes = await prisma.residente.findMany({
    where: { activo: true },
    include: { departamento: true, pagos: { where: { estado: 'VERIFICADO' } } }
  });
  
  const config = await prisma.configuracion.findUnique({ where: { id: "1" } });
  const cuotaBase = config?.cuotaBase || 0;

  if (cuotaBase === 0) return []; // No hay morosidad si no hay cuota

  const morosos = [];
  const currDate = new Date();
  
  for (const res of residentes) {
    if (!res.departamento) continue;
    
    // Meses desde ingreso
    const monthsDiff = (currDate.getFullYear() - res.fechaIngreso.getFullYear()) * 12 + currDate.getMonth() - res.fechaIngreso.getMonth();
    
    // Total de deuda esperada
    const deudaEsperada = monthsDiff * cuotaBase * (res.departamento.alicuota / 100);
    
    // Total pagado
    const totalPagado = res.pagos.reduce((acc, p) => acc + p.monto, 0);
    
    const deuda = deudaEsperada - totalPagado;
    
    if (deuda > 1) { // margen de error 1 usd
      morosos.push({
        residente: res.nombre + ' ' + res.apellido,
        departamento: res.departamento.numero,
        deuda: deuda
      });
    }
  }

  return morosos.sort((a, b) => b.deuda - a.deuda);
}
