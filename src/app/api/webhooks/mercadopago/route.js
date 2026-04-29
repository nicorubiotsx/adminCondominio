import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import prisma from '@/lib/prisma';

const mpToken = process.env.MP_ACCESS_TOKEN

const client = new MercadoPagoConfig({
  accessToken: mpToken
});

export async function POST(request) {
  const body = await request.json();
  const { type, data } = body;

  // Solo nos interesan las notificaciones de pago
  if (type === 'payment') {
    const paymentId = data.id;

    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        const { residente_id, departamento_id, mes_pago, monto } = paymentData.metadata;

        // Verificar si el pago ya fue procesado para evitar duplicados
        const existingPago = await prisma.pago.findUnique({
          where: { gatewayId: String(paymentId) }
        });

        if (!existingPago) {
          // Registrar el pago como VERIFICADO automáticamente
          await prisma.pago.create({
            data: {
              monto: parseInt(monto, 10),
              mesPago: mes_pago,
              metodoPago: 'MERCADOPAGO',
              referencia: `MP-${paymentId}`,
              estado: 'VERIFICADO',
              gatewayId: String(paymentId),
              residenteId: residente_id,
              departamentoId: departamento_id,
              notas: `Pago automático procesado vía Mercado Pago. Transacción: ${paymentId}`
            }
          });

          console.log(`✅ Pago aprobado y registrado: ${paymentId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error procesando webhook de Mercado Pago:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
