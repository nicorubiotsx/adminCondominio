import prisma from '@/lib/prisma';
import AdminReservasClient from './AdminReservasClient';

export const metadata = { title: 'Áreas Comunes - Admin' };

export default async function AdminReservasPage() {
  const areasComunes = await prisma.areaComun.findMany();
  const reservas = await prisma.reserva.findMany({ include: { residente: true, areaComun: true } });

  return <AdminReservasClient areasComunes={areasComunes} reservas={reservas} />;
}
