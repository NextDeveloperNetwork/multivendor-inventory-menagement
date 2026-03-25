'use client';

import { createBusiness, updateBusiness, deleteBusiness, unassignShop, unassignCustomer } from '@/app/actions/business';
import { Business } from '@prisma/client';
import { useState } from 'react';
import { Briefcase, X, Plus, Edit2, Check, Trash2, MapPin, Mail, Phone, Unlink, ChevronDown, ChevronUp, Users, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface BusinessWithStats extends Business {
    shopCount: number;
    customerCount: number;
    shops: { id: string, name: string, location: string | null }[];
    customers: { id: string, name: string, email: string | null, phone: string | null }[];
}

interface BusinessesPageProps {
    initialBusinesses: BusinessWithStats[];
}

export default function BusinessesClient({ initialBusinesses }: BusinessesPageProps) {
    const [businesses, setBusinesses] = useState(initialBusinesses);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isUnassigning, setIsUnassigning] = useState(false);

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

    const handleUnassignShop = async (shopId: string) => {
        setIsUnassigning(true);
        const result = await unassignShop(shopId);
        if (result.success) {
            toast.success('Shop unassigned successfully');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setIsUnassigning(false);
    };

    const handleUnassignCustomer = async (customerId: string) => {
        setIsUnassigning(true);
        const result = await unassignCustomer(customerId);
        if (result.success) {
            toast.success('Customer unassigned successfully');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setIsUnassigning(false);
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

            <div className={`grid grid-cols-1 ${expandedId ? 'lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6 transition-all duration-500`}>
                {initialBusinesses.map(business => (
                    <div 
                        key={business.id} 
                        className={`bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-900 transition-all duration-500 group flex flex-col ${expandedId === business.id ? 'ring-2 ring-blue-500 shadow-2xl relative z-10' : ''}`}
                    >
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:scale-110 transition-all duration-500">
                                    <Briefcase size={24} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black tracking-tighter text-slate-900 group-hover:text-blue-900 transition-colors uppercase italic">{business.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[8px] font-black text-slate-400 border border-slate-200 px-1.5 rounded uppercase tracking-widest font-mono italic">
                                            ID_{business.id.slice(-8).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(business)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm active:scale-90"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(business.id)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all shadow-sm active:scale-90"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setExpandedId(expandedId === business.id ? null : business.id)}
                                className={`p-4 rounded-[1.5rem] border transition-all duration-500 text-left relative overflow-hidden group/btn ${expandedId === business.id ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-blue-400 hover:bg-white'}`}
                            >
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <p className={`text-[10px] font-black uppercase tracking-widest italic ${expandedId === business.id ? 'text-blue-100' : 'text-slate-400 group-hover/btn:text-blue-600'}`}>Nodes</p>
                                    <Store size={14} className={expandedId === business.id ? 'text-blue-200' : 'text-slate-300'} />
                                </div>
                                <div className="flex items-end justify-between relative z-10">
                                    <p className="text-3xl font-black font-mono tracking-tighter italic">{business.shopCount}</p>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${expandedId === business.id ? 'bg-white/20 rotate-180' : 'bg-white shadow-sm'}`}>
                                        <ChevronDown size={14} strokeWidth={3} className={expandedId === business.id ? 'text-white' : 'text-slate-400'} />
                                    </div>
                                </div>
                            </button>

                            <button 
                                onClick={() => setExpandedId(expandedId === business.id ? null : business.id)}
                                className={`p-4 rounded-[1.5rem] border transition-all duration-500 text-left relative overflow-hidden group/btn ${expandedId === business.id ? 'bg-slate-900 text-white border-slate-700 shadow-lg' : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-900 hover:bg-white'}`}
                            >
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <p className={`text-[10px] font-black uppercase tracking-widest italic ${expandedId === business.id ? 'text-slate-400' : 'text-slate-400 group-hover/btn:text-slate-900'}`}>Human Assets</p>
                                    <Users size={14} className={expandedId === business.id ? 'text-slate-600' : 'text-slate-300'} />
                                </div>
                                <div className="flex items-end justify-between relative z-10">
                                    <p className="text-3xl font-black font-mono tracking-tighter italic">{business.customerCount}</p>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${expandedId === business.id ? 'bg-white/10 rotate-180' : 'bg-white shadow-sm'}`}>
                                        <ChevronDown size={14} strokeWidth={3} className={expandedId === business.id ? 'text-slate-300' : 'text-slate-400'} />
                                    </div>
                                </div>
                            </button>
                        </div>

                        {expandedId === business.id && (
                            <div className="px-6 pb-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                                {/* Shops List */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-3 text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                                        Associated Active Nodes
                                    </h4>
                                    {business.shops.length > 0 ? (
                                        <div className="grid gap-2">
                                            {business.shops.map(shop => (
                                                <div key={shop.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-[1rem] hover:bg-white hover:border-blue-400 transition-all group/item">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 group-hover/item:text-blue-600 transition-colors">
                                                            <Store size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-black text-slate-900 uppercase italic leading-none">{shop.name}</p>
                                                            {shop.location && (
                                                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 italic">
                                                                    <MapPin size={10} /> {shop.location}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        disabled={isUnassigning}
                                                        onClick={() => handleUnassignShop(shop.id)}
                                                        className="h-10 px-4 bg-white border border-slate-200 hover:border-rose-400 hover:text-rose-600 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 group/unlink shadow-sm hover:shadow"
                                                    >
                                                        <Unlink size={14} className="group-hover/unlink:rotate-12 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Detatch</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 italic px-4 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">NO_NODES_DETECTOR_OFFLINE</p>
                                    )}
                                </div>

                                {/* Customers List */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-3 text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic">
                                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse"></span>
                                        Global Human Assets
                                    </h4>
                                    {business.customers.length > 0 ? (
                                        <div className="grid gap-2">
                                            {business.customers.map(customer => (
                                                <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-[1rem] hover:bg-white hover:border-slate-900 transition-all group/item">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 group-hover/item:text-slate-900 transition-colors">
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-black text-slate-900 uppercase italic leading-none">{customer.name}</p>
                                                            <div className="flex gap-4 mt-1">
                                                                {customer.email && (
                                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 italic">
                                                                        <Mail size={10} /> {customer.email}
                                                                    </p>
                                                                )}
                                                                {customer.phone && (
                                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 italic">
                                                                        <Phone size={10} /> {customer.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        disabled={isUnassigning}
                                                        onClick={() => handleUnassignCustomer(customer.id)}
                                                        className="h-10 px-4 bg-white border border-slate-200 hover:border-rose-400 hover:text-rose-600 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 group/unlink shadow-sm hover:shadow"
                                                    >
                                                        <Unlink size={14} className="group-hover/unlink:rotate-12 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Detatch</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 italic px-4 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">NO_HUMAN_ASSETS_IDENTIFIED</p>
                                    )}
                                </div>
                            </div>
                        )}
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
