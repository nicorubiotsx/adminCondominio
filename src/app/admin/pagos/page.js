import { getPagos } from '@/actions/pagos';
import { getResidentes } from '@/actions/residentes';
import { getAllDepartamentos } from '@/actions/departamentos';
import PagosClient from './PagosClient';

export const metadata = { title: 'Pagos - CondoAdmin' };

export default async function PagosPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const page = parseInt(params?.page || '1');
  const filtroEstado = params?.estado || '';
  const { pagos, total, pages } = await getPagos(search, page, 10, filtroEstado);
  const { residentes } = await getResidentes('', 1, 500);
  const departamentos = await getAllDepartamentos();

  return (
    <PagosClient
      pagos={pagos}
      residentes={residentes}
      departamentos={departamentos}
      total={total}
      pages={pages}
      currentPage={page}
      search={search}
      filtroEstado={filtroEstado}
    />
  );
}
