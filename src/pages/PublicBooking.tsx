import { useCallback, useEffect, useState, useActionState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormStatus } from 'react-dom';
import { format, addDays, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { businessSettingsService } from '../services/businessSettingsService';
import { appointmentService } from '../services/appointmentService';
import { slotsService } from '../services/slotsService';
import { holidayService } from '../services/holidayService';
import { useToast } from '../components/ui/useToast';
import type { BusinessSettings, BookingTimeSlot } from '../types';
import '../styles/booking.css';

interface BookingFormState {
  error?: string;
  success?: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Reservando...' : 'Confirmar Reserva'}
    </button>
  );
}

export function PublicBooking() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookingTimeSlot[]>([]);
  const [holidayBlockedMessage, setHolidayBlockedMessage] = useState('');

  const loadBusinessData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await businessSettingsService.getSettingsByUserId(userId);

      if (!data || !data.publicBookingEnabled) {
        showToast('Este link de reservas no está disponible', 'error');
        navigate('/');
        return;
      }

      setSettings(data);
    } catch {
      showToast('Error al cargar la información del negocio', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, navigate, showToast]);

  const loadAppointmentsForDate = useCallback(async () => {
    if (!userId || !settings) return;

    try {
      if (!settings.allowHolidayAppointments) {
        const holiday = await holidayService.getHolidayByDate(selectedDate);
        if (holiday) {
          setAvailableSlots([]);
          setHolidayBlockedMessage(`No se reciben turnos este día: ${holiday.nombre} (${holiday.tipo}).`);
          return;
        }
      }

      setHolidayBlockedMessage('');
      const apts = await appointmentService.getAppointmentsByUserAndDate(userId, selectedDate);
      const dateObj = parse(selectedDate, 'yyyy-MM-dd', new Date());
      const slotOptions = { now: new Date(), blockPastSlots: true as const };
      const slots = slotsService.generateDaySlots(dateObj, settings, apts, slotOptions);
      setAvailableSlots(slots);
      setSelectedTime((current) => {
        if (!current) return null;
        const stillAvailable = slots.some((s) => s.time === current && s.available);
        return stillAvailable ? current : null;
      });
    } catch {
      showToast('Error al cargar horarios disponibles', 'error');
    }
  }, [userId, settings, selectedDate, showToast]);

  useEffect(() => {
    loadBusinessData();
  }, [loadBusinessData]);

  useEffect(() => {
    loadAppointmentsForDate();
  }, [loadAppointmentsForDate]);

  const [formState, formAction] = useActionState(
    async (_prev: BookingFormState | null, formData: FormData): Promise<BookingFormState> => {
      const bookingUserId = userId;
      const bookingDate = formData.get('selectedDate') as string;
      const bookingTime = formData.get('selectedTime') as string;
      const appointmentDuration = Number(formData.get('appointmentDuration'));

      if (!bookingTime || !bookingDate || !bookingUserId) {
        return { error: 'Por favor selecciona un horario' };
      }

      if (!settings) {
        return { error: 'No se pudo cargar la configuración del negocio' };
      }

      if (!settings.allowHolidayAppointments) {
        const holiday = await holidayService.getHolidayByDate(bookingDate);
        if (holiday) {
          return { error: `No se pueden reservar turnos en este día: ${holiday.nombre} (${holiday.tipo}).` };
        }
      }

      const clientPhone = (formData.get('clientPhone') as string)?.trim();
      const notes = (formData.get('notes') as string)?.trim();

      const slotOptions = { now: new Date(), blockPastSlots: true as const };
      const dayAppointments = await appointmentService.getAppointmentsByUserAndDate(
        bookingUserId,
        bookingDate
      );
      const slotStillValid = slotsService.isSlotAvailable(
        bookingDate,
        bookingTime,
        settings,
        dayAppointments,
        slotOptions
      );
      if (!slotStillValid) {
        return { error: 'Ese horario ya no está disponible. Elegí otro.' };
      }

      try {
        const endTime = slotsService.calculateEndTime(bookingTime, appointmentDuration);
        await appointmentService.createPublicAppointment({
          userId: bookingUserId,
          clientName: (formData.get('clientName') as string).trim(),
          clientEmail: (formData.get('clientEmail') as string).trim(),
          clientPhone: clientPhone || undefined,
          date: bookingDate,
          startTime: bookingTime,
          endTime,
          status: 'pending',
          notes: notes || undefined,
        });

        setSelectedTime(null);
        showToast('¡Turno reservado exitosamente!', 'success');

        try {
          await loadAppointmentsForDate();
        } catch (refreshError) {
          console.error('Error refreshing slots after booking:', refreshError);
        }

        return { success: true };
      } catch (error) {
        console.error('Error creating public appointment:', error);
        return { error: 'Error al reservar el turno. Por favor intenta nuevamente.' };
      }
    },
    null
  );

  const getNextWeekDays = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  };

  if (loading) {
    return (
      <div className="booking-container">
        <div className="booking-loading">Cargando...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="booking-container">
        <div className="booking-error">No se encontró la información del negocio</div>
      </div>
    );
  }

  const weekDays = getNextWeekDays();

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1>{settings.businessName}</h1>
        {settings.businessDescription && (
          <p className="business-description">{settings.businessDescription}</p>
        )}
      </div>

      <div className="booking-content">
        <div className="date-selector">
          <h2>Selecciona una fecha</h2>
          <div className="date-grid">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`date-card ${selectedDate === dateStr ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedTime(null);
                  }}
                >
                  <span className="day-name">{format(day, 'EEEE', { locale: es })}</span>
                  <span className="day-number">{format(day, 'd')}</span>
                  <span className="month-name">{format(day, 'MMM', { locale: es })}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="time-selector">
          <h2>
            Horarios disponibles -{' '}
            {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'd MMMM', { locale: es })}
          </h2>
          {availableSlots.length === 0 ? (
            <p className="no-slots">
              {holidayBlockedMessage || 'No hay horarios disponibles para este día'}
            </p>
          ) : (
            <div className="time-grid">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-slot ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTime && !holidayBlockedMessage && (
          <div className="booking-form-section">
            <h2>Completa tus datos</h2>
            <form action={formAction} className="booking-form">
              <input type="hidden" name="selectedDate" value={selectedDate} />
              <input type="hidden" name="selectedTime" value={selectedTime} />
              <input type="hidden" name="appointmentDuration" value={settings.appointmentDuration} />
              {formState?.error && (
                <p className="form-error" role="alert">
                  {formState.error}
                </p>
              )}
              {formState?.success && (
                <p className="form-success" role="status">
                  Reserva confirmada. Podés hacer otra reserva.
                </p>
              )}
              <div className="form-group">
                <label htmlFor="name">Nombre completo *</label>
                <input id="name" name="clientName" type="text" required placeholder="Tu nombre" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input id="email" name="clientEmail" type="email" required placeholder="tu@email.com" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Teléfono</label>
                <input id="phone" name="clientPhone" type="tel" placeholder="+34 600 000 000" />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notas adicionales</label>
                <textarea id="notes" name="notes" placeholder="¿Algo que debamos saber?" rows={3} />
              </div>
              <div className="booking-summary">
                <h3>Resumen de tu reserva</h3>
                <p>
                  <strong>Fecha:</strong>{' '}
                  {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', { locale: es })}
                </p>
                <p>
                  <strong>Hora:</strong> {selectedTime}
                </p>
                <p>
                  <strong>Duración:</strong> {settings.appointmentDuration} minutos
                </p>
              </div>
              <SubmitButton />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
