import { getMantenimientos } from '@/actions/mantenimiento';
import { getResidentes } from '@/actions/residentes';
import { getAllDepartamentos } from '@/actions/departamentos';
import MantenimientoClient from './MantenimientoClient';

export const metadata = { title: 'Mantenimiento - CondoAdmin' };

export default async function MantenimientoPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const page = parseInt(params?.page || '1');
  const { mantenimientos, total, pages } = await getMantenimientos(search, page);
  const { residentes } = await getResidentes('', 1, 500);
  const departamentos = await getAllDepartamentos();

  return (
    <MantenimientoClient
      mantenimientos={mantenimientos}
      residentes={residentes}
      departamentos={departamentos}
      total={total}
      pages={pages}
      currentPage={page}
      search={search}
    />
  );
}
