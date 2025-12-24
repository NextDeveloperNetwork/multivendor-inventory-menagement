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
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Vivid Header */}
            <div className="relative overflow-hidden bg-white rounded-[3rem] p-10 md:p-14 shadow-xl border border-slate-100">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full -mr-72 -mt-72 blur-[100px]"></div>

                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                                <Activity className="text-white" size={24} />
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Finance System</span>
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                Currency <span className="text-blue-600">Management</span>
                            </h1>
                            <p className="mt-4 text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                System Status: <span className="text-emerald-500">Operational</span>
                            </p>
                        </div>
                    </div>

                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="group h-20 px-10 bg-blue-600 hover:bg-slate-900 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center gap-4 uppercase tracking-widest text-[11px]"
                        >
                            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                                <Plus size={20} strokeWidth={3} />
                            </div>
                            <span>Add Currency</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                {/* Visual Registry */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Active Currencies
                            </h3>
                            <div className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl uppercase tracking-widest">
                                {currencies.length} Available
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 md:px-12 py-6">Currency</th>
                                        <th className="px-6 md:px-8 py-6">Symbol</th>
                                        <th className="px-6 md:px-8 py-6 text-right">Exchange Rate</th>
                                        <th className="px-6 md:px-8 py-6 text-center">Type</th>
                                        <th className="px-8 md:px-12 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currencies.map((c) => (
                                        <tr key={c.id} className="group hover:bg-blue-50/30 transition-all">
                                            <td className="px-8 md:px-12 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                        {c.code.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-black text-slate-900 uppercase tracking-tight">{c.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{c.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-8">
                                                <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center font-black text-lg text-slate-700">
                                                    {c.symbol}
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-8 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-xl font-black text-slate-900 tabular-nums tracking-tight">
                                                        {Number(c.rate).toFixed(6)}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        Ratio
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-8 text-center">
                                                {c.isBase ? (
                                                    <span className="inline-flex px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        Base Currency
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Standard</span>
                                                )}
                                            </td>
                                            <td className="px-8 md:px-12 py-8 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => startEdit(c)}
                                                        className="h-10 w-10 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {!c.isBase && (
                                                        <button
                                                            onClick={() => handleDelete(c.id)}
                                                            className="h-10 w-10 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Adjustment Interface */}
                <div className="lg:col-span-4 relative">
                    {(isAdding || editingId) && (
                        <div className="bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] sticky top-12 border border-slate-100 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                        {isAdding ? 'New Currency' : 'Edit Currency'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuration Panel</p>
                                </div>
                                <button
                                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                                    className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center border border-slate-100 transition-all"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleAdd} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ISO Code</label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 uppercase"
                                        placeholder="USD"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        maxLength={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Currency Name</label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                        placeholder="United States Dollar"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Symbol</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-center text-lg text-slate-900 placeholder:text-slate-300"
                                            placeholder="$"
                                            value={formData.symbol}
                                            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Base</label>
                                        <div className="flex items-center justify-center w-full h-[62px] bg-slate-50 border border-slate-200 rounded-2xl">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.isBase}
                                                    onChange={(e) => setFormData({ ...formData, isBase: e.target.checked, rate: e.target.checked ? '1' : formData.rate })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Exchange Rate</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            step="0.0000000001"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-lg text-slate-900 placeholder:text-slate-300"
                                            placeholder="1.0000"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                            disabled={formData.isBase}
                                        />
                                        {formData.isBase && (
                                            <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full h-16 bg-blue-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-6"
                                >
                                    {isAdding ? 'Create Currency' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {!isAdding && !editingId && (
                        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-12 text-center h-[400px] flex flex-col items-center justify-center relative shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                                <Coins size={32} className="text-slate-300" />
                            </div>
                            <h4 className="text-lg font-black text-slate-300 uppercase tracking-widest">No Selection</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Select an item to edit details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
