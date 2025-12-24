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
}

export default function SupplierClient({ suppliers }: SupplierClientProps) {
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
        <div className="space-y-12 bg-white p-4">
            {/* Create/Edit Supplier Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-black text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-4 text-sm"
                >
                    <Plus size={20} />
                    Register New Supplier
                </button>
            )}

            {/* Supplier Form */}
            {showForm && (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 p-12 lg:p-16 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-12 pb-8 border-b border-blue-100">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                                <Users size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-black tracking-tighter uppercase italic">
                                    {editingSupplier ? 'Modify Registry' : 'Supplier Interface'}
                                </h2>
                                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mt-2">
                                    {editingSupplier ? 'Synchronizing existing node parameters' : 'Initializing new external resource node'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border-2 border-blue-100 text-blue-200 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Name */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Entity Legal Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none text-sm placeholder:text-blue-100"
                                    placeholder="e.g. Global Logistics Corp"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Data Channel (Email)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none text-sm placeholder:text-blue-100"
                                    placeholder="contact@entity-node.com"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Voice Interface (Phone)</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none text-sm placeholder:text-blue-100"
                                    placeholder="+1-800-SUPPLY-OPS"
                                />
                            </div>

                            {/* Latitude */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Global Latitude</label>
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none text-sm placeholder:text-blue-100"
                                    placeholder="e.g. 51.5074"
                                />
                            </div>

                            {/* Longitude */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Global Longitude</label>
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none text-sm placeholder:text-blue-100"
                                    placeholder="e.g. -0.1278"
                                />
                            </div>

                            {/* Map Selector */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Spatial Matrix Selector</label>
                                <MapPicker onSelect={(lat, lng) => {
                                    setFormData({ ...formData, latitude: lat.toString(), longitude: lng.toString() });
                                }} />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-8 pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-20 bg-black text-white rounded-[2rem] font-bold shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] uppercase tracking-[0.3em] text-sm disabled:opacity-30 border-2 border-black"
                            >
                                {loading ? 'SYNCHRONIZING...' : editingSupplier ? 'Commit Updates' : 'Initialize Registry Entry'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-12 h-20 bg-white text-blue-300 rounded-[2rem] font-bold hover:text-black border-2 border-blue-100 hover:border-black transition-all uppercase tracking-widest text-xs shadow-sm hover:shadow-xl hover:shadow-black/5"
                            >
                                Abort
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Suppliers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {suppliers.length === 0 ? (
                    <div className="col-span-full bg-blue-50/50 border-2 border-dashed border-blue-100 p-24 text-center rounded-[3rem]">
                        <div className="w-24 h-24 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm">
                            <Users className="text-blue-200" size={40} />
                        </div>
                        <p className="text-2xl font-black text-black mb-4 uppercase tracking-tighter italic">No Supplier Data Detected</p>
                        <p className="text-blue-300 font-bold max-w-sm mx-auto text-[10px] uppercase tracking-widest leading-relaxed opacity-80">System requires at least one external supply node to initialize logistics chain.</p>
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-blue-50 border-2 border-blue-100 rounded-[2rem] p-10 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.1)] hover:border-blue-400 hover:bg-white transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="w-16 h-16 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-all shadow-sm">
                                    <Users className="text-blue-400 group-hover:text-white" size={28} />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="p-3.5 text-blue-200 hover:text-black bg-white rounded-xl shadow-sm border border-blue-50 transition-all"
                                        title="Edit Entity"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(supplier.id)}
                                        className="p-3.5 text-blue-200 hover:text-red-500 bg-white rounded-xl shadow-sm border border-blue-50 transition-all"
                                        title="Purge Registry"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-black mb-8 uppercase tracking-tighter italic group-hover:translate-x-1 transition-transform">{supplier.name}</h3>

                            <div className="space-y-6 text-[11px] font-bold uppercase tracking-widest relative z-10">
                                {supplier.email && (
                                    <div className="flex items-center gap-4 text-blue-400 group-hover:text-black transition-colors">
                                        <Mail size={18} className="text-blue-200 group-hover:text-blue-500" />
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center gap-4 text-blue-400 group-hover:text-black transition-colors">
                                        <Phone size={18} className="text-blue-200 group-hover:text-blue-500" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-center gap-4 text-blue-400 group-hover:text-black transition-colors">
                                        <MapPin size={18} className="text-blue-200 group-hover:text-blue-500" />
                                        <span className="truncate">{supplier.address}</span>
                                    </div>
                                )}
                            </div>

                            {supplier.invoices && supplier.invoices.length > 0 && (
                                <div className="mt-10 pt-8 border-t border-blue-100/50 relative z-10">
                                    <div className="text-[10px] font-black text-white bg-blue-500 inline-block px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                        {supplier.invoices.length} ACTIVE BATCHES
                                    </div>
                                </div>
                            )}

                            {/* Accent graphics */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/20 rounded-full -mr-24 -mt-24 group-hover:bg-blue-500/5 transition-all"></div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                description="Are you sure you want to delete this supplier? This action cannot be undone."
                confirmText="Delete Supplier"
                variant="danger"
            />
        </div>
    );
}
