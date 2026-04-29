import prisma from '@/lib/prisma';
import ConserjePaquetesClient from './ConserjePaquetesClient';

export const metadata = { title: 'Paquetes - Conserjería' };

export default async function ConserjePaquetesPage() {
  const [pendientes, entregados, departamentos] = await Promise.all([
    prisma.encomienda.findMany({
      where: { estado: 'EN_CONSERJERIA' },
      orderBy: { fechaRecepcion: 'desc' },
      include: { residente: { include: { departamento: true } } }
    }),
    prisma.encomienda.findMany({
      where: {
        estado: 'ENTREGADA',
        fechaEntrega: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { fechaEntrega: 'desc' },
      take: 20,
      include: { residente: { include: { departamento: true } } }
    }),
    prisma.departamento.findMany({
      orderBy: { numero: 'asc' },
      include: { residentes: { where: { activo: true }, take: 1 } }
    })
  ]);

  return <ConserjePaquetesClient pendientes={pendientes} entregados={entregados} departamentos={departamentos} />;
}
