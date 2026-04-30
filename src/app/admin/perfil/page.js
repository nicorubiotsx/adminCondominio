import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import AdminPerfilClient from './AdminPerfilClient';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Mi Perfil - CondoAdmin' };

export default async function AdminPerfilPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  if (!user) {
    // Si el usuario no existe (ej. DB reseteada pero cookie activa)
    redirect('/login');
  }

  return <AdminPerfilClient user={user} />;
}
