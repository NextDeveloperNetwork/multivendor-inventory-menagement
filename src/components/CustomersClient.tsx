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
    Loader2,
    MapPin,
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
            toast.success('Client account registered');
            setCustomers([res.customer, ...customers]);
            setIsAddOpen(false);
        } else {
            toast.error(res.error || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 fade-in pb-20 p-2 md:p-6">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Client Portfolio <span className="text-blue-600">Registry</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Customer Profiles & Accounts
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
                        Add Client
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

            {/* Client Portfolio Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identity Entry</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Official Email</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tax ID (TIN)</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Aggregate Revenue</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Profile Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                                                <UserPlus size={24} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Client Records Detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer, i) => (
                                    <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-serif italic text-lg shadow-lg shadow-black/5 shrink-0">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{customer.name}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">REF_{customer.id.slice(-8).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold font-mono lowercase">
                                                <Mail size={12} className="text-slate-300" />
                                                {customer.email || 'NO_IDENTIFIER'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-black text-slate-900 font-mono tracking-tighter">
                                                {customer.taxId || '---'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="text-sm font-black text-slate-900 font-mono tabular-nums italic">
                                                ${customer.sales.reduce((sum: number, s: any) => sum + Number(s.total), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                <button className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 flex items-center gap-2">
                                                    Open Profile <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                    {/* Header Section */}
                    <DialogHeader className="bg-white px-10 py-8 border-b border-slate-100 flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <UserPlus size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none uppercase italic">
                                    Client Registration
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black italic">Initialize Client Account Registry</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddCustomer} className="p-10 space-y-8 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Identity */}
                            <div className="space-y-2 col-span-full">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> Business / Legal Name
                                </label>
                                <input
                                    name="name"
                                    required
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm placeholder:text-slate-300 placeholder:italic uppercase"
                                    placeholder="PRO_ENTITY_NAME"
                                />
                            </div>

                            {/* Contact Logic */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Official Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm font-mono placeholder:text-slate-300 placeholder:italic uppercase"
                                    placeholder="NEXUS@PROTOCOL.COM"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Contact Number
                                </label>
                                <input
                                    name="phone"
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm font-mono placeholder:text-slate-300 placeholder:italic"
                                    placeholder="+000-LOGOUT-OPS"
                                />
                            </div>

                            {/* Meta Data */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Tax ID (TIN)
                                </label>
                                <input
                                    name="taxId"
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm font-mono placeholder:text-slate-300 placeholder:italic uppercase"
                                    placeholder="TAX_ID_REF"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Business Address
                                </label>
                                <input
                                    name="address"
                                    className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all shadow-sm placeholder:text-slate-300 placeholder:italic uppercase font-bold"
                                    placeholder="GLOBAL_ADDR_COORD"
                                />
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 px-10 bg-slate-900 hover:bg-black disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-slate-900/10"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" size={16} /> Finalizing...</>
                                ) : (
                                    <><UserPlus size={16} /> Save Client</>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
