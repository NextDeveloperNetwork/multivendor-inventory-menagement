'use client';

import { useState, useEffect } from 'react';
import { createSupplier, updateSupplier, deleteSupplier } from '@/app/actions/supplier';
import { Plus, Trash2, Edit2, Users, Mail, Phone, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';
import MapPicker from './MapPicker';

interface SupplierClientProps {
    suppliers: any[];
    selectedBusinessId: string | null;
}

export default function SupplierClient({ suppliers, selectedBusinessId }: SupplierClientProps) {
    const searchParams = useSearchParams();
    const initialLat = searchParams.get('lat') || '';
    const initialLng = searchParams.get('lng') || '';

    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        latitude: initialLat,
        longitude: initialLng,
    });
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (initialLat || initialLng) {
            setFormData(prev => ({
                ...prev,
                latitude: initialLat || prev.latitude,
                longitude: initialLng || prev.longitude
            }));
            if (!showForm) setShowForm(true);
        }
    }, [initialLat, initialLng, showForm]);

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', latitude: '', longitude: '' });
        setEditingSupplier(null);
        setShowForm(false);
    };

    const handleEdit = (supplier: any) => {
        setFormData({
            name: supplier.name,
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            latitude: supplier.latitude?.toString() || '',
            longitude: supplier.longitude?.toString() || '',
        });
        setEditingSupplier(supplier);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formDataObj = new FormData();
        formDataObj.append('name', formData.name);
        formDataObj.append('email', formData.email);
        formDataObj.append('phone', formData.phone);
        formDataObj.append('address', formData.address);
        formDataObj.append('latitude', formData.latitude);
        formDataObj.append('longitude', formData.longitude);
        if (selectedBusinessId) {
            formDataObj.append('businessId', selectedBusinessId);
        }

        const result = editingSupplier
            ? await updateSupplier(editingSupplier.id, formDataObj)
            : await createSupplier(formDataObj);

        if (result.success) {
            toast.success(editingSupplier ? 'Supplier updated' : 'Supplier registered');
            resetForm();
            router.refresh();
        } else {
            toast.error(result.error || 'Operation failed');
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await deleteSupplier(deleteId);
        if (result.success) {
            toast.success('Supplier purged');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setDeleteId(null);
    };

    return (
        <div className="space-y-6 bg-white p-2 md:p-6">
            {/* Create/Edit Supplier Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="h-12 bg-slate-900 text-white px-8 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-black/10 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3 text-[10px] italic"
                >
                    <Plus size={16} />
                    REGISTER_NEW_SUPPLIER
                </button>
            )}

            {/* Supplier Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                <Users size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                                    {editingSupplier ? 'Modify Registry' : 'Supplier Interface'}
                                </h2>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic mt-0.5 leading-none">
                                    {editingSupplier ? 'Synchronizing existing node parameters' : 'Initializing new external resource node'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white hover:bg-rose-600 hover:border-rose-600 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Entity Legal Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-600 transition-all outline-none text-sm placeholder:text-slate-300 placeholder:italic"
                                    placeholder="e.g. Global Logistics Corp"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Data Uplink (Email)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-600 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic"
                                    placeholder="contact@entity-node.com"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Voice Proxy (Phone)
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-600 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic"
                                    placeholder="+1-800-SUPPLY-OPS"
                                />
                            </div>

                            {/* Latitude */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Global Latitude
                                </label>
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-600 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic"
                                    placeholder="0.0000"
                                />
                            </div>

                            {/* Longitude */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Global Longitude
                                </label>
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-600 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic"
                                    placeholder="0.0000"
                                />
                            </div>

                            {/* Map Selector */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-600" /> Spatial Matrix Selector
                                </label>
                                <MapPicker onSelect={(lat, lng) => {
                                    setFormData({ ...formData, latitude: lat.toString(), longitude: lng.toString() });
                                }} />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4 pt-6 border-t border-slate-50">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black shadow-lg shadow-black/10 hover:bg-blue-600 transition-all active:scale-[0.98] uppercase tracking-widest text-[10px] disabled:opacity-30 italic border border-slate-800"
                            >
                                {loading ? 'SYNCHRONIZING...' : editingSupplier ? 'COMMIT_REGISTRY_UPDATES' : 'INITIALIZE_REGISTRY_ENTRY'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 h-12 bg-white text-slate-400 rounded-xl font-black hover:text-rose-600 border border-slate-200 hover:border-rose-100 transition-all uppercase tracking-widest text-[10px] shadow-sm italic"
                            >
                                ABORT
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Suppliers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.length === 0 ? (
                    <div className="col-span-full bg-slate-50 border border-slate-200 border-dashed p-16 text-center rounded-[2rem]">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                            <Users size={32} />
                        </div>
                        <p className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">No Supplier Data Detected</p>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto text-[9px] uppercase tracking-widest leading-relaxed italic opacity-80">
                            System requires at least one external supply node to initialize logistics chain.
                        </p>
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-md transition-all group relative overflow-hidden flex flex-col border-b-4 border-b-slate-100 hover:border-b-blue-600">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all shadow-sm text-slate-400">
                                    <Users size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                        title="Edit Entity"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(supplier.id)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all"
                                        title="Purge Registry"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tighter italic truncate">{supplier.name}</h3>

                            <div className="space-y-3 text-[9px] font-black uppercase tracking-widest flex-1">
                                {supplier.email && (
                                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                                            <Mail size={12} />
                                        </div>
                                        <span className="truncate font-mono italic">{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                                            <Phone size={12} />
                                        </div>
                                        <span className="font-mono italic">{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-900 transition-colors">
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                                            <MapPin size={12} />
                                        </div>
                                        <span className="truncate italic">{supplier.address}</span>
                                    </div>
                                )}
                            </div>

                            {supplier.invoices && supplier.invoices.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <span className="text-[8px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest font-mono italic">
                                        {supplier.invoices.length} ACTIVE_BATCHES
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Purge Supplier Registry"
                description={`Initialize protocol to purge registry entry [${deleteId}]? This action will permanently remove the supplier from the Matrix.`}
                confirmText="PURGE_REGISTRY"
                variant="danger"
            />
        </div>
    );
}
