import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ResidenteMantenimientoClient from './ResidenteMantenimientoClient';

export const metadata = { title: 'Mantenimiento - Portal Residente' };

export default async function ResidenteMantenimientoPage() {
  const session = await getSession();

  const residente = await prisma.residente.findUnique({
    where: { id: session.userId },
    include: { departamento: true }
  });

  const mantenimientos = await prisma.mantenimiento.findMany({
    where: { residenteId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <ResidenteMantenimientoClient 
      mantenimientos={mantenimientos} 
      residenteId={session.userId} 
      departamentoId={residente.departamentoId} 
    />
  );
}
