'use client';

import { createShop, updateShop, assignUserToShop, removeUserFromShop } from '@/app/actions/shop';
import { User, Shop } from '@prisma/client';
import { useState, useEffect } from 'react';
import { Store, User as UserIcon, MapPin, X, Plus, Edit2, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';
import MapPicker from './MapPicker';

interface ShopsPageProps {
    initialShops: (Shop & { users: User[], currency?: any })[];
    initialUnassignedUsers: User[];
    currencies: any[];
}

export default function ShopsClient({ initialShops, initialUnassignedUsers, currencies }: ShopsPageProps) {
    const searchParams = useSearchParams();
    const initialLat = searchParams.get('lat') || '';
    const initialLng = searchParams.get('lng') || '';

    const [shops, setShops] = useState(initialShops);
    const [unassignedUsers, setUnassignedUsers] = useState(initialUnassignedUsers);
    const [removeUser, setRemoveUser] = useState<{ id: string; name: string } | null>(null);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [lat, setLat] = useState(initialLat);
    const [lng, setLng] = useState(initialLng);
    const [currencyId, setCurrencyId] = useState('');

    const router = useRouter();

    useEffect(() => {
        if (initialLat && !editingShop) setLat(initialLat);
        if (initialLng && !editingShop) setLng(initialLng);
    }, [initialLat, initialLng, editingShop]);

    const handleEditClick = (shop: any) => {
        setEditingShop(shop);
        setName(shop.name);
        setLocation(shop.location || '');
        setLat(shop.latitude?.toString() || '');
        setLng(shop.longitude?.toString() || '');
        setCurrencyId(shop.currencyId || '');

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingShop(null);
        setName('');
        setLocation('');
        setLat('');
        setLng('');
        setCurrencyId('');
    };

    const handleSubmit = async (formData: FormData) => {
        if (editingShop) {
            const result = await updateShop(editingShop.id, formData);
            if (result.success) {
                toast.success('Shop updated successfully');
                handleCancelEdit();
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } else {
            const result = await createShop(formData);
            if (result.success) {
                toast.success('Shop created successfully');
                handleCancelEdit();
                router.refresh();
            } else {
                toast.error(result.error);
            }
        }
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
                                    <Store className="text-white" size={24} />
                                </div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Retail Network</span>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    {editingShop ? 'Edit Shop' : 'Register New Shop'}
                                </h1>
                                <p className="mt-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                    {editingShop ? 'Updating Existing Node' : 'Initializing Commercial Node'}
                                </p>
                            </div>
                        </div>

                        {editingShop && (
                            <button
                                onClick={handleCancelEdit}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form action={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Name</label>
                                <input
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="e.g. Main Street Branch"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                <input
                                    name="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="e.g. New York, NY"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                                <input
                                    name="latitude"
                                    value={lat}
                                    onChange={(e) => setLat(e.target.value)}
                                    className="w-full px-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none font-mono"
                                    placeholder="0.0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                                <input
                                    name="longitude"
                                    value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    className="w-full px-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none font-mono"
                                    placeholder="0.0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Map Selection</label>
                                <MapPicker onSelect={(latitude, longitude) => {
                                    setLat(latitude.toString());
                                    setLng(longitude.toString());
                                }} />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="w-full md:w-1/3 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Currency</label>
                                <select
                                    name="currencyId"
                                    value={currencyId}
                                    onChange={(e) => setCurrencyId(e.target.value)}
                                    className="w-full px-6 h-16 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none appearance-none"
                                >
                                    <option value="">Select Currency...</option>
                                    {currencies.map(c => (
                                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="flex-1 h-16 bg-blue-600 hover:bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                            >
                                {editingShop ? (
                                    <>
                                        <Check size={18} strokeWidth={3} /> Save Changes
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} strokeWidth={3} /> Register Shop
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
                {shops.map(shop => (
                    <div key={shop.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-100 transition-all group">
                        <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start group-hover:bg-blue-50/30 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-600">
                                    <Store size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors uppercase">{shop.name}</h3>
                                    <p className="text-[11px] font-bold flex items-center gap-2 mt-2 text-slate-400 uppercase tracking-widest">
                                        <MapPin size={14} />
                                        {shop.location || 'Location Not Set'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button
                                    onClick={() => handleEditClick(shop)}
                                    className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all"
                                    title="Edit Shop Details"
                                >
                                    <Edit2 size={16} />
                                </button>
                                {shop.currency && (
                                    <div className="text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                                        {shop.currency.code}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 md:p-10 space-y-8">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Shield size={12} /> Authorized Staff
                                    </p>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-black tracking-widest">
                                        {shop.users.length} ACCESSIBLE
                                    </span>
                                </div>

                                {shop.users.length === 0 ? (
                                    <div className="h-24 flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No personnel assigned</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {shop.users.map(user => (
                                            <div key={user.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white hover:border-blue-100 hover:shadow-md transition-all group/item">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white text-slate-500 flex items-center justify-center text-xs font-black uppercase group-hover/item:bg-blue-600 group-hover/item:text-white transition-all shadow-sm">
                                                        {(user.name || user.email || 'A')[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{user.name || 'Unknown User'}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">{user.email}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setRemoveUser({ id: user.id, name: user.name || user.email || 'User' })}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Revoke Permission"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Assign User Section */}
                            {unassignedUsers.length > 0 && (
                                <div className="pt-8 border-t border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign New Staff</p>
                                    <div className="flex gap-3">
                                        <select id={`select-${shop.id}`} className="flex-1 bg-slate-50 border border-slate-200 h-12 px-4 text-[11px] font-bold text-slate-700 rounded-xl outline-none focus:border-blue-500 focus:bg-white uppercase appearance-none transition-all">
                                            {unassignedUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={async () => {
                                                const select = document.getElementById(`select-${shop.id}`) as HTMLSelectElement;
                                                const result = await assignUserToShop(select.value, shop.id);
                                                if (result.success) {
                                                    toast.success('Access granted');
                                                    router.refresh();
                                                } else {
                                                    toast.error(result.error);
                                                }
                                            }}
                                            className="bg-slate-900 text-white h-12 px-6 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                                        >
                                            Grant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={removeUser !== null}
                onClose={() => setRemoveUser(null)}
                onConfirm={async () => {
                    if (!removeUser) return;
                    const result = await removeUserFromShop(removeUser.id);
                    if (result.success) {
                        toast.success('Access revoked');
                        router.refresh();
                    } else {
                        toast.error(result.error);
                    }
                    setRemoveUser(null);
                }}
                title="Revoke User Access"
                description={`Are you sure you want to revoke access for ${removeUser?.name}? They will no longer be able to access this shop.`}
                confirmText="Revoke Access"
                variant="warning"
            />
        </div>
    );
}
