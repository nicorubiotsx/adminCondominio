'use server';

import prisma from '@/lib/prisma';
import { pagoSchema, formatZodErrors } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotificacion } from './notificaciones';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function getPagos(search = '', page = 1, limit = 10, filtroEstado = '') {
  await requireAuth();
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.OR = [
      { referencia: { contains: search } },
      { residente: { nombre: { contains: search } } },
      { residente: { apellido: { contains: search } } },
      { departamento: { numero: { contains: search } } },
    ];
  }

  if (filtroEstado) {
    where.estado = filtroEstado;
  }

  const [pagos, total] = await Promise.all([
    prisma.pago.findMany({
      where,
      include: {
        residente: true,
        departamento: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pago.count({ where }),
  ]);

  return { pagos, total, pages: Math.ceil(total / limit) };
}

export async function createPago(prevState, formData) {
  await requireAuth();

  const rawData = {
    monto: formData.get('monto'),
    mesPago: formData.get('mesPago'),
    metodoPago: formData.get('metodoPago'),
    referencia: formData.get('referencia'),
    estado: formData.get('estado') || 'PENDIENTE',
    residenteId: formData.get('residenteId'),
    departamentoId: formData.get('departamentoId'),
    notas: formData.get('notas'),
  };

  const result = pagoSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: formatZodErrors(result.error), success: false };
  }

  const data = { ...result.data };
  if (!data.referencia) delete data.referencia;
  if (!data.notas) delete data.notas;

  await prisma.pago.create({ data });
  
  // Notificar a los admins
  const residente = await prisma.residente.findUnique({ where: { id: data.residenteId } });
  const depto = await prisma.departamento.findUnique({ where: { id: data.departamentoId } });
  
  await createNotificacion({
    titulo: 'Nuevo Pago Registrado',
    mensaje: `El residente ${residente?.nombre || ''} ha registrado un pago para el depto ${depto?.numero || ''} por el monto de $${data.monto}.`,
    tipo: 'SUCCESS',
    enlace: '/admin/pagos'
  });

  revalidatePath('/admin/pagos');
  return { success: true, message: 'Pago registrado exitosamente' };
}

import { sendEmail, templates } from '@/lib/email';

export async function updatePagoEstado(id, estado) {
  await requireAuth();
  
  const pago = await prisma.pago.update({
    where: { id },
    data: { estado },
    include: { residente: true, departamento: true }
  });

  // Si se verificó exitosamente y el residente tiene correo, enviar recibo
  if (estado === 'VERIFICADO' && pago.residente?.email) {
    const template = templates.pagoVerificado(pago.residente, pago);
    await sendEmail({
      to: pago.residente.email,
      ...template
    });
  }

  revalidatePath('/admin/pagos');
  return { success: true };
}

export async function deletePago(id) {
  await requireAuth();
  // No borramos, anulamos para mantener trazabilidad
  await prisma.pago.update({ 
    where: { id },
    data: { estado: 'ANULADO' } 
  });
  revalidatePath('/admin/pagos');
  return { success: true };
}

