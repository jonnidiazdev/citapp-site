import type { AppointmentStatus } from '../../types';
import type { RecurrenceType } from '../../utils/recurrence';
import { Modal } from '../ui/Modal';

export interface ManualAppointmentForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  recurrenceType: RecurrenceType;
  recurrenceCount: number;
}

interface ManualAppointmentModalProps {
  isOpen: boolean;
  form: ManualAppointmentForm;
  isSubmitting: boolean;
  error?: string;
  onChange: (updates: Partial<ManualAppointmentForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ManualAppointmentModal({
  isOpen,
  form,
  isSubmitting,
  error,
  onChange,
  onClose,
  onSubmit,
}: ManualAppointmentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Cargar Turnos Manualmente"
      onClose={onClose}
      disabled={isSubmitting}
      footer={
        <>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Turno(s)'}
          </button>
          <button type="button" className="button secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
        </>
      }
    >
      <fieldset className="manual-form-fieldset" disabled={isSubmitting}>
        <div className="form-group">
          <label htmlFor="manual-client-name">Nombre del Cliente</label>
          <input
            id="manual-client-name"
            type="text"
            value={form.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="Nombre completo"
          />
        </div>
        <div className="form-group">
          <label htmlFor="manual-client-email">Email</label>
          <input
            id="manual-client-email"
            type="email"
            value={form.clientEmail}
            onChange={(e) => onChange({ clientEmail: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="manual-client-phone">Teléfono</label>
          <input
            id="manual-client-phone"
            type="tel"
            value={form.clientPhone}
            onChange={(e) => onChange({ clientPhone: e.target.value })}
            placeholder="+54 11 0000 0000"
          />
        </div>
        <div className="form-group">
          <label htmlFor="manual-date">Fecha</label>
          <input
            id="manual-date"
            type="date"
            value={form.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div className="form-row-grid">
          <div className="form-group">
            <label htmlFor="manual-start-time">Hora Inicio</label>
            <input
              id="manual-start-time"
              type="time"
              value={form.startTime}
              onChange={(e) => onChange({ startTime: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="manual-end-time">Hora Fin</label>
            <input
              id="manual-end-time"
              type="time"
              value={form.endTime}
              onChange={(e) => onChange({ endTime: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="manual-status">Estado Inicial</label>
          <select
            id="manual-status"
            value={form.status}
            onChange={(e) => onChange({ status: e.target.value as AppointmentStatus })}
          >
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Completado</option>
            <option value="absent">Ausente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="manual-recurrence">Repetición</label>
          <select
            id="manual-recurrence"
            value={form.recurrenceType}
            onChange={(e) => {
              const recurrenceType = e.target.value as RecurrenceType;
              onChange({
                recurrenceType,
                recurrenceCount:
                  recurrenceType === 'none' ? 1 : Math.max(2, form.recurrenceCount),
              });
            }}
          >
            <option value="none">Sin repetición</option>
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
        {form.recurrenceType !== 'none' && (
          <div className="form-group">
            <label htmlFor="manual-recurrence-count">Cantidad de turnos a crear</label>
            <input
              id="manual-recurrence-count"
              type="number"
              min={2}
              max={24}
              value={form.recurrenceCount}
              onChange={(e) => {
                const count = Number(e.target.value);
                onChange({
                  recurrenceCount: Number.isNaN(count) ? 2 : Math.max(2, Math.min(24, count)),
                });
              }}
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="manual-notes">Notas</label>
          <textarea
            id="manual-notes"
            value={form.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Notas adicionales..."
            rows={3}
          />
        </div>
      </fieldset>
    </Modal>
  );
}
