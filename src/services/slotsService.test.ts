import { describe, it, expect } from 'vitest';
import { parse } from 'date-fns';
import { slotsService } from '../services/slotsService';
import type { BusinessSettings, Appointment } from '../types';

const baseSettings: BusinessSettings = {
  userId: 'user1',
  businessName: 'Test',
  workingHours: {
    monday: { enabled: true, startTime: '09:00', endTime: '12:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '18:00' },
  },
  appointmentDuration: 30,
  breakTime: 0,
  dailySessionLimit: 10,
  allowHolidayAppointments: true,
  publicBookingToken: 'token',
  publicBookingEnabled: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('slotsService', () => {
  it('generates slots for enabled day', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date()); // Monday
    const slots = slotsService.generateDaySlots(date, baseSettings, []);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].available).toBe(true);
  });

  it('returns empty for disabled day', () => {
    const date = parse('2026-06-02', 'yyyy-MM-dd', new Date()); // Tuesday
    const slots = slotsService.generateDaySlots(date, baseSettings, []);
    expect(slots).toEqual([]);
  });

  it('marks occupied slots unavailable with OccupiedSlot input', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const occupied = [{ startTime: '09:00', endTime: '09:30' }];
    const slots = slotsService.generateDaySlots(date, baseSettings, occupied);
    const nineSlot = slots.find((s) => s.time === '09:00');
    expect(nineSlot?.available).toBe(false);
  });

  it('marks occupied slots unavailable', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const appointments: Appointment[] = [
      {
        id: '1',
        userId: 'user1',
        clientName: 'Test',
        clientEmail: 'test@test.com',
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '09:30',
        status: 'confirmed',
        createdAt: '2026-01-01',
      },
    ];
    const slots = slotsService.generateDaySlots(date, baseSettings, appointments);
    const nineSlot = slots.find((s) => s.time === '09:00');
    expect(nineSlot?.available).toBe(false);
  });

  it('returns empty when daily session limit reached', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const settings = { ...baseSettings, dailySessionLimit: 2 };
    const appointments: Appointment[] = [
      {
        id: '1',
        userId: 'user1',
        clientName: 'A',
        clientEmail: 'a@test.com',
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '09:30',
        status: 'confirmed',
        createdAt: '2026-01-01',
      },
      {
        id: '2',
        userId: 'user1',
        clientName: 'B',
        clientEmail: 'b@test.com',
        date: '2026-06-01',
        startTime: '09:30',
        endTime: '10:00',
        status: 'pending',
        createdAt: '2026-01-01',
      },
    ];
    const slots = slotsService.generateDaySlots(date, settings, appointments);
    expect(slots).toEqual([]);
  });

  it('ignores cancelled appointments for occupancy', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const appointments: Appointment[] = [
      {
        id: '1',
        userId: 'user1',
        clientName: 'Test',
        clientEmail: 'test@test.com',
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '09:30',
        status: 'cancelled',
        createdAt: '2026-01-01',
      },
    ];
    const slots = slotsService.generateDaySlots(date, baseSettings, appointments);
    const nineSlot = slots.find((s) => s.time === '09:00');
    expect(nineSlot?.available).toBe(true);
  });

  it('marks past slots unavailable for today', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const now = parse('11:30', 'HH:mm', date);
    const slots = slotsService.generateDaySlots(date, baseSettings, [], {
      now,
      blockPastSlots: true,
    });

    const elevenSlot = slots.find((s) => s.time === '11:00');
    expect(elevenSlot?.available).toBe(false);

    const tenThirtySlot = slots.find((s) => s.time === '10:30');
    expect(tenThirtySlot?.available).toBe(false);
  });

  it('keeps morning slots available when now is before them on same day', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const now = parse('10:00', 'HH:mm', date);
    const slots = slotsService.generateDaySlots(date, baseSettings, [], {
      now,
      blockPastSlots: true,
    });

    const elevenSlot = slots.find((s) => s.time === '11:00');
    expect(elevenSlot?.available).toBe(true);

    const nineSlot = slots.find((s) => s.time === '09:00');
    expect(nineSlot?.available).toBe(false);
  });

  it('does not block past slots on future dates', () => {
    const today = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const futureDate = parse('2026-06-08', 'yyyy-MM-dd', new Date());
    const now = parse('11:30', 'HH:mm', today);
    const slots = slotsService.generateDaySlots(futureDate, baseSettings, [], {
      now,
      blockPastSlots: true,
    });

    const nineSlot = slots.find((s) => s.time === '09:00');
    expect(nineSlot?.available).toBe(true);
  });

  it('isSlotAvailable returns false for past slot', () => {
    const date = parse('2026-06-01', 'yyyy-MM-dd', new Date());
    const now = parse('11:30', 'HH:mm', date);

    expect(
      slotsService.isSlotAvailable('2026-06-01', '11:00', baseSettings, [], {
        now,
        blockPastSlots: true,
      })
    ).toBe(false);

    expect(
      slotsService.isSlotAvailable('2026-06-01', '11:00', baseSettings, [], {
        now,
        blockPastSlots: false,
      })
    ).toBe(true);
  });
});
