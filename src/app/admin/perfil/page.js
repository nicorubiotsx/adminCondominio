import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import AdminPerfilClient from './AdminPerfilClient';

export const metadata = { title: 'Mi Perfil - CondoAdmin' };

export default async function AdminPerfilPage() {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  return <AdminPerfilClient user={user} />;
}
