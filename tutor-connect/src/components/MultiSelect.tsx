'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
    label: string;
    options: { value: string; label: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    helperText?: string;
}

export function MultiSelect({ label, options, selectedValues, onChange, placeholder = "Select...", helperText }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const selectedLabels = selectedValues
        .map(v => options.find(o => o.value === v)?.label)
        .filter(Boolean);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label}
            </label>
            {helperText && (
                <p className="text-xs text-slate-500 mb-2">{helperText}</p>
            )}
            <div 
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-white cursor-pointer min-h-[42px] flex items-center transition-colors ${
                    isOpen ? 'border-primary ring-1 ring-primary' : 'border-slate-300 hover:border-slate-400'
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedValues.length === 0 ? (
                    <span className="text-slate-500 select-none">{placeholder}</span>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedLabels.map((label, idx) => (
                            <span key={idx} className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-medium inline-flex items-center">
                                {label}
                                <span 
                                    className="material-symbols-outlined text-[14px] ml-1 cursor-pointer hover:text-emerald-900"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOption(selectedValues[idx]);
                                    }}
                                >
                                    close
                                </span>
                            </span>
                        ))}
                    </div>
                )}
                <span className="material-symbols-outlined ml-auto text-slate-400 text-lg select-none">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-slate-500 text-center">No options available</div>
                    ) : (
                        options.map((option) => (
                            <div 
                                key={option.value}
                                className="flex items-center px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                onClick={() => toggleOption(option.value)}
                            >
                                <input 
                                    type="checkbox" 
                                    className="mr-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                    checked={selectedValues.includes(option.value)}
                                    readOnly
                                />
                                <span className={`text-sm select-none flex-1 ${selectedValues.includes(option.value) ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                                    {option.label}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
