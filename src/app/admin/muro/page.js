import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import MuroClient from '@/app/residente/muro/MuroClient';

export const metadata = { title: 'Muro Comunidad - Admin' };

export default async function AdminMuroPage() {
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
      isAdmin={true} 
    />
  );
}
