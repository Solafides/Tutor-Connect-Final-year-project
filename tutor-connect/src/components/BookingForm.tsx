'use client';

import { useState, useMemo } from 'react';
import { createBooking } from '@/app/actions/booking';

interface BookingFormProps {
    tutorId: string;
    tutorName: string;
    hourlyRate: number;
    subjects: { id: string; name: string }[];
}

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

            await createBooking(formData);
        } catch (error: any) {
            setError(error.message || 'Something went wrong');
            setIsLoading(false);
        }
    };

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
}
