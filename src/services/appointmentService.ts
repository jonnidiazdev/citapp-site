import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { bookingSlotsService } from './bookingSlotsService';
import { omitUndefinedFields } from '../utils/firestore';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  OccupiedSlot,
  PublicAppointmentInput,
} from '../types';

class AppointmentService {
  private collectionName = 'appointments';

  async getAppointments(): Promise<Appointment[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.convertDocToAppointment(d));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return this.getAppointmentsByUserAndDate(user.uid, date);
  }

  async getAppointmentsByUserAndDate(userId: string, date: string): Promise<Appointment[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('date', '==', date)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.convertDocToAppointment(d));
  }

  async createAppointment(appointment: CreateAppointmentInput): Promise<Appointment> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const appointmentData = omitUndefinedFields({
      ...appointment,
      userId: user.uid,
      createdAt: Timestamp.now(),
    });

    const docRef = await addDoc(collection(db, this.collectionName), appointmentData);

    if (appointment.status !== 'cancelled' && appointment.status !== 'absent') {
      await bookingSlotsService.addOccupiedSlot(user.uid, appointment.date, {
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      });
    }

    return {
      ...appointment,
      userId: user.uid,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
  }

  async createPublicAppointment(data: PublicAppointmentInput): Promise<Appointment> {
    const appointmentData = omitUndefinedFields({
      ...data,
      createdAt: Timestamp.now(),
    });

    const docRef = await addDoc(collection(db, this.collectionName), appointmentData);

    await bookingSlotsService.addOccupiedSlot(data.userId, data.date, {
      startTime: data.startTime,
      endTime: data.endTime,
    });

    return {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
    };
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const appointmentRef = doc(db, this.collectionName, id);

    const snapshot = await getDocs(
      query(
        collection(db, this.collectionName),
        where('__name__', '==', id),
        where('userId', '==', user.uid)
      )
    );

    if (snapshot.empty) {
      throw new Error('Appointment not found or access denied');
    }

    const existing = this.convertDocToAppointment(snapshot.docs[0]);

    await updateDoc(appointmentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await this.syncSlotAfterUpdate(existing, updates);

    const updated = (
      await getDocs(query(collection(db, this.collectionName), where('__name__', '==', id)))
    ).docs[0];
    return this.convertDocToAppointment(updated);
  }

  async deleteAppointment(id: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const snapshot = await getDocs(
      query(
        collection(db, this.collectionName),
        where('__name__', '==', id),
        where('userId', '==', user.uid)
      )
    );

    if (snapshot.empty) {
      throw new Error('Appointment not found or access denied');
    }

    const existing = this.convertDocToAppointment(snapshot.docs[0]);
    await deleteDoc(doc(db, this.collectionName, id));

    if (existing.status !== 'cancelled' && existing.status !== 'absent') {
      await bookingSlotsService.removeOccupiedSlot(existing.userId, existing.date, {
        startTime: existing.startTime,
        endTime: existing.endTime,
      });
    }
  }

  convertDocToAppointment(docSnap: QueryDocumentSnapshot): Appointment {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      userId: data.userId ?? '',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Appointment;
  }

  private async syncSlotAfterUpdate(
    existing: Appointment,
    updates: Partial<Appointment>
  ): Promise<void> {
    const previousSlot: OccupiedSlot = {
      startTime: existing.startTime,
      endTime: existing.endTime,
    };
    const nextDate = updates.date ?? existing.date;
    const nextStart = updates.startTime ?? existing.startTime;
    const nextEnd = updates.endTime ?? existing.endTime;
    const nextStatus = (updates.status ?? existing.status) as AppointmentStatus;
    const previousActive = existing.status !== 'cancelled' && existing.status !== 'absent';
    const nextActive = nextStatus !== 'cancelled' && nextStatus !== 'absent';
    const nextSlot: OccupiedSlot = { startTime: nextStart, endTime: nextEnd };

    const scheduleChanged =
      existing.date !== nextDate ||
      existing.startTime !== nextStart ||
      existing.endTime !== nextEnd;

    if (scheduleChanged) {
      if (previousActive) {
        await bookingSlotsService.removeOccupiedSlot(existing.userId, existing.date, previousSlot);
      }
      if (nextActive) {
        await bookingSlotsService.addOccupiedSlot(existing.userId, nextDate, nextSlot);
      }
      return;
    }

    if (previousActive && !nextActive) {
      await bookingSlotsService.removeOccupiedSlot(existing.userId, existing.date, previousSlot);
      return;
    }

    if (!previousActive && nextActive) {
      await bookingSlotsService.addOccupiedSlot(existing.userId, nextDate, nextSlot);
    }
  }
}

export const appointmentService = new AppointmentService();
