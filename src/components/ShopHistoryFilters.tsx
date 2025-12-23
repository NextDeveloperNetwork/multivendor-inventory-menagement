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
        <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-50 shadow-xl shadow-blue-500/5 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 bg-blue-50 p-2 rounded-2xl border border-blue-100 shadow-inner">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-blue-50">
                    <Calendar size={16} className="text-blue-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => updateFilters('startDate', e.target.value)}
                        className="bg-transparent border-none text-xs font-bold focus:ring-0 text-slate-900 uppercase"
                        placeholder="Start Date"
                    />
                </div>
                <div className="text-blue-300 font-black text-xs">TO</div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-blue-50">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => updateFilters('endDate', e.target.value)}
                        className="bg-transparent border-none text-xs font-bold focus:ring-0 text-slate-900 uppercase"
                        placeholder="End Date"
                    />
                </div>
            </div>

            <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                <input
                    type="text"
                    placeholder="Search Transaction ID..."
                    className="w-full pl-14 pr-6 h-14 bg-blue-50/50 border-2 border-blue-100 rounded-2xl text-sm font-bold placeholder:text-blue-200 focus:border-blue-400 focus:bg-white transition-all outline-none text-slate-900"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') updateFilters('q', (e.target as HTMLInputElement).value);
                    }}
                />
            </div>

            {(startDate || endDate || searchParams.get('q')) && (
                <button
                    onClick={() => router.push('/shop/history')}
                    className="px-6 py-3 bg-rose-50 text-rose-500 font-bold text-xs rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-colors uppercase tracking-widest border border-rose-100"
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}
