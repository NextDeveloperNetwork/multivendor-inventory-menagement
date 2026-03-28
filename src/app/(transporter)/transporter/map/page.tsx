import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sanitizeData } from '@/lib/utils';
import TransporterMapClient from '@/components/TransporterMapClient';

export const dynamic = 'force-dynamic';

export default async function TransporterMapPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const user = session.user as any;
    const transporterId = user.transporterId;

    if (user.role !== 'TRANSPORTER' && user.role !== 'ADMIN' && !transporterId) {
        redirect('/login');
    }

    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    const rawTransfers = await (prisma.transfer as any).findMany({
        where: {
            transporterId: transporterId || 'NO_UNIT',
            OR: [
                { status: { in: ['ASSIGNED', 'SHIPPED', 'PARTIAL_RETURN', 'PENDING'] } },
                { status: { in: ['DELIVERED', 'PAID'] }, updatedAt: { gte: thirtyMinsAgo } }
            ]
        },
        include: {
            fromWarehouse: true,
            fromShop: true,
            toWarehouse: true,
            toShop: true,
            items: { include: { product: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const transfers = sanitizeData(rawTransfers);

    return (
        <div className="space-y-6 fade-in">
            {/* Page Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Map View</h1>
                    <p className="text-xs text-slate-400 font-medium">Active delivery routes & destinations</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {transfers.length} active manifest{transfers.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
                <TransporterMapClient transfers={transfers} />
            </div>
        </div>
    );
}
