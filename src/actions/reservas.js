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

// ADMIN ACTIONS

export async function updateReservaEstado(id, estado) {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) throw new Error('No autorizado');

  try {
    await prisma.reserva.update({
      where: { id },
      data: { estado }
    });
    revalidatePath('/admin/reservas');
    return { success: true, message: `Reserva ${estado.toLowerCase()} exitosamente` };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al actualizar reserva' };
  }
}

export async function createAreaComun(formData) {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) throw new Error('No autorizado');

  const nombre = formData.get('nombre');
  const descripcion = formData.get('descripcion');
  const capacidad = parseInt(formData.get('capacidad')) || null;
  const costoReserva = parseInt(formData.get('costoReserva')) || 0;
  const activa = formData.get('activa') === 'true';

  if (!nombre) return { success: false, error: 'El nombre es obligatorio' };

  try {
    await prisma.areaComun.create({
      data: { nombre, descripcion, capacidad, costoReserva, activa }
    });
    revalidatePath('/admin/reservas');
    return { success: true, message: 'Área común creada' };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al crear área común' };
  }
}

export async function updateAreaComun(id, formData) {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) throw new Error('No autorizado');

  const nombre = formData.get('nombre');
  const descripcion = formData.get('descripcion');
  const capacidad = parseInt(formData.get('capacidad')) || null;
  const costoReserva = parseInt(formData.get('costoReserva')) || 0;
  const activa = formData.get('activa') === 'true';

  if (!nombre) return { success: false, error: 'El nombre es obligatorio' };

  try {
    await prisma.areaComun.update({
      where: { id },
      data: { nombre, descripcion, capacidad, costoReserva, activa }
    });
    revalidatePath('/admin/reservas');
    return { success: true, message: 'Área común actualizada' };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al actualizar área común' };
  }
}

export async function deleteAreaComun(id) {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) throw new Error('No autorizado');

  try {
    await prisma.areaComun.delete({ where: { id } });
    revalidatePath('/admin/reservas');
    return { success: true, message: 'Área común eliminada' };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'No se puede eliminar porque tiene reservas asociadas' };
  }
}
