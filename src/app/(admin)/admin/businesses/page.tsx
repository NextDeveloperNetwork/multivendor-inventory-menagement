import { prisma } from '@/lib/prisma';
import BusinessesClient from '@/components/BusinessesClient';
import { Briefcase } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BusinessesPage() {
    const businesses = await prisma.business.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const businessesWithDetails = await Promise.all(
        businesses.map(async (business: any) => {
            const shops = await prisma.shop.findMany({
                where: { businessId: business.id },
                select: { id: true, name: true, location: true }
            });
            const customers = await prisma.customer.findMany({
                where: { businessId: business.id },
                select: { id: true, name: true, email: true, phone: true }
            });
            return {
                ...business,
                shops,
                customers,
                shopCount: shops.length,
                customerCount: customers.length
            };
        })
    );

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Business Entities</h1>
                        <p className="text-sm text-slate-400 font-medium">Global segment & root domain management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center items-end min-w-[120px]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Root Domains</span>
                        <span className="text-xl font-black text-slate-900 leading-none mt-1 font-mono">{businesses.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 p-6">
                <BusinessesClient initialBusinesses={sanitizeData(businessesWithDetails)} />
            </div>
        </div>
    );
}
