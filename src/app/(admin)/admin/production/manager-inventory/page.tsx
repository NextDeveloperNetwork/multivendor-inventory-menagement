import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProductionManagerInventoryClient from '@/components/ProductionManagerInventoryClient';
import { getSelectedBusinessId } from '@/app/actions/business';
import { getProductionArticles } from '@/app/actions/productionArticles';
import { Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminManagerInventoryPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || user.role !== 'ADMIN') {
        redirect('/login');
    }

    const businessId = await getSelectedBusinessId();
    const rawArticles = await getProductionArticles(businessId || undefined, 'MANAGER');
    
    // Convert Dates to Strings for Client Component
    const articles = rawArticles.map((a: any) => ({
        ...a,
        entryDate: a.entryDate ? new Date(a.entryDate).toISOString().split('T')[0] : null,
        createdAt: a.createdAt?.toISOString(),
        updatedAt: a.updatedAt?.toISOString()
    }));

    const totalItems = articles.length;
    const totalVolume = articles.reduce((sum: number, a: any) => sum + (Number(a.stockQuantity) || 0), 0);

    return (
        <div className="space-y-8 max-w-[1700px] mx-auto">
            {/* ── Page Identity Banner ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 shadow-xl shadow-blue-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-xl" />
                <div className="pointer-events-none absolute -bottom-8 right-24 w-32 h-32 rounded-full bg-white/5 blur-lg" />

                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20 shrink-0">
                        <Package size={26} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-1">Global Manager Inventory</h1>
                        <p className="text-[10px] text-blue-100 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-300"/>
                             Admin View of Production Floor Stock
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-2 px-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] shrink-0">
                    <div className="px-3 py-2 border-r border-white/10 flex flex-col justify-center">
                        <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest drop-shadow-sm mb-0.5">Total Articles</p>
                        <p className="text-xl font-black text-white leading-none">{totalItems}</p>
                    </div>
                    <div className="px-3 py-2 flex flex-col justify-center">
                        <p className="text-[9px] text-emerald-200 font-black uppercase tracking-widest drop-shadow-sm mb-0.5">Global Volume</p>
                        <p className="text-xl font-black text-white leading-none">{totalVolume.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <ProductionManagerInventoryClient 
                businessId={businessId || undefined} 
                initialItems={articles as any}
            />
        </div>
    );
}
