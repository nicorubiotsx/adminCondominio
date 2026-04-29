import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ConserjeNav from '@/components/ConserjeNav';

export const metadata = { title: 'Portal Conserjería - CondoAdmin' };

export default async function ConserjeLayout({ children }) {
  const session = await getSession();
  if (!session || session.rol !== 'CONSERJE') redirect('/login');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <ConserjeNav user={session} />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}
