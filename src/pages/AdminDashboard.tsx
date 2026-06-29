import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { businessSettingsService } from '../services/businessSettingsService';
import { bookingSlotsService } from '../services/bookingSlotsService';
import { useAppointments } from '../hooks/useAppointments';
import { useMonthHolidays } from '../hooks/useMonthHolidays';
import { calculateAppointmentStats, getAppointmentsForDate } from '../utils/appointmentStats';
import { getRecurringDates } from '../utils/recurrence';
import { useToast } from '../components/ui/useToast';
import { useConfirm } from '../components/ui/useConfirm';
import { AdminStats } from '../components/admin/AdminStats';
import { BookingUrlBanner } from '../components/admin/BookingUrlBanner';
import { AdminCalendar } from '../components/admin/AdminCalendar';
import { AppointmentsTable } from '../components/admin/AppointmentsTable';
import { EditAppointmentModal } from '../components/admin/EditAppointmentModal';
import {
  ManualAppointmentModal,
  type ManualAppointmentForm,
} from '../components/admin/ManualAppointmentModal';
import type { Appointment, AppointmentStatus } from '../types';
import { FiSettings } from 'react-icons/fi';
import '../styles/admin.css';

const defaultManualForm = (date: string): ManualAppointmentForm => ({
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  date,
  startTime: '09:00',
  endTime: '09:30',
  status: 'pending',
  notes: '',
  recurrenceType: 'none',
  recurrenceCount: 1,
});

