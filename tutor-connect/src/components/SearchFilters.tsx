'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MultiSelect } from './MultiSelect';

interface SearchFiltersProps {
    subjects: string[];
    initialValues?: {
        subject?: string;
        city?: string;
        minPrice?: string;
        maxPrice?: string;
        mode?: string;
        gender?: string;
        dayOfWeek?: string;
        timeInterval?: string;
    };
}

const cityOptions = [
    { value: 'Addis Ababa', label: 'Addis Ababa' },
    { value: 'Hawassa', label: 'Hawassa' },
    { value: 'DireDawa', label: 'DireDawa' },
    { value: 'BahirDar', label: 'BahirDar' },
    { value: 'Mekele', label: 'Mekele' },
    { value: 'Harar', label: 'Harar' },
    { value: 'Jimma', label: 'Jimma' },
    { value: 'Nazret/Adama', label: 'Nazret/Adama' },
    { value: 'Hossana', label: 'Hossana' },
    { value: 'Shashemene', label: 'Shashemene' },
    { value: 'Gondar', label: 'Gondar' }
];

const dayOptions = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' }
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
        value: `${start24}-${end24}`,
        label: `${formatTimeAMPM(startHour)} - ${formatTimeAMPM(endHour)}`
    };
});

export function SearchFilters({ subjects, initialValues }: SearchFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [filters, setFilters] = useState({
        subject: initialValues?.subject || '',
        city: initialValues?.city || '',
        minPrice: initialValues?.minPrice || '',
        maxPrice: initialValues?.maxPrice || '',
        mode: initialValues?.mode || '',
        gender: initialValues?.gender || '',
        dayOfWeek: initialValues?.dayOfWeek || '',
        timeInterval: initialValues?.timeInterval || '',
    });

    const handleMultiChange = (key: string, values: string[]) => {
        setFilters(prev => ({ ...prev, [key]: values.join(',') }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        router.push(`/search?${params.toString()}`);
    };

    const clearFilters = () => {
        setFilters({
            subject: '',
            city: '',
            minPrice: '',
            maxPrice: '',
            mode: '',
            gender: '',
            dayOfWeek: '',
            timeInterval: '',
        });
        router.push('/search');
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Subject Filter */}
            <MultiSelect
                label="Subject"
                placeholder="Select subjects..."
                options={subjects.map(s => ({ value: s, label: s }))}
                selectedValues={filters.subject ? filters.subject.split(',') : []}
                onChange={(values) => handleMultiChange('subject', values)}
            />

            {/* Location Filter */}
            <MultiSelect
                label="City"
                placeholder="Select cities..."
                options={cityOptions}
                selectedValues={filters.city ? filters.city.split(',') : []}
                onChange={(values) => handleMultiChange('city', values)}
            />

            {/* Day of the week Filter */}
            <MultiSelect
                label="Day of the Week"
                placeholder="Select days..."
                options={dayOptions}
                selectedValues={filters.dayOfWeek ? filters.dayOfWeek.split(',') : []}
                onChange={(values) => handleMultiChange('dayOfWeek', values)}
            />

            {/* Time Interval Filter */}
            <MultiSelect
                label="Time Interval"
                placeholder="Select time intervals..."
                helperText="All times are GMT+3"
                options={timeIntervals}
                selectedValues={filters.timeInterval ? filters.timeInterval.split(',') : []}
                onChange={(values) => handleMultiChange('timeInterval', values)}
            />

            {/* Price Range */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hourly Rate (ETB)
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Tutoring Mode */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tutoring Mode
                </label>
                <select
                    value={filters.mode}
                    onChange={(e) => handleFilterChange('mode', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">All modes</option>
                    <option value="VIRTUAL">Virtual only</option>
                    <option value="IN_PERSON">In-person only</option>
                    <option value="BOTH">Both</option>
                </select>
            </div>

            {/* Gender Filter */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Gender Preference
                </label>
                <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">Any</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                </select>
            </div>

            {/* Apply Button */}
            <button
                onClick={applyFilters}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
                Apply Filters
            </button>
        </div>
    );
}
