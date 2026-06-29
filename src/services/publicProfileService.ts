import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { omitUndefinedFields } from '../utils/firestore';
import type { BusinessSettings, PublicBusinessProfile } from '../types';

class PublicProfileService {
  private collectionName = 'publicProfiles';

  async exists(token: string): Promise<boolean> {
    const docSnap = await getDoc(doc(db, this.collectionName, token));
    return docSnap.exists();
  }

  async getByToken(token: string): Promise<PublicBusinessProfile | null> {
    const docRef = doc(db, this.collectionName, token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as PublicBusinessProfile;
    const publicBookingEnabled = data.publicBookingEnabled ?? true;
    if (!publicBookingEnabled) {
      return null;
    }

    return {
      ...data,
      publicBookingEnabled,
      allowHolidayAppointments: data.allowHolidayAppointments ?? true,
    };
  }

  async syncFromSettings(settings: BusinessSettings): Promise<void> {
    const profile: PublicBusinessProfile = {
      userId: settings.userId,
      businessName: settings.businessName,
      businessDescription: settings.businessDescription,
      workingHours: settings.workingHours,
      appointmentDuration: settings.appointmentDuration,
      breakTime: settings.breakTime,
      dailySessionLimit: settings.dailySessionLimit,
      allowHolidayAppointments: settings.allowHolidayAppointments,
      publicBookingEnabled: settings.publicBookingEnabled ?? true,
    };

    await setDoc(
      doc(db, this.collectionName, settings.publicBookingToken),
      omitUndefinedFields({ ...profile } as Record<string, unknown>)
    );
  }
}

export const publicProfileService = new PublicProfileService();
