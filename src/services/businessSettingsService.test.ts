import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BusinessSettings } from '../types';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockExists = vi.fn();
const mockSyncFromSettings = vi.fn();
const mockGenerateSecureToken = vi.fn(() => 'generated-token');

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'user-1' } },
}));

vi.mock('./publicProfileService', () => ({
  publicProfileService: {
    exists: (...args: unknown[]) => mockExists(...args),
    syncFromSettings: (...args: unknown[]) => mockSyncFromSettings(...args),
  },
}));

vi.mock('../utils/token', () => ({
  generateSecureToken: () => mockGenerateSecureToken(),
}));

import { businessSettingsService } from './businessSettingsService';

const baseSettings: BusinessSettings = {
  userId: 'user-1',
  businessName: 'Test Salon',
  businessDescription: '',
  workingHours: {
    monday: { enabled: true, startTime: '09:00', endTime: '18:00' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
    thursday: { enabled: true, startTime: '09:00', endTime: '18:00' },
    friday: { enabled: true, startTime: '09:00', endTime: '18:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '18:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '18:00' },
  },
  appointmentDuration: 30,
  breakTime: 0,
  dailySessionLimit: 10,
  allowHolidayAppointments: true,
  publicBookingToken: 'existing-token',
  publicBookingEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('businessSettingsService.getSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue(undefined);
    mockSyncFromSettings.mockResolvedValue(undefined);
    mockExists.mockResolvedValue(true);
  });

  it('returns null when settings document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await businessSettingsService.getSettings();

    expect(result).toBeNull();
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockSyncFromSettings).not.toHaveBeenCalled();
  });

  it('backfills missing publicBookingToken and syncs public profile', async () => {
    const stored = { ...baseSettings };
    delete (stored as Partial<BusinessSettings>).publicBookingToken;

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => stored,
    });
    mockExists.mockResolvedValue(false);

    const result = await businessSettingsService.getSettings();

    expect(result?.publicBookingToken).toBe('generated-token');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSyncFromSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        publicBookingToken: 'generated-token',
        publicBookingEnabled: true,
      })
    );
  });

  it('syncs public profile when token exists but profile is missing', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => baseSettings,
    });
    mockExists.mockResolvedValue(false);

    const result = await businessSettingsService.getSettings();

    expect(result?.publicBookingToken).toBe('existing-token');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSyncFromSettings).toHaveBeenCalledWith(
      expect.objectContaining({ publicBookingToken: 'existing-token' })
    );
  });

  it('does not persist when settings and public profile are already valid', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => baseSettings,
    });
    mockExists.mockResolvedValue(true);

    const result = await businessSettingsService.getSettings();

    expect(result?.publicBookingToken).toBe('existing-token');
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockSyncFromSettings).not.toHaveBeenCalled();
  });

  it('syncs public profile when exists check returns permission-denied', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => baseSettings,
    });
    mockExists.mockRejectedValue({ code: 'permission-denied' });

    const result = await businessSettingsService.getSettings();

    expect(result?.publicBookingToken).toBe('existing-token');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSyncFromSettings).toHaveBeenCalledWith(
      expect.objectContaining({ publicBookingToken: 'existing-token' })
    );
  });
});
