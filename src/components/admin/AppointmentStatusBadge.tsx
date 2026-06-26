import type { AppointmentStatus } from '../../types';
import { STATUS_ICONS } from '../../utils/appointmentStatus';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  return <span className={`status-indicator ${status}`}>{STATUS_ICONS[status]}</span>;
}
