import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ResidentePagosClient from './ResidentePagosClient';

export const metadata = { title: 'Mis Pagos - Portal Residente' };

export default async function ResidentePagosPage() {
  const session = await getSession();

  const residente = await prisma.residente.findUnique({
    where: { id: session.userId },
    include: { departamento: true }
  });

  const pagos = await prisma.pago.findMany({
    where: { residenteId: session.userId },
    orderBy: { fechaPago: 'desc' }
  });

  const deudas = await prisma.deudaMensual.findMany({
    where: { 
      departamentoId: residente.departamentoId,
      estado: { in: ['PENDIENTE', 'PARCIAL'] }
    },
    orderBy: { mes: 'asc' }
  });

  return (
    <ResidentePagosClient 
      pagos={pagos} 
      deudas={deudas}
      residenteId={session.userId} 
      departamentoId={residente.departamentoId} 
    />
  );
}
