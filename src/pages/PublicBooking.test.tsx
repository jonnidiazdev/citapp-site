import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { format } from 'date-fns';
import { PublicBooking } from '../pages/PublicBooking';
import { ToastProvider } from '../components/ui/ToastProvider';
import { businessSettingsService } from '../services/businessSettingsService';
import { appointmentService } from '../services/appointmentService';
import { slotsService } from '../services/slotsService';

vi.mock('../services/businessSettingsService', () => ({
  businessSettingsService: {
    getSettingsByUserId: vi.fn(),
  },
}));

vi.mock('../services/appointmentService', () => ({
  appointmentService: {
    getAppointmentsByUserAndDate: vi.fn(),
    createPublicAppointment: vi.fn(),
  },
}));

vi.mock('../services/holidayService', () => ({
  holidayService: {
    getHolidayByDate: vi.fn().mockResolvedValue(null),
  },
}));

const mockSettings = {
  userId: 'user1',
  businessName: 'Test Salon',
  workingHours: {
    monday: { enabled: true, startTime: '09:00', endTime: '12:00' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '12:00' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '12:00' },
    thursday: { enabled: true, startTime: '09:00', endTime: '12:00' },
    friday: { enabled: true, startTime: '09:00', endTime: '12:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '12:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '12:00' },
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

function renderPublicBooking() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/booking/user1']}>
        <Routes>
          <Route path="/booking/:userId" element={<PublicBooking />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('PublicBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(slotsService, 'generateDaySlots').mockReturnValue([
      { time: '09:00', available: true, date: format(new Date(), 'yyyy-MM-dd') },
    ]);
    vi.spyOn(slotsService, 'isSlotAvailable').mockReturnValue(true);
    vi.mocked(businessSettingsService.getSettingsByUserId).mockResolvedValue(mockSettings);
    vi.mocked(appointmentService.getAppointmentsByUserAndDate).mockResolvedValue([]);
    vi.mocked(appointmentService.createPublicAppointment).mockResolvedValue({
      id: 'new1',
      userId: 'user1',
      clientName: 'Juan',
      clientEmail: 'juan@test.com',
      date: '2026-06-01',
      startTime: '09:00',
      endTime: '09:30',
      status: 'pending',
      createdAt: '2026-01-01',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads business settings via service', async () => {
    renderPublicBooking();
    await waitFor(() => expect(screen.getByText('Test Salon')).toBeInTheDocument());
    expect(businessSettingsService.getSettingsByUserId).toHaveBeenCalledWith('user1');
  });

  it('submits booking via appointmentService not direct Firestore', async () => {
    const user = userEvent.setup();
    renderPublicBooking();

    await waitFor(() => expect(screen.getByText('Test Salon')).toBeInTheDocument());

    const timeButtons = await screen.findAllByRole('button', { name: /^09:00$/ });
    const availableButton = timeButtons.find(
      (btn) => !(btn as HTMLButtonElement).disabled
    );
    if (availableButton) await user.click(availableButton);

    await waitFor(() => expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Juan');
    await user.type(screen.getByLabelText(/Email/i), 'juan@test.com');
    await user.click(screen.getByRole('button', { name: /Confirmar Reserva/i }));

    await waitFor(() => {
      expect(appointmentService.createPublicAppointment).toHaveBeenCalled();
    });
  });
});
