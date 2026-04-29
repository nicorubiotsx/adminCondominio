'use server';

import prisma from '@/lib/prisma';
import { departamentoSchema, formatZodErrors } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getDepartamentos(search = '', page = 1, limit = 10) {
  await requireAuth();
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { numero: { contains: search } },
          { torre: { contains: search } },
        ],
      }
    : {};

  const [departamentos, total] = await Promise.all([
    prisma.departamento.findMany({
      where,
      include: { residentes: { where: { activo: true } } },
      skip,
      take: limit,
      orderBy: { numero: 'asc' },
    }),
    prisma.departamento.count({ where }),
  ]);

  return { departamentos, total, pages: Math.ceil(total / limit) };
}

export async function getAllDepartamentos() {
  await requireAuth();
  return prisma.departamento.findMany({
    orderBy: { numero: 'asc' },
    include: { residentes: { where: { activo: true } } },
  });
}

export async function getDepartamento(id) {
  await requireAuth();
  return prisma.departamento.findUnique({
    where: { id },
    include: {
      residentes: true,
      pagos: { orderBy: { createdAt: 'desc' }, take: 10 },
      mantenimientos: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function createDepartamento(prevState, formData) {
  await requireAuth();

  const rawData = {
    numero: formData.get('numero'),
    piso: formData.get('piso'),
    torre: formData.get('torre'),
    tipo: formData.get('tipo'),
    metrosCuadrados: formData.get('metrosCuadrados'),
    habitaciones: formData.get('habitaciones'),
    banos: formData.get('banos'),
    estacionamiento: formData.get('estacionamiento') === 'on',
    alicuota: formData.get('alicuota'),
    estado: formData.get('estado'),
  };

  const result = departamentoSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const existing = await prisma.departamento.findUnique({
    where: { numero: result.data.numero },
  });
  if (existing) {
    return { errors: { numero: 'Ya existe un departamento con este número' }, success: false };
  }

  const data = { ...result.data };
  if (!data.torre) delete data.torre;
  if (!data.metrosCuadrados) delete data.metrosCuadrados;
  if (data.habitaciones === '') delete data.habitaciones;
  if (data.banos === '') delete data.banos;

  await prisma.departamento.create({ data });
  revalidatePath('/admin/departamentos');
  return { success: true, message: 'Departamento creado exitosamente' };
}

export async function updateDepartamento(id, prevState, formData) {
  await requireAuth();

  const rawData = {
    numero: formData.get('numero'),
    piso: formData.get('piso'),
    torre: formData.get('torre'),
    tipo: formData.get('tipo'),
    metrosCuadrados: formData.get('metrosCuadrados'),
    habitaciones: formData.get('habitaciones'),
    banos: formData.get('banos'),
    estacionamiento: formData.get('estacionamiento') === 'on',
    alicuota: formData.get('alicuota'),
    estado: formData.get('estado'),
  };

  const result = departamentoSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const existing = await prisma.departamento.findFirst({
    where: { numero: result.data.numero, NOT: { id } },
  });
  if (existing) {
    return { errors: { numero: 'Ya existe otro departamento con este número' }, success: false };
  }

  const data = { ...result.data };
  data.torre = data.torre || null;
  data.metrosCuadrados = data.metrosCuadrados || null;
  data.habitaciones = data.habitaciones === '' ? null : data.habitaciones;
  data.banos = data.banos === '' ? null : data.banos;

  await prisma.departamento.update({ where: { id }, data });
  revalidatePath('/admin/departamentos');
  return { success: true, message: 'Departamento actualizado exitosamente' };
}

export async function deleteDepartamento(id) {
  await requireAuth();
  // Check if has residents
  const dept = await prisma.departamento.findUnique({
    where: { id },
    include: { residentes: { where: { activo: true } } },
  });
  if (dept.residentes.length > 0) {
    return { success: false, error: 'No se puede eliminar un departamento con residentes activos' };
  }
  await prisma.departamento.delete({ where: { id } });
  revalidatePath('/admin/departamentos');
  return { success: true };
}
