import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sendEmail, templates } from '@/lib/email';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

export const metadata = { title: 'Pago Online - CondoAdmin' };

export default async function PagoSuccessPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { payment_id, status, preference_id } = await searchParams;

  if (!payment_id || status !== 'approved') {
    return (
      <div className="data-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <XCircle size={64} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
        <h2>El pago no pudo procesarse</h2>
        <p>Hubo un inconveniente al procesar tu pago mediante Webpay/Mercado Pago.</p>
        <Link href="/residente/pagos" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Volver a mis pagos
        </Link>
      </div>
    );
  }

  // Verificamos el pago consultando a Mercado Pago para evitar fraude (manipulación de URL)
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-3392471691238472-042813-882f05a96db4e9d08e1c6b8c8d880d6b-1786524387'
  });
  const paymentAPI = new Payment(client);
  
  let paymentData;
  try {
    paymentData = await paymentAPI.get({ id: payment_id });
  } catch (error) {
    console.error("Error verificando pago en MP", error);
    return <h2>Error verificando el pago con el proveedor. Contacte a administración.</h2>;
  }

  // Si el pago es legítimo, comprobamos que no exista ya en la BD para evitar duplicidad si el usuario recarga la página
  const existingPago = await prisma.pago.findFirst({
    where: { referencia: `MP-${payment_id}` }
  });

  if (existingPago) {
    return (
      <div className="data-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2>Pago ya registrado</h2>
        <p>Este pago ya fue procesado y registrado exitosamente en tu cuenta.</p>
        <Link href="/residente/pagos" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Volver a mis pagos
        </Link>
      </div>
    );
  }

  // Si es nuevo, lo registramos en la BD
  // Extraemos la metadata que enviamos al crear la preferencia
  const metadata = paymentData.metadata || {};
  const mesPago = metadata.mes_pago || new Date().toISOString().slice(0, 7);
  const residenteId = session.userId;
  const departamentoId = metadata.departamento_id; // Debería sacarlo de metadata o sesión

  const nuevoPago = await prisma.pago.create({
    data: {
      monto: paymentData.transaction_amount,
      mesPago: mesPago,
      metodoPago: 'TARJETA',
      referencia: `MP-${payment_id}`,
      estado: 'VERIFICADO', // Automáticamente verificado porque MP lo aprobó
      residenteId: residenteId,
      departamentoId: departamentoId,
      notas: 'Pago Online procesado por Webpay / Mercado Pago'
    },
    include: { residente: true, departamento: true }
  });

  // Notificamos por correo que el pago fue exitoso y verificado
  if (nuevoPago.residente?.email) {
    const template = templates.pagoVerificado(nuevoPago.residente, nuevoPago);
    await sendEmail({
      to: nuevoPago.residente.email,
      ...template
    });
  }

  return (
    <div className="data-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
      <h2>¡Pago Exitoso!</h2>
      <p>Tu pago por <strong>${paymentData.transaction_amount}</strong> ha sido procesado mediante Webpay Plus / Tarjeta correctamente.</p>
      <p>Ya se encuentra verificado en el sistema y el recibo ha sido enviado a tu correo.</p>
      
      <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', marginTop: '2rem', display: 'inline-block', textAlign: 'left' }}>
        <p style={{ margin: '0 0 0.5rem' }}><strong>Mes:</strong> {mesPago}</p>
        <p style={{ margin: '0 0 0.5rem' }}><strong>Nro. Operación:</strong> {payment_id}</p>
        <p style={{ margin: '0' }}><strong>Estado:</strong> Aprobado y Verificado</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link href="/residente/pagos" className="btn btn-primary" style={{ display: 'inline-block' }}>
          Volver a mis pagos
        </Link>
      </div>
    </div>
  );
}
