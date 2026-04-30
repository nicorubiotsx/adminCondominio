'use server';

import prisma from '@/lib/prisma';
import { residenteSchema, formatZodErrors } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getResidentes(search = '', page = 1, limit = 10, tipo = '', activo = '') {
  await requireAuth();
  const skip = (page - 1) * limit;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { apellido: { contains: search, mode: 'insensitive' } },
      { cedula: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (tipo) {
    where.tipo = tipo;
  }

  if (activo !== '') {
    where.activo = activo === 'true';
  }

  const [residentes, total] = await Promise.all([
    prisma.residente.findMany({
      where,
      include: { departamento: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.residente.count({ where }),
  ]);

  return { residentes, total, pages: Math.ceil(total / limit) };
}

export async function getResidente(id) {
  await requireAuth();
  return prisma.residente.findUnique({
    where: { id },
    include: {
      departamento: true,
      pagos: { orderBy: { createdAt: 'desc' }, take: 10 },
      mantenimientos: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function createResidente(prevState, formData) {
  await requireAuth();

  const rawData = {
    cedula: formData.get('cedula'),
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    telefonoAlt: formData.get('telefonoAlt'),
    tipo: formData.get('tipo'),
    departamentoId: formData.get('departamentoId'),
    notas: formData.get('notas'),
  };

  const result = residenteSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  // Check if cedula already exists
  const existing = await prisma.residente.findUnique({
    where: { cedula: result.data.cedula },
  });
  if (existing) {
    return { errors: { cedula: 'Ya existe un residente con este RUT' }, success: false };
  }

  const data = { ...result.data };
  if (!data.email) delete data.email;
  if (!data.telefonoAlt) delete data.telefonoAlt;
  if (!data.departamentoId) delete data.departamentoId;
  if (!data.notas) delete data.notas;

  // No seteamos password por defecto para permitir el flujo de activación
  // data.password = await bcrypt.hash(data.cedula, 12);

  await prisma.residente.create({ data });

  await logAudit({
    accion: 'CREAR_RESIDENTE',
    detalles: `Residente creado: ${data.nombre} ${data.apellido}`,
    metadata: { cedula: data.cedula, tipo: data.tipo }
  });

  revalidatePath('/admin/residentes');
  return { success: true, message: 'Residente creado exitosamente' };
}

export async function updateResidente(id, prevState, formData) {
  await requireAuth();

  const rawData = {
    cedula: formData.get('cedula'),
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    telefonoAlt: formData.get('telefonoAlt'),
    tipo: formData.get('tipo'),
    departamentoId: formData.get('departamentoId'),
    notas: formData.get('notas'),
  };

  const result = residenteSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const existing = await prisma.residente.findFirst({
    where: { cedula: result.data.cedula, NOT: { id } },
  });
  if (existing) {
    return { errors: { cedula: 'Ya existe otro residente con este RUT' }, success: false };
  }

  const data = { ...result.data };
  data.email = data.email || null;
  data.telefonoAlt = data.telefonoAlt || null;
  data.departamentoId = data.departamentoId || null;
  data.notas = data.notas || null;

  await prisma.residente.update({ where: { id }, data });

  await logAudit({
    accion: 'ACTUALIZAR_RESIDENTE',
    detalles: `Residente actualizado: ${data.nombre} ${data.apellido}`,
    metadata: { id, cedula: data.cedula }
  });

  revalidatePath('/admin/residentes');
  revalidatePath(`/admin/residentes/${id}`);
  return { success: true, message: 'Residente actualizado exitosamente' };
}

export async function deleteResidente(id) {
  await requireAuth();
  await prisma.residente.update({
    where: { id },
    data: { activo: false },
  });

  await logAudit({
    accion: 'ELIMINAR_RESIDENTE',
    detalles: `Residente desactivado (eliminado lógicamente): ${id}`,
    metadata: { id }
  });

  revalidatePath('/admin/residentes');
  return { success: true };
}

export async function resetPassword(id) {
  await requireAuth();
  const residente = await prisma.residente.findUnique({ where: { id } });
  if (!residente) return { success: false, error: 'Residente no encontrado' };

  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash(residente.cedula, 12);

  await prisma.residente.update({
    where: { id },
    data: { password: hashedPassword }
  });

  await logAudit({
    accion: 'RESETEO_PASSWORD_ADMIN',
    detalles: `Admin reseteó contraseña de: ${residente.nombre} ${residente.apellido}`,
    metadata: { residenteId: id }
  });

  return { success: true, message: 'La contraseña ha sido reseteada al RUT del residente.' };
}

export async function toggleResidenteStatus(id) {
  await requireAuth();
  const residente = await prisma.residente.findUnique({ where: { id } });
  await prisma.residente.update({
    where: { id },
    data: { activo: !residente.activo },
  });
  revalidatePath('/admin/residentes');
  return { success: true };
}

export async function updateMiPerfil(prevState, formData) {
  const session = await getSession();
  if (!session || session.rol !== 'RESIDENTE') throw new Error('No autorizado');

  const email = formData.get('email') || null;
  const telefono = formData.get('telefono');
  const telefonoAlt = formData.get('telefonoAlt') || null;

  if (!telefono) {
    return { errors: { telefono: 'El teléfono es requerido' }, success: false };
  }

  await prisma.residente.update({
    where: { id: session.userId },
    data: { email, telefono, telefonoAlt }
  });

  revalidatePath('/residente/perfil');
  return { success: true, message: 'Perfil actualizado exitosamente' };
}

export async function changePasswordResidente(prevState, formData) {
  const session = await getSession();
  if (!session || session.rol !== 'RESIDENTE') throw new Error('No autorizado');

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { errors: { form: 'Todos los campos son obligatorios' }, success: false };
  }

  if (newPassword !== confirmPassword) {
    return { errors: { confirmPassword: 'Las contraseñas no coinciden' }, success: false };
  }

  if (newPassword.length < 6) {
    return { errors: { newPassword: 'La contraseña debe tener al menos 6 caracteres' }, success: false };
  }

  const residente = await prisma.residente.findUnique({ where: { id: session.userId } });
  
  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(currentPassword, residente.password);
  
  if (!valid) {
    return { errors: { currentPassword: 'La contraseña actual es incorrecta' }, success: false };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  await prisma.residente.update({
    where: { id: session.userId },
    data: { password: hashedPassword }
  });

  return { success: true, message: 'Contraseña actualizada exitosamente' };
}
