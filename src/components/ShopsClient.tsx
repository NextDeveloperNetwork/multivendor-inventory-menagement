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
    businesses: any[];
    selectedBusinessId?: string | null;
}

export default function ShopsClient({ initialShops, initialUnassignedUsers, currencies, businesses, selectedBusinessId }: ShopsPageProps) {
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
    const [businessId, setBusinessId] = useState(selectedBusinessId || '');

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
        setBusinessId(shop.businessId || '');

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
        setBusinessId('');
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
        <div className="space-y-6 animate-in fade-in duration-1000">
            {/* Header / Form Section */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                            <Store className="text-white" size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                                {editingShop ? 'Modify Business Branch' : 'Branch Registration'}
                            </h2>
                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1 italic leading-none">
                                {editingShop ? `Updating Branch ID: ${editingShop.id.slice(-8).toUpperCase()}` : 'Register New Commercial Branch Office'}
                            </p>
                        </div>
                    </div>

                    {editingShop && (
                        <button
                            onClick={handleCancelEdit}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 italic"
                        >
                            Cancel Changes
                        </button>
                    )}
                </div>

                <div className="p-6 md:p-8 bg-white">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Legal Identity</label>
                                <input
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[10px] focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic"
                                    placeholder="BRANCH_NAME / LOCATION_UNIT..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Geographic Sector</label>
                                <input
                                    name="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[10px] focus:border-blue-600 focus:bg-white transition-all outline-none uppercase italic"
                                    placeholder="REGION_CODE..."
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Vector Data (X, Y)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        name="latitude"
                                        value={lat}
                                        onChange={(e) => setLat(e.target.value)}
                                        className="w-full px-3 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[9px] focus:border-blue-600 transition-all outline-none font-mono italic"
                                        placeholder="LAT"
                                    />
                                    <input
                                        name="longitude"
                                        value={lng}
                                        onChange={(e) => setLng(e.target.value)}
                                        className="w-full px-3 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[9px] focus:border-blue-600 transition-all outline-none font-mono italic"
                                        placeholder="LNG"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Branch Location Matrix</label>
                                <MapPicker onSelect={(latitude, longitude) => {
                                    setLat(latitude.toString());
                                    setLng(longitude.toString());
                                }} />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-slate-100">
                            <div className="w-full md:w-1/4 space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Financial Protocol</label>
                                <div className="relative">
                                    <select
                                        name="currencyId"
                                        value={currencyId}
                                        onChange={(e) => setCurrencyId(e.target.value)}
                                        className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[9px] focus:border-blue-600 focus:bg-white transition-all outline-none appearance-none italic uppercase"
                                    >
                                        <option value="">Currency Profile...</option>
                                        {currencies.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} // {c.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <Shield size={10} />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/4 space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">Domain Assignment</label>
                                <div className="relative">
                                    <select
                                        name="businessId"
                                        required
                                        value={businessId}
                                        onChange={(e) => setBusinessId(e.target.value)}
                                        className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-[9px] focus:border-blue-600 focus:bg-white transition-all outline-none appearance-none italic uppercase"
                                    >
                                        <option value="">Business Entity...</option>
                                        {businesses.map(b => (
                                            <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <MapPin size={10} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-end">
                                <button
                                    type="submit"
                                    className="w-full h-11 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-black/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] italic border border-slate-800"
                                >
                                    {editingShop ? (
                                        <>
                                            <Check size={16} strokeWidth={3} /> Save Unit Changes
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} strokeWidth={3} /> Register Business Branch
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {shops.map(shop => (
                    <div key={shop.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-900 transition-all group flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center px-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 transition-all">
                                    <Store size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase italic truncate">{shop.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <MapPin size={10} className="text-blue-600" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic truncate">{shop.location || 'GLOBAL_ENTITY_BRANCH'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => handleEditClick(shop)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"
                                    title="Modify Branch"
                                >
                                    <Edit2 size={12} />
                                </button>
                                {shop.currency && (
                                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded border border-slate-900 uppercase tracking-widest font-mono italic">
                                        {shop.currency.code}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                    <Shield size={10} className="text-blue-600" /> Authorized Personnel
                                </p>
                                <span className="text-[8px] font-black text-slate-400 tracking-widest font-mono italic">
                                    {shop.users.length} ACTIVE_SESSIONS
                                </span>
                            </div>

                            <div className="space-y-2 flex-1">
                                {shop.users.length === 0 ? (
                                    <div className="py-8 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                                        <div className="text-[8px] text-slate-300 font-black uppercase tracking-widest italic mb-1">Branch Unassigned</div>
                                        <p className="text-[7px] text-slate-200 font-black uppercase tracking-widest italic">Awaiting personnel assignment</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                        {shop.users.map(user => (
                                            <div key={user.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg hover:border-blue-600 transition-all group/item">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center text-[9px] font-black uppercase shadow-inner shrink-0 leading-none italic">
                                                        {(user.name || user.email || 'A')[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black text-slate-900 uppercase truncate leading-none italic">{user.name || 'Anonymous'}</p>
                                                        <p className="text-[7px] font-black text-slate-400 mt-0.5 truncate italic font-mono uppercase tracking-tighter">{user.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setRemoveUser({ id: user.id, name: user.name || user.email || 'User' })}
                                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-600 transition-all shrink-0"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Assign User Section */}
                            {unassignedUsers.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <select id={`select-${shop.id}`} className="flex-1 bg-white border border-slate-200 h-9 px-3 text-[9px] font-black text-slate-700 rounded-lg outline-none focus:border-blue-600 transition-all uppercase appearance-none italic">
                                            {unassignedUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={async () => {
                                                const select = document.getElementById(`select-${shop.id}`) as HTMLSelectElement;
                                                const result = await assignUserToShop(select.value, shop.id);
                                                if (result.success) {
                                                    toast.success('System Access Granted');
                                                    router.refresh();
                                                } else {
                                                    toast.error(result.error);
                                                }
                                            }}
                                            className="bg-slate-900 text-white h-9 px-4 text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md italic"
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
                        toast.success('Matrix Access Revoked');
                        router.refresh();
                    } else {
                        toast.error(result.error);
                    }
                    setRemoveUser(null);
                }}
                title="Deactivate Branch Access"
                description={`Initialize protocol to revoke access for ID [${removeUser?.name}]? Target will lose all branch visibility.`}
                confirmText="DEACTIVATE_ACCESS_PROFILE"
                variant="warning"
            />
        </div>
    );
}
