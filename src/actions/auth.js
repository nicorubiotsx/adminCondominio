'use server';

import prisma from '@/lib/prisma';
import { loginSchema, formatZodErrors } from '@/lib/validations';
import { setSession, deleteSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function loginAction(prevState, formData) {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (!user || !user.activo) {
    return { errors: { email: 'Credenciales inválidas' }, success: false };
  }

  const validPassword = await bcrypt.compare(result.data.password, user.password);
  if (!validPassword) {
    return { errors: { email: 'Credenciales inválidas' }, success: false };
  }

  await setSession({
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    rol: user.rol,
  });

  if (user.rol === 'CONSERJE') {
    redirect('/conserje');
  }
  redirect('/admin');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}

export async function loginResidenteAction(prevState, formData) {
  const cedula = formData.get('cedula');
  const password = formData.get('password');
  const departamentoNumero = formData.get('departamento');

  if (!cedula || !password || !departamentoNumero) {
    return { errors: { general: 'Cédula, contraseña y departamento requeridos' }, success: false };
  }

  // Buscar el departamento para validar
  const depto = await prisma.departamento.findUnique({
    where: { numero: departamentoNumero }
  });

  if (!depto) {
    return { errors: { general: 'Credenciales inválidas' }, success: false };
  }

  const residente = await prisma.residente.findUnique({
    where: { cedula },
    include: { departamento: true }
  });

  // Validar que el residente existe, está activo y coincide con el departamento
  if (!residente || !residente.activo || residente.departamentoId !== depto.id) {
    return { errors: { general: 'Credenciales inválidas' }, success: false };
  }

  // Validar contraseña si existe, si no existe (usuario nuevo sin clave), usar cedula como clave temporal
  const passwordToCompare = residente.password || residente.cedula;
  const validPassword = await bcrypt.compare(password, passwordToCompare).catch(() => password === passwordToCompare);

  if (!validPassword) {
    return { errors: { general: 'Contraseña incorrecta' }, success: false };
  }

  // Guardamos sesión con rol especial de residente
  await setSession({
    userId: residente.id,
    email: residente.email,
    nombre: residente.nombre,
    apellido: residente.apellido,
    rol: 'RESIDENTE',
    departamento: depto.numero
  });

  redirect('/residente');
}

// Seed: crear admin por defecto si no existe
export async function ensureAdminExists() {
  const adminCount = await prisma.user.count();
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@condominio.com',
        password: hashedPassword,
        nombre: 'Admin',
        apellido: 'Sistema',
        rol: 'SUPER_ADMIN',
      },
    });
  }
}
