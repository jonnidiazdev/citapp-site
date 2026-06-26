import { create } from 'zustand';
import type { Service, Schedule } from '../types';

// TODO: wire or remove — deferred. Business settings live in businessSettingsService.

interface BusinessStore {
  services: Service[];
  schedules: Schedule[];
  businessName: string;
  businessEmail: string;
  
  setServices: (services: Service[]) => void;
  addService: (service: Service) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  
  setBusinessInfo: (name: string, email: string) => void;
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  services: [],
  schedules: [],
  businessName: 'Mi Negocio',
  businessEmail: 'info@minegocio.com',
  
  setServices: (services) => set({ services }),
  addService: (service) => {
    set((state) => ({
      services: [...state.services, service],
    }));
  },
  updateService: (id, updates) => {
    set((state) => ({
      services: state.services.map((svc) =>
        svc.id === id ? { ...svc, ...updates } : svc
      ),
    }));
  },
  deleteService: (id) => {
    set((state) => ({
      services: state.services.filter((svc) => svc.id !== id),
    }));
  },
  
  setSchedules: (schedules) => set({ schedules }),
  addSchedule: (schedule) => {
    set((state) => ({
      schedules: [...state.schedules, schedule],
    }));
  },
  updateSchedule: (id, updates) => {
    set((state) => ({
      schedules: state.schedules.map((sch) =>
        sch.id === id ? { ...sch, ...updates } : sch
      ),
    }));
  },
  deleteSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.filter((sch) => sch.id !== id),
    }));
  },
  
  setBusinessInfo: (name, email) => {
    set({ businessName: name, businessEmail: email });
  },
}));
