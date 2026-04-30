'use server';

import prisma from '@/lib/prisma';
import { anuncioSchema, formatZodErrors } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getAnuncios(page = 1, limit = 10) {
  await requireAuth();
  const skip = (page - 1) * limit;
  const [anuncios, total] = await Promise.all([
    prisma.anuncio.findMany({
      include: { autor: { select: { nombre: true, apellido: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.anuncio.count(),
  ]);
  return { anuncios, total, pages: Math.ceil(total / limit) };
}

export async function createAnuncio(prevState, formData) {
  const session = await requireAuth();
  const rawData = {
    titulo: formData.get('titulo'),
    contenido: formData.get('contenido'),
    prioridad: formData.get('prioridad'),
    fechaFin: formData.get('fechaFin'),
  };
  const result = anuncioSchema.safeParse(rawData);
  if (!result.success) return { errors: formatZodErrors(result.error), success: false };
  const data = { ...result.data, autorId: session.userId };
  if (!data.fechaFin) delete data.fechaFin;
  
  const anuncio = await prisma.anuncio.create({ data });

  // Notificar por correo si es ALTA o URGENTE
  if (anuncio.prioridad === 'ALTA' || anuncio.prioridad === 'URGENTE') {
    const { sendEmail, templates } = await import('@/lib/email');
    const residentesConCorreo = await prisma.residente.findMany({
      where: { activo: true, email: { not: null } },
      select: { email: true }
    });
    
    if (residentesConCorreo.length > 0) {
      const template = templates.nuevoAnuncio(anuncio);
      // Enviar a todos (en producción sería mejor usar una cola de correos o BCC)
      const correos = residentesConCorreo.map(r => r.email).join(',');
      await sendEmail({
        to: correos,
        ...template
      });
    }
  }

  revalidatePath('/admin/anuncios');
  return { success: true, message: 'Anuncio creado exitosamente' };
}

export async function updateAnuncio(id, prevState, formData) {
  await requireAuth();
  const rawData = {
    titulo: formData.get('titulo'),
    contenido: formData.get('contenido'),
    prioridad: formData.get('prioridad'),
    fechaFin: formData.get('fechaFin'),
  };
  const result = anuncioSchema.safeParse(rawData);
  if (!result.success) return { errors: formatZodErrors(result.error), success: false };
  
  const data = { ...result.data };
  if (!data.fechaFin) {
    data.fechaFin = null;
  } else {
    data.fechaFin = new Date(data.fechaFin);
  }
  
  await prisma.anuncio.update({
    where: { id },
    data
  });

  revalidatePath('/admin/anuncios');
  return { success: true, message: 'Anuncio actualizado' };
}

export async function toggleAnuncio(id) {
  await requireAuth();
  const anuncio = await prisma.anuncio.findUnique({ where: { id } });
  await prisma.anuncio.update({ where: { id }, data: { activo: !anuncio.activo } });
  revalidatePath('/admin/anuncios');
  return { success: true };
}

export async function deleteAnuncio(id) {
  await requireAuth();
  await prisma.anuncio.delete({ where: { id } });
  revalidatePath('/admin/anuncios');
  return { success: true };
}
