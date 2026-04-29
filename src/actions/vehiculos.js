'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createVehiculo(formData) {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) {
    throw new Error('No autorizado');
  }

  const patente = formData.get('patente');
  const marca = formData.get('marca');
  const modelo = formData.get('modelo');
  const color = formData.get('color');
  const tipo = formData.get('tipo');
  const residenteId = formData.get('residenteId');

  if (!patente || !residenteId) {
    return { success: false, error: 'Patente y Residente son obligatorios' };
  }

  const residente = await prisma.residente.findUnique({
    where: { id: residenteId },
    select: { departamentoId: true }
  });

  if (!residente?.departamentoId) {
    return { success: false, error: 'El residente no tiene un departamento asignado.' };
  }

  try {
    await prisma.vehiculo.create({
      data: {
        patente: patente.toUpperCase(),
        marca,
        modelo,
        color,
        tipo,
        residenteId,
        departamentoId: residente.departamentoId
      }
    });

    revalidatePath('/admin/vehiculos');
    return { success: true, message: 'Vehículo registrado exitosamente' };
  } catch (error) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Esta patente ya está registrada en el sistema.' };
    }
    return { success: false, error: 'Error al registrar vehículo.' };
  }
}

export async function deleteVehiculo(id) {
  const session = await getSession();
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'SUPER_ADMIN')) {
    throw new Error('No autorizado');
  }

  await prisma.vehiculo.delete({ where: { id } });
  revalidatePath('/admin/vehiculos');
  return { success: true };
}

export async function getVehiculos() {
  return prisma.vehiculo.findMany({
    include: {
      residente: true,
      departamento: true
    },
    orderBy: { createdAt: 'desc' }
  });
}
