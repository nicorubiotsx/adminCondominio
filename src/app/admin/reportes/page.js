import { getReportesData, getMorosidad } from '@/actions/reportes';
import ReportesClient from './ReportesClient';
import { getCurrentMonth } from '@/lib/utils';

export const metadata = { title: 'Reportes - CondoAdmin' };

export default async function ReportesPage({ searchParams }) {
  const params = await searchParams;
  const mesFin = params?.mesFin || getCurrentMonth();
  
  // Por defecto 6 meses atrás
  const [year, month] = mesFin.split('-');
  let startMonth = parseInt(month) - 5;
  let startYear = parseInt(year);
  if (startMonth <= 0) {
    startMonth += 12;
    startYear -= 1;
  }
  const defaultMesInicio = `${startYear}-${startMonth.toString().padStart(2, '0')}`;
  const mesInicio = params?.mesInicio || defaultMesInicio;

  const data = await getReportesData(mesInicio, mesFin);
  const morosidad = await getMorosidad();

  return (
    <ReportesClient 
      data={data} 
      morosidad={morosidad}
      mesInicio={mesInicio}
      mesFin={mesFin}
    />
  );
}
