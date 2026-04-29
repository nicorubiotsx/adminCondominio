'use server';

import prisma from '@/lib/prisma';
import { mantenimientoSchema, formatZodErrors } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotificacion } from './notificaciones';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getMantenimientos(search = '', page = 1, limit = 10) {
  await requireAuth();
  const skip = (page - 1) * limit;
  const where = search ? { OR: [
    { titulo: { contains: search } },
    { categoria: { contains: search } },
  ] } : {};
  const [mantenimientos, total] = await Promise.all([
    prisma.mantenimiento.findMany({
      where, include: { residente: true, departamento: true },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.mantenimiento.count({ where }),
  ]);
  return { mantenimientos, total, pages: Math.ceil(total / limit) };
}

export async function createMantenimiento(prevState, formData) {
  await requireAuth();
  const rawData = {
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    prioridad: formData.get('prioridad'),
    estado: formData.get('estado') || 'PENDIENTE',
    categoria: formData.get('categoria'),
    costoEstimado: formData.get('costoEstimado'),
    residenteId: formData.get('residenteId'),
    departamentoId: formData.get('departamentoId'),
    notas: formData.get('notas'),
  };
  const result = mantenimientoSchema.safeParse(rawData);
  if (!result.success) return { errors: formatZodErrors(result.error), success: false };
  const data = { ...result.data };
  if (!data.costoEstimado) delete data.costoEstimado;
  if (!data.residenteId) delete data.residenteId;
  if (!data.departamentoId) delete data.departamentoId;
  if (!data.notas) delete data.notas;
  await prisma.mantenimiento.create({ data });
  
  if (data.residenteId) {
    const residente = await prisma.residente.findUnique({ where: { id: data.residenteId } });
    const depto = await prisma.departamento.findUnique({ where: { id: data.departamentoId } });
    await createNotificacion({
      titulo: 'Nueva Solicitud de Mantenimiento',
      mensaje: `${residente?.nombre || ''} (Depto ${depto?.numero || ''}) solicita: ${data.titulo}`,
      tipo: data.prioridad === 'URGENTE' || data.prioridad === 'ALTA' ? 'WARNING' : 'INFO',
      enlace: '/admin/mantenimiento'
    });
  }

  revalidatePath('/admin/mantenimiento');
  return { success: true, message: 'Solicitud creada exitosamente' };
}

export async function updateMantenimientoEstado(id, estado) {
  await requireAuth();
  const data = { estado };
  if (estado === 'EN_PROGRESO') data.fechaInicio = new Date();
  if (estado === 'COMPLETADO') data.fechaFin = new Date();
  await prisma.mantenimiento.update({ where: { id }, data });
  revalidatePath('/admin/mantenimiento');
  return { success: true };
}

export async function deleteMantenimiento(id) {
  await requireAuth();
  await prisma.mantenimiento.delete({ where: { id } });
  revalidatePath('/admin/mantenimiento');
  return { success: true };
}
