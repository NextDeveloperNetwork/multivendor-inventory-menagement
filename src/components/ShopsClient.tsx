'use client';

import { createShop, assignUserToShop, removeUserFromShop } from '@/app/actions/shop';
import { User, Shop } from '@prisma/client';
import { useState } from 'react';
import { Store, User as UserIcon, MapPin, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ShopsPageProps {
    initialShops: (Shop & { users: User[] })[];
    initialUnassignedUsers: User[];
}

// Separate client component for interactivity
export default function ShopsClient({ initialShops, initialUnassignedUsers }: ShopsPageProps) {
    const [shops, setShops] = useState(initialShops);
    const [unassignedUsers, setUnassignedUsers] = useState(initialUnassignedUsers);
    const router = useRouter();

    // State for new shop form can be simple

    return (
        <div className="space-y-16 bg-white p-4">
            {/* Create Shop Section */}
            <div className="bg-blue-50 p-12 rounded-[3rem] border-2 border-blue-100 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-black mb-10 flex items-center gap-6 uppercase tracking-tighter italic">
                        <div className="w-16 h-16 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                            <Plus size={32} />
                        </div>
                        Secure Node Registration
                    </h2>
                    <form action={async (formData) => {
                        const result = await createShop(formData);
                        if (result.success) {
                            toast.success('Node registered successfully');
                            router.refresh();
                        } else {
                            toast.error(result.error);
                        }
                    }} className="flex flex-col lg:flex-row gap-10 items-end">
                        <div className="flex-1 w-full space-y-4">
                            <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Node Identifier</label>
                            <input name="name" required className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none uppercase text-sm placeholder:text-blue-100" placeholder="e.g. Primary Storage A" />
                        </div>
                        <div className="flex-1 w-full space-y-4">
                            <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2">Geospatial Coordinates</label>
                            <input name="location" className="w-full px-6 h-16 bg-white border-2 border-blue-100 rounded-2xl text-black font-bold focus:border-blue-400 transition-all outline-none uppercase text-sm placeholder:text-blue-100" placeholder="e.g. Sector 7 / Grid-A" />
                        </div>
                        <button type="submit" className="h-16 px-12 bg-black text-white rounded-2xl font-bold shadow-2xl hover:bg-blue-600 transition-all active:scale-95 whitespace-nowrap uppercase tracking-[0.2em] text-xs border-2 border-black">
                            Initialize Node
                        </button>
                    </form>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full -mr-32 -mt-32"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {shops.map(shop => (
                    <div key={shop.id} className="bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/10 hover:border-blue-400 transition-all group">
                        <div className="p-10 border-b border-blue-100 bg-white/50 flex justify-between items-center group-hover:bg-white transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-50 group-hover:border-blue-400 transition-all">
                                    <Store size={32} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase italic text-black">{shop.name}</h3>
                                    <p className="text-[11px] font-bold flex items-center gap-2 mt-2 text-blue-400 uppercase tracking-widest">
                                        <MapPin size={16} />
                                        {shop.location || 'Logistics Node Unset'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-[11px] font-black bg-white text-blue-500 border-2 border-blue-100 px-4 py-2.5 rounded-xl font-mono shadow-sm group-hover:border-blue-400 transition-all">
                                {shop.id.slice(-6).toUpperCase()}
                            </div>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2 italic">Authorized Personnel</p>
                                    <span className="text-[10px] bg-blue-500 text-white px-4 py-2 rounded-full font-black tracking-widest shadow-lg shadow-blue-500/20">
                                        {shop.users.length} ACTIVE
                                    </span>
                                </div>

                                {shop.users.length === 0 ? (
                                    <div className="text-[11px] text-blue-300 font-bold bg-white border-2 border-dashed border-blue-100 p-10 rounded-[2rem] text-center uppercase tracking-widest leading-loose">
                                        Node Security Alert:<br />No Personnel Assigned.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {shop.users.map(user => (
                                            <div key={user.id} className="flex justify-between items-center bg-white border border-blue-50 p-6 rounded-2xl hover:border-blue-400 transition-all shadow-sm group/item">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center text-sm font-black uppercase group-hover/item:bg-blue-500 group-hover/item:text-white transition-all">
                                                        {(user.name || user.email || 'A')[0]}
                                                    </div>
                                                    <span className="text-sm font-bold text-black uppercase tracking-tight">{user.name || user.email}</span>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Revoke access for ${user.name || user.email}?`)) {
                                                            const result = await removeUserFromShop(user.id);
                                                            if (result.success) {
                                                                toast.success('Access revoked');
                                                                router.refresh();
                                                            } else {
                                                                toast.error(result.error);
                                                            }
                                                        }
                                                    }}
                                                    className="text-blue-100 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Revoke Permission"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Assign User Section */}
                            {unassignedUsers.length > 0 && (
                                <div className="pt-10 border-t border-blue-100 space-y-6">
                                    <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2 italic">Network Deployment</p>
                                    <div className="flex gap-4">
                                        <select id={`select-${shop.id}`} className="flex-1 bg-white border-2 border-blue-100 h-14 px-6 text-[11px] font-black text-black rounded-2xl outline-none focus:border-blue-400 uppercase appearance-none shadow-sm">
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
                                            className="bg-black text-white h-14 px-8 text-[11px] font-bold rounded-2xl uppercase tracking-widest hover:bg-blue-600 transition-all border-2 border-black shadow-xl"
                                        >
                                            Grant Access
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
