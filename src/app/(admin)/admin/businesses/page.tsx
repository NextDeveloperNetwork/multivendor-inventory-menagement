import { prisma } from '@/lib/prisma';
import BusinessesClient from '@/components/BusinessesClient';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BusinessesPage() {
    const businesses = await prisma.business.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const businessesWithCounts = await Promise.all(
        businesses.map(async (business) => {
            const shopCount = await prisma.shop.count({
                where: { businessId: business.id }
            });
            const customerCount = await prisma.customer.count({
                where: { businessId: business.id }
            });
            return {
                ...business,
                shopCount,
                customerCount
            };
        })
    );

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic line-through decoration-blue-500/30">
                        Global <span className="text-blue-600">Sectors</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic">
                        High-Level Corporate Segment & Root Domain Management
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="px-4 h-12 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center items-end shadow-inner min-w-[120px]">
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black leading-none">Root Domains</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter italic">{businesses.length} UNITS</span>
                    </div>
                </div>
            </div>

            <BusinessesClient initialBusinesses={sanitizeData(businessesWithCounts)} />
        </div>
    );
}
