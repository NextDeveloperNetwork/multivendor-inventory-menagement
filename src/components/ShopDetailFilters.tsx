'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

export default function ShopDetailFilters({ shopId }: { shopId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const updateFilters = (field: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(field, value);
        else params.delete(field);
        router.push(`/admin/shops/${shopId}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 px-3">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => updateFilters('startDate', e.target.value)}
                        className="bg-transparent border-none text-sm focus:ring-0 text-white"
                        placeholder="Start Date"
                    />
                </div>
                <div className="text-gray-600">to</div>
                <div className="flex items-center gap-2 px-3">
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => updateFilters('endDate', e.target.value)}
                        className="bg-transparent border-none text-sm focus:ring-0 text-white"
                        placeholder="End Date"
                    />
                </div>
            </div>

            {(startDate || endDate) && (
                <button
                    onClick={() => router.push(`/admin/shops/${shopId}`)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                >
                    Clear Dates
                </button>
            )}
        </div>
    );
}
