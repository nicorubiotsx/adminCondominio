'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createReserva(prevState, formData) {
  const session = await getSession();
  if (!session || session.rol !== 'RESIDENTE') throw new Error('No autorizado');

  const areaComunId = formData.get('areaComunId');
  const fecha = formData.get('fecha');
  const horaInicio = formData.get('horaInicio');
  const horaFin = formData.get('horaFin');
  const motivo = formData.get('motivo');

  if (!areaComunId || !fecha || !horaInicio || !horaFin) {
    return { success: false, errors: { form: 'Todos los campos son obligatorios' } };
  }

  // Validación básica de horario
  if (horaInicio >= horaFin) {
    return { success: false, errors: { form: 'La hora de fin debe ser posterior a la de inicio' } };
  }

  const fechaReserva = new Date(fecha);

  try {
    // Usamos una transacción para evitar "race conditions"
    return await prisma.$transaction(async (tx) => {
      const conflictos = await tx.reserva.findFirst({
        where: {
          areaComunId,
          fecha: fechaReserva,
          estado: 'APROBADA',
          OR: [
            {
              horaInicio: { lte: horaInicio },
              horaFin: { gt: horaInicio }
            },
            {
              horaInicio: { lt: horaFin },
              horaFin: { gte: horaFin }
            }
          ]
        }
      });

      if (conflictos) {
        return { success: false, errors: { form: 'El área común ya está reservada en ese horario' } };
      }

      await tx.reserva.create({
        data: {
          fecha: fechaReserva,
          horaInicio,
          horaFin,
          motivo,
          areaComunId,
          residenteId: session.userId,
        }
      });

      return { success: true, message: 'Reserva solicitada exitosamente' };
    });
  } catch (error) {
    console.error('Error en reserva:', error);
    return { success: false, errors: { form: 'Error al procesar la reserva' } };
  } finally {
    revalidatePath('/residente/reservas');
  }
}
