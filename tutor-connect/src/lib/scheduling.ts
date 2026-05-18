import { addDays, addMonths, addWeeks, eachDayOfInterval, format, getDay, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export function formatDateInput(value: string) {
  return value;
}

export function getWeekdayName(date: Date): DayOfWeek {
  const index = getDay(date); // 0 = Sunday
  return index === 0 ? 'SUNDAY' : DAYS_OF_WEEK[index - 1];
}

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function buildSessionDates(startDate: string, endDate: string, selectedDays: DayOfWeek[]) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (isAfter(start, end)) return [];
  const allDays = eachDayOfInterval({ start, end });
  return allDays.filter(day => selectedDays.includes(getWeekdayName(day))).map(day => format(day, 'yyyy-MM-dd'));
}

export function calculateTotalSessions(startDate: string, endDate: string, selectedDays: DayOfWeek[]) {
  return buildSessionDates(startDate, endDate, selectedDays).length;
}

export function calculateTotalHours(totalSessions: number, hoursPerSession: number) {
  return totalSessions * hoursPerSession;
}

export function calculateCost(totalHours: number, hourlyRate: number) {
  return totalHours * hourlyRate;
}

export function addDurationToEndDate(startDate: string, packageDuration: string) {
  const start = parseISO(startDate);
  let end: Date;

  if (packageDuration.endsWith('week')) {
    const weeks = parseInt(packageDuration, 10);
    end = addWeeks(start, weeks);
    end = addDays(end, -1);
  } else if (packageDuration.endsWith('month')) {
    const months = parseInt(packageDuration, 10);
    end = addMonths(start, months);
    end = addDays(end, -1);
  } else {
    return '';
  }

  return format(end, 'yyyy-MM-dd');
}

export function buildDateRangeFromPackage(startDate: string, packageDuration: string) {
  if (!startDate || packageDuration === 'Custom') return { startDate, endDate: '' };

  return {
    startDate,
    endDate: addDurationToEndDate(startDate, packageDuration),
  };
}

export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);

  return aStart < bEnd && bStart < aEnd;
}

export function buildDateTimeRange(date: string, time: string) {
  return `${date}T${time}:00`;
}

export function isValidTimeRange(startTime: string, endTime: string) {
  return parseTimeToMinutes(endTime) > parseTimeToMinutes(startTime);
}

export function normalizeTimeString(time: string) {
  return time.length === 5 ? time : time.padStart(5, '0');
}
