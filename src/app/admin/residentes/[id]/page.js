import { getResidente } from '@/actions/residentes';
import { getAllDepartamentos } from '@/actions/departamentos';
import { notFound } from 'next/navigation';
import ResidenteDetailClient from './ResidenteDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const residente = await getResidente(id);
  return { title: residente ? `${residente.nombre} ${residente.apellido} - CondoAdmin` : 'Residente no encontrado' };
}

export default async function ResidenteDetailPage({ params }) {
  const { id } = await params;
  const residente = await getResidente(id);
  if (!residente) notFound();
  const departamentos = await getAllDepartamentos();

  return <ResidenteDetailClient residente={residente} departamentos={departamentos} />;
}
