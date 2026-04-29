import { getGastos } from '@/actions/gastos';
import GastosClient from './GastosClient';

export const metadata = { title: 'Gastos Comunes - CondoAdmin' };

export default async function GastosPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || '';
  const page = parseInt(params?.page || '1');
  const { gastos, total, pages } = await getGastos(search, page);

  return <GastosClient gastos={gastos} total={total} pages={pages} currentPage={page} search={search} />;
}
