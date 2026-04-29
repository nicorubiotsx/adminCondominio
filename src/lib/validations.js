import { z } from 'zod';

// ============== AUTH ==============
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ============== RESIDENTE ==============
export const residenteSchema = z.object({
  cedula: z.string().min(5, 'El RUT debe tener al menos 5 caracteres').max(20),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().min(7, 'Teléfono inválido').max(20),
  telefonoAlt: z.string().max(20).optional().or(z.literal('')),
  tipo: z.enum(['PROPIETARIO', 'INQUILINO']),
  departamentoId: z.string().optional().or(z.literal('')),
  notas: z.string().max(500).optional().or(z.literal('')),
});

// ============== DEPARTAMENTO ==============
export const departamentoSchema = z.object({
  numero: z.string().min(1, 'El número es requerido').max(10),
  piso: z.coerce.number().int().min(0, 'El piso debe ser 0 o mayor'),
  torre: z.string().max(10).optional().or(z.literal('')),
  tipo: z.enum(['APARTAMENTO', 'PENTHOUSE', 'LOCAL']),
  metrosCuadrados: z.coerce.number().positive('Debe ser mayor a 0').optional().or(z.literal('')),
  habitaciones: z.coerce.number().int().min(0).optional().or(z.literal('')),
  banos: z.coerce.number().int().min(0).optional().or(z.literal('')),
  estacionamiento: z.coerce.boolean().default(false),
  alicuota: z.coerce.number().min(0).max(100).default(0),
  estado: z.enum(['OCUPADO', 'DISPONIBLE', 'MANTENIMIENTO']),
});

// ============== PAGO ==============
export const pagoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  mesPago: z.string().min(7, 'Formato requerido: YYYY-MM').max(7),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'DEPOSITO']),
  referencia: z.string().max(100).optional().or(z.literal('')),
  estado: z.enum(['PENDIENTE', 'VERIFICADO', 'RECHAZADO']).default('PENDIENTE'),
  residenteId: z.string().min(1, 'El residente es requerido'),
  departamentoId: z.string().min(1, 'El departamento es requerido'),
  notas: z.string().max(500).optional().or(z.literal('')),
});

// ============== GASTO COMUN ==============
export const gastoComunSchema = z.object({
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  fecha: z.coerce.date(),
  categoria: z.enum(['SERVICIOS', 'MANTENIMIENTO', 'PERSONAL', 'SEGUROS', 'OTROS']),
  proveedor: z.string().max(200).optional().or(z.literal('')),
  factura: z.string().max(100).optional().or(z.literal('')),
});

// ============== ANUNCIO ==============
export const anuncioSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  contenido: z.string().min(10, 'El contenido debe tener al menos 10 caracteres'),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']),
  fechaFin: z.coerce.date().optional().or(z.literal('')),
});

// ============== MANTENIMIENTO ==============
export const mantenimientoSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']),
  estado: z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO']).default('PENDIENTE'),
  categoria: z.enum(['PLOMERIA', 'ELECTRICIDAD', 'PINTURA', 'GENERAL', 'AREAS_COMUNES']),
  costoEstimado: z.coerce.number().min(0).optional().or(z.literal('')),
  residenteId: z.string().optional().or(z.literal('')),
  departamentoId: z.string().optional().or(z.literal('')),
  notas: z.string().max(500).optional().or(z.literal('')),
});

// Helper para formatear errores de Zod
export function formatZodErrors(error) {
  const errors = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
