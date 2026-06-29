import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Appointment, DayOccupiedSlots, OccupiedSlot } from '../types';

class BookingSlotsService {
  private dayDocRef(userId: string, date: string) {
    return doc(db, 'bookingSlots', userId, 'days', date);
  }

  async getOccupiedSlots(userId: string, date: string): Promise<OccupiedSlot[]> {
    const docSnap = await getDoc(this.dayDocRef(userId, date));
    if (!docSnap.exists()) {
      return [];
    }
    return (docSnap.data() as DayOccupiedSlots).occupied ?? [];
  }

  async addOccupiedSlot(userId: string, date: string, slot: OccupiedSlot): Promise<void> {
    const docRef = this.dayDocRef(userId, date);
    const docSnap = await getDoc(docRef);
    const existing = docSnap.exists() ? ((docSnap.data() as DayOccupiedSlots).occupied ?? []) : [];

    const alreadyExists = existing.some(
      (entry) => entry.startTime === slot.startTime && entry.endTime === slot.endTime
    );
    if (alreadyExists) {
      return;
    }

    await setDoc(docRef, { occupied: [...existing, slot] });
  }

  async removeOccupiedSlot(userId: string, date: string, slot: OccupiedSlot): Promise<void> {
    const docRef = this.dayDocRef(userId, date);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return;
    }

    const existing = (docSnap.data() as DayOccupiedSlots).occupied ?? [];
    const updated = existing.filter(
      (entry) => !(entry.startTime === slot.startTime && entry.endTime === slot.endTime)
    );

    await setDoc(docRef, { occupied: updated });
  }

  async syncDayFromAppointments(userId: string, date: string, appointments: Appointment[]): Promise<void> {
    const occupied = appointments
      .filter((apt) => apt.status !== 'cancelled' && apt.status !== 'absent')
      .map((apt) => ({ startTime: apt.startTime, endTime: apt.endTime }));

    await setDoc(this.dayDocRef(userId, date), { occupied });
  }

  async syncAllFromAppointments(userId: string, appointments: Appointment[]): Promise<void> {
    const byDate = new Map<string, OccupiedSlot[]>();

    for (const apt of appointments) {
      if (apt.status === 'cancelled' || apt.status === 'absent') {
        continue;
      }
      const slots = byDate.get(apt.date) ?? [];
      slots.push({ startTime: apt.startTime, endTime: apt.endTime });
      byDate.set(apt.date, slots);
    }

    await Promise.all(
      Array.from(byDate.entries()).map(([date, occupied]) =>
        setDoc(this.dayDocRef(userId, date), { occupied })
      )
    );
  }
}

export const bookingSlotsService = new BookingSlotsService();
