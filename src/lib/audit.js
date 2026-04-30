import prisma from './prisma';
import { getSession } from './auth';

/**
 * Registra una acción en el log de auditoría
 * @param {Object} params - Parámetros del log
 * @param {string} params.accion - Nombre de la acción (ej: LOGIN, CREATE_PAYMENT)
 * @param {string} params.detalles - Descripción legible
 * @param {Object} [params.metadata] - Datos adicionales técnicos
 */
export async function logAudit({ accion, detalles, metadata = {} }) {
  try {
    const session = await getSession();
    
    await prisma.auditLog.create({
      data: {
        accion,
        detalles,
        metadata,
        userId: session?.userId || null,
        userType: session?.rol || null,
        userEmail: session?.email || null,
      }
    });
  } catch (error) {
    console.error('Error recording audit log:', error);
    // No lanzamos el error para no romper el flujo principal si falla el log
  }
}
