import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export const metadata = {
  title: 'Panel Admin - CondoAdmin',
};

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <MobileNav>
      <div className="admin-layout">
        <Sidebar user={session} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </MobileNav>
  );
}
