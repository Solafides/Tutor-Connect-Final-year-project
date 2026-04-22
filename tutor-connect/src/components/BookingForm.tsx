'use client';

import { useState } from 'react';
import { createBooking } from '@/app/actions/booking';

interface BookingFormProps {
    tutorId: string;
    tutorName: string;
    hourlyRate: number;
    subjects: { id: string; name: string }[];
}

export function BookingForm({ tutorId, tutorName, hourlyRate, subjects }: BookingFormProps) {
    const [duration, setDuration] = useState(60);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            
            // Validate the date is explicitly in the future
            const scheduledFor = formData.get('scheduledFor') as string;
            if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
                throw new Error("Please select a future date and time.");
            }

            // Convert to ISO string for submission
            const isoString = new Date(scheduledFor).toISOString();
            formData.set('scheduledFor', isoString);

            await createBooking(formData);
        } catch (error: any) {
            setError(error.message || 'Something went wrong');
            setIsLoading(false);
        }
    };

    const totalCost = (hourlyRate * duration) / 60;

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
                        <option key={sub.id} value={sub.name}>
                            {sub.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="scheduledFor" className="block text-sm font-medium text-slate-700 mb-1">
                    Date & Time
                </label>
                <input
                    type="datetime-local"
                    name="scheduledFor"
                    id="scheduledFor"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            </div>

            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (minutes)
                </label>
                <select
                    name="duration"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                </select>
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
                <div className="flex justify-between items-center mb-4 text-slate-700">
                    <span className="font-medium">Total Cost:</span>
                    <span className="text-xl font-bold">{totalCost.toFixed(2)} ETB</span>
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Processing...' : 'Confirm Request'}
                </button>
            </div>
        </form>
    );
}
