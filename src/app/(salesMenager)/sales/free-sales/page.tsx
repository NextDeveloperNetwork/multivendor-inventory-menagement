import React from 'react';
import { Banknote, Package, Clock, ShoppingBag } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CreateFreeSaleForm from '@/components/CreateFreeSaleForm';
import { getFreeSales } from '@/app/actions/salesOps';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function FreeSalesPage() {
    const session = await getServerSession(authOptions);
    const sales = await getFreeSales();

    const totalRevenue = sales.reduce((acc: number, s: any) => acc + Number(s.totalAmount), 0);
    const totalQty = sales.reduce((acc: number, s: any) => acc + s.items.reduce((sum: number, i: any) => sum + i.quantity, 0), 0);

    return (
        <div className="flex flex-col min-h-full">
            <div className="bg-white border-b border-slate-100 px-4 py-5 flex items-center justify-between sticky top-0 z-20">
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                        Free <span className="text-emerald-600">Sales</span>
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Manual Sales Registration
                    </p>
                </div>
                <CreateFreeSaleForm userName={session?.user?.name || 'Manager'} />
            </div>

            <div className="grid grid-cols-2 gap-3 px-4 pt-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-2xl font-black tabular-nums text-slate-900">${totalRevenue.toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Revenue</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-2xl font-black tabular-nums text-emerald-600">{totalQty}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Items Sold</p>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 pb-32 space-y-3">
                {sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                            <ShoppingBag size={28} className="text-slate-300" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Sales Recorded</p>
                        <p className="text-[9px] text-slate-300 mt-1 max-w-[200px] leading-relaxed">
                            Log manual sales that occurred outside the formal system.
                        </p>
                    </div>
                ) : sales.map((sale: any) => (
                    <div key={sale.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500">
                                <Package size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] text-slate-300 font-bold uppercase">#{sale.id.slice(-6)}</span>
                                    <span className="text-[10px] font-black text-emerald-600">${Number(sale.totalAmount).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">
                                    {sale.items.map((i: any) => i.productName).join(', ')}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                        {sale.items.length} {sale.items.length === 1 ? 'Item' : 'Items'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} className="text-slate-300" />
                                        <span className="text-[9px] text-slate-400" suppressHydrationWarning>{new Date(sale.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {sale.notes && (
                                    <p className="text-[10px] text-slate-500 italic mt-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
                                        "{sale.notes}"
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
