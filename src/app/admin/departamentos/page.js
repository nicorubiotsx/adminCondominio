import { getDepartamentos } from '@/actions/departamentos';
import DepartamentosClient from './DepartamentosClient';

export const metadata = { title: 'Departamentos - CondoAdmin' };

export default async function DepartamentosPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const page = parseInt(params?.page || '1');
  const { departamentos, total, pages } = await getDepartamentos(search, page);

  return (
    <DepartamentosClient
      departamentos={departamentos}
      total={total}
      pages={pages}
      currentPage={page}
      search={search}
    />
  );
}
