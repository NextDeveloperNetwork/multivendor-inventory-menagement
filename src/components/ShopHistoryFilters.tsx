'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Search, X } from 'lucide-react';

export default function ShopHistoryFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const q = searchParams.get('q') || '';

    const updateFilters = (field: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(field, value);
        else params.delete(field);
        router.push(`/shop/history?${params.toString()}`);
    };

    const hasFilters = startDate || endDate || q;

    const clearFilters = () => {
        router.push('/shop/history');
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    defaultValue={q}
                    placeholder="Search by Receipt #..."
                    className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                    }}
                />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 px-3">
                    <Calendar size={14} className="text-slate-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => updateFilters('startDate', e.target.value)}
                        className="bg-transparent border-none text-xs font-semibold focus:ring-0 text-slate-700 w-32 outline-none"
                    />
                </div>
                <div className="text-slate-300">to</div>
                <div className="flex items-center gap-2 px-3">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => updateFilters('endDate', e.target.value)}
                        className="bg-transparent border-none text-xs font-semibold focus:ring-0 text-slate-700 w-32 outline-none"
                    />
                </div>
            </div>

            {/* Clear Filters */}
            {hasFilters && (
                <button
                    onClick={clearFilters}
                    className="h-11 px-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-rose-100 transition-colors shrink-0"
                >
                    <X size={14} /> Clear
                </button>
            )}
        </div>
    );
}
