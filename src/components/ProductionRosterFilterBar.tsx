'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Calendar, X } from 'lucide-react';

export function ProductionRosterFilterBar({ initialSearch, initialDate }: { initialSearch: string, initialDate: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [search, setSearch] = useState(initialSearch);
    const [date, setDate] = useState(initialDate);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (search) params.set('q', search);
            else params.delete('q');
            params.set('page', '1'); // Reset to page 1 on search
            router.push(`?${params.toString()}`);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        const params = new URLSearchParams(searchParams.toString());
        if (newDate) params.set('date', newDate);
        else params.delete('date');
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearch('');
        setDate('');
        router.push('?');
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                    type="text"
                    placeholder="Search by article, worker, or process..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                />
            </div>

            <div className="relative group min-w-[200px]">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                />
            </div>

            {(search || date) && (
                <button
                    onClick={clearFilters}
                    className="h-12 px-6 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <X size={14} /> Clear
                </button>
            )}
        </div>
    );
}
