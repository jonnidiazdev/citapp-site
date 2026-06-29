import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment } from '../../types';

interface AdminCalendarProps {
  currentMonth: Date;
  selectedDate: string;
  appointments: Appointment[];
  isHoliday: (date: string) => boolean;
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: string) => void;
}

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function AdminCalendar({
  currentMonth,
  selectedDate,
  appointments,
  isHoliday,
  onMonthChange,
  onDateSelect,
}: AdminCalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const paddingDays = Array(firstDayOfWeek).fill(null);

  const getAppointmentsForDate = (date: string) =>
    appointments.filter((apt) => apt.date === date);

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <button
          type="button"
          onClick={() =>
            onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
          }
          className="calendar-nav-btn"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <h2>{format(currentMonth, 'MMMM yyyy', { locale: es })}</h2>
        <button
          type="button"
          onClick={() =>
            onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
          }
          className="calendar-nav-btn"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="calendar-grid">
        {weekDays.map((day) => (
          <div key={day} className="week-day-header">
            {day}
          </div>
        ))}

        {paddingDays.map((_, idx) => (
          <div key={`padding-start-${idx}`} className="calendar-day padding-day" />
        ))}

        {daysInMonth.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = getAppointmentsForDate(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
          const isHolidayDay = isHoliday(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''} ${isHolidayDay ? 'holiday' : ''}`}
              onClick={() => onDateSelect(dateStr)}
              aria-label={`${format(day, "EEEE d 'de' MMMM", { locale: es })}${dayAppointments.length > 0 ? `, ${dayAppointments.length} turnos` : ', sin turnos'}`}
              aria-pressed={isSelected}
              aria-current={isToday && !isSelected ? 'date' : undefined}
            >
              <div className="day-number">{format(day, 'd')}</div>
              {dayAppointments.length > 0 && (
                <div className="appointment-indicator">{dayAppointments.length}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
