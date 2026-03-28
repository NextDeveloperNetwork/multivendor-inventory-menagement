import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sanitizeData } from '@/lib/utils';
import TransporterList from '@/components/TransporterList';
import { Truck, Clock, Package, CheckCircle, RotateCcw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TransporterPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const user = session.user as any;
    const transporterId = user.transporterId;

    if (user.role !== 'TRANSPORTER' && user.role !== 'ADMIN' && !transporterId) {
        redirect('/login');
    }

    const rawTransporter = await (prisma as any).transporter.findUnique({
        where: { id: transporterId },
        include: {
            transports: {
                include: {
                    items: { include: { product: true } },
                    fromWarehouse: true,
                    fromShop: { include: { currency: true } },
                    toWarehouse: true,
                    toShop: { include: { currency: true } },
                },
                orderBy: { updatedAt: 'desc' },
            }
        }
    });

    const transfers = sanitizeData(rawTransporter?.transports || []);
    const driverName = rawTransporter?.name || 'Driver';

    const inTransit = transfers.filter((t: any) => t.status === 'SHIPPED');
    const pending   = transfers.filter((t: any) => t.status === 'PENDING');
    const returns   = transfers.filter((t: any) => ['PARTIAL_RETURN', 'RETURN_PENDING'].includes(t.status));
    const completed = transfers.filter((t: any) => ['PAID', 'RETURN_ACCEPTED'].includes(t.status));

    const stats = [
        { label: 'In Transit',  value: inTransit.length,  icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100' },
        { label: 'Pending',     value: pending.length,    icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100' },
        { label: 'Returns',     value: returns.length,    icon: RotateCcw,    color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-100' },
        { label: 'Completed',   value: completed.length,  icon: CheckCircle,  color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100' },
    ];

    return (
        <div className="space-y-8 fade-in">
            {/* Page Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Welcome back, {driverName}</h1>
                        <p className="text-sm text-slate-400 font-medium">Your active manifest feed</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live sync active
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-5 flex items-center gap-4`}>
                        <div className={`w-11 h-11 ${s.bg} ${s.border} border rounded-xl flex items-center justify-center shrink-0`}>
                            <s.icon size={20} className={s.color} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Manifests */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">All Manifests</h2>
                    <span className="text-xs text-slate-400">{transfers.length} total</span>
                </div>
                <TransporterList transfers={transfers} />
            </div>
        </div>
    );
}
