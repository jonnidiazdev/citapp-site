import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAppointments } from '../hooks/useAppointments';
import { appointmentService } from '../services/appointmentService';

vi.mock('../services/appointmentService', () => ({
  appointmentService: {
    getAppointments: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
  },
}));

const mockAppointment = {
  id: '1',
  userId: 'user1',
  clientName: 'Test',
  clientEmail: 'test@test.com',
  date: '2026-06-01',
  startTime: '09:00',
  endTime: '09:30',
  status: 'pending' as const,
  createdAt: '2026-01-01',
};

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads appointments on mount', async () => {
    vi.mocked(appointmentService.getAppointments).mockResolvedValue([mockAppointment]);

    const { result } = renderHook(() => useAppointments(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('sets error on load failure', async () => {
    vi.mocked(appointmentService.getAppointments).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAppointments(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
  });
});
