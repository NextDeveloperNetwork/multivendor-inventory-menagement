'use client';

import { createBusiness, updateBusiness, deleteBusiness } from '@/app/actions/business';
import { Business } from '@prisma/client';
import { useState } from 'react';
import { Briefcase, X, Plus, Edit2, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface BusinessWithStats extends Business {
    shopCount: number;
    customerCount: number;
}

interface BusinessesPageProps {
    initialBusinesses: BusinessWithStats[];
}

export default function BusinessesClient({ initialBusinesses }: BusinessesPageProps) {
    const [businesses, setBusinesses] = useState(initialBusinesses);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');

    const router = useRouter();

    const handleEditClick = (business: Business) => {
        setEditingBusiness(business);
        setName(business.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingBusiness(null);
        setName('');
    };

    const handleSubmit = async (formData: FormData) => {
        if (editingBusiness) {
            const result = await updateBusiness(editingBusiness.id, formData);
            if (result.success) {
                toast.success('Business updated successfully');
                handleCancelEdit();
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } else {
            const result = await createBusiness(formData);
            if (result.success) {
                toast.success('Business created successfully');
                handleCancelEdit();
                router.refresh();
            } else {
                toast.error(result.error);
            }
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await deleteBusiness(deleteId);
        if (result.success) {
            toast.success('Business deleted successfully');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setDeleteId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-1000">
            {/* Header / Form Section */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                            <Briefcase className="text-white" size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic line-through decoration-blue-500/30">
                                {editingBusiness ? 'Modify Sector' : 'Sector Registration'}
                            </h2>
                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] italic leading-none mt-1">
                                {editingBusiness ? `Updating Domain: ${editingBusiness.id.slice(-8).toUpperCase()}` : 'Initialize New Global Management Scope'}
                            </p>
                        </div>
                    </div>

                    {editingBusiness && (
                        <button
                            onClick={handleCancelEdit}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 italic"
                        >
                            ABORT_EDIT
                        </button>
                    )}
                </div>

                <div className="p-6 md:p-8 bg-white">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Authorized Sector Identity</label>
                                <input
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[10px] focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic"
                                    placeholder="ACME_GLOBAL_DIVISION..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full md:w-64 h-11 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-black/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] italic border border-slate-800"
                            >
                                {editingBusiness ? (
                                    <>
                                        <Check size={16} strokeWidth={3} /> COMMIT_DOMAIN_CHANGES
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} strokeWidth={3} /> INITIALIZE_DOMAIN_SCOPE
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialBusinesses.map(business => (
                    <div key={business.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-900 transition-all group flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start px-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 transition-all">
                                    <Briefcase size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors uppercase italic">{business.name}</h3>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 font-mono italic truncate">ID_{business.id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(business)}
                                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(business.id)}
                                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center italic">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Active Nodes</p>
                                <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">{business.shopCount}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center italic">
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Human Assets</p>
                                <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">{business.customerCount}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Authorize Sector Purge"
                description={`Initialize terminal sequence to purge domain [${initialBusinesses.find(b => b.id === deleteId)?.name}]. Root association will be fragmented.`}
                confirmText="PURGE_DOMAIN_STAKE"
                variant="danger"
            />
        </div>
    );
}
