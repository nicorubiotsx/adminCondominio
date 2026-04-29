import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

export function formatDateTime(date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0, // En Chile por lo general no se usan decimales
  }).format(amount);
}

export function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}

export function getStatusColor(status) {
  const colors = {
    PENDIENTE: '#f59e0b',
    VERIFICADO: '#10b981',
    RECHAZADO: '#ef4444',
    EN_PROGRESO: '#3b82f6',
    COMPLETADO: '#10b981',
    CANCELADO: '#6b7280',
    OCUPADO: '#10b981',
    DISPONIBLE: '#3b82f6',
    MANTENIMIENTO: '#f59e0b',
  };
  return colors[status] || '#6b7280';
}

export function getPriorityColor(priority) {
  const colors = {
    BAJA: '#6b7280',
    NORMAL: '#3b82f6',
    ALTA: '#f59e0b',
    URGENTE: '#ef4444',
  };
  return colors[priority] || '#6b7280';
}
