import { addDays, addMonths, format, parse } from 'date-fns';

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

export function getRecurringDates(
  baseDate: string,
  recurrenceType: RecurrenceType,
  recurrenceCount: number
): string[] {
  const startDate = parse(baseDate, 'yyyy-MM-dd', new Date());
  const totalOccurrences = recurrenceType === 'none' ? 1 : Math.max(1, recurrenceCount);

  return Array.from({ length: totalOccurrences }, (_, index) => {
    const date =
      recurrenceType === 'weekly'
        ? addDays(startDate, 7 * index)
        : recurrenceType === 'biweekly'
          ? addDays(startDate, 14 * index)
          : recurrenceType === 'monthly'
            ? addMonths(startDate, index)
            : startDate;
    return format(date, 'yyyy-MM-dd');
  });
}
