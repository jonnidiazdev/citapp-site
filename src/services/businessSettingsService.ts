import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { publicProfileService } from './publicProfileService';
import { generateSecureToken } from '../utils/token';
import type { BusinessSettings, DayWorkingHours } from '../types';

class BusinessSettingsService {
  private collectionName = 'businessSettings';

  async getSettings(): Promise<BusinessSettings | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.collectionName, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as BusinessSettings;
    const normalized = this.normalizeSettings(data);

    const needsTokenBackfill = !data.publicBookingToken;
    const needsEnabledBackfill = data.publicBookingEnabled === undefined;
    const profileExists = await this.checkPublicProfileExists(normalized.publicBookingToken);

    if (needsTokenBackfill || needsEnabledBackfill || !profileExists) {
      const cleanSettings = this.removeUndefinedFields({
        ...normalized,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(docRef, cleanSettings);
      await publicProfileService.syncFromSettings(normalized);
    }

    return normalized;
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
      publicBookingToken: existingSettings?.publicBookingToken || generateSecureToken(),
      publicBookingEnabled: settings.publicBookingEnabled ?? existingSettings?.publicBookingEnabled ?? true,
      createdAt: existingSettings?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cleanSettings = this.removeUndefinedFields(updatedSettings);
    await setDoc(doc(db, this.collectionName, user.uid), cleanSettings);
    await publicProfileService.syncFromSettings(updatedSettings);
    return updatedSettings;
  }

  getPublicBookingUrl(token: string): string {
    return `${window.location.origin}/booking/${token}`;
  }

  private async checkPublicProfileExists(token: string): Promise<boolean> {
    try {
      return await publicProfileService.exists(token);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code === 'permission-denied') {
        return false;
      }
      throw error;
    }
  }

  private normalizeSettings(data: BusinessSettings): BusinessSettings {
    return {
      ...data,
      allowHolidayAppointments: data.allowHolidayAppointments ?? true,
      publicBookingEnabled: data.publicBookingEnabled ?? true,
      publicBookingToken: data.publicBookingToken || generateSecureToken(),
    };
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
