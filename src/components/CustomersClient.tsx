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
        <div className="space-y-12 fade-in pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
                                CRM Node
                            </div>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Customer <span className="text-primary underline underline-offset-8 decoration-primary/10 decoration-8">Registry</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-3 italic font-mono px-2 border-l-4 border-primary/20">
                            <Heart size={18} className="text-primary" /> Manage loyalty, contact data, and spending habits
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="h-20 px-10 bg-slate-900 hover:bg-primary text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all active:scale-95 shadow-2xl shadow-black/10"
                    >
                        <UserPlus size={20} />
                        Acquire New Profile
                    </button>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-50 transition-opacity"></div>
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or digital identifier..."
                            className="relative w-full h-20 pl-20 pr-10 bg-white border border-slate-200 rounded-[2rem] text-lg font-bold outline-none focus:border-primary transition-all shadow-sm focus:shadow-xl focus:shadow-primary/5 text-slate-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                        <Star size={24} />
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Reach</div>
                        <div className="text-3xl font-black text-slate-900 italic">{customers.length} Profiles</div>
                    </div>
                </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredCustomers.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-30">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8">
                            <UserPlus size={48} />
                        </div>
                        <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">No profiles detected</p>
                        <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-3">Registry empty for current sector sector.</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer, i) => (
                        <div key={i} className="bg-white group rounded-[3rem] border border-slate-100 p-10 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:scale-125 transition-transform duration-700">
                                <Heart size={120} />
                            </div>

                            <div className="relative z-10 flex-1">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets Out</div>
                                        <div className="text-2xl font-black text-slate-900 font-mono italic">
                                            ${customer.sales.reduce((sum: number, s: any) => sum + Number(s.total), 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic mb-6 break-words underline decoration-primary/10 decoration-4 underline-offset-8 decoration-transparent group-hover:decoration-primary/20 transition-all">{customer.name}</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                                        <Mail size={16} className="text-primary/40 group-hover:text-primary transition-colors" /> {customer.email || 'NO_IDENTIFIER'}
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                                        <Phone size={16} className="text-primary/40 group-hover:text-primary transition-colors" /> {customer.phone || 'NO_V_ENTRY'}
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 font-bold text-sm font-mono text-[10px] uppercase tracking-widest">
                                        <Calendar size={16} className="text-primary/40 group-hover:text-primary transition-colors" /> JOINED {new Date(customer.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <button className="relative z-10 w-full mt-10 h-14 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-100 transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 group/btn shadow-sm">
                                Intelligence Report <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Customer Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-slate-900 p-12 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                        <DialogTitle className="text-4xl font-black uppercase italic tracking-tighter relative z-10">New Profile <span className="text-primary">Acquisition</span></DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3 relative z-10 px-1 border-l-4 border-primary/30">
                            Establish a new customer entry in the global registry
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleAddCustomer} className="p-12 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Name / Entity</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full h-16 px-8 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg focus:border-primary outline-none transition-all focus:bg-white"
                                    placeholder="e.g. Johnathan Sentinel"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Digital Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="w-full h-16 px-8 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg focus:border-primary outline-none transition-all focus:bg-white"
                                        placeholder="nexus@client.com"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Voice Identifier</label>
                                    <input
                                        name="phone"
                                        className="w-full h-16 px-8 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg focus:border-primary outline-none transition-all focus:bg-white"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="flex-1 h-16 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all font-mono"
                            >
                                [ ABORT_PROCESS ]
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : '[ COMMIT_PROFILE ]'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
