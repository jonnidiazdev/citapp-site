import { describe, it, expect } from 'vitest';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { appointmentService } from './appointmentService';

describe('appointmentService.convertDocToAppointment', () => {
  it('converts Firestore document to Appointment', () => {
    const mockDoc = {
      id: 'apt1',
      data: () => ({
        userId: 'user1',
        clientName: 'Test User',
        clientEmail: 'test@test.com',
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '09:30',
        status: 'pending',
        createdAt: { toDate: () => new Date('2026-01-15T10:00:00Z') },
      }),
    } as unknown as QueryDocumentSnapshot;

    const result = appointmentService.convertDocToAppointment(mockDoc);

    expect(result.id).toBe('apt1');
    expect(result.userId).toBe('user1');
    expect(result.clientName).toBe('Test User');
    expect(result.createdAt).toBe(new Date('2026-01-15T10:00:00Z').toISOString());
  });
});
