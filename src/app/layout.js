import './globals.css';

export const metadata = {
  title: 'CondoAdmin - Sistema de Gestión de Condominio',
  description: 'Sistema completo de administración de condominio. Gestión de residentes, departamentos, pagos, gastos y mantenimiento.',
};

import ToasterProvider from '@/components/ToasterProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
