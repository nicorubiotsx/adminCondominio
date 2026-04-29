'use server';

import prisma from '@/lib/prisma';
import { gastoComunSchema, formatZodErrors } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getGastos(search = '', page = 1, limit = 10) {
  await requireAuth();
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { concepto: { contains: search } },
          { proveedor: { contains: search } },
          { categoria: { contains: search } },
        ],
      }
    : {};

  const [gastos, total] = await Promise.all([
    prisma.gastoComun.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha: 'desc' },
    }),
    prisma.gastoComun.count({ where }),
  ]);

  return { gastos, total, pages: Math.ceil(total / limit) };
}

export async function createGasto(prevState, formData) {
  await requireAuth();

  const rawData = {
    concepto: formData.get('concepto'),
    descripcion: formData.get('descripcion'),
    monto: formData.get('monto'),
    fecha: formData.get('fecha'),
    categoria: formData.get('categoria'),
    proveedor: formData.get('proveedor'),
    factura: formData.get('factura'),
  };

  const result = gastoComunSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const data = { ...result.data };
  if (!data.descripcion) delete data.descripcion;
  if (!data.proveedor) delete data.proveedor;
  if (!data.factura) delete data.factura;

  await prisma.gastoComun.create({ data });
  revalidatePath('/admin/gastos');
  return { success: true, message: 'Gasto registrado exitosamente' };
}

export async function updateGasto(id, prevState, formData) {
  await requireAuth();

  const rawData = {
    concepto: formData.get('concepto'),
    descripcion: formData.get('descripcion'),
    monto: formData.get('monto'),
    fecha: formData.get('fecha'),
    categoria: formData.get('categoria'),
    proveedor: formData.get('proveedor'),
    factura: formData.get('factura'),
  };

  const result = gastoComunSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const data = { ...result.data };
  data.descripcion = data.descripcion || null;
  data.proveedor = data.proveedor || null;
  data.factura = data.factura || null;

  await prisma.gastoComun.update({ where: { id }, data });
  revalidatePath('/admin/gastos');
  return { success: true, message: 'Gasto actualizado exitosamente' };
}

export async function deleteGasto(id) {
  await requireAuth();
  await prisma.gastoComun.delete({ where: { id } });
  revalidatePath('/admin/gastos');
  return { success: true };
}

export async function getGastosResumen() {
  await requireAuth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const gastosMes = await prisma.gastoComun.aggregate({
    where: {
      fecha: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { monto: true },
    _count: true,
  });

  const gastosPorCategoria = await prisma.gastoComun.groupBy({
    by: ['categoria'],
    where: {
      fecha: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { monto: true },
    _count: true,
  });

  return { gastosMes, gastosPorCategoria };
}
