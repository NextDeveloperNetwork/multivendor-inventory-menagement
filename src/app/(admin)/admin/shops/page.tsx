import { prisma } from '@/lib/prisma';
import ShopsClient from '@/components/ShopsClient';
import { Store } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';
import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function ShopsPage() {
    const filter = await getBusinessFilter();

    const shops = await prisma.shop.findMany({
        where: filter as any,
        include: { users: true, currency: true },
        orderBy: { createdAt: 'desc' }
    });

    const unassignedUsers = await prisma.user.findMany({
        where: { shopId: null, role: 'USER' }
    });

    const currencies = await prisma.currency.findMany({
        orderBy: { code: 'asc' }
    });

    const businesses = await prisma.business.findMany({
        orderBy: { name: 'asc' }
    });

    const selectedBusinessId = await getSelectedBusinessId();

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Store size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Commercial Operations</h1>
                        <p className="text-sm text-slate-400 font-medium">Physical site locations & assigned personnel</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center items-end min-w-[120px]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Sites</span>
                        <span className="text-xl font-black text-slate-900 leading-none mt-1 font-mono">{shops.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 p-6">
                <ShopsClient
                    initialShops={sanitizeData(shops)}
                    initialUnassignedUsers={sanitizeData(unassignedUsers)}
                    currencies={sanitizeData(currencies)}
                    businesses={sanitizeData(businesses)}
                    selectedBusinessId={selectedBusinessId}
                />
            </div>
        </div>
    );
}
