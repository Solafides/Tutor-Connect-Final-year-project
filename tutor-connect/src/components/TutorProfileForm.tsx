'use client';

import { useState } from 'react';
import { updateTutorProfile } from '@/app/actions/tutor';
import { TutorProfile, Subject, Availability as TutorAvailability } from '@prisma/client';
import { useRouter } from 'next/navigation';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

type AvailabilityItem = {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
};

interface TutorProfileFormProps {
    profile: TutorProfile & { availability?: TutorAvailability[] };
    allSubjects: Subject[];
    selectedSubjectIds: string[];
}

export function TutorProfileForm({ profile, allSubjects, selectedSubjectIds }: TutorProfileFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form states
    const [fullName, setFullName] = useState(profile.fullName || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [hourlyRate, setHourlyRate] = useState(profile.hourlyRate ? Number(profile.hourlyRate) : '');
    const [gender, setGender] = useState(profile.gender || '');
    const [locationCity, setLocationCity] = useState(profile.locationCity || '');
    const [locationArea, setLocationArea] = useState(profile.locationArea || '');
    const [tutoringMode, setTutoringMode] = useState(profile.tutoringMode || 'BOTH');

    const [availabilityEntries, setAvailabilityEntries] = useState<AvailabilityItem[]>(
        (profile.availability || []).map((entry) => ({
            dayOfWeek: entry.dayOfWeek as DayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
        }))
    );
    const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState<DayOfWeek>(profile.availability?.[0]?.dayOfWeek || 'MONDAY');
    const [selectedAvailabilityStart, setSelectedAvailabilityStart] = useState(profile.availability?.[0]?.startTime || '09:00');
    const [selectedAvailabilityEnd, setSelectedAvailabilityEnd] = useState(profile.availability?.[0]?.endTime || '17:00');

    // Subject selection state
    const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(new Set(selectedSubjectIds));

    const handleSubjectToggle = (subjectId: string) => {
        const newChecked = new Set(checkedSubjects);
        if (newChecked.has(subjectId)) {
            newChecked.delete(subjectId);
        } else {
            newChecked.add(subjectId);
        }
        setCheckedSubjects(newChecked);
    };

    const addAvailability = () => {
        if (!selectedAvailabilityDay || !selectedAvailabilityStart || !selectedAvailabilityEnd) return;
        if (selectedAvailabilityStart >= selectedAvailabilityEnd) {
            setError('Availability end time must be after start time.');
            return;
        }

        setError(null);
        setAvailabilityEntries((prev) => {
            const filtered = prev.filter((entry) => entry.dayOfWeek !== selectedAvailabilityDay);
            return [
                ...filtered,
                {
                    dayOfWeek: selectedAvailabilityDay,
                    startTime: selectedAvailabilityStart,
                    endTime: selectedAvailabilityEnd,
                },
            ];
        });
    };

    const removeAvailability = (dayOfWeek: DayOfWeek) => {
        setAvailabilityEntries((prev) => prev.filter((entry) => entry.dayOfWeek !== dayOfWeek));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData(e.currentTarget);
            
            // Append all checked subjects
            Array.from(checkedSubjects).forEach((subjectId) => {
                formData.append('subjects', subjectId);
            });
            formData.set('availabilities', JSON.stringify(availabilityEntries));

            await updateTutorProfile(formData);
            setSuccess(true);
            router.refresh(); // so dashboard reflects immediately
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg text-sm border border-emerald-100">
                    Profile successfully updated! Your changes are now live.
                </div>
            )}

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            name="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select
                            name="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                    <textarea
                        required
                        name="bio"
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell students about yourself..."
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Minimum 50 characters.</p>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Tutoring Preferences & Rates</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate (ETB)</label>
                        <input
                            required
                            type="number"
                            name="hourlyRate"
                            min="10"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tutoring Mode</label>
                        <select
                            required
                            name="tutoringMode"
                            value={tutoringMode}
                            onChange={(e) => setTutoringMode(e.target.value as "VIRTUAL" | "IN_PERSON" | "BOTH")}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="VIRTUAL">Virtual / Online</option>
                            <option value="IN_PERSON">In-Person</option>
                            <option value="BOTH">Both</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                        <input
                            type="text"
                            name="locationCity"
                            placeholder="e.g. Addis Ababa"
                            value={locationCity}
                            onChange={(e) => setLocationCity(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Subjects</h3>
                <p className="text-sm text-slate-600 mb-4">Select the subjects you are able to teach. These will be visible to students when they book you.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-slate-200 p-4 rounded-xl bg-slate-50">
                    {allSubjects.map((subject) => (
                        <label key={subject.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors">
                            <input
                                type="checkbox"
                                checked={checkedSubjects.has(subject.id)}
                                onChange={() => handleSubjectToggle(subject.id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                        </label>
                    ))}
                    {allSubjects.length === 0 && (
                        <p className="text-sm text-slate-500 col-span-3">No subjects available in the platform.</p>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Weekly Availability</h3>
                <p className="text-sm text-slate-600">Set the weekly time blocks when you are available to teach. Students will only be able to request sessions inside these ranges.</p>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                        <select
                            value={selectedAvailabilityDay}
                            onChange={(e) => setSelectedAvailabilityDay(e.target.value as DayOfWeek)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            {DAYS_OF_WEEK.map((day) => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                        <input
                            type="time"
                            value={selectedAvailabilityStart}
                            onChange={(e) => setSelectedAvailabilityStart(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Until</label>
                        <input
                            type="time"
                            value={selectedAvailabilityEnd}
                            onChange={(e) => setSelectedAvailabilityEnd(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={addAvailability}
                        className="rounded-lg bg-slate-800 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition-colors"
                    >
                        Add / Update Availability
                    </button>
                </div>

                {availabilityEntries.length > 0 ? (
                    <div className="space-y-3">
                        {availabilityEntries.map((entry) => (
                            <div key={entry.dayOfWeek} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{entry.dayOfWeek}</p>
                                    <p className="text-sm text-slate-600">{entry.startTime} – {entry.endTime}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAvailability(entry.dayOfWeek)}
                                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No weekly availability set yet.</p>
                )}
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Saving Changes...' : 'Save Profile'}
                </button>
            </div>
        </form>
    );
}
