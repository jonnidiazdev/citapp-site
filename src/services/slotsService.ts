import { format, addMinutes, parse, isAfter, isBefore, isEqual, isSameDay } from 'date-fns';
import type { BusinessSettings, Appointment, BookingTimeSlot } from '../types';

export type { BookingTimeSlot as TimeSlot };

export interface GenerateDaySlotsOptions {
  now?: Date;
  blockPastSlots?: boolean;
}

class SlotsService {
  generateDaySlots(
    date: Date,
    settings: BusinessSettings,
    existingAppointments: Appointment[],
    options?: GenerateDaySlotsOptions
  ): BookingTimeSlot[] {
    const dayName = this.getDayName(date);
    const dayConfig = settings.workingHours[dayName];

    if (!dayConfig || !dayConfig.enabled) {
      return [];
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const activeAppointments = existingAppointments.filter(
      (apt) =>
        apt.date === dateStr &&
        apt.status !== 'cancelled' &&
        apt.status !== 'absent'
    );

    if (activeAppointments.length >= settings.dailySessionLimit) {
      return [];
    }

    const slots: BookingTimeSlot[] = [];
    let currentTime = parse(dayConfig.startTime, 'HH:mm', date);
    const endTime = parse(dayConfig.endTime, 'HH:mm', date);

    while (isBefore(currentTime, endTime)) {
      const timeStr = format(currentTime, 'HH:mm');

      const slotEnd = addMinutes(currentTime, settings.appointmentDuration);
      if (isAfter(slotEnd, endTime) || isEqual(slotEnd, endTime)) {
        break;
      }

      const isOccupied = existingAppointments.some((apt) => {
        if (apt.status === 'cancelled' || apt.status === 'absent') {
          return false;
        }
        if (apt.date !== dateStr) return false;

        const aptStart = parse(apt.startTime, 'HH:mm', date);
        const aptEnd = parse(apt.endTime, 'HH:mm', date);

        return (
          ((isAfter(currentTime, aptStart) || isEqual(currentTime, aptStart)) &&
            isBefore(currentTime, aptEnd)) ||
          (isAfter(slotEnd, aptStart) && (isBefore(slotEnd, aptEnd) || isEqual(slotEnd, aptEnd)))
        );
      });

      const isPast =
        options?.blockPastSlots &&
        options.now &&
        isSameDay(date, options.now) &&
        !isAfter(currentTime, options.now);

      slots.push({
        time: timeStr,
        available: !isOccupied && !isPast,
        date: dateStr,
      });

      currentTime = addMinutes(currentTime, settings.appointmentDuration + settings.breakTime);
    }

    return slots;
  }

  calculateEndTime(startTime: string, duration: number): string {
    const date = new Date();
    const start = parse(startTime, 'HH:mm', date);
    const end = addMinutes(start, duration);
    return format(end, 'HH:mm');
  }

  isSlotAvailable(
    date: string,
    time: string,
    settings: BusinessSettings,
    existingAppointments: Appointment[],
    options?: GenerateDaySlotsOptions
  ): boolean {
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    const slots = this.generateDaySlots(dateObj, settings, existingAppointments, options);
    const slot = slots.find((s) => s.time === time);
    return slot ? slot.available : false;
  }

  private getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }
}

export const slotsService = new SlotsService();
