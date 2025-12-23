import { getSuppliers } from '@/app/actions/supplier';
import SupplierClient from '../../../../components/SupplierClient';
import { Users, Phone, Mail, MapPin } from 'lucide-react';

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();

    return (
        <div className="space-y-12 fade-in relative pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black text-black tracking-tighter uppercase italic">
                            Supply <span className="text-blue-600">Topology</span>
                        </h1>
                        <p className="text-blue-300 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-4">
                            <Users size={20} className="text-blue-500" />
                            Manage Global External Resource Networks
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'TOTAL ENTITIES', value: suppliers.length, icon: Users, sub: 'Active Supply Clusters' },
                    { label: 'EMAIL UPLINK', value: suppliers.filter((s: any) => s.email).length, icon: Mail, sub: 'Digital Interface Ready' },
                    { label: 'VOICE UPLINK', value: suppliers.filter((s: any) => s.phone).length, icon: Phone, sub: 'Analog Feedback Loop' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-12 rounded-[2.5rem] border-2 border-blue-50 shadow-2xl shadow-blue-500/5 relative group hover:bg-blue-50 transition-all duration-500">
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <stat.icon size={32} />
                            </div>
                            <span className="text-[10px] font-black text-blue-200 group-hover:text-blue-400 transition-colors uppercase tracking-widest font-mono">0{idx + 1} // VEND</span>
                        </div>
                        <div className="text-4xl font-black text-black mb-2 tracking-tighter underline decoration-4 decoration-blue-500/10 underline-offset-8 group-hover:decoration-blue-500/30 transition-all">{stat.value}</div>
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mt-6">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Supplier Management */}
            <div className="bg-white border-2 border-blue-50 rounded-[3rem] p-1 shadow-2xl shadow-blue-500/5 overflow-hidden">
                <SupplierClient suppliers={suppliers} />
            </div>
        </div>
    );
}
