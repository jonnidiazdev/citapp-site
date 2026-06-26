import type { AppointmentStatus } from '../types';

export const STATUS_ICONS: Record<AppointmentStatus, string> = {
  pending: '⏳',
  confirmed: '✓',
  completed: '✓',
  cancelled: '✗',
  absent: '👤',
};

export function getStatusIcon(status: AppointmentStatus): string {
  return STATUS_ICONS[status] ?? '';
}
