import prisma from '@/lib/prisma';
import ConserjeVisitasClient from './ConserjeVisitasClient';

export const metadata = { title: 'Visitas - Conserjería' };

export default async function ConserjeVisitasPage() {
  const [visitas, historial, residentes] = await Promise.all([
    prisma.visita.findMany({
      where: { estado: { in: ['PRE_AUTORIZADA', 'INGRESADA'] } },
      orderBy: { fechaEsperada: 'asc' },
      include: {
        residente: { include: { departamento: true } }
      }
    }),
    prisma.visita.findMany({
      where: {
        estado: { in: ['FINALIZADA', 'RECHAZADA', 'CANCELADA'] },
        fechaEsperada: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { fechaEsperada: 'desc' },
      take: 20,
      include: { residente: { include: { departamento: true } } }
    }),
    prisma.residente.findMany({
      where: { activo: true },
      include: { departamento: true },
      orderBy: { departamento: { numero: 'asc' } }
    })
  ]);

  return <ConserjeVisitasClient visitas={visitas} historial={historial} residentes={residentes} />;
}
