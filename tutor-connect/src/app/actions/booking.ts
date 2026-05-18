'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { bookingSchema } from '@/lib/validations';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { buildSessionDates, calculateTotalHours, calculateCost, timeRangesOverlap, isValidTimeRange, parseTimeToMinutes, getWeekdayName, DayOfWeek } from '@/lib/scheduling';

function parseJsonValue<T>(value: FormDataEntryValue | null, fallback: T): T {
    if (!value) return fallback;
    if (typeof value !== 'string') return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function buildISODateTime(date: string, time: string) {
    return new Date(`${date}T${time}:00`);
}

function formatDateOnly(value: string) {
    return value.split('T')[0];
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
    if (!value) return fallback;
    const parsed = parseInt(value.toString(), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

export async function createBooking(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'STUDENT') {
        throw new Error('Unauthorized');
    }

<<<<<<< HEAD
    const data = {
        tutorId: formData.get('tutorId') as string,
        subjectName: formData.get('subjectName') as string,
        scheduledFor: formData.get('scheduledFor') as string,
        endDate: formData.get('endDate') as string || undefined,
        schedule: formData.get('schedule') as string || undefined,
        duration: parseInt(formData.get('duration') as string),
        notes: formData.get('notes') as string || undefined,
=======
    const tutorId = formData.get('tutorId') as string;
    const subjectName = formData.get('subjectName') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const packageDuration = formData.get('packageDuration') as string;
    const daysPerWeek = parseInteger(formData.get('daysPerWeek'), 1);
    const selectedDays = parseJsonValue<DayOfWeek[]>(formData.get('selectedDays'), []);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const timezone = (formData.get('timezone') as string) || 'UTC';
    const notes = formData.get('notes') as string | null;

    const scheduleDetails = {
        selectedDays,
        startTime,
        endTime,
        timezone,
>>>>>>> e4f534e5f9af3f18933c5b4692e2670445658ec5
    };

    const firstSessionDates = buildSessionDates(startDate, endDate, selectedDays);
    if (firstSessionDates.length === 0) {
        throw new Error('Please select at least one study day within the selected date range.');
    }

<<<<<<< HEAD
    const { tutorId, subjectName, scheduledFor, endDate, schedule, duration, notes } = result.data;
=======
    if (!isValidTimeRange(startTime, endTime)) {
        throw new Error('Session end time must be after the start time.');
    }

    if (daysPerWeek !== selectedDays.length) {
        throw new Error(`Please select exactly ${daysPerWeek} study days.`);
    }

    if (new Date(endDate) < new Date(startDate)) {
        throw new Error('End date cannot be before start date.');
    }

    const hoursPerSession = parseInteger(formData.get('hoursPerSession'), 1);
    if (hoursPerSession <= 0) throw new Error('Hours per session must be positive.');

    const data = {
        tutorId,
        subjectName,
        scheduledFor: buildISODateTime(firstSessionDates[0], startTime).toISOString(),
        startDate,
        endDate,
        packageDuration,
        daysPerWeek,
        selectedDays,
        startTime,
        endTime,
        timezone,
        hoursPerSession,
        duration: hoursPerSession * 60,
        notes: notes || undefined,
        scheduleDetails,
    };

    const validation = bookingSchema.safeParse(data);
    if (!validation.success) {
        throw new Error('Invalid booking data');
    }
>>>>>>> e4f534e5f9af3f18933c5b4692e2670445658ec5

    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorId }
    });
    if (!tutor) throw new Error('Tutor not found');

    const studentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { studentProfile: true }
    });
    const studentId = studentUser?.studentProfile?.id;
    if (!studentId) throw new Error('Student profile not found');

    const sessionDates = buildSessionDates(startDate, endDate, selectedDays);

    const totalSessions = sessionDates.length;
    const totalHours = calculateTotalHours(totalSessions, hoursPerSession);
    const hourlyRate = Number(tutor.hourlyRate);
    const totalAmount = calculateCost(totalHours, hourlyRate);
    const platformFee = Number((totalAmount * 0.1).toFixed(2));
    const tutorEarning = Number((totalAmount - platformFee).toFixed(2));

    const conflictDateRangeStart = new Date(startDate);
    const conflictDateRangeEnd = new Date(endDate);

    const availabilityRecords = await prisma.availability.findMany({
        where: {
            tutorId,
            isActive: true,
        },
    });

    const availabilityByDay = availabilityRecords.reduce<Partial<Record<DayOfWeek, { startTime: string; endTime: string }[]>>>((acc, record) => {
        const day = record.dayOfWeek as DayOfWeek;
        if (!acc[day]) acc[day] = [];
        acc[day]!.push({ startTime: record.startTime, endTime: record.endTime });
        return acc;
    }, {});

    const existingSessions = await prisma.sessionInstance.findMany({
        where: {
            booking: {
                tutorId,
                status: {
                    in: ['PENDING', 'ACCEPTED'],
                },
            },
            sessionDate: {
                gte: conflictDateRangeStart,
                lte: conflictDateRangeEnd,
            },
        },
        include: { booking: true },
    });

    const existingBookings = await prisma.booking.findMany({
        where: {
            tutorId,
            status: {
                in: ['PENDING', 'ACCEPTED'],
            },
            scheduledFor: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        },
    });

    function isConflict(existingStart: string, existingEnd: string) {
        return timeRangesOverlap(startTime, endTime, existingStart, existingEnd);
    }

    const conflict = sessionDates.some((date) => {
        const weekday = getWeekdayName(new Date(`${date}T00:00:00`));
        const availableRanges = availabilityByDay[weekday] || [];

        const availabilityConflict = !availableRanges.some((range) =>
            parseTimeToMinutes(startTime) >= parseTimeToMinutes(range.startTime) &&
            parseTimeToMinutes(endTime) <= parseTimeToMinutes(range.endTime)
        );

        if (availabilityConflict) {
            throw new Error(`Selected time range is outside ${weekday} availability for this tutor. Please choose a time within their available schedule.`);
        }

        const instanceConflict = existingSessions.some((existing) => {
            const existingSessionDate = formatDateOnly(existing.sessionDate.toISOString());
            return existingSessionDate === date && isConflict(existing.startTime, existing.endTime);
        });

        if (instanceConflict) return true;

        const bookingConflict = existingBookings.some((booking) => {
            const existingStart = booking.scheduledFor.toISOString().slice(11, 16);
            const existingEnd = (() => {
                const start = booking.scheduledFor;
                const end = new Date(start.getTime() + booking.duration * 60 * 1000);
                return end.toISOString().slice(11, 16);
            })();
            return formatDateOnly(booking.scheduledFor.toISOString()) === date && isConflict(existingStart, existingEnd);
        });

        return bookingConflict;
    });

    if (conflict) {
        throw new Error('This tutor is already booked during the selected time. Please choose another time interval.');
    }

    const booking = await prisma.booking.create({
        data: {
            tutorId,
            studentId,
            subjectName,
<<<<<<< HEAD
            scheduledFor: new Date(scheduledFor),
            endDate: endDate ? new Date(endDate) : undefined,
            schedule: schedule ? JSON.parse(schedule) : undefined,
            duration,
            notes,
=======
            scheduledFor: buildISODateTime(sessionDates[0], startTime),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            packageDuration,
            daysPerWeek,
            duration: hoursPerSession * 60,
>>>>>>> e4f534e5f9af3f18933c5b4692e2670445658ec5
            totalAmount,
            totalHours,
            totalSessions,
            platformFee,
            tutorEarning,
            notes: notes || undefined,
            status: 'PENDING',
            isPaid: false,
            scheduleDetails,
            recurringSchedule: {
                create: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    selectedDays,
                    startTime,
                    endTime,
                    timezone,
                }
            },
            sessions: {
                create: sessionDates.map((date) => ({
                    sessionDate: new Date(`${date}T00:00:00`),
                    startTime,
                    endTime,
                    durationHours: hoursPerSession,
                    status: 'SCHEDULED',
                }))
            }
        },
        include: {
            recurringSchedule: true,
            sessions: true,
        }
    });

    revalidatePath('/student/bookings');
    redirect('/student/bookings');
}

export async function cancelBooking(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const bookingId = formData.get('bookingId') as string;
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { student: { include: { user: true } } }
    });
    if (!booking) throw new Error('Booking not found');
    if (session.user.role === 'STUDENT' && booking.student.userId !== session.user.id) throw new Error('Unauthorized');

    await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'CANCELLED',
            sessions: { updateMany: { where: { status: 'SCHEDULED' }, data: { status: 'CANCELLED' } } }
        }
    });
}
