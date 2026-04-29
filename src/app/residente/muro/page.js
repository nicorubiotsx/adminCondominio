import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import MuroClient from './MuroClient';

export const metadata = { title: 'Muro Comunidad - Portal Residente' };

export default async function MuroPage() {
  const session = await getSession();

  const publicaciones = await prisma.publicacion.findMany({
    where: { activa: true },
    orderBy: { createdAt: 'desc' },
    include: {
      residente: {
        include: { departamento: true }
      }
    }
  });

  return (
    <MuroClient 
      publicaciones={publicaciones} 
      currentUserId={session.userId} 
      isAdmin={false} 
    />
  );
}
