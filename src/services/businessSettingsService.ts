import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { BusinessSettings, DayWorkingHours } from '../types';

class BusinessSettingsService {
  private collectionName = 'businessSettings';

  async getSettings(): Promise<BusinessSettings | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.collectionName, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as BusinessSettings;
      return {
        ...data,
        allowHolidayAppointments: data.allowHolidayAppointments ?? true,
      };
    }

    return null;
  }

  async saveSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const existingSettings = await this.getSettings();

    const updatedSettings: BusinessSettings = {
      userId: user.uid,
      businessName: settings.businessName || existingSettings?.businessName || 'Mi Negocio',
      businessDescription: settings.businessDescription || existingSettings?.businessDescription || '',
      workingHours: settings.workingHours || existingSettings?.workingHours || this.getDefaultWorkingHours(),
      appointmentDuration: settings.appointmentDuration || existingSettings?.appointmentDuration || 30,
      breakTime: settings.breakTime || existingSettings?.breakTime || 0,
      dailySessionLimit:
        settings.dailySessionLimit ??
        existingSettings?.dailySessionLimit ??
        this.calculateMaxDailySessions(
          settings.workingHours || existingSettings?.workingHours || this.getDefaultWorkingHours(),
          settings.appointmentDuration || existingSettings?.appointmentDuration || 30,
          settings.breakTime || existingSettings?.breakTime || 0
        ),
      allowHolidayAppointments:
        settings.allowHolidayAppointments ?? existingSettings?.allowHolidayAppointments ?? true,
      publicBookingToken: existingSettings?.publicBookingToken || this.generateToken(),
      publicBookingEnabled: settings.publicBookingEnabled ?? existingSettings?.publicBookingEnabled ?? true,
      createdAt: existingSettings?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cleanSettings = this.removeUndefinedFields(updatedSettings);
    await setDoc(doc(db, this.collectionName, user.uid), cleanSettings);
    return updatedSettings;
  }

  async getSettingsByUserId(userId: string): Promise<BusinessSettings | null> {
    const docRef = doc(db, this.collectionName, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as BusinessSettings;
      return {
        ...data,
        allowHolidayAppointments: data.allowHolidayAppointments ?? true,
      };
    }

    return null;
  }

  /** @deprecated Use getSettingsByUserId */
  async getSettingsByToken(token: string): Promise<BusinessSettings | null> {
    return this.getSettingsByUserId(token);
  }

  getPublicBookingUrl(userId: string): string {
    return `${window.location.origin}/booking/${userId}`;
  }

  private removeUndefinedFields(obj: BusinessSettings): BusinessSettings {
    const cleaned = { ...obj };
    (Object.keys(cleaned) as (keyof BusinessSettings)[]).forEach((key) => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      }
    });
    return cleaned;
  }

  private getDefaultWorkingHours(): Record<string, DayWorkingHours> {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const workingHours: Record<string, DayWorkingHours> = {};

    days.forEach((day) => {
      workingHours[day] = {
        enabled: day !== 'saturday' && day !== 'sunday',
        startTime: '09:00',
        endTime: '18:00',
      };
    });

    return workingHours;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private calculateMaxDailySessions(
    workingHours: Record<string, DayWorkingHours>,
    appointmentDuration: number,
    breakTime: number
  ): number {
    let totalSessions = 0;

    Object.values(workingHours).forEach((dayConfig) => {
      if (!dayConfig.enabled) return;

      const [startH, startM] = dayConfig.startTime.split(':').map(Number);
      const [endH, endM] = dayConfig.endTime.split(':').map(Number);

      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      const workingMins = endMins - startMins;

      const slotDuration = appointmentDuration + breakTime;
      const slots = Math.floor(workingMins / slotDuration);
      totalSessions += slots;
    });

    return Math.max(totalSessions, 1);
  }
}

export const businessSettingsService = new BusinessSettingsService();
