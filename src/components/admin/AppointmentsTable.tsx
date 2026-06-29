import { useOptimistic, useTransition } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, AppointmentStatus } from '../../types';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

interface AppointmentsTableProps {
  appointments: Appointment[];
  selectedDate: string;
  loading: boolean;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
}

export function AppointmentsTable({
  appointments,
  selectedDate,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticAppointments, setOptimisticStatus] = useOptimistic(
    appointments,
    (state, update: { id: string; status: AppointmentStatus }) =>
      state.map((apt) => (apt.id === update.id ? { ...apt, status: update.status } : apt))
  );

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    startTransition(() => {
      setOptimisticStatus({ id, status });
    });
    return onStatusChange(id, status);
  };

  const formattedDate = format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEEE d MMMM yyyy', {
    locale: es,
  });

  if (loading) {
    return (
      <div className="appointments-section">
        <h2>Turnos del {formattedDate}</h2>
        <p className="empty-message" role="status" aria-live="polite">
          Cargando turnos...
        </p>
      </div>
    );
  }

  if (optimisticAppointments.length === 0) {
    return (
      <div className="appointments-section">
        <h2>Turnos del {formattedDate}</h2>
        <p className="empty-message">No hay turnos para esta fecha</p>
      </div>
    );
  }

  return (
    <div className="appointments-section">
      <h2>
        Turnos del {formattedDate}
        {isPending && (
          <span className="status-updating" aria-live="polite">
            {' '}
            Actualizando...
          </span>
        )}
      </h2>
      <div className="appointments-table">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {optimisticAppointments.map((apt) => (
              <tr key={apt.id}>
                <td>{apt.clientName}</td>
                <td>{apt.clientEmail}</td>
                <td>{apt.clientPhone || '-'}</td>
                <td>
                  {apt.startTime} - {apt.endTime}
                </td>
                <td>
                  <div className="status-select-wrapper">
                    <AppointmentStatusBadge status={apt.status} />
                    <select
                      className={`status-select ${apt.status}`}
                      value={apt.status}
                      onChange={(e) =>
                        handleStatusChange(apt.id, e.target.value as AppointmentStatus)
                      }
                      aria-label={`Estado de ${apt.clientName}`}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="completed">Completado</option>
                      <option value="absent">Ausente</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </td>
                <td>
                  <button type="button" className="button small" onClick={() => onEdit(apt)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="button small danger"
                    onClick={() => onDelete(apt.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
