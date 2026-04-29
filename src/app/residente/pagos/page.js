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

  return (
    <ResidentePagosClient 
      pagos={pagos} 
      residenteId={session.userId} 
      departamentoId={residente.departamentoId} 
    />
  );
}
