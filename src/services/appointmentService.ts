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
import { omitUndefinedFields } from '../utils/firestore';
import type {
  Appointment,
  CreateAppointmentInput,
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

    await updateDoc(appointmentRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

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

    await deleteDoc(doc(db, this.collectionName, id));
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
}

export const appointmentService = new AppointmentService();
