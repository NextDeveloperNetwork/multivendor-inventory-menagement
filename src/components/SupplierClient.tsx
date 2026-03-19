'use client';

import { useState, useEffect } from 'react';
import { createSupplier, updateSupplier, deleteSupplier } from '@/app/actions/supplier';
import { Plus, Trash2, Edit2, Users, Mail, Phone, MapPin, X, ChevronRight, Loader2, Store } from 'lucide-react';
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
        taxId: '',
        contactPerson: '',
        website: '',
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
        setFormData({ name: '', email: '', phone: '', address: '', taxId: '', contactPerson: '', website: '', latitude: '', longitude: '' });
        setEditingSupplier(null);
        setShowForm(false);
    };

    const handleEdit = (supplier: any) => {
        setFormData({
            name: supplier.name,
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            taxId: supplier.taxId || '',
            contactPerson: supplier.contactPerson || '',
            website: supplier.website || '',
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
        formDataObj.append('taxId', formData.taxId);
        formDataObj.append('contactPerson', formData.contactPerson);
        formDataObj.append('website', formData.website);
        formDataObj.append('latitude', formData.latitude);
        formDataObj.append('longitude', formData.longitude);
        if (selectedBusinessId) {
            formDataObj.append('businessId', selectedBusinessId);
        }

        const result = editingSupplier
            ? await updateSupplier(editingSupplier.id, formDataObj)
            : await createSupplier(formDataObj);

        if (result.success) {
            toast.success(editingSupplier ? 'Supplier parameters updated' : 'Supplier account registered');
            resetForm();
            router.refresh();
        } else {
            toast.error(result.error || 'Registration failed');
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await deleteSupplier(deleteId);
        if (result.success) {
            toast.success('Supplier removed');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setDeleteId(null);
    };

    return (
        <div className="space-y-10 bg-white p-2 md:p-10 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                        <Users size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif text-slate-900 italic tracking-tight uppercase">Supplier <span className="text-slate-400">Network</span></h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Manage Supplier Accounts & Logistics</p>
                    </div>
                </div>
                
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="h-16 px-10 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 flex items-center gap-4 text-xs italic"
                    >
                        <Plus size={20} />
                        Add Supplier
                    </button>
                )}
            </div>

            {/* Supplier Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 max-w-5xl mx-auto">
                    <div className="bg-white px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-900">
                                {editingSupplier ? <Edit2 size={24} strokeWidth={1.5} /> : <Plus size={24} strokeWidth={1.5} />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif text-slate-900 italic tracking-tight uppercase">
                                    {editingSupplier ? 'Modify Account Details' : 'New Supplier Registration'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1 leading-none">
                                    {editingSupplier ? `MOD_ID: ${editingSupplier.id.slice(-8).toUpperCase()}` : 'NEW_ENTITY_SPECIFICATION'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-10 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Identity Section */}
                            <div className="space-y-6 lg:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> Business Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-base placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                    placeholder="LEGAL_ENTITY_DESCRIPTOR"
                                    required
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Tax Identity (TIN)
                                </label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-base font-mono placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                    placeholder="TAX_ID_REF"
                                />
                            </div>

                            {/* Contact Section */}
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Official Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                    placeholder="CORE@ENTITY.COM"
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Contact Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic shadow-sm"
                                    placeholder="+00-LOGOUT-VOICE"
                                />
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Account Manager
                                </label>
                                <input
                                    type="text"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-sm placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                    placeholder="PERSON_OF_CONTACT"
                                />
                            </div>

                            {/* Logistics Section */}
                            <div className="space-y-6 md:col-span-2 lg:col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Web Presence
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-sm font-mono placeholder:text-slate-300 placeholder:italic shadow-sm"
                                    placeholder="https://source.manifest.io"
                                />
                            </div>

                            <div className="space-y-6 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3 italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Business Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-xl text-slate-900 font-black focus:border-slate-900 focus:ring-4 focus:ring-slate-50 transition-all outline-none text-sm placeholder:text-slate-300 placeholder:italic uppercase shadow-sm"
                                    placeholder="GLOBAL_ADDR_COORD"
                                />
                            </div>

                            {/* Spatial Metadata */}
                            <div className="space-y-6 lg:col-span-3 p-8 bg-slate-50/50 border border-slate-100 rounded-2xl">
                                <div className="flex flex-col md:flex-row gap-8 items-end">
                                    <div className="flex-1_space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 italic">Geographic Location Matrix</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={formData.latitude}
                                                readOnly
                                                className="h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-400 font-mono text-xs shadow-inner"
                                                placeholder="LAT_COORD"
                                            />
                                            <input
                                                type="text"
                                                value={formData.longitude}
                                                readOnly
                                                className="h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-400 font-mono text-xs shadow-inner"
                                                placeholder="LNG_COORD"
                                            />
                                        </div>
                                    </div>
                                    <MapPicker onSelect={(lat, lng) => {
                                        setFormData({ ...formData, latitude: lat.toString(), longitude: lng.toString() });
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Submit Section */}
                        <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-16 px-12 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95 uppercase tracking-[0.2em] text-xs disabled:opacity-30 italic flex items-center gap-4"
                            >
                                {loading ? 'SYNCHRONIZING...' : editingSupplier ? 'Save Changes' : 'Save Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Supplier Network Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-32">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Supplier Identity</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Account Manager</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Communication</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Fiscal Identity</th>
                                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Record Batches</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center text-slate-300">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                                                <Users size={32} strokeWidth={1} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest italic">No Supplier Records Detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr key={supplier.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm shrink-0">
                                                    <Store size={20} strokeWidth={2} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black text-slate-900 tracking-tight uppercase truncate">{supplier.name}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">SUP_REF: {supplier.id.slice(-8).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-[11px] font-bold text-slate-600 italic">
                                                {supplier.contactPerson || 'NULL_MANAGER'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 font-mono lowercase">
                                                    <Mail size={12} className="text-slate-300" />
                                                    {supplier.email || '---'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 font-mono italic">
                                                    <Phone size={12} className="text-slate-300" />
                                                    {supplier.phone || '---'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-900 font-mono">{supplier.taxId || 'UNREGISTERED'}</span>
                                                {supplier.taxId && (
                                                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest font-mono">TAX_VERIFIED</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                                                <span className="text-[10px] font-black text-slate-900 font-mono tabular-nums">{supplier.invoices?.length || 0}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Batches</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(supplier)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95"
                                                    title="Modify Account"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(supplier.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95"
                                                    title="Delete Supplier"
                                                >
                                                    <Trash2 size={16} />
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

            <ConfirmDialog
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                description={`Permanently remove supplier account [${deleteId}]? This action will remove the supplier from the database.`}
                confirmText="CONFIRM_DELETE"
            />
        </div>
    );
}
