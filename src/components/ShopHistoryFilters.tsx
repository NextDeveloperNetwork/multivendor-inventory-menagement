'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Search } from 'lucide-react';

export default function ShopHistoryFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const updateFilters = (field: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(field, value);
        else params.delete(field);
        router.push(`/shop/history?${params.toString()}`);
    };

    return (
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-inner">
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
                    <Calendar size={16} className="text-indigo-600" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => updateFilters('startDate', e.target.value)}
                        className="bg-transparent border-none text-[10px] font-bold focus:ring-0 text-slate-900 uppercase tracking-widest"
                        placeholder="Start Date"
                    />
                </div>
                <div className="text-slate-300 font-bold text-[9px] uppercase tracking-widest px-2">To</div>
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => updateFilters('endDate', e.target.value)}
                        className="bg-transparent border-none text-[10px] font-bold focus:ring-0 text-slate-900 uppercase tracking-widest"
                        placeholder="End Date"
                    />
                </div>
            </div>

            <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search Sale Reference..."
                    className="w-full pl-14 pr-6 h-16 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:border-indigo-600/50 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none text-slate-900 uppercase tracking-tight"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                    }}
                />
            </div>

            {(startDate || endDate || searchParams.get('q')) && (
                <button
                    onClick={() => router.push('/shop/history')}
                    className="px-8 py-4 bg-rose-50 text-rose-500 font-bold text-[9px] rounded-xl hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest border border-rose-100 shadow-sm"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}
