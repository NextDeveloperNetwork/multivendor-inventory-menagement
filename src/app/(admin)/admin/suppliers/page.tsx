import { getSuppliers } from '@/app/actions/supplier';
import SupplierClient from '../../../../components/SupplierClient';
import { Users, Phone, Mail, Link as LinkIcon } from 'lucide-react';
import { sanitizeData } from '@/lib/utils';

import { getBusinessFilter, getSelectedBusinessId } from '@/app/actions/business';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
    const filter = await getBusinessFilter();
    const selectedBusinessId = await getSelectedBusinessId();
    const suppliersRaw = await getSuppliers(filter);
    const suppliers = sanitizeData(suppliersRaw);

    const stats = [
        { label: 'Total Entities', value: suppliers.length, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Email Connected', value: suppliers.filter((s: any) => s.email).length, icon: Mail, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'Phone Connected', value: suppliers.filter((s: any) => s.phone).length, icon: Phone, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
    ];

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <LinkIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Supply Registry</h1>
                        <p className="text-sm text-slate-400 font-medium">Global resource network & logistics contacts</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Supplier Management */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col p-6">
                <SupplierClient suppliers={suppliers} selectedBusinessId={selectedBusinessId} />
            </div>
        </div>
    );
}
