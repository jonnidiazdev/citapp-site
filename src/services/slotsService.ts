import { format, addMinutes, parse, isAfter, isBefore, isEqual, isSameDay } from 'date-fns';
import type {
  Appointment,
  BookingTimeSlot,
  OccupiedSlot,
  SlotGenerationSettings,
} from '../types';

export type { BookingTimeSlot as TimeSlot };

export interface GenerateDaySlotsOptions {
  now?: Date;
  blockPastSlots?: boolean;
}

type OccupancyInput = OccupiedSlot[] | Appointment[];

class SlotsService {
  generateDaySlots(
    date: Date,
    settings: SlotGenerationSettings,
    occupied: OccupancyInput,
    options?: GenerateDaySlotsOptions
  ): BookingTimeSlot[] {
    const dayName = this.getDayName(date);
    const dayConfig = settings.workingHours[dayName];

    if (!dayConfig || !dayConfig.enabled) {
      return [];
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const normalizedOccupied = this.normalizeOccupied(dateStr, occupied);

    if (normalizedOccupied.length >= settings.dailySessionLimit) {
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

      const isOccupied = normalizedOccupied.some((slot) => {
        const aptStart = parse(slot.startTime, 'HH:mm', date);
        const aptEnd = parse(slot.endTime, 'HH:mm', date);

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
    settings: SlotGenerationSettings,
    occupied: OccupancyInput,
    options?: GenerateDaySlotsOptions
  ): boolean {
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    const slots = this.generateDaySlots(dateObj, settings, occupied, options);
    const slot = slots.find((s) => s.time === time);
    return slot ? slot.available : false;
  }

  private normalizeOccupied(dateStr: string, occupied: OccupancyInput): OccupiedSlot[] {
    if (occupied.length === 0) {
      return [];
    }

    const first = occupied[0];
    if ('status' in first) {
      return (occupied as Appointment[])
        .filter(
          (apt) =>
            apt.date === dateStr && apt.status !== 'cancelled' && apt.status !== 'absent'
        )
        .map((apt) => ({ startTime: apt.startTime, endTime: apt.endTime }));
    }

    return occupied as OccupiedSlot[];
  }

  private getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }
}

export const slotsService = new SlotsService();
