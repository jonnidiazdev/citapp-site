import type { Appointment, AppointmentStatus } from '../../types';
import { Modal } from '../ui/Modal';

interface EditAppointmentModalProps {
  isOpen: boolean;
  editForm: Partial<Appointment>;
  isSubmitting: boolean;
  onChange: (updates: Partial<Appointment>) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditAppointmentModal({
  isOpen,
  editForm,
  isSubmitting,
  onChange,
  onSave,
  onClose,
}: EditAppointmentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Editar Turno"
      onClose={onClose}
      disabled={isSubmitting}
      footer={
        <>
          <button type="button" className="button" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        </>
      }
    >
      <fieldset className="manual-form-fieldset" disabled={isSubmitting}>
        <div className="form-group">
          <label htmlFor="edit-client-name">Nombre del Cliente</label>
          <input
            id="edit-client-name"
            type="text"
            value={editForm.clientName || ''}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="Nombre completo"
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-client-email">Email</label>
          <input
            id="edit-client-email"
            type="email"
            value={editForm.clientEmail || ''}
            onChange={(e) => onChange({ clientEmail: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-client-phone">Teléfono</label>
          <input
            id="edit-client-phone"
            type="tel"
            value={editForm.clientPhone || ''}
            onChange={(e) => onChange({ clientPhone: e.target.value })}
            placeholder="+34 600 000 000"
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-date">Fecha</label>
          <input
            id="edit-date"
            type="date"
            value={editForm.date || ''}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div className="form-row-grid">
          <div className="form-group">
            <label htmlFor="edit-start-time">Hora Inicio</label>
            <input
              id="edit-start-time"
              type="time"
              value={editForm.startTime || ''}
              onChange={(e) => onChange({ startTime: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-end-time">Hora Fin</label>
            <input
              id="edit-end-time"
              type="time"
              value={editForm.endTime || ''}
              onChange={(e) => onChange({ endTime: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="edit-status">Estado</label>
          <select
            id="edit-status"
            value={editForm.status || 'pending'}
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
          <label htmlFor="edit-notes">Notas</label>
          <textarea
            id="edit-notes"
            value={editForm.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Notas adicionales..."
            rows={3}
          />
        </div>
      </fieldset>
    </Modal>
  );
}
