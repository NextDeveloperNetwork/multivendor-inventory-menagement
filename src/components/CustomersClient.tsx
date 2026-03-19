'use client';

import { useState } from 'react';
import {
    UserPlus,
    Search,
    Mail,
    Phone,
    Calendar,
    ChevronRight,
    Heart,
    Star,
    Loader2
} from 'lucide-react';
import { createCustomer } from '@/app/actions/intelligence';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';

interface CustomersClientProps {
    initialCustomers: any[];
    selectedBusinessId: string | null;
}

export default function CustomersClient({ initialCustomers, selectedBusinessId }: CustomersClientProps) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        if (selectedBusinessId) {
            formData.append('businessId', selectedBusinessId);
        }

        const res = await createCustomer(formData);
        if (res.success) {
            toast.success('Customer profile created successfully');
            setCustomers([res.customer, ...customers]);
            setIsAddOpen(false);
        } else {
            toast.error(res.error || 'Failed to create customer');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 fade-in pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Customer <span className="text-blue-600">Registry</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Client Identity & Intelligence Archive
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="px-4 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 shadow-inner">
                        <Star size={16} className="text-blue-600" />
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Sector</div>
                            <div className="text-xs font-black text-slate-900 italic font-mono">{customers.length} PROFILES</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-black/10"
                    >
                        <UserPlus size={16} className="text-blue-400" />
                        Acquire Profile
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search by name, email, or digital identifier..."
                    className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/10 transition-all shadow-sm text-slate-900 placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-20 bg-white border border-slate-200 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                            <UserPlus size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No profiles detected in current matrix</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer, i) => (
                        <div key={i} className="bg-white group rounded-[2rem] border border-slate-200 p-6 hover:border-blue-600/30 transition-all shadow-sm hover:shadow-md relative overflow-hidden flex flex-col border-b-4 border-b-slate-100 hover:border-b-blue-600">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg group-hover:bg-blue-600 transition-colors shadow-lg shadow-black/5">
                                    {customer.name.charAt(0)}
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Net Output</div>
                                    <div className="text-sm font-black text-slate-900 font-mono italic">
                                        ${customer.sales.reduce((sum: number, s: any) => sum + Number(s.total), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight italic mb-4 truncate group-hover:text-blue-600 transition-colors">{customer.name}</h3>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3 text-slate-500 font-black text-[10px] uppercase truncate">
                                        <Mail size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                        <span className="truncate">{customer.email || 'NO_IDENTIFIER'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 font-black text-[10px] uppercase">
                                        <Phone size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                        <span>{customer.phone || 'NO_V_ENTRY'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 font-black text-[9px] uppercase tracking-widest font-mono pt-3 border-t border-slate-50 group-hover:border-blue-50 transition-colors">
                                        <Calendar size={12} className="text-slate-200 shrink-0" />
                                        EST. {new Date(customer.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <button className="w-full mt-6 h-10 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-600 group/btn">
                                Intelligence Report <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-xl bg-white rounded-[2rem] p-0 overflow-hidden border border-slate-200 shadow-2xl">
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-2 py-0.5 bg-blue-600 text-[8px] font-black uppercase tracking-[0.2em] rounded">SYSTEM_MASTER</div>
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Profile <span className="text-blue-400">Acquisition</span></DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
                            Initialize secure customer entry in registry matrix
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleAddCustomer} className="p-8 space-y-6 bg-white">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Legal Entity Identity
                                </label>
                                <input
                                    name="name"
                                    required
                                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                                    placeholder="Enter full name or business entity..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-blue-600" /> Digital Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                                        placeholder="nexus@matrix.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                        <div className="w-1 h-1 bg-blue-600" /> Voice Identifier
                                    </label>
                                    <input
                                        name="phone"
                                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 placeholder:italic"
                                        placeholder="+1 --- --- ----"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="flex-1 h-12 border border-slate-200 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all italic"
                            >
                                ABORT
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-2 h-12 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-3 px-8"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'COMMIT_PROFILE'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
