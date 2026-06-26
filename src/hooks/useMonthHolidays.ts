import { useEffect, useState } from 'react';
import { holidayService } from '../services/holidayService';

export function useMonthHolidays(currentMonth: Date) {
  const [monthHolidays, setMonthHolidays] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadMonthHolidays = async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      try {
        const holidays = await holidayService.getHolidaysByYear(year);
        const monthHolidaySet = new Set<string>();
        holidays.forEach((holiday) => {
          const [, hMonth] = holiday.fecha.split('-');
          if (parseInt(hMonth) === month) {
            monthHolidaySet.add(holiday.fecha);
          }
        });
        setMonthHolidays(monthHolidaySet);
      } catch (error) {
        console.error('Error loading holidays for calendar:', error);
      }
    };

    loadMonthHolidays();
  }, [currentMonth]);

  const isHoliday = (date: string) => monthHolidays.has(date);

  return { monthHolidays, isHoliday };
}
