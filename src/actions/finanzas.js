'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createBulkNotificaciones } from './notificaciones';

async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) {
    throw new Error('No autorizado');
  }
  return session;
}

export async function generarDeudasMensuales(mes) {
  await requireAdmin();
  
  try {
    // 1. Obtener el rango de fechas para el mes (formato "YYYY-MM")
    const [year, month] = mes.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 2. Sumar todos los gastos comunes de ese mes
    const sumGastos = await prisma.gastoComun.aggregate({
      where: {
        fecha: { gte: startDate, lte: endDate }
      },
      _sum: { monto: true }
    });

    const totalARecaudar = sumGastos._sum.monto || 0;

    if (totalARecaudar <= 0) {
      return { success: false, error: `No hay gastos registrados para el mes ${mes}.` };
    }

    const departamentos = await prisma.departamento.findMany();
    
    if (departamentos.length === 0) {
      return { success: false, error: 'No se pueden generar cobros porque no hay departamentos registrados.' };
    }

    let creadas = 0;
    let deptosConError = 0;

    for (const depto of departamentos) {
      // 3. Calcular monto según alícuota del departamento
      // totalARecaudar * (alicuota / 100)
      const alicuota = depto.alicuota || 0;
      const montoCalculado = Math.round(totalARecaudar * (alicuota / 100));
      
      if (montoCalculado > 0) {
        await prisma.deudaMensual.upsert({
          where: {
            departamentoId_mes: {
              departamentoId: depto.id,
              mes: mes
            }
          },
          update: { monto: montoCalculado },
          create: {
            departamentoId: depto.id,
            mes: mes,
            monto: montoCalculado,
            estado: 'PENDIENTE'
          }
        });
        creadas++;
      } else {
        deptosConError++;
      }
    }

    if (creadas === 0) {
      return { 
        success: false, 
        error: 'No se generaron cobros. Verifica que los departamentos tengan configurada su Alícuota (ej: 2.5%) y que el total de gastos sea mayor a cero.' 
      };
    }

    revalidatePath('/admin/pagos');
    revalidatePath('/admin/gastos');

    // 4. Notificar a todos los residentes que tienen deudas nuevas
    const residentesConDeuda = await prisma.residente.findMany({
      where: { 
        departamentoId: { in: departamentos.map(d => d.id) },
        activo: true
      },
      select: { id: true }
    });

    if (residentesConDeuda.length > 0) {
      await createBulkNotificaciones({
        titulo: 'Gastos Comunes Listos',
        mensaje: `Se han generado los cobros para el periodo ${mes}. Ya puedes revisarlos y pagar desde tu portal.`,
        tipo: 'ALERTA',
        enlace: '/residente/pagos',
        usuariosIds: residentesConDeuda.map(r => r.id)
      });
    }

    return { success: true, message: `Se generaron cobros para ${creadas} departamentos por un total de ${totalARecaudar}.` };
  } catch (error) {
    console.error("Error generando deudas:", error);
    return { success: false, error: 'Hubo un error al generar las deudas.' };
  }
}

export async function getDesgloseGastos(mes) {
  const [year, month] = mes.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await prisma.gastoComun.findMany({
    where: {
      fecha: { gte: startDate, lte: endDate }
    },
    orderBy: { fecha: 'asc' }
  });
}

export async function getDeudaTotal(departamentoId) {
  const deudas = await prisma.deudaMensual.findMany({
    where: { 
      departamentoId,
      estado: { in: ['PENDIENTE', 'PARCIAL'] }
    }
  });

  const totalDeuda = deudas.reduce((acc, curr) => acc + curr.monto, 0);

  const pagosVerificados = await prisma.pago.aggregate({
    where: { 
      departamentoId, 
      estado: 'VERIFICADO' 
    },
    _sum: { monto: true }
  });

  // La deuda real es lo facturado menos lo pagado
  const saldoPagado = pagosVerificados._sum.monto || 0;
  
  // Calcular todas las deudas históricas facturadas
  const todasLasDeudas = await prisma.deudaMensual.aggregate({
    where: { departamentoId },
    _sum: { monto: true }
  });

  const totalFacturado = todasLasDeudas._sum.monto || 0;
  
  return Math.max(0, totalFacturado - saldoPagado);
}
