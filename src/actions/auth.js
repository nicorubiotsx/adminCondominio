'use server';

import prisma from '@/lib/prisma';
import { loginSchema, formatZodErrors } from '@/lib/validations';
import { setSession, deleteSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

import { logAudit } from '@/lib/audit';



export async function unifiedLoginAction(prevState, formData) {
  const identifier = formData.get('identifier'); // Puede ser RUT o Email
  const password = formData.get('password');
  const departamento = formData.get('departamento'); // Opcional, solo para residentes

  if (!identifier || !password) {
    return { errors: { general: 'Identificación y contraseña requeridas' }, success: false };
  }

  // DETECTAR TIPO DE USUARIO
  const isEmail = identifier.includes('@');

  if (isEmail) {
    // FLUJO STAFF (Admin / Conserje)
    // Reutilizamos la lógica de loginAction pero adaptada
    const user = await prisma.user.findUnique({
      where: { email: identifier },
    });

    if (!user || !user.activo) {
      return { errors: { general: 'Credenciales inválidas' }, success: false };
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return { errors: { general: 'Credenciales inválidas' }, success: false };
    }

    await setSession({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol,
    });

    await logAudit({
      accion: 'LOGIN',
      detalles: `Inicio de sesión unificado: ${user.rol}`,
      metadata: { email: user.email, rol: user.rol }
    });

    if (user.rol === 'CONSERJE') redirect('/conserje');
    redirect('/admin');

  } else {
    // FLUJO RESIDENTE
    if (!departamento) {
      return { errors: { general: 'El número de departamento es requerido para residentes' }, success: false };
    }

    // Reutilizamos la lógica de loginResidenteAction
    const depto = await prisma.departamento.findUnique({
      where: { numero: departamento }
    });

    if (!depto) {
      return { errors: { general: 'Departamento no encontrado' }, success: false };
    }

    const residente = await prisma.residente.findUnique({
      where: { cedula: identifier },
      include: { departamento: true }
    });

    if (!residente || !residente.activo || residente.departamentoId !== depto.id) {
      return { errors: { general: 'Credenciales inválidas' }, success: false };
    }

    const passwordToCompare = residente.password || residente.cedula;
    const validPassword = await bcrypt.compare(password, passwordToCompare).catch(() => password === passwordToCompare);

    if (!validPassword) {
      return { errors: { general: 'Contraseña incorrecta' }, success: false };
    }

    await setSession({
      userId: residente.id,
      email: residente.email,
      nombre: residente.nombre,
      apellido: residente.apellido,
      rol: 'RESIDENTE',
      departamento: depto.numero
    });

    await logAudit({
      accion: 'LOGIN_RESIDENTE',
      detalles: `Residente inició sesión unificada: Depto ${depto.numero}`,
      metadata: { cedula: identifier, depto: depto.numero }
    });

    redirect('/residente');
  }
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

  await logAudit({
    accion: 'LOGIN_RESIDENTE',
    detalles: `Residente inició sesión: Depto ${depto.numero}`,
    metadata: { cedula, depto: depto.numero }
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

// Onboarding / Primer acceso
export async function checkRut(identifier) {
  if (!identifier) return { success: false, error: 'Identificador (RUT o Email) es requerido' };

  // Intentar buscar por RUT en User
  let user = await prisma.user.findFirst({ where: { rut: identifier } });

  // Si no se encuentra por RUT, intentar por Email en User (útil para conserjes)
  if (!user && identifier.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: identifier } });
  }

  if (user) {
    return { success: true, requiresPassword: !user.password, type: 'USER', email: user.email };
  }

  // Buscar en Residente (siempre por RUT/Cédula)
  const residente = await prisma.residente.findFirst({ where: { cedula: identifier } });
  if (residente) {
    return { success: true, requiresPassword: !residente.password, type: 'RESIDENTE', email: residente.email };
  }

  return { success: false, error: 'No se encontró el usuario con los datos proporcionados' };
}

export async function createPassword(identifier, newPassword) {
  if (!identifier || !newPassword) return { success: false, error: 'Datos incompletos' };

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Buscar en User (RUT o Email)
  let user = await prisma.user.findFirst({ where: { rut: identifier } });
  if (!user && identifier.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: identifier } });
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    await logAudit({
      accion: 'ACTIVACION_CUENTA',
      detalles: `Usuario activó su cuenta: ${user.email}`,
      metadata: { userId: user.id, email: user.email }
    });

    return { success: true };
  }

  // Buscar en Residente
  const residente = await prisma.residente.findFirst({ where: { cedula: identifier } });
  if (residente) {
    await prisma.residente.update({
      where: { id: residente.id },
      data: { password: hashedPassword }
    });

    await logAudit({
      accion: 'ACTIVACION_RESIDENTE',
      detalles: `Residente activó su cuenta: ${residente.nombre} ${residente.apellido}`,
      metadata: { residenteId: residente.id, cedula: residente.cedula }
    });

    return { success: true };
  }

  return { success: false, error: 'Usuario no encontrado' };
}

export async function recoverPassword(identifier) {
  // Buscar en User
  let user = await prisma.user.findFirst({ where: { rut: identifier } });
  if (!user && identifier.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: identifier } });
  }

  if (user) {
    return { 
      success: true, 
      type: 'USER', 
      method: user.email,
      message: `Se ha enviado un código de recuperación a ${user.email.replace(/(.{3}).*(@.*)/, "$1...$2")}`
    };
  }

  // Buscar en Residente
  const residente = await prisma.residente.findFirst({ where: { cedula: identifier } });
  if (residente) {
    const contact = residente.email || residente.telefono;
    return { 
      success: true, 
      type: 'RESIDENTE', 
      method: contact,
      message: `Se ha enviado un enlace de recuperación a tu contacto registrado: ${contact?.replace(/(.{3}).*(.{4})/, "$1...$2")}`
    };
  }

  return { success: false, error: 'No se encontró ningún usuario con esa identificación.' };
}
