import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ShopMoneyClient from '@/components/ShopMoneyClient';
import { Wallet } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ShopMoneyPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.shopId) {
        redirect('/');
    }

    const shopId = session.user.shopId;
    const userId = session.user.id;

    // Fetch active shift, shop currency, and past shifts in parallel where possible, but activeShift/past shifts are fine as is.
    const [activeShift, pastShifts, cashTransfers, shopRecord, baseCurrency] = await Promise.all([
        prisma.shift.findFirst({
            where: { shopId, status: 'OPEN' },
            orderBy: { openedAt: 'desc' }
        }),
        prisma.shift.findMany({
            where: { shopId },
            orderBy: { openedAt: 'desc' },
            take: 10
        }),
        (prisma as any).cashTransfer.findMany({
            where: { shopId },
            orderBy: { createdAt: 'desc' },
            include: { shift: true }
        }),
        prisma.shop.findUnique({
            where: { id: shopId },
            include: { currency: true }
        }),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);


    // Fetch today's sales for estimation
    let todaySalesTotal = 0;
    if (activeShift) {
        const sales = await prisma.sale.findMany({
            where: {
                shopId,
                date: { gte: activeShift.openedAt }
            }
        });
        todaySalesTotal = sales.reduce((sum, s) => sum + Number(s.total), 0);
    }

    const serializedTransfers = sanitizeData(cashTransfers);
    const serializedPastShifts = sanitizeData(pastShifts);
    const serializedActiveShift = sanitizeData(activeShift);
    const currencySymbol = shopRecord?.currency?.symbol || baseCurrency?.symbol || '$';

    const allShopSales = await prisma.sale.aggregate({
        where: { shopId },
        _sum: { total: true }
    });
    
    // Calculate global shop vault balance
    const firstShift = await prisma.shift.findFirst({
        where: { shopId },
        orderBy: { openedAt: 'asc' }
    });

    const totalSalesEver = Number(allShopSales._sum.total || 0);
    const initialFloat = firstShift ? Number(firstShift.openingCash || 0) : 0;
    
    const totalDepositedToAdmin = cashTransfers
        .filter((t: any) => t.type === 'TO_ADMIN' && t.status !== 'REJECTED')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        
    const totalReceivedFromAdmin = cashTransfers
        .filter((t: any) => t.type === 'FROM_ADMIN' && t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    let safeBalance = totalSalesEver + initialFloat + totalReceivedFromAdmin - totalDepositedToAdmin;
    if (activeShift) {
        safeBalance -= (Number(activeShift.openingCash) + todaySalesTotal);
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto fade-in">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Till & Cash Management</h1>
                        <p className="text-sm text-slate-400 font-medium">Shift registry and administrative money transfers</p>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Shop Vault Balance</span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">{currencySymbol}{safeBalance.toFixed(2)}</span>
                </div>
            </div>

            <ShopMoneyClient 
                shopId={shopId} 
                userId={userId} 
                activeShift={serializedActiveShift}
                pastShifts={serializedPastShifts}
                cashTransfers={serializedTransfers}
                todaySalesTotal={todaySalesTotal}
                currencySymbol={currencySymbol}
                safeBalance={safeBalance}
            />
        </div>
    );
}
