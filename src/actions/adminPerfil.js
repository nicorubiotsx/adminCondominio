'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

async function requireAuth() {
  const session = await getSession();
  if (!session || session.rol === 'RESIDENTE') throw new Error('No autorizado');
  return session;
}

export async function updateAdminProfile(prevState, formData) {
  const session = await requireAuth();

  const data = {
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
  };

  // Validaciones básicas
  if (!data.nombre || !data.apellido || !data.email) {
    return { errors: { general: 'Todos los campos son requeridos' }, success: false };
  }

  // Verificar si el email ya existe en otro admin
  const existing = await prisma.user.findFirst({
    where: { 
      email: data.email,
      NOT: { id: session.userId }
    }
  });

  if (existing) {
    return { errors: { email: 'Este correo ya está en uso' }, success: false };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
    }
  });

  revalidatePath('/admin/perfil');
  revalidatePath('/admin', 'layout'); // Para actualizar el Sidebar
  return { success: true, message: 'Perfil actualizado exitosamente' };
}

export async function changeAdminPassword(prevState, formData) {
  const session = await requireAuth();

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { errors: { general: 'Todos los campos son requeridos' }, success: false };
  }

  if (newPassword !== confirmPassword) {
    return { errors: { confirmPassword: 'Las contraseñas nuevas no coinciden' }, success: false };
  }

  if (newPassword.length < 6) {
    return { errors: { newPassword: 'La contraseña debe tener al menos 6 caracteres' }, success: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { errors: { currentPassword: 'La contraseña actual es incorrecta' }, success: false };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashedPassword }
  });

  return { success: true, message: 'Contraseña cambiada exitosamente' };
}
