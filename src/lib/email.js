import nodemailer from 'nodemailer';

// Configuración del transporter de Nodemailer
// Para producción, se deben configurar estas variables en el archivo .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Si no hay credenciales configuradas (entorno dev local sin .env) 
    // y estamos usando ethereal o no configuramos SMTP_USER, simulamos el envío para no fallar
    if (!process.env.SMTP_USER) {
      console.log('Simulando envío de correo (No SMTP_USER configurado):');
      console.log(`To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"CondoAdmin" <${process.env.SMTP_FROM || 'no-reply@condominio.com'}>`,
      to,
      subject,
      html,
    });
    
    console.log(`Correo enviado exitosamente a ${to}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando correo:', error);
    // Retornamos falso pero no lanzamos el error para no romper la app si falla el correo
    return { success: false, error: error.message };
  }
};

export const templates = {
  // Plantilla para recibo de pago verificado
  pagoVerificado: (residente, pago) => ({
    subject: `Recibo de Pago Verificado - ${pago.mesPago}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981; text-align: center;">¡Pago Verificado Exitosamente!</h2>
        <p>Hola <strong>${residente.nombre}</strong>,</p>
        <p>Te confirmamos que tu pago correspondiente al mes de <strong>${pago.mesPago}</strong> ha sido verificado por la administración.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Departamento:</strong> ${residente.departamento?.numero || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Método:</strong> ${pago.metodoPago}</p>
          <p style="margin: 5px 0;"><strong>Referencia:</strong> ${pago.referencia || 'N/A'}</p>
        </div>
        
        <p>Puedes descargar tu recibo oficial ingresando al <a href="${process.env.NEXT_PUBLIC_APP_URL}/residente/pagos">Portal de Residente</a>.</p>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
          Este es un correo automático de CondoAdmin, por favor no respondas a este mensaje.
        </p>
      </div>
    `
  }),

  // Plantilla para nuevo anuncio importante
  nuevoAnuncio: (anuncio) => ({
    subject: `🚨 Aviso Importante del Condominio: ${anuncio.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #ef4444; color: white; padding: 10px; text-align: center; border-radius: 6px 6px 0 0;">
          <h2 style="margin: 0;">Aviso de la Administración</h2>
        </div>
        <div style="padding: 20px;">
          <h3 style="color: #334155;">${anuncio.titulo}</h3>
          <p style="white-space: pre-wrap; line-height: 1.6; color: #475569;">${anuncio.contenido}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
          Has recibido este correo porque estás registrado como residente en CondoAdmin.
        </p>
      </div>
    `
  })
};
