import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ReservasClient from './ReservasClient';

export const metadata = { title: 'Reservas - Portal Residente' };

export default async function ReservasPage() {
  const session = await getSession();

  const areasComunes = await prisma.areaComun.findMany({
    where: { activa: true },
    orderBy: { nombre: 'asc' }
  });

  const reservas = await prisma.reserva.findMany({
    where: { residenteId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      areaComun: true
    }
  });

  return <ReservasClient reservas={reservas} areasComunes={areasComunes} />;
}
