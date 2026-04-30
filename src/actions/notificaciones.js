'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getNotificaciones() {
  const session = await requireAuth();
  
  const where = {};
  if (session.rol === 'RESIDENTE') {
    where.usuarioId = session.userId;
  } else {
    // Para admins
    where.usuarioId = null;
  }

  const notificaciones = await prisma.notificacion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const unreadCount = await prisma.notificacion.count({
    where: { ...where, leida: false }
  });

  return { notificaciones, unreadCount };
}

export async function markAsRead(id) {
  await requireAuth();
  await prisma.notificacion.update({
    where: { id },
    data: { leida: true }
  });
  revalidatePath('/', 'layout');
}

export async function markAllAsRead() {
  const session = await requireAuth();
  const where = session.rol === 'RESIDENTE' ? { usuarioId: session.userId } : { usuarioId: null };
  
  await prisma.notificacion.updateMany({
    where: { ...where, leida: false },
    data: { leida: true }
  });
  revalidatePath('/', 'layout');
}

export async function createNotificacion({ titulo, mensaje, tipo = 'INFO', enlace = null, usuarioId = null }) {
  await prisma.notificacion.create({
    data: {
      titulo,
      mensaje,
      tipo,
      enlace,
      usuarioId
    }
  });
}

export async function createBulkNotificaciones({ titulo, mensaje, tipo = 'INFO', enlace = null, usuariosIds = [] }) {
  if (usuariosIds.length === 0) return;
  
  const data = usuariosIds.map(id => ({
    titulo,
    mensaje,
    tipo,
    enlace,
    usuarioId: id
  }));

  await prisma.notificacion.createMany({
    data
  });
}