export function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookingUrl, setBookingUrl] = useState('');
  const [publicBookingEnabled, setPublicBookingEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualForm, setManualForm] = useState<ManualAppointmentForm>(
    defaultManualForm(format(new Date(), 'yyyy-MM-dd'))
  );
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Appointment>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment, updateStatus, refetch } =
    useAppointments(!!user);
  const { isHoliday } = useMonthHolidays(currentMonth);

  useEffect(() => {
    if (!user) return;
    businessSettingsService.getSettings().then((settings) => {
      if (settings?.publicBookingEnabled && settings.publicBookingToken) {
        setPublicBookingEnabled(true);
        setBookingUrl(businessSettingsService.getPublicBookingUrl(settings.publicBookingToken));
      } else {
        setPublicBookingEnabled(false);
        setBookingUrl('');
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    bookingSlotsService.syncAllFromAppointments(user.id, appointments).catch(() => {
      // Best-effort migration sync for existing appointments.
    });
  }, [user, loading, appointments]);

  useEffect(() => {
    setManualForm((prev) => ({ ...prev, date: selectedDate }));
  }, [selectedDate]);

  const stats = useMemo(
    () => calculateAppointmentStats(appointments, currentMonth, selectedDate),
    [appointments, currentMonth, selectedDate]
  );

  const todayAppointments = useMemo(
    () => getAppointmentsForDate(appointments, selectedDate),
    [appointments, selectedDate]
  );

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Link copiado al portapapeles', 'success');
  };

  const resetManualForm = () => {
    setManualForm(defaultManualForm(selectedDate));
    setManualError('');
  };

  const handleCreateManualAppointments = async () => {
    if (isSubmittingManual) return;

    const { clientName, clientEmail, clientPhone, date, startTime, endTime, status, notes, recurrenceType, recurrenceCount } =
      manualForm;

    if (!clientName.trim() || !clientEmail.trim() || !date || !startTime || !endTime) {
      setManualError('Completá nombre, email, fecha y horario para crear el turno');
      return;
    }

    if (startTime >= endTime) {
      setManualError('La hora de fin debe ser mayor a la hora de inicio');
      return;
    }

    try {
      setIsSubmittingManual(true);
      setManualError('');
      const dates = getRecurringDates(date, recurrenceType, recurrenceCount);

      const results = await Promise.allSettled(
        dates.map((appointmentDate) =>
          createAppointment({
            clientId: 'manual',
            clientName: clientName.trim(),
            clientEmail: clientEmail.trim(),
            clientPhone: clientPhone.trim(),
            date: appointmentDate,
            startTime,
            endTime,
            status,
            notes: notes.trim(),
          })
        )
      );

      const createdCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - createdCount;

      if (createdCount === 0) {
        setManualError('No se pudo crear ningún turno. Intentá nuevamente.');
        return;
      }

      if (failedCount > 0) {
        showToast(`Se crearon ${createdCount} turnos y fallaron ${failedCount}.`, 'info');
      } else {
        showToast(`Se crearon ${createdCount} turno${createdCount > 1 ? 's' : ''} correctamente.`, 'success');
      }

      setSelectedDate(date);
      setShowManualModal(false);
      resetManualForm();
      await refetch();
    } catch {
      showToast('Error al crear los turnos manuales', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditForm({
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail,
      clientPhone: appointment.clientPhone,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      notes: appointment.notes,
      status: appointment.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAppointment || isSubmittingEdit) return;

    try {
      setIsSubmittingEdit(true);
      await updateAppointment(editingAppointment.id, editForm);
      setShowEditModal(false);
      setEditingAppointment(null);
      setEditForm({});
      showToast('Turno actualizado correctamente', 'success');
    } catch {
      showToast('Error al actualizar el turno', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteClick = async (appointmentId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar turno',
      message: '¿Estás seguro de que deseas eliminar este turno?',
      confirmLabel: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await deleteAppointment(appointmentId);
      showToast('Turno eliminado', 'success');
    } catch {
      showToast('Error al eliminar el turno', 'error');
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      await updateStatus(appointmentId, newStatus);
    } catch {
      showToast('Error al cambiar el estado del turno', 'error');
      await refetch();
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Panel de Gestión</h1>
        <div className="admin-header-actions">
          <button type="button" className="button admin-action-btn" onClick={() => setShowManualModal(true)}>
            + Carga Manual
          </button>
          <button type="button" className="button admin-action-btn" onClick={() => navigate('/admin/settings')}>
            <FiSettings aria-hidden="true" />
            Configuración
          </button>
        </div>
      </div>

      <AdminStats stats={stats} />
      {publicBookingEnabled && bookingUrl ? (
        <BookingUrlBanner bookingUrl={bookingUrl} copied={copied} onCopy={copyBookingUrl} />
      ) : (
        <div className="booking-url-banner booking-url-disabled-hint">
          <p>
            Las reservas públicas están desactivadas. Activá el link en{' '}
            <button
              type="button"
              className="booking-url-settings-link"
              onClick={() => navigate('/admin/settings')}
            >
              Configuración
            </button>
            .
          </p>
        </div>
      )}

      <div className="admin-content">
        <AdminCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          appointments={appointments}
          isHoliday={isHoliday}
          onMonthChange={setCurrentMonth}
          onDateSelect={setSelectedDate}
        />
        <AppointmentsTable
          appointments={todayAppointments}
          selectedDate={selectedDate}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
        />
      </div>

      <EditAppointmentModal
        isOpen={showEditModal}
        editForm={editForm}
        isSubmitting={isSubmittingEdit}
        onChange={(updates) => setEditForm((prev) => ({ ...prev, ...updates }))}
        onSave={handleSaveEdit}
        onClose={() => {
          if (!isSubmittingEdit) setShowEditModal(false);
        }}
      />

      <ManualAppointmentModal
        isOpen={showManualModal}
        form={manualForm}
        isSubmitting={isSubmittingManual}
        error={manualError}
        onChange={(updates) => setManualForm((prev) => ({ ...prev, ...updates }))}
        onClose={() => {
          if (!isSubmittingManual) {
            setShowManualModal(false);
            resetManualForm();
          }
        }}
        onSubmit={handleCreateManualAppointments}
      />

      {(isSubmittingManual || isSubmittingEdit) && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-box">
            <div className="loading-spinner" />
            <p>{isSubmittingManual ? 'Guardando turnos...' : 'Guardando cambios...'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
