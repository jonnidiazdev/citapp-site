import { useCallback, useEffect, useState } from 'react';
import { appointmentService } from '../services/appointmentService';
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from '../types';

export function useAppointments(enabled = true) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading appointments');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createAppointment = useCallback(async (input: CreateAppointmentInput) => {
    const created = await appointmentService.createAppointment(input);
    setAppointments((prev) => [...prev, created]);
    return created;
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    const updated = await appointmentService.updateAppointment(id, updates);
    setAppointments((prev) => prev.map((apt) => (apt.id === id ? updated : apt)));
    return updated;
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    await appointmentService.deleteAppointment(id);
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
  }, []);

  const updateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    return updateAppointment(id, { status });
  }, [updateAppointment]);

  return {
    appointments,
    loading,
    error,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
  };
}
