'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createVisita(prevState, formData) {
  const session = await getSession();
  if (!session || session.rol !== 'RESIDENTE') throw new Error('No autorizado');

  const nombreVisitante = formData.get('nombreVisitante');
  const rutVisitante = formData.get('rutVisitante');
  const fechaEsperada = formData.get('fechaEsperada');
  const patenteVehiculo = formData.get('patenteVehiculo');
  const notas = formData.get('notas');

  if (!nombreVisitante || !fechaEsperada) {
    return { success: false, errors: { form: 'Nombre y fecha esperada son obligatorios' } };
  }

  await prisma.visita.create({
    data: {
      nombreVisitante,
      rutVisitante,
      fechaEsperada: new Date(fechaEsperada),
      patenteVehiculo,
      notas,
      residenteId: session.userId,
    }
  });

  revalidatePath('/residente/conserjeria');
  return { success: true, message: 'Visita pre-autorizada exitosamente' };
}

export async function deleteVisita(id) {
  const session = await getSession();
  if (!session || session.rol !== 'RESIDENTE') throw new Error('No autorizado');

  // No borramos, marcamos como cancelada para mantener historial
  await prisma.visita.update({
    where: { id, residenteId: session.userId },
    data: { estado: 'CANCELADA' }
  });

  revalidatePath('/residente/conserjeria');
  return { success: true };
}

export async function updateEstadoVisita(id, estado) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const data = { estado };
  if (estado === 'INGRESADA') data.fechaIngreso = new Date();
  if (estado === 'FINALIZADA') data.fechaSalida = new Date();

  await prisma.visita.update({
    where: { id },
    data
  });

  revalidatePath('/admin/conserjeria');
  revalidatePath('/conserje/visitas');
  revalidatePath('/conserje');
  return { success: true };
}

export async function registrarEncomienda(formData) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const deptoId = formData.get('departamentoId');
  const empresaDelivery = formData.get('empresaDelivery');
  const descripcion = formData.get('descripcion');

  // Buscar el residente principal de ese departamento
  const residente = await prisma.residente.findFirst({
    where: { departamentoId: deptoId, activo: true }
  });

  if (!residente) {
    return { success: false, error: 'No se encontró un residente activo en este departamento.' };
  }

  await prisma.encomienda.create({
    data: {
      empresaDelivery,
      descripcion,
      residenteId: residente.id,
      receptorId: session.userId,
      estado: 'EN_CONSERJERIA'
    }
  });

  revalidatePath('/admin/conserjeria');
  revalidatePath('/conserje/paquetes');
  revalidatePath('/conserje');
  return { success: true, message: 'Encomienda registrada.' };
}

export async function updateEstadoEncomienda(id, estado) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const data = { estado };
  if (estado === 'ENTREGADA') data.fechaEntrega = new Date();

  await prisma.encomienda.update({
    where: { id },
    data
  });

  revalidatePath('/admin/conserjeria');
  revalidatePath('/conserje/paquetes');
  revalidatePath('/conserje');
  return { success: true };
}

export async function registrarVisitaEspontanea(formData) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const nombreVisitante = formData.get('nombreVisitante');
  const rutVisitante = formData.get('rutVisitante');
  const residenteId = formData.get('residenteId');
  const patenteVehiculo = formData.get('patenteVehiculo');
  const notas = formData.get('notas');

  if (!nombreVisitante || !residenteId) {
    return { success: false, error: 'Nombre y residente de destino son obligatorios' };
  }

  await prisma.visita.create({
    data: {
      nombreVisitante,
      rutVisitante,
      residenteId,
      patenteVehiculo,
      notas,
      estado: 'INGRESADA',
      fechaEsperada: new Date(),
      fechaIngreso: new Date(),
    }
  });

  revalidatePath('/admin/conserjeria');
  revalidatePath('/conserje/visitas');
  revalidatePath('/conserje');
  return { success: true, message: 'Ingreso registrado correctamente.' };
}
