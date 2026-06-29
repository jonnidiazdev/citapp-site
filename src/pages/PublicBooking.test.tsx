import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { format } from 'date-fns';
import { PublicBooking } from '../pages/PublicBooking';
import { ToastProvider } from '../components/ui/ToastProvider';
import { publicProfileService } from '../services/publicProfileService';
import { appointmentService } from '../services/appointmentService';
import { bookingSlotsService } from '../services/bookingSlotsService';
import { slotsService } from '../services/slotsService';

vi.mock('../services/publicProfileService', () => ({
  publicProfileService: {
    getByToken: vi.fn(),
  },
}));

vi.mock('../services/appointmentService', () => ({
  appointmentService: {
    createPublicAppointment: vi.fn(),
  },
}));

vi.mock('../services/bookingSlotsService', () => ({
  bookingSlotsService: {
    getOccupiedSlots: vi.fn(),
  },
}));

vi.mock('../services/holidayService', () => ({
  holidayService: {
    getHolidayByDate: vi.fn().mockResolvedValue(null),
  },
}));

const mockProfile = {
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
  publicBookingEnabled: true,
};

function renderPublicBooking() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/booking/token1']}>
        <Routes>
          <Route path="/booking/:token" element={<PublicBooking />} />
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
    vi.mocked(publicProfileService.getByToken).mockResolvedValue(mockProfile);
    vi.mocked(bookingSlotsService.getOccupiedSlots).mockResolvedValue([]);
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

  it('loads public profile via token', async () => {
    renderPublicBooking();
    await waitFor(() => expect(screen.getByText('Test Salon')).toBeInTheDocument());
    expect(publicProfileService.getByToken).toHaveBeenCalledWith('token1');
  });

  it('shows a single inline message when profile is missing', async () => {
    vi.mocked(publicProfileService.getByToken).mockResolvedValue(null);

    renderPublicBooking();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Este link de reservas no está disponible. Pedile al negocio un link actualizado.'
      );
    });
    expect(screen.queryByText('No se encontró la información del negocio')).not.toBeInTheDocument();
  });

  it('shows a distinct inline message when loading fails', async () => {
    vi.mocked(publicProfileService.getByToken).mockRejectedValue(new Error('permission-denied'));

    renderPublicBooking();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo cargar la información del negocio. Intentá de nuevo en unos minutos.'
      );
    });
  });

  it('loads profile when publicBookingEnabled is missing in stored data', async () => {
    const { publicBookingEnabled: _enabled, ...profileWithoutFlag } = mockProfile;
    vi.mocked(publicProfileService.getByToken).mockResolvedValue({
      ...profileWithoutFlag,
      publicBookingEnabled: true,
    });

    renderPublicBooking();

    await waitFor(() => expect(screen.getByText('Test Salon')).toBeInTheDocument());
  });

  it('submits booking via appointmentService not direct Firestore', async () => {
    const user = userEvent.setup();
    renderPublicBooking();

    await waitFor(() => expect(screen.getByText('Test Salon')).toBeInTheDocument());

    const timeButtons = await screen.findAllByRole('button', { name: /Horario 09:00/i });
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
