'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getDashboardStats() {
  await requireAuth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalResidentes,
    totalDepartamentos,
    totalPagosMes,
    pagosPendientes,
    pagosVerificados,
    totalGastosMes,
    mantenimientoPendiente,
    anunciosActivos,
    ultimosPagos,
    ultimosMantenimientos,
  ] = await Promise.all([
    prisma.residente.count({ where: { activo: true } }),
    prisma.departamento.count(),
    prisma.pago.aggregate({
      where: { fechaPago: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { monto: true }, _count: true,
    }),
    prisma.pago.count({ where: { estado: 'PENDIENTE' } }),
    prisma.pago.count({ where: { estado: 'VERIFICADO', fechaPago: { gte: startOfMonth } } }),
    prisma.gastoComun.aggregate({
      where: { fecha: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { monto: true }, _count: true,
    }),
    prisma.mantenimiento.count({ where: { estado: { in: ['PENDIENTE', 'EN_PROGRESO'] } } }),
    prisma.anuncio.count({ where: { activo: true } }),
    prisma.pago.findMany({
      include: { residente: true, departamento: true },
      orderBy: { createdAt: 'desc' }, take: 5,
    }),
    prisma.mantenimiento.findMany({
      include: { departamento: true },
      orderBy: { createdAt: 'desc' }, take: 5,
    }),
  ]);

  // Obtener historial de los últimos 6 meses para los gráficos
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const rawGastos = await prisma.gastoComun.groupBy({
    by: ['fecha'],
    where: { fecha: { gte: sixMonthsAgo } },
    _sum: { monto: true }
  });
  
  const rawPagos = await prisma.pago.findMany({
    where: { fechaPago: { gte: sixMonthsAgo }, estado: 'VERIFICADO' },
    select: { fechaPago: true, monto: true }
  });

  // Procesar para el gráfico (agrupando por mes-año)
  const chartDataMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    chartDataMap[monthKey] = { mes: monthKey, ingresos: 0, gastos: 0 };
  }

  rawGastos.forEach(g => {
    const monthKey = g.fecha.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    if (chartDataMap[monthKey]) chartDataMap[monthKey].gastos += (g._sum.monto || 0);
  });

  rawPagos.forEach(p => {
    const monthKey = p.fechaPago.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    if (chartDataMap[monthKey]) chartDataMap[monthKey].ingresos += p.monto;
  });

  return {
    totalResidentes,
    totalDepartamentos,
    ingresosMes: totalPagosMes._sum.monto || 0,
    cantidadPagosMes: totalPagosMes._count,
    pagosPendientes,
    pagosVerificados,
    gastosMes: totalGastosMes._sum.monto || 0,
    cantidadGastosMes: totalGastosMes._count,
    mantenimientoPendiente,
    anunciosActivos,
    ultimosPagos,
    ultimosMantenimientos,
    balance: (totalPagosMes._sum.monto || 0) - (totalGastosMes._sum.monto || 0),
    chartData: Object.values(chartDataMap)
  };
}
