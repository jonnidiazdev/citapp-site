import { useCallback, useEffect, useState, useActionState } from 'react';
import { useParams } from 'react-router-dom';
import { useFormStatus } from 'react-dom';
import { format, addDays, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { publicProfileService } from '../services/publicProfileService';
import { appointmentService } from '../services/appointmentService';
import { bookingSlotsService } from '../services/bookingSlotsService';
import { slotsService } from '../services/slotsService';
import { holidayService } from '../services/holidayService';
import { useToast } from '../components/ui/useToast';
import type { PublicBusinessProfile, BookingTimeSlot } from '../types';
import '../styles/booking.css';

interface BookingFormState {
  error?: string;
  success?: boolean;
}

type LoadState = 'loading' | 'ready' | 'not_found' | 'error';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Reservando...' : 'Confirmar Reserva'}
    </button>
  );
}

export function PublicBooking() {
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PublicBusinessProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BookingTimeSlot[]>([]);
  const [holidayBlockedMessage, setHolidayBlockedMessage] = useState('');

  const loadBusinessData = useCallback(async () => {
    if (!token) {
      setLoadState('not_found');
      return;
    }

    try {
      setLoadState('loading');
      const data = await publicProfileService.getByToken(token);

      if (!data) {
        setLoadState('not_found');
        return;
      }

      setProfile(data);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [token]);

  const loadSlotsForDate = useCallback(async () => {
    if (!profile) return;

    try {
      if (!profile.allowHolidayAppointments) {
        const holiday = await holidayService.getHolidayByDate(selectedDate);
        if (holiday) {
          setAvailableSlots([]);
          setHolidayBlockedMessage(`No se reciben turnos este día: ${holiday.nombre} (${holiday.tipo}).`);
          return;
        }
      }

      setHolidayBlockedMessage('');
      const occupied = await bookingSlotsService.getOccupiedSlots(profile.userId, selectedDate);
      const dateObj = parse(selectedDate, 'yyyy-MM-dd', new Date());
      const slotOptions = { now: new Date(), blockPastSlots: true as const };
      const slots = slotsService.generateDaySlots(dateObj, profile, occupied, slotOptions);
      setAvailableSlots(slots);
      setSelectedTime((current) => {
        if (!current) return null;
        const stillAvailable = slots.some((s) => s.time === current && s.available);
        return stillAvailable ? current : null;
      });
    } catch {
      showToast('Error al cargar horarios disponibles', 'error');
    }
  }, [profile, selectedDate, showToast]);

  useEffect(() => {
    loadBusinessData();
  }, [loadBusinessData]);

  useEffect(() => {
    loadSlotsForDate();
  }, [loadSlotsForDate]);

  const [formState, formAction] = useActionState(
    async (_prev: BookingFormState | null, formData: FormData): Promise<BookingFormState> => {
      const bookingUserId = formData.get('userId') as string;
      const bookingDate = formData.get('selectedDate') as string;
      const bookingTime = formData.get('selectedTime') as string;
      const appointmentDuration = Number(formData.get('appointmentDuration'));

      if (!bookingTime || !bookingDate || !bookingUserId) {
        return { error: 'Por favor selecciona un horario' };
      }

      if (!profile) {
        return { error: 'No se pudo cargar la configuración del negocio' };
      }

      if (!profile.allowHolidayAppointments) {
        const holiday = await holidayService.getHolidayByDate(bookingDate);
        if (holiday) {
          return { error: `No se pueden reservar turnos en este día: ${holiday.nombre} (${holiday.tipo}).` };
        }
      }

      const clientPhone = (formData.get('clientPhone') as string)?.trim();
      const notes = (formData.get('notes') as string)?.trim();

      const slotOptions = { now: new Date(), blockPastSlots: true as const };
      const occupied = await bookingSlotsService.getOccupiedSlots(bookingUserId, bookingDate);
      const slotStillValid = slotsService.isSlotAvailable(
        bookingDate,
        bookingTime,
        profile,
        occupied,
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
          await loadSlotsForDate();
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

  if (loadState === 'loading') {
    return (
      <div className="booking-container">
        <div className="booking-loading" role="status" aria-live="polite">
          Cargando...
        </div>
      </div>
    );
  }

  if (loadState === 'not_found') {
    return (
      <div className="booking-container">
        <div className="booking-error" role="alert">
          Este link de reservas no está disponible. Pedile al negocio un link actualizado.
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="booking-container">
        <div className="booking-error" role="alert">
          No se pudo cargar la información del negocio. Intentá de nuevo en unos minutos.
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const weekDays = getNextWeekDays();

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1>{profile.businessName}</h1>
        {profile.businessDescription && (
          <p className="business-description">{profile.businessDescription}</p>
        )}
      </div>

      <div className="booking-content">
        <div className="date-selector" aria-labelledby="date-selector-heading">
          <h2 id="date-selector-heading">Selecciona una fecha</h2>
          <div className="date-grid">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dateLabel = format(day, "EEEE d 'de' MMMM", { locale: es });
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`date-card ${selectedDate === dateStr ? 'selected' : ''}`}
                  aria-label={dateLabel}
                  aria-pressed={selectedDate === dateStr}
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

        <div className="time-selector" aria-labelledby="time-selector-heading">
          <h2 id="time-selector-heading">
            Horarios disponibles -{' '}
            {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'd MMMM', { locale: es })}
          </h2>
          {availableSlots.length === 0 ? (
            <p className="no-slots" role="status">
              {holidayBlockedMessage || 'No hay horarios disponibles para este día'}
            </p>
          ) : (
            <div className="time-grid">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-slot ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                  aria-label={`Horario ${slot.time}`}
                  aria-pressed={selectedTime === slot.time}
                  aria-disabled={!slot.available}
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
          <div className="booking-form-section" aria-labelledby="booking-form-heading">
            <h2 id="booking-form-heading">Completa tus datos</h2>
            <form action={formAction} className="booking-form">
              <input type="hidden" name="userId" value={profile.userId} />
              <input type="hidden" name="selectedDate" value={selectedDate} />
              <input type="hidden" name="selectedTime" value={selectedTime} />
              <input type="hidden" name="appointmentDuration" value={profile.appointmentDuration} />
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
                  <strong>Duración:</strong> {profile.appointmentDuration} minutos
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
