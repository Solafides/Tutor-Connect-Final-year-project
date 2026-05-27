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


    const tutorId = formData.get('tutorId') as string;
    const subjectName = formData.get('subjectName') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
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

    };

    const firstSessionDates = buildSessionDates(startDate, endDate, selectedDays);
    if (firstSessionDates.length === 0) {
        throw new Error('Please select at least one study day within the selected date range.');
    }


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

            scheduledFor: buildISODateTime(sessionDates[0], startTime),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            duration: hoursPerSession * 60,

            totalAmount,
            platformFee,
            tutorEarning,
            notes: notes || undefined,
            status: 'PENDING',
            isPaid: false,
            scheduleDetails,
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
        }
    });
}
