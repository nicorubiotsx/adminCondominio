'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Configuración de Mercado Pago
// En producción, usa tu Access Token real de Chile configurado en .env
const mpToken = process.env.MP_ACCESS_TOKEN && !process.env.MP_ACCESS_TOKEN.includes('TU_ACCESS_TOKEN') 
  ? process.env.MP_ACCESS_TOKEN 
  : 'TEST-3392471691238472-042813-882f05a96db4e9d08e1c6b8c8d880d6b-1786524387';

const client = new MercadoPagoConfig({ 
  accessToken: mpToken
});

export async function createPaymentPreference({ monto, mesPago, departamentoId, residenteId }) {
  const session = await getSession();
  if (!session) throw new Error('No autorizado');

  try {
    const preference = new Preference(client);

    // Creamos la preferencia (link de pago) en Mercado Pago
    // Limpiamos el monto de puntos o caracteres no numéricos (común en Chile: 150.000)
    const montoLimpio = String(monto).replace(/\D/g, '');
    const montoFinal = parseInt(montoLimpio, 10);

    if (isNaN(montoFinal) || montoFinal <= 0) {
      return { success: false, error: 'El monto debe ser un número válido' };
    }

    const result = await preference.create({
      body: {
        items: [
          {
            id: `PAGO-${mesPago}-${departamentoId}`,
            title: `Gasto Común - ${mesPago}`,
            description: `Pago de gastos comunes del departamento ${session.departamento} correspondiente al mes ${mesPago}`,
            quantity: 1,
            unit_price: montoFinal,
            currency_id: 'CLP',
          }
        ],
        payer: {
          name: session.nombre,
          surname: session.apellido,
          email: session.email || 'residente@condominio.com',
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/residente/pagos`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/residente/pagos`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/residente/pagos`
        },
        // Adjuntamos metadatos para saber a qué corresponde el pago al volver
        metadata: {
          residente_id: residenteId,
          departamento_id: departamentoId,
          mes_pago: mesPago,
          monto: montoFinal
        }
      }
    });

    console.log('✅ Preferencia creada exitosamente:', result.id);
    return { success: true, initPoint: result.init_point };

  } catch (error) {
    console.error('Error creando preferencia de pago:', error);
    return { success: false, error: 'No se pudo iniciar el pago online' };
  }
}
