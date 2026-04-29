import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ResidentePerfilClient from './ResidentePerfilClient';
import { getDeudaTotal } from '@/actions/finanzas';

export const metadata = { title: 'Mi Perfil - Portal Residente' };

export default async function ResidentePerfilPage() {
  const session = await getSession();

  const residente = await prisma.residente.findUnique({
    where: { id: session.userId },
    include: { 
      departamento: true,
      pagos: { 
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      mantenimientos: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  const config = await prisma.configuracion.findUnique({ where: { id: "1" } });
  const cuotaBase = config?.cuotaBase || 0;

  // Calcular deuda real desde la base de datos
  let deuda = 0;
  if (residente.departamento) {
    deuda = await getDeudaTotal(residente.departamento.id);
  }

  return (
    <ResidentePerfilClient 
      residente={residente}
      deuda={deuda}
      cuotaBase={cuotaBase}
    />
  );
}
