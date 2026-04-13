import React from 'react';
import ProductionInventoryClient from '@/components/ProductionInventoryClient';
import { getSelectedBusinessId } from '@/app/actions/business';
import { getProductionArticles } from '@/app/actions/productionArticles';
import { PackagePlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductionInventoryPage() {
    const businessId = await getSelectedBusinessId();
    const rawArticles = await getProductionArticles(businessId || undefined, 'ADMIN');
    const initialArticles = rawArticles.map((a: any) => ({
        ...a,
        entryDate: a.entryDate ? new Date(a.entryDate).toISOString().split('T')[0] : null,
        createdAt: a.createdAt?.toISOString(),
        updatedAt: a.updatedAt?.toISOString()
    }));
    
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <PackagePlus size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Main Production Warehouse</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Central Catalog & Stock Management</p>
                    </div>
                </div>
            </div>
            
            <ProductionInventoryClient 
                businessId={businessId || undefined} 
                initialItems={initialArticles as any} 
            />
        </div>
    );
}
