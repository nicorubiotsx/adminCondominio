'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getConserjes() {
  const session = await getSession();
  if (!session || session.rol === 'CONSERJE' || session.rol === 'RESIDENTE') throw new Error('No autorizado');

  return prisma.user.findMany({
    where: { rol: 'CONSERJE' },
    orderBy: { nombre: 'asc' }
  });
}

export async function createConserje(prevState, formData) {
  const session = await getSession();
  if (!session || session.rol === 'CONSERJE' || session.rol === 'RESIDENTE') {
    return { success: false, error: 'No autorizado' };
  }

  const nombre = formData.get('nombre');
  const apellido = formData.get('apellido');
  const email = formData.get('email');
  const password = formData.get('password');

  if (!nombre || !apellido || !email || !password) {
    return { success: false, error: 'Todos los campos son obligatorios' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { success: false, error: 'Ya existe un usuario con ese email' };

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { nombre, apellido, email, password: hashed, rol: 'CONSERJE' }
  });

  revalidatePath('/admin/configuracion');
  return { success: true, message: `Conserje ${nombre} ${apellido} creado correctamente.` };
}

export async function toggleConserjeActivo(id) {
  const session = await getSession();
  if (!session || session.rol === 'CONSERJE') throw new Error('No autorizado');

  const user = await prisma.user.findUnique({ where: { id } });
  await prisma.user.update({ where: { id }, data: { activo: !user.activo } });

  revalidatePath('/admin/configuracion');
  return { success: true };
}
