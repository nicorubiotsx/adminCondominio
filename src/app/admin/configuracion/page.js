import { getConfiguracion } from '@/actions/configuracion';
import { getConserjes } from '@/actions/conserjes';
import ConfigClient from './ConfigClient';

export const metadata = { title: 'Configuración - CondoAdmin' };

export default async function ConfiguracionPage() {
  const [config, conserjes] = await Promise.all([
    getConfiguracion(),
    getConserjes()
  ]);
  return <ConfigClient config={config} conserjes={conserjes} />;
}
