'use client';

import { useState, useEffect, useRef } from 'react';
import { getBusinesses, getSelectedBusinessId, setSelectedBusinessId, createBusiness } from '@/app/actions/business';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
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
    const ref = useRef<HTMLDivElement>(null);

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

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleToggle = async () => {
        if (!isOpen) await fetchLatestData();
        setIsOpen(!isOpen);
    };

    const handleSelect = async (id: string | null) => {
        await setSelectedBusinessId(id);
        setSelectedId(id);
        setIsOpen(false);
        router.refresh();
        toast.success(id ? 'Context switched' : 'Global view');
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
            if (result.business) await handleSelect(result.business.id);
        } else {
            toast.error(result.error || 'Failed to create');
        }
    };

    const selectedBusiness = businesses.find(b => b.id === selectedId);

    return (
        <div ref={ref} className={cn('relative z-[60]', className)}>
            {/* Trigger — slim pill */}
            <button
                onClick={handleToggle}
                className="flex items-center gap-2 h-9 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all active:scale-95 max-w-full"
            >
                <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={11} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wide truncate max-w-[100px] sm:max-w-[140px]">
                    {selectedBusiness?.name || 'Global'}
                </span>
                <ChevronDown
                    size={12}
                    className={cn('text-slate-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 min-w-[220px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="px-3 pt-3 pb-2 border-b border-slate-800">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Context</p>
                    </div>

                    <div className="py-1 max-h-52 overflow-y-auto">
                        {/* Global option */}
                        <button
                            onClick={() => handleSelect(null)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                                !selectedId ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', !selectedId ? 'bg-blue-400 animate-pulse' : 'bg-slate-600')} />
                            <span className="text-[10px] font-black uppercase tracking-wide flex-1 truncate">Global</span>
                            {!selectedId && <Check size={12} className="text-blue-400 shrink-0" strokeWidth={3} />}
                        </button>

                        {businesses.length > 0 && <div className="mx-3 my-1 h-px bg-slate-800" />}

                        {businesses.map(b => (
                            <button
                                key={b.id}
                                onClick={() => handleSelect(b.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                                    selectedId === b.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', selectedId === b.id ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')} />
                                <span className="text-[10px] font-black uppercase tracking-wide flex-1 truncate">{b.name}</span>
                                {selectedId === b.id && <Check size={12} className="text-blue-400 shrink-0" strokeWidth={3} />}
                            </button>
                        ))}
                    </div>

                    {/* Create new */}
                    <div className="border-t border-slate-800 p-2">
                        {isCreating ? (
                            <form onSubmit={handleCreate} className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Business name..."
                                    className="flex-1 h-8 px-3 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-white uppercase tracking-wide outline-none focus:border-blue-500 placeholder:text-slate-600 placeholder:normal-case transition-colors"
                                />
                                <button type="submit" className="h-8 px-3 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase active:scale-95 shrink-0">
                                    Add
                                </button>
                                <button type="button" onClick={() => setIsCreating(false)} className="h-8 px-2 bg-slate-800 text-slate-400 rounded-lg active:scale-95 shrink-0">
                                    <XIcon />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <Plus size={12} strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase tracking-wide">New Business</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function XIcon() {
    return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}
