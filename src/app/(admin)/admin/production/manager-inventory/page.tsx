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

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Global Manager Inventory</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                             Admin View of Production Floor Stock Levels
                        </p>
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
