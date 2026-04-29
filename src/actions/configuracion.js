'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await getSession();
  if (!session || session.rol === 'RESIDENTE') throw new Error('No autorizado');
  return session;
}

export async function getConfiguracion() {
  // Solo los admin necesitan esto para configurarla, pero los residentes pueden leerla
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  let config = await prisma.configuracion.findUnique({
    where: { id: "1" }
  });

  if (!config) {
    config = await prisma.configuracion.create({
      data: { id: "1" }
    });
  }

  return config;
}

export async function updateConfiguracion(prevState, formData) {
  await requireAuth();

  const data = {
    nombreCondominio: formData.get('nombreCondominio'),
    direccion: formData.get('direccion'),
    telefono: formData.get('telefono'),
    emailContacto: formData.get('emailContacto'),
    cuotaBase: parseInt(formData.get('cuotaBase') || 0, 10),
    moneda: formData.get('moneda') || 'CLP',
    bancoNombre: formData.get('bancoNombre'),
    bancoCuenta: formData.get('bancoCuenta'),
    bancoTitular: formData.get('bancoTitular'),
    bancoRut: formData.get('bancoRut'),
    diasMorosidad: parseInt(formData.get('diasMorosidad') || 5, 10),
    tasaMora: parseInt(formData.get('tasaMora') || 0, 10),
  };

  await prisma.configuracion.upsert({
    where: { id: "1" },
    update: data,
    create: { id: "1", ...data }
  });

  revalidatePath('/admin/configuracion');
  return { success: true, message: 'Configuración actualizada exitosamente' };
}
