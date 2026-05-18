'use client';

<<<<<<< HEAD
import { useState, useMemo } from 'react';
=======
import { useState, useMemo, useEffect } from 'react';
>>>>>>> e4f534e5f9af3f18933c5b4692e2670445658ec5
import { createBooking } from '@/app/actions/booking';
import { buildDateRangeFromPackage } from '@/lib/scheduling';

interface BookingFormProps {
  tutorId: string;
  tutorName: string;
  hourlyRate: number;
  subjects: { id: string; name: string }[];
}

<<<<<<< HEAD
const DAYS_OF_WEEK = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const formatTimeAMPM = (hours: number) => {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h.toString().padStart(2, '0')}:00 ${ampm}`;
};

const timeIntervals = Array.from({ length: 24 }, (_, i) => {
    const startHour = i;
    const endHour = (i + 1) % 24;
    const start24 = startHour.toString().padStart(2, '0') + ':00';
    const end24 = endHour.toString().padStart(2, '0') + ':00';
    
    return { 
        start: start24, 
        end: end24, 
        value: `${start24}-${end24}`,
        label: `${formatTimeAMPM(startHour)} - ${formatTimeAMPM(endHour)}` 
    };
});

export function BookingForm({ tutorId, tutorName, hourlyRate, subjects }: BookingFormProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [schedule, setSchedule] = useState<{ dayOfWeek: string; startTime: string; endTime: string }[]>([]);
    const [newSlot, setNewSlot] = useState({ dayOfWeek: 'MONDAY', timeSlot: '06:00-07:00' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddSlot = () => {
        const [startTime, endTime] = newSlot.timeSlot.split('-');
        if (!schedule.some(s => s.dayOfWeek === newSlot.dayOfWeek && s.startTime === startTime)) {
            setSchedule([...schedule, { dayOfWeek: newSlot.dayOfWeek, startTime, endTime }]);
        }
    };

    const handleRemoveSlot = (index: number) => {
        setSchedule(schedule.filter((_, i) => i !== index));
    };

    const calculatedData = useMemo(() => {
        if (!startDate || !endDate || schedule.length === 0) return { totalCost: 0, totalHours: 0, weeks: 0 };
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return { totalCost: 0, totalHours: 0, weeks: 0 };
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.max(1, Math.ceil(diffDays / 7));
        
        const hoursPerWeek = schedule.length;
        const totalHours = hoursPerWeek * weeks;
        return {
            totalCost: totalHours * hourlyRate,
            totalHours,
            weeks
        };
    }, [startDate, endDate, schedule, hourlyRate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!startDate || !endDate) {
                throw new Error("Please select start and end dates.");
            }
            if (new Date(startDate) < new Date(new Date().setHours(0,0,0,0))) {
                throw new Error("Start date cannot be in the past.");
            }
            if (new Date(endDate) < new Date(startDate)) {
                throw new Error("End date must be after start date.");
            }
            if (schedule.length === 0) {
                throw new Error("Please add at least one class schedule time.");
            }

            const formData = new FormData(e.currentTarget);
            formData.set('scheduledFor', new Date(startDate).toISOString());
            formData.set('endDate', new Date(endDate).toISOString());
            formData.set('schedule', JSON.stringify(schedule));
            formData.set('duration', (calculatedData.totalHours * 60).toString());
=======
const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export function BookingForm({ tutorId, tutorName, hourlyRate, subjects }: BookingFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [packageDuration, setPackageDuration] = useState('1 week');
  const [daysPerWeek, setDaysPerWeek] = useState(2);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [hoursPerSession, setHoursPerSession] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState('16:00');
  const [sessionEndTime, setSessionEndTime] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz || 'UTC');
  }, []);

  useEffect(() => {
    if (!startDate || packageDuration === 'Custom') return;
    const { endDate: calculatedEndDate } = buildDateRangeFromPackage(startDate, packageDuration);
    if (calculatedEndDate) {
      setEndDate(calculatedEndDate);
    }
  }, [startDate, packageDuration]);

  const sessionDates = useMemo(() => {
    if (!startDate || !endDate || selectedDays.length === 0) return [];
>>>>>>> e4f534e5f9af3f18933c5b4692e2670445658ec5

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return [];

<<<<<<< HEAD
    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <input type="hidden" name="tutorId" value={tutorId} />
            
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="subjectName" className="block text-sm font-medium text-slate-700 mb-1">
                    Subject
                </label>
                <select
                    name="subjectName"
                    id="subjectName"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    <option value="">Select a subject</option>
                    {subjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
                        Class Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">
                        Class End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="border border-slate-200 p-4 rounded-xl">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Class Schedule
                </label>
                <p className="text-xs text-slate-500 mb-3">All times are GMT+3</p>
                
                {schedule.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {schedule.map((slot, index) => (
                            <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                <span className="text-sm font-medium text-slate-700">
                                    {slot.dayOfWeek.charAt(0) + slot.dayOfWeek.slice(1).toLowerCase()}
                                </span>
                                <span className="text-sm text-slate-600">
                                    {formatTimeAMPM(parseInt(slot.startTime.split(':')[0]))} - {formatTimeAMPM(parseInt(slot.endTime.split(':')[0]))}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSlot(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <select
                        value={newSlot.dayOfWeek}
                        onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: e.target.value })}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        {DAYS_OF_WEEK.map(day => (
                            <option key={day} value={day}>{day.charAt(0) + day.slice(1).toLowerCase()}</option>
                        ))}
                    </select>
                    <select
                        value={newSlot.timeSlot}
                        onChange={(e) => setNewSlot({ ...newSlot, timeSlot: e.target.value })}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                        {timeIntervals.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={handleAddSlot}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                    Notes for {tutorName} (Optional)
                </label>
                <textarea
                    name="notes"
                    id="notes"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Tell the tutor what you'd like to focus on..."
                />
            </div>

            <div className="pt-4 border-t border-slate-200">
                <div className="space-y-2 mb-4 text-sm text-slate-600">
                    <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>{hourlyRate} ETB / hour</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Hours:</span>
                        <span>{calculatedData.totalHours} hrs ({calculatedData.weeks} weeks)</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-slate-900 border-t border-slate-100 pt-2">
                        <span>Total Cost:</span>
                        <span>{calculatedData.totalCost.toFixed(2)} ETB</span>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading || schedule.length === 0 || !startDate || !endDate}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Processing...' : 'Confirm Request'}
                </button>
            </div>
        </form>
    );
=======
    const dates: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayName = current.getDay() === 0 ? 'SUNDAY' : DAYS_OF_WEEK[current.getDay() - 1];
      if (selectedDays.includes(dayName as DayOfWeek)) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [startDate, endDate, selectedDays]);

  const totalSessions = sessionDates.length;
  const totalHours = totalSessions * hoursPerSession;
  const totalCost = totalHours * hourlyRate;

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((item) => item !== day);
      }
      if (prev.length >= daysPerWeek) {
        return prev;
      }
      return [...prev, day];
    });
  };

  const validateTimeRange = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return h2 * 60 + m2 > h1 * 60 + m1;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!startDate || !endDate) {
        throw new Error('Please choose both start and end dates.');
      }
      if (new Date(endDate) < new Date(startDate)) {
        throw new Error('End date cannot be before the start date.');
      }
      if (selectedDays.length === 0) {
        throw new Error('Please select at least one study day.');
      }
      if (selectedDays.length !== daysPerWeek) {
        throw new Error(`Please select exactly ${daysPerWeek} study day(s).`);
      }
      if (!validateTimeRange(sessionStartTime, sessionEndTime)) {
        throw new Error('End time must be after start time.');
      }
      if (hoursPerSession <= 0) {
        throw new Error('Hours per session must be positive.');
      }
      if (totalSessions === 0) {
        throw new Error('No sessions were generated for this schedule. Please adjust your dates or selected days.');
      }

      const formData = new FormData(event.currentTarget);
      formData.set('startDate', startDate);
      formData.set('endDate', endDate);
      formData.set('packageDuration', packageDuration);
      formData.set('daysPerWeek', daysPerWeek.toString());
      formData.set('selectedDays', JSON.stringify(selectedDays));
      formData.set('startTime', sessionStartTime);
      formData.set('endTime', sessionEndTime);
      formData.set('timezone', timezone);
      formData.set('hoursPerSession', hoursPerSession.toString());
      formData.set('duration', (hoursPerSession * 60).toString());
      formData.set('notes', notes);
      formData.set('scheduledFor', `${sessionDates[0]}T${sessionStartTime}:00`);

      await createBooking(formData);
    } catch (err: any) {
      setError(err?.message || 'Unable to create booking.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <input type="hidden" name="tutorId" value={tutorId} />
      <input type="hidden" name="timezone" value={timezone} />

      {error && (
        <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="subjectName" className="block text-sm font-semibold text-slate-700">Subject</label>
        <input
          id="subjectName"
          name="subjectName"
          list="subject-options"
          placeholder={subjects.length > 0 ? 'Select or type a subject' : 'e.g. Mathematics'}
          required
          className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <datalist id="subject-options">
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.name} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700">Start Date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700">End Date</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPackageDuration('Custom');
            }}
            required
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="packageDuration" className="block text-sm font-semibold text-slate-700">Package Duration</label>
          <select
            id="packageDuration"
            value={packageDuration}
            onChange={(e) => setPackageDuration(e.target.value)}
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="1 week">1 week</option>
            <option value="2 weeks">2 weeks</option>
            <option value="3 weeks">3 weeks</option>
            <option value="1 month">1 month</option>
            <option value="2 months">2 months</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="daysPerWeek" className="block text-sm font-semibold text-slate-700">Study days per week</label>
          <select
            id="daysPerWeek"
            value={daysPerWeek}
            onChange={(e) => {
              setDaysPerWeek(Number(e.target.value));
              if (selectedDays.length > Number(e.target.value)) {
                setSelectedDays([]);
              }
            }}
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <option key={value} value={value}>{value} {value === 1 ? 'day' : 'days'}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Choose study days</p>
            <p className="text-xs text-slate-500">Pick exactly {daysPerWeek} study day(s).</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{selectedDays.length}/{daysPerWeek}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day as DayOfWeek);
            const disabled = !isSelected && selectedDays.length >= daysPerWeek;
            return (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(day as DayOfWeek)}
                disabled={disabled}
                className={`rounded-3xl border px-3 py-3 text-sm font-semibold transition ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="hoursPerSession" className="block text-sm font-semibold text-slate-700">Hours / session</label>
          <select
            id="hoursPerSession"
            name="hoursPerSession"
            value={hoursPerSession}
            onChange={(e) => setHoursPerSession(Number(e.target.value))}
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {[1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>{value} hour{value > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="sessionStartTime" className="block text-sm font-semibold text-slate-700">Session start</label>
          <input
            id="sessionStartTime"
            name="startTime"
            type="time"
            value={sessionStartTime}
            onChange={(e) => setSessionStartTime(e.target.value)}
            required
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="sessionEndTime" className="block text-sm font-semibold text-slate-700">Session end</label>
          <input
            id="sessionEndTime"
            name="endTime"
            type="time"
            value={sessionEndTime}
            onChange={(e) => setSessionEndTime(e.target.value)}
            required
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="notes" className="block text-sm font-semibold text-slate-700">Notes for {tutorName} (Optional)</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Share your learning goals..."
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Booking summary</p>
            <p className="text-xs text-slate-500">Your recurring schedule is generated across chosen weekdays.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">{timezone}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Sessions</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalSessions}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total hours</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalHours}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total cost</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalCost.toFixed(2)} ETB</p>
          </div>
        </div>

        {sessionDates.length > 0 && (
          <div className="mt-5 rounded-3xl bg-white p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Next session dates</p>
            <p className="mt-1 text-xs text-slate-500">{sessionDates[0]} through {sessionDates[sessionDates.length - 1]}</p>
            <div className="mt-3 grid gap-1 text-xs text-slate-600">
              {sessionDates.slice(0, 5).map((date) => (
                <div key={date} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>{date}</span>
                  <span>{sessionStartTime} - {sessionEndTime}</span>
                </div>
              ))}
              {sessionDates.length > 5 && (
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-500">+ {sessionDates.length - 5} more sessions</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Your schedule will repeat across the selected days and date range.</p>
        <button
          type="submit"
          disabled={isLoading || totalHours <= 0}
          className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Confirm Request'}
        </button>
      </div>
    </form>
  );
>>>>>>> e4f534e5f9af3f18933c5b4692e2670445658ec5
}
