// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  phone?: string;
  createdAt: string;
}

// Appointment types
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'absent';

export interface Appointment {
  id: string;
  userId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface PublicAppointmentInput {
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: 'pending';
}

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'userId'>;

// Booking slot (used by slotsService)
export interface BookingTimeSlot {
  time: string;
  available: boolean;
  date: string;
}

// Business settings
export interface DayWorkingHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface BusinessSettings {
  userId: string;
  businessName: string;
  businessDescription?: string;
  workingHours: Record<string, DayWorkingHours>;
  appointmentDuration: number;
  breakTime: number;
  dailySessionLimit: number;
  allowHolidayAppointments: boolean;
  publicBookingToken: string;
  publicBookingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy types — used by businessStore (TODO: wire or remove)
export interface TimeRange {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
}

export interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface BusinessHours {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
}
