import prisma from '@/lib/prisma';
import VehiculosClient from './VehiculosClient';

export const metadata = { title: 'Gestión de Vehículos - Admin' };

export default async function VehiculosPage() {
  const [vehiculos, residentes] = await Promise.all([
    prisma.vehiculo.findMany({
      include: {
        residente: true,
        departamento: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.residente.findMany({
      where: { activo: true },
      include: { departamento: true },
      orderBy: { nombre: 'asc' }
    })
  ]);

  return <VehiculosClient initialVehiculos={vehiculos} residentes={residentes} />;
}
