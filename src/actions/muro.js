'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createPublicacion(prevState, formData) {
  const session = await getSession();
  if (!session || session.rol !== 'RESIDENTE') throw new Error('No autorizado');

  const titulo = formData.get('titulo');
  const contenido = formData.get('contenido');
  const tipo = formData.get('tipo');

  if (!titulo || !contenido) {
    return { success: false, errors: { form: 'Título y contenido son obligatorios' } };
  }

  await prisma.publicacion.create({
    data: {
      titulo,
      contenido,
      tipo,
      residenteId: session.userId,
    }
  });

  revalidatePath('/residente/muro');
  return { success: true };
}

export async function deletePublicacion(id) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  const publicacion = await prisma.publicacion.findUnique({ where: { id } });
  
  // Solo el autor o el admin pueden borrar
  if (session.rol === 'RESIDENTE' && publicacion.residenteId !== session.userId) {
    throw new Error('No autorizado para borrar');
  }

  await prisma.publicacion.update({
    where: { id },
    data: { activa: false }
  });

  revalidatePath('/residente/muro');
  revalidatePath('/admin/muro');
  return { success: true };
}
