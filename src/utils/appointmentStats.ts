import { parse } from 'date-fns';
import type { Appointment } from '../types';

export interface AppointmentStats {
  total: number;
  pending: number;
  completed: number;
  today: number;
}

export function getAppointmentsForDate(appointments: Appointment[], date: string): Appointment[] {
  return appointments.filter((apt) => apt.date === date);
}

export function getMonthAppointments(appointments: Appointment[], month: Date): Appointment[] {
  return appointments.filter((apt) => {
    const appointmentDate = parse(apt.date, 'yyyy-MM-dd', new Date());
    return (
      appointmentDate.getFullYear() === month.getFullYear() &&
      appointmentDate.getMonth() === month.getMonth()
    );
  });
}

export function calculateAppointmentStats(
  appointments: Appointment[],
  currentMonth: Date,
  selectedDate: string
): AppointmentStats {
  const monthAppointments = getMonthAppointments(appointments, currentMonth);
  const todayAppointments = getAppointmentsForDate(appointments, selectedDate);

  return {
    total: monthAppointments.length,
    pending: monthAppointments.filter((apt) => apt.status === 'pending').length,
    completed: monthAppointments.filter((apt) => apt.status === 'completed').length,
    today: todayAppointments.length,
  };
}
