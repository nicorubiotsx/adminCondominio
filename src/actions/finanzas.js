'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('No autorizado');
  return session;
}

export async function generarDeudasMensuales(mes) {
  await requireAdmin();
  
  try {
    const config = await prisma.configuracion.findUnique({ where: { id: "1" } });
    if (!config || config.cuotaBase <= 0) {
      return { success: false, error: 'La cuota base debe ser mayor a 0 en configuración.' };
    }

    const departamentos = await prisma.departamento.findMany();
    let creadas = 0;

    for (const depto of departamentos) {
      // Calcular monto exacto según alícuota
      const montoCalculado = Math.round(config.cuotaBase * (depto.alicuota / 100));
      
      if (montoCalculado > 0) {
        // Upsert para no duplicar si ya existe
        const deuda = await prisma.deudaMensual.upsert({
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
      }
    }

    revalidatePath('/admin/pagos');
    return { success: true, message: `Deudas generadas para ${creadas} departamentos.` };
  } catch (error) {
    console.error("Error generando deudas:", error);
    return { success: false, error: 'Hubo un error al generar las deudas.' };
  }
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
