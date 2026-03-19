'use client';

import { useState } from 'react';
import {
    Coins,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Shield,
    Zap,
    Activity,
    Target,
    ArrowUpRight,
    Lock
} from 'lucide-react';
import { createCurrency, updateCurrency, deleteCurrency } from '@/app/actions/settings';
import { toast } from 'sonner';

interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    rate: any; // Decimal
    isBase: boolean;
}

interface CurrenciesClientProps {
    initialCurrencies: Currency[];
}

export default function CurrenciesClient({ initialCurrencies }: CurrenciesClientProps) {
    const [currencies, setCurrencies] = useState(initialCurrencies);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        symbol: '',
        rate: '1',
        isBase: false,
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createCurrency({
            ...formData,
            rate: parseFloat(formData.rate),
        } as any);

        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Currency successfully created');
            setIsAdding(false);
            setFormData({ code: '', name: '', symbol: '', rate: '1', isBase: false });
            window.location.reload();
        }
    };

    const handleUpdate = async (id: string) => {
        const res = await updateCurrency(id, {
            ...formData,
            rate: parseFloat(formData.rate),
        } as any);

        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Currency updated successfully');
            setEditingId(null);
            window.location.reload();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this currency?')) return;
        const res = await deleteCurrency(id);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Currency deleted successfully');
            window.location.reload();
        }
    };

    const startEdit = (c: Currency) => {
        setEditingId(c.id);
        setFormData({
            code: c.code,
            name: c.name,
            symbol: c.symbol,
            rate: c.rate.toString(),
            isBase: c.isBase,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-1000">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm px-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-black/20">
                        <Activity size={16} />
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                        System Protocol Status: <span className="text-blue-600">Active_Link</span>
                    </div>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="h-10 px-6 bg-slate-900 hover:bg-blue-600 text-white rounded-lg font-black shadow-lg shadow-black/10 transition-all active:scale-[0.98] flex items-center gap-3 uppercase tracking-[0.2em] text-[10px] italic"
                    >
                        <Plus size={16} /> INITIALIZE_PROTOCOL
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Registry */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div> Active Financial Protocols
                            </h3>
                            <div className="text-[8px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-widest font-mono italic">
                                TOTAL_NODES_{currencies.length}
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4">Protocol Identity</th>
                                        <th className="px-6 py-4">Symbol</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Synchronization Rate</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-8 py-4 text-right">Auth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {currencies.map((c) => (
                                        <tr key={c.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-600 transition-all shadow-lg shadow-black/10 italic">
                                                        {c.code.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic line-through decoration-slate-300/50 group-hover:decoration-blue-400/30 transition-all">{c.name}</div>
                                                        <div className="text-[8px] text-slate-400 font-black font-mono uppercase tracking-[0.2em] mt-0.5">{c.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-sm text-slate-900 shadow-sm italic">
                                                    {c.symbol}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-lg font-black text-slate-900 tabular-nums tracking-tighter font-mono italic leading-none group-hover:text-blue-600 transition-colors">
                                                        {Number(c.rate).toFixed(6)}
                                                    </div>
                                                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">
                                                        LOGIT_DELTA
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                {c.isBase ? (
                                                    <span className="inline-flex px-3 py-1 bg-blue-600 text-white rounded text-[8px] font-black uppercase tracking-widest italic shadow-lg shadow-blue-500/20">
                                                        Root Protocol
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-black text-[8px] uppercase tracking-widest italic font-mono opacity-30">V_SLAVE</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(c)}
                                                        className="h-8 w-8 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-600 rounded-lg border border-slate-200 transition-all flex items-center justify-center shadow-sm"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    {!c.isBase && (
                                                        <button
                                                            onClick={() => handleDelete(c.id)}
                                                            className="h-8 w-8 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-600 rounded-lg border border-slate-200 transition-all flex items-center justify-center shadow-sm"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4 space-y-3">
                            {currencies.map((c) => (
                                <div key={c.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs italic shadow-lg">
                                                {c.code.slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic">{c.name}</div>
                                                <div className="text-[8px] text-blue-600 font-black font-mono uppercase tracking-widest mt-0.5">{c.code}</div>
                                            </div>
                                        </div>
                                        {c.isBase && (
                                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[7px] font-black uppercase tracking-widest italic">
                                                Root
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                                        <div>
                                            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">V_SYM</div>
                                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-900 shadow-sm italic">
                                                {c.symbol}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">V_DELTA</div>
                                            <div className="text-sm font-black text-slate-900 tabular-nums tracking-tighter font-mono italic">
                                                {Number(c.rate).toFixed(6)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                                        <button
                                            onClick={() => startEdit(c)}
                                            className="flex-1 h-9 bg-white text-slate-900 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest italic shadow-sm"
                                        >
                                            <Edit2 size={12} />
                                            Modify
                                        </button>
                                        {!c.isBase && (
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="w-9 h-9 bg-white text-rose-600 rounded-lg border border-slate-200 transition-all flex items-center justify-center shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Adjustment Interface */}
                <div className="lg:col-span-4 relative">
                    {(isAdding || editingId) && (
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm sticky top-12 border border-slate-200 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic line-through decoration-blue-500/30">
                                        {isAdding ? 'New Protocol' : 'Modify Protocol'}
                                    </h3>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic leading-none">V_PARAMETER_NODE</p>
                                </div>
                                <button
                                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                                    className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center border border-slate-100 transition-all"
                                >
                                    <X size={16} strokeWidth={3} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleAdd} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">ISO_MATCH_CODE</label>
                                    <input
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 h-10 outline-none focus:border-blue-600 transition-all font-black text-slate-900 text-[10px] uppercase italic"
                                        placeholder="ISO_CODE"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        maxLength={3}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">PROTOCOL_LABEL</label>
                                    <input
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 h-10 outline-none focus:border-blue-600 transition-all font-black text-slate-900 text-[10px] uppercase italic"
                                        placeholder="UNITED_STATES_DOLLAR..."
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">SYMB_NODE</label>
                                        <input
                                            required
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 h-10 outline-none focus:border-blue-600 transition-all font-black text-center text-sm text-slate-900 italic"
                                            placeholder="$"
                                            value={formData.symbol}
                                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">ROOT_ACCESS</label>
                                        <div className="flex items-center justify-center w-full h-10 bg-slate-50 border border-slate-200 rounded-xl">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.isBase}
                                                    onChange={(e) => setFormData({ ...formData, isBase: e.target.checked, rate: e.target.checked ? '1' : formData.rate })}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 italic">EXCH_SYNC_RATE</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            step="0.0000000001"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 h-10 outline-none focus:border-blue-600 transition-all font-mono font-black text-sm text-slate-900 italic"
                                            placeholder="1.0000"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                            disabled={formData.isBase}
                                        />
                                        {formData.isBase && (
                                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-30" size={14} />
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-12 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-black/10 transition-all active:scale-[0.98] mt-4 italic border border-slate-800"
                                >
                                    {isAdding ? 'AUTHORIZE_PROTOCOL' : 'COMMIT_PROTOCOL_AUTH'}
                                </button>
                            </form>
                        </div>
                    )}

                    {!isAdding && !editingId && (
                        <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-12 text-center h-[400px] flex flex-col items-center justify-center relative shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
                                <Coins size={28} className="text-slate-300" />
                            </div>
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">NULL_SELECTION</h4>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Awaiting parameter input</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
