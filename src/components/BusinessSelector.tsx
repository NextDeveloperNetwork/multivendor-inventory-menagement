'use client';

import { useState, useEffect } from 'react';
import { getBusinesses, getSelectedBusinessId, setSelectedBusinessId, createBusiness } from '@/app/actions/business';
import { Briefcase, ChevronDown, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function BusinessSelector({ className }: { className?: string }) {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const router = useRouter();

    const fetchLatestData = async () => {
        const b = await getBusinesses();
        setBusinesses(b);
    };

    useEffect(() => {
        const load = async () => {
            await fetchLatestData();
            const sid = await getSelectedBusinessId();
            setSelectedId(sid);
        };
        load();
    }, []);

    const handleToggle = async () => {
        if (!isOpen) {
            await fetchLatestData();
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = async (id: string | null) => {
        await setSelectedBusinessId(id);
        setSelectedId(id);
        setIsOpen(false);
        router.refresh();
        toast.success(id ? 'Business context switched' : 'Global view enabled');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;

        const formData = new FormData();
        formData.append('name', newName);
        const result = await createBusiness(formData);

        if (result.success) {
            toast.success('Business created');
            setIsCreating(false);
            setNewName('');
            const b = await getBusinesses();
            setBusinesses(b);
            if (result.business) {
                await handleSelect(result.business.id);
            }
        } else {
            toast.error(result.error || 'Failed to create');
        }
    };

    const selectedBusiness = businesses.find(b => b.id === selectedId);

    return (
        <div className={cn("relative mb-8 z-[60]", className)}>
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden"
            >
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Briefcase size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1.5">Active Context</p>
                        <p className="text-sm font-black text-slate-900 truncate max-w-[130px] uppercase italic">
                            {selectedBusiness?.name || 'Global Core'}
                        </p>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />

                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+0.75rem)] left-0 right-0 bg-white/90 backdrop-blur-xl border-2 border-slate-100 rounded-[2rem] shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-300 overflow-hidden ring-4 ring-slate-400/5">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Select Domain</p>
                    </div>

                    <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                        <button
                            onClick={() => handleSelect(null)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${!selectedId ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${!selectedId ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                                Global Aggregate
                            </span>
                            {!selectedId && <Check size={16} strokeWidth={4} />}
                        </button>

                        <div className="h-px bg-slate-100 my-3 mx-4" />

                        {businesses.map(b => (
                            <button
                                key={b.id}
                                onClick={() => handleSelect(b.id)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${selectedId === b.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span className="flex items-center gap-3 truncate">
                                    <div className={`w-2 h-2 rounded-full ${selectedId === b.id ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                                    {b.name}
                                </span>
                                {selectedId === b.id && <Check size={16} strokeWidth={4} />}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-slate-100 my-4 mx-4" />

                    {isCreating ? (
                        <form onSubmit={handleCreate} className="p-2 space-y-3">
                            <div className="relative">
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Entity Identity..."
                                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-slate-900 transition-all active:scale-[0.98]"
                                >
                                    Initialize
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center gap-3 p-4 text-blue-600 hover:bg-blue-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group/btn"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all">
                                <Plus size={16} strokeWidth={4} />
                            </div>
                            New Business Entity
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function X({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}
