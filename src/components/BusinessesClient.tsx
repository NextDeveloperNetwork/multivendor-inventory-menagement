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
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Header / Form Section */}
            <div className="relative overflow-hidden bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full -mr-72 -mt-72 blur-[100px]"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                                    <Briefcase className="text-white" size={24} />
                                </div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enterprise segment</span>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    {editingBusiness ? 'Edit Business' : 'Create Entity'}
                                </h1>
                                <p className="mt-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                    {editingBusiness ? 'Updating Corporate Node' : 'Initialize Management Scope'}
                                </p>
                            </div>
                        </div>

                        {editingBusiness && (
                            <button
                                onClick={handleCancelEdit}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form action={handleSubmit} className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                                <input
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="e.g. Acme Corp / Retail Division"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full md:w-64 h-16 bg-blue-600 hover:bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                            >
                                {editingBusiness ? (
                                    <>
                                        <Check size={18} strokeWidth={3} /> Update Entity
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} strokeWidth={3} /> Create Entity
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
                {initialBusinesses.map(business => (
                    <div key={business.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 transition-all group">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start group-hover:bg-blue-50/30 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-600">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors uppercase">{business.name}</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {business.id}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(business)}
                                    className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(business.id)}
                                    className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-md transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Shops</p>
                                <p className="text-2xl font-black text-slate-900">{business.shopCount}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Customers</p>
                                <p className="text-2xl font-black text-slate-900">{business.customerCount}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Business Entity"
                description="Are you sure you want to delete this business? Internal data nodes may lose association if they exist."
                confirmText="Delete Entity"
                variant="danger"
            />
        </div>
    );
}
