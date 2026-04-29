import prisma from '@/lib/prisma';
import ConserjeriaAdminClient from './ConserjeriaAdminClient';

export const metadata = { title: 'Conserjería - Admin' };

export default async function AdminConserjeriaPage() {
  const [visitas, encomiendas, departamentos] = await Promise.all([
    prisma.visita.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        residente: { include: { departamento: true } }
      }
    }),
    prisma.encomienda.findMany({
      orderBy: { fechaRecepcion: 'desc' },
      take: 50,
      include: {
        residente: { include: { departamento: true } }
      }
    }),
    prisma.departamento.findMany({
      orderBy: { numero: 'asc' },
      include: { residentes: { where: { activo: true }, take: 1 } }
    })
  ]);

  return <ConserjeriaAdminClient visitas={visitas} encomiendas={encomiendas} departamentos={departamentos} />;
}

