'use client';

import { useState } from 'react';
import { createWarehouse } from '@/app/actions/warehouse';
import { Warehouse, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function WarehouseForm() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);

        const result = await createWarehouse(formData);

        if (result.success) {
            toast.success('Warehouse created successfully');
            setName('');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl shadow-blue-500/5">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-black uppercase tracking-[0.3em] px-2 italic">Warehouse Identifier</label>
                <div className="relative">
                    <Warehouse className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Main Distribution Hub"
                        className="w-full pl-14 pr-6 h-14 bg-white border-2 border-blue-100 rounded-2xl text-sm font-bold placeholder:text-blue-100 focus:border-blue-400 transition-all outline-none text-black shadow-sm"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-black text-white rounded-2xl font-bold shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs border-2 border-black"
            >
                {loading ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Plus size={20} /> Add Warehouse
                    </>
                )}
            </button>
        </form>
    );
}
