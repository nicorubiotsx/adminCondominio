import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ConserjeriaClient from './ConserjeriaClient';

export const metadata = { title: 'Conserjería - Portal Residente' };

export default async function ConserjeriaPage() {
  const session = await getSession();

  const visitas = await prisma.visita.findMany({
    where: { residenteId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  const encomiendas = await prisma.encomienda.findMany({
    where: { residenteId: session.userId },
    orderBy: { fechaRecepcion: 'desc' }
  });

  return <ConserjeriaClient visitas={visitas} encomiendas={encomiendas} />;
}
