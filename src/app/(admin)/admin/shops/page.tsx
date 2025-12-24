import { prisma } from '@/lib/prisma';
import ShopsClient from '@/components/ShopsClient';
import { sanitizeData } from '@/lib/utils';

export default async function ShopsPage() {
    const shops = await prisma.shop.findMany({
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

    return (
        <div className="space-y-12 fade-in relative pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Terminal <span className="text-blue-600">Network</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            Monitor and manage all physical store locations and staff assignments
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-blue-50 px-8 py-5 rounded-[2rem] border-2 border-blue-100 flex flex-col items-end shadow-sm">
                            <span className="text-[10px] text-blue-300 uppercase tracking-widest font-black">Active Nodes</span>
                            <span className="text-4xl font-black text-blue-600 tracking-tighter italic">{shops.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <ShopsClient
                initialShops={sanitizeData(shops)}
                initialUnassignedUsers={sanitizeData(unassignedUsers)}
                currencies={sanitizeData(currencies)}
            />
        </div>
    );
}
