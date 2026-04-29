import { getAnuncios } from '@/actions/anuncios';
import AnunciosClient from './AnunciosClient';

export const metadata = { title: 'Anuncios - CondoAdmin' };

export default async function AnunciosPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1');
  const { anuncios, total, pages } = await getAnuncios(page);

  return <AnunciosClient anuncios={anuncios} total={total} pages={pages} currentPage={page} />;
}
