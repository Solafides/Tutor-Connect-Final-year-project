'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface SearchFiltersProps {
    subjects: string[];
    initialValues?: {
        subject?: string;
        city?: string;
        minPrice?: string;
        maxPrice?: string;
        mode?: string;
        gender?: string;
    };
}

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
    });

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
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subject
                </label>
                <input
                    type="text"
                    placeholder="e.g. Mathematics, Physics"
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
            </div>

            {/* Location Filter */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    City
                </label>
                <input
                    type="text"
                    placeholder="e.g. Addis Ababa, Hawassa"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
            </div>

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
