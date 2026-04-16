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
        toast.success(id ? 'CONTEXT_SWITCH: OK' : 'GLOBAL_VIEW: ENABLED');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        const formData = new FormData();
        formData.append('name', newName);
        const result = await createBusiness(formData);
        if (result.success) {
            toast.success('BUSINESS REGISTERED');
            setIsCreating(false);
            setNewName('');
            const b = await getBusinesses();
            setBusinesses(b);
            if (result.business) await handleSelect(result.business.id);
        } else {
            toast.error(result.error || 'REGISTRATION FAILED');
        }
    };

    const selectedBusiness = businesses.find(b => b.id === selectedId);

    return (
        <div ref={ref} className={cn('relative z-[60]', className)}>
            {/* Trigger — slim pill */}
            <button
                onClick={handleToggle}
                className="flex items-center gap-2 h-8 px-2.5 bg-slate-900 border border-slate-800 hover:bg-black rounded-lg transition-all active:scale-95 max-w-full shadow-lg"
            >
                <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                    <Building2 size={10} className="text-white" />
                </div>
                <span className="text-[9px] font-black text-white uppercase tracking-[0.1em] truncate max-w-[80px] sm:max-w-[120px] italic">
                    {selectedBusiness?.name || 'GLOBAL_CORE'}
                </span>
                <ChevronDown
                    size={10}
                    className={cn('text-slate-600 shrink-0 transition-transform duration-300', isOpen && 'rotate-180')}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 min-w-[240px] bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Activity size={10} className="text-indigo-500" /> ACTIVE CONTEXT MESH
                        </p>
                    </div>

                    <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                        {/* Global option */}
                        <button
                            onClick={() => handleSelect(null)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all group',
                                !selectedId ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-900 hover:text-white'
                            )}
                        >
                            <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 group-hover:scale-125 transition-transform', !selectedId ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-slate-800')} />
                            <span className="text-[10px] font-black uppercase tracking-widest flex-1 truncate italic">GLOBAL_DOMAIN</span>
                            {!selectedId && <Check size={12} className="text-indigo-400 shrink-0" strokeWidth={4} />}
                        </button>

                        {businesses.length > 0 && <div className="mx-4 my-1 h-px bg-slate-800/50" />}

                        {businesses.map(b => (
                            <button
                                key={b.id}
                                onClick={() => handleSelect(b.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-all group',
                                    selectedId === b.id ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-900 hover:text-white'
                                )}
                            >
                                <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 group-hover:scale-125 transition-transform', selectedId === b.id ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-slate-800')} />
                                <span className="text-[10px] font-black uppercase tracking-widest flex-1 truncate italic">{b.name}</span>
                                {selectedId === b.id && <Check size={12} className="text-indigo-400 shrink-0" strokeWidth={4} />}
                            </button>
                        ))}
                    </div>

                    {/* Create new */}
                    <div className="border-t border-slate-800 p-2 bg-slate-900/40">
                        {isCreating ? (
                            <form onSubmit={handleCreate} className="flex items-center gap-2 p-1">
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="NODE NAME..."
                                    className="flex-1 h-8 px-3 bg-black border border-slate-800 rounded-lg text-[9px] font-black text-white uppercase tracking-widest italic outline-none focus:border-indigo-600 placeholder:text-slate-700 transition-all"
                                />
                                <button type="submit" className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter active:scale-95 shrink-0 shadow-lg shadow-indigo-600/20">
                                    SAVE
                                </button>
                                <button type="button" onClick={() => setIsCreating(false)} className="h-8 px-2 bg-slate-800 text-slate-500 rounded-lg hover:text-rose-500 transition-colors shrink-0">
                                    <XIcon />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-xl transition-all group"
                            >
                                <Plus size={12} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">REGISTER_NEW_NODE</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Activity(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}

function XIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
}
