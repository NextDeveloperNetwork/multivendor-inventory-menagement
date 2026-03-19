import { prisma } from '@/lib/prisma';
import ShopsClient from '@/components/ShopsClient';
import { sanitizeData } from '@/lib/utils';
import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function ShopsPage() {
    const filter = await getBusinessFilter();

    const shops = await prisma.shop.findMany({
        where: filter as any,
        include: {
            users: true,
            currency: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const unassignedUsers = await prisma.user.findMany({
        where: {
            shopId: null,
            role: 'USER'
        }
    });

    const currencies = await prisma.currency.findMany({
        orderBy: { code: 'asc' }
    });

    const businesses = await prisma.business.findMany({
        orderBy: { name: 'asc' }
    });

    const selectedBusinessId = await getSelectedBusinessId();

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Terminal <span className="text-blue-600">Matrix</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Physical Node Distribution & Staffing Registry
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="px-4 h-12 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center items-end shadow-inner min-w-[120px]">
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black leading-none">Active Nodes</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter italic">{shops.length} UNITS</span>
                    </div>
                </div>
            </div>

            <ShopsClient
                initialShops={sanitizeData(shops)}
                initialUnassignedUsers={sanitizeData(unassignedUsers)}
                currencies={sanitizeData(currencies)}
                businesses={sanitizeData(businesses)}
                selectedBusinessId={selectedBusinessId}
            />
        </div>
    );
}
