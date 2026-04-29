import { getResidentes } from '@/actions/residentes';
import { getAllDepartamentos } from '@/actions/departamentos';
import ResidentesClient from './ResidentesClient';

export const metadata = { title: 'Residentes - CondoAdmin' };

export default async function ResidentesPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const tipo = params?.tipo || '';
  const activo = params?.activo || '';
  const page = parseInt(params?.page || '1');
  const { residentes, total, pages } = await getResidentes(search, page, 10, tipo, activo);
  const departamentos = await getAllDepartamentos();

  return (
    <ResidentesClient
      residentes={residentes}
      departamentos={departamentos}
      total={total}
      pages={pages}
      currentPage={page}
      search={search}
    />
  );
}
