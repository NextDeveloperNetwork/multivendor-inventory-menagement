'use client';

import { useState } from 'react';
import { 
    Truck, 
    Plus, 
    Edit2, 
    Trash2, 
    Phone, 
    MapPin, 
    BadgeCheck,
    Container,
    Hash,
    Search
} from 'lucide-react';
import { toast } from 'sonner';
import { createTransporter, updateTransporter, deleteTransporter } from '@/app/actions/transporters';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface TransporterManagerProps {
    initialTransporters: any[];
    businessId?: string;
}

export default function TransporterManager({ initialTransporters, businessId }: TransporterManagerProps) {
    const [transporters, setTransporters] = useState(initialTransporters);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTransporter, setEditingTransporter] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const filtered = transporters.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.licensePlate || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        if (businessId) data.businessId = businessId;

        if (editingTransporter) {
            const res = await updateTransporter(editingTransporter.id, data);
            if (res.success) {
                toast.success("Logistics unit updated");
                setTransporters(transporters.map(t => t.id === editingTransporter.id ? { ...t, ...data } : t));
                setEditingTransporter(null);
            } else {
                toast.error(res.error || "Update failure");
            }
        } else {
            const res = await createTransporter(data);
            if (res.success) {
                toast.success("New logistics unit registered");
                setTransporters([...transporters, res.transporter]);
                setIsAddOpen(false);
            } else {
                toast.error(res.error || "Registry failure");
            }
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Decommission this logistics unit? Historical records will orphan.")) return;
        setLoading(true);
        const res = await deleteTransporter(id);
        if (res.success) {
            toast.success("Unit decommissioned");
            setTransporters(transporters.filter(t => t.id !== id));
        } else {
            toast.error(res.error || "Decommission failure");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header Control */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Fleet <span className="text-blue-600">Inventory</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                        Managing {transporters.length} Active Logistics Entities & Carrier Units
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="SEARCH_FLEET..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-600 transition-all font-mono italic"
                        />
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <button className="h-12 px-6 bg-slate-900 text-white rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-black/10">
                                <Plus size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Register Unit</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                            <div className="bg-slate-900 p-8 text-white relative">
                                <Truck className="absolute top-4 right-4 text-white/10" size={80} />
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Fleet Registration</DialogTitle>
                                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2">New Carrier Logistics Entity</p>
                                </DialogHeader>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Company / Unit Name</label>
                                    <input name="name" required className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Vehicle Type</label>
                                        <input name="vehicleType" placeholder="e.g., SEMI-TRUCK" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">License Plate</label>
                                        <input name="licensePlate" placeholder="XYZ-1234" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Contact Phone</label>
                                    <input name="phone" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                                </div>
                                <button type="submit" disabled={loading} className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] hover:bg-blue-600 transition-all disabled:opacity-50">
                                    {loading ? 'PROCESSING...' : 'CONFIRM_REGISTRATION'}
                                </button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((t) => (
                    <div key={t.id} className="group bg-white rounded-[2rem] p-8 border border-slate-200 hover:border-slate-900 transition-all shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <Truck size={24} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingTransporter(t)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-black uppercase text-slate-900 italic leading-none">{t.name}</h3>
                                <div className="flex items-center gap-2 mt-2 text-slate-400 italic">
                                    <Container size={12} className="text-blue-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest font-mono italic">
                                        {t.vehicleType || 'GENERAL_FLEET'} // {t.licensePlate || 'UNMARKED'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Unit Personnel</span>
                                    <div className="flex items-center gap-2">
                                        <BadgeCheck size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black italic">{t._count?.users || 0} Staff</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Contact Log</span>
                                    <div className="flex items-center gap-2">
                                        <Phone size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black italic font-mono">{t.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingTransporter} onOpenChange={() => setEditingTransporter(null)}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit Unit Profile</DialogTitle>
                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2 italic">Ref: {editingTransporter?.id.slice(-8).toUpperCase()}</p>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-4">
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Internal Identifier</label>
                            <input name="name" defaultValue={editingTransporter?.name} required className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Type</label>
                                <input name="vehicleType" defaultValue={editingTransporter?.vehicleType} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Plate</label>
                                <input name="licensePlate" defaultValue={editingTransporter?.licensePlate} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-600 transition-all font-mono italic" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full h-14 bg-slate-900 text-white rounded-xl font-black uppercase italic tracking-widest text-[10px] hover:bg-blue-600 transition-all disabled:opacity-50">
                            {loading ? 'SAVING...' : 'COMMIT_SYSTEM_UPDATES'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
