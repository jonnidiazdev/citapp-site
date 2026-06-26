import { create } from 'zustand';
import type { Appointment } from '../types';

// TODO: wire or remove — deferred. useAppointments hook is the integration point.

interface AppointmentStore {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByClient: (clientId: string) => Appointment[];
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  
  setAppointments: (appointments) => set({ appointments }),
  
  addAppointment: (appointment) => {
    set((state) => ({
      appointments: [...state.appointments, appointment],
    }));
  },
  
  updateAppointment: (id, updates) => {
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, ...updates } : apt
      ),
    }));
  },
  
  deleteAppointment: (id) => {
    set((state) => ({
      appointments: state.appointments.filter((apt) => apt.id !== id),
    }));
  },
  
  getAppointmentsByDate: (date) => {
    return get().appointments.filter((apt) => apt.date === date);
  },
  
  getAppointmentsByClient: (clientId) => {
    return get().appointments.filter((apt) => apt.clientId === clientId);
  },
}));
