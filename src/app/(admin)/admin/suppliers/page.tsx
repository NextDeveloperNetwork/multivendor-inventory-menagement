import { getSuppliers } from '@/app/actions/supplier';
import SupplierClient from '../../../../components/SupplierClient';
import { Users, Phone, Mail, MapPin } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
    const filter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();
    const suppliersRaw = await getSuppliers(filter);
    const suppliers = sanitizeData(suppliersRaw);

    return (
        <div className="space-y-6 fade-in relative pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Supply <span className="text-blue-600">Registry</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Global Resource Network & Logistics Interface
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'TOTAL ENTITIES', value: suppliers.length, icon: Users, sub: 'Active Supply Clusters' },
                    { label: 'EMAIL UPLINK', value: suppliers.filter((s: any) => s.email).length, icon: Mail, sub: 'Digital Interface Ready' },
                    { label: 'VOICE UPLINK', value: suppliers.filter((s: any) => s.phone).length, icon: Phone, sub: 'Analog Feedback Loop' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-600 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[8px] font-black text-slate-300 group-hover:text-blue-600 transition-colors uppercase tracking-widest font-mono">0{idx + 1} // VEND</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1 tracking-tighter italic">{stat.value}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Supplier Management */}
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                <SupplierClient suppliers={suppliers} selectedBusinessId={selectedBusinessId} />
            </div>
        </div>
    );
}
