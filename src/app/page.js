import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ensureAdminExists } from '@/actions/auth';

export default async function Home() {
  await ensureAdminExists();
  const session = await getSession();
  if (session) {
    redirect('/admin');
  } else {
    redirect('/login');
  }
}
