export interface ArgentinaHoliday {
  fecha: string;
  tipo: string;
  nombre: string;
}

interface HolidayCacheEntry {
  fetchedAt: number;
  holidays: ArgentinaHoliday[];
}

class HolidayService {
  private readonly apiBaseUrl = 'https://api.argentinadatos.com/v1/feriados';
  private readonly cachePrefix = 'citapp_ar_holidays_';
  private readonly cacheTtlMs = 1000 * 60 * 60 * 24 * 14;
  private readonly memoryCache = new Map<number, ArgentinaHoliday[]>();

  async getHolidayByDate(date: string): Promise<ArgentinaHoliday | null> {
    const year = Number(date.split('-')[0]);
    if (!year) return null;

    const holidays = await this.getHolidaysByYear(year);
    return holidays.find((holiday) => holiday.fecha === date) || null;
  }

  async getHolidaysByYear(year: number): Promise<ArgentinaHoliday[]> {
    const cachedInMemory = this.memoryCache.get(year);
    if (cachedInMemory) {
      return cachedInMemory;
    }

    const cachedInStorage = this.getCachedHolidays(year);
    if (cachedInStorage) {
      this.memoryCache.set(year, cachedInStorage);
      return cachedInStorage;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/${year}`);
      if (!response.ok) {
        throw new Error(`Holiday API error: ${response.status}`);
      }

      const holidays = (await response.json()) as ArgentinaHoliday[];
      this.memoryCache.set(year, holidays);
      this.setCachedHolidays(year, holidays);
      return holidays;
    } catch (error) {
      console.error('Error fetching Argentina holidays:', error);
      return cachedInStorage || [];
    }
  }

  private getCachedHolidays(year: number): ArgentinaHoliday[] | null {
    try {
      const raw = localStorage.getItem(`${this.cachePrefix}${year}`);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as HolidayCacheEntry;
      if (Date.now() - parsed.fetchedAt > this.cacheTtlMs) {
        localStorage.removeItem(`${this.cachePrefix}${year}`);
        return null;
      }

      return parsed.holidays;
    } catch {
      return null;
    }
  }

  private setCachedHolidays(year: number, holidays: ArgentinaHoliday[]): void {
    try {
      const payload: HolidayCacheEntry = {
        fetchedAt: Date.now(),
        holidays,
      };

      localStorage.setItem(`${this.cachePrefix}${year}`, JSON.stringify(payload));
    } catch {
      // Ignore cache write errors.
    }
  }
}

export const holidayService = new HolidayService();