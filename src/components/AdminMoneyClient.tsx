'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCashTransferStatus, sendFundsToShop } from '@/app/actions/money';
import { 
    Coins,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ShieldCheck,
    ArrowRightCircle,
    Building2,
    CalendarClock,
    Send
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AdminMoneyClient({ initialTransfers, baseCurrencySymbol = '$', shops = [] }: any) {
    const router = useRouter();
    const [transfers, setTransfers] = useState(initialTransfers);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Send Funds State
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [sendShopId, setSendShopId] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [sendReference, setSendReference] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleAction = async (id: string, status: 'COMPLETED' | 'REJECTED') => {
        setIsSubmitting(id);
        try {
            const updated = await updateCashTransferStatus(id, status);
            setTransfers((prev: any[]) => prev.map(t => t.id === id ? updated : t));
            toast.success(`Transfer ${status.toLowerCase()}`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update transfer');
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleSendFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sendShopId || !sendAmount) return toast.error('Fill required fields');
        
        setIsSending(true);
        try {
            await sendFundsToShop({
                shopId: sendShopId,
                amount: Number(sendAmount),
                reference: sendReference || 'Initial Float / Provision'
            });
            toast.success('Funds sent to shop successfully');
            setIsSendModalOpen(false);
            setSendAmount('');
            setSendReference('');
            setSendShopId('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send funds');
        } finally {
            setIsSending(false);
        }
    };

    const pendingTransfers = transfers.filter((t: any) => t.status === 'PENDING');
    const closedTransfers = transfers.filter((t: any) => t.status !== 'PENDING');
    
    // Quick summary
    const totalPending = pendingTransfers.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalCollected = closedTransfers
        .filter((t: any) => t.status === 'COMPLETED')
        .reduce((sum: number, t: any) => {
            const amount = Number(t.amount);
            return t.type === 'FROM_ADMIN' ? sum - amount : sum + amount;
        }, 0);

    return (
        <div className="space-y-6">

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Total Unreconciled</div>
                    <div className="text-2xl font-black text-amber-500">{baseCurrencySymbol}{totalPending.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-1">{pendingTransfers.length} pending claims</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Total Cleared Receipts</div>
                    <div className="text-2xl font-black text-emerald-500">{baseCurrencySymbol}{totalCollected.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-1">Life-to-date reconciled</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Pending Action List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                        <div className="p-6 border-b border-amber-100 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Clock size={18} className="text-amber-500" />
                                    Action Required
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">Approve incoming cash drops</p>
                            </div>
                            <button 
                                onClick={() => setIsSendModalOpen(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
                            >
                                <Send size={14} /> Send Funds
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-50/30">
                            {pendingTransfers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">All Reconciled</div>
                                    <div className="text-xs text-slate-400 mt-1 max-w-[200px]">There are no pending cash deposits from any shops.</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {pendingTransfers.map((t: any) => (
                                        <div key={t.id} className="p-6 bg-white hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <div className="text-2xl font-black text-slate-900">{t.shop?.currency?.symbol || baseCurrencySymbol}{Number(t.amount).toFixed(2)}</div>
                                                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-1">Ref: {t.reference || 'Auto-Drop'}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Coins size={14} />
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                                    <Building2 size={14} className="text-blue-500" /> 
                                                    {t.shop?.name || 'Unknown Shop'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <CalendarClock size={14} /> 
                                                    {new Date(t.createdAt).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => handleAction(t.id, 'COMPLETED')}
                                                    disabled={isSubmitting === t.id}
                                                    className="flex-1 h-10 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 border border-emerald-200 hover:border-emerald-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(t.id, 'REJECTED')}
                                                    disabled={isSubmitting === t.id}
                                                    className="flex-none w-10 h-10 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-500 rounded-xl transition-all flex items-center justify-center"
                                                    title="Reject Deposit"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Ledger Logs */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Historical Master Ledger</h2>
                                <p className="text-xs text-slate-500 font-medium">Filter past transactions and audits</p>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search references or shop..."
                                    className="w-full md:w-64 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Receipt Info</th>
                                        <th className="px-6 py-4">Origin Entity</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {closedTransfers
                                        .filter((t: any) => 
                                            t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{t.reference || 'Auto-Deposit'}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">ID: {t.id.slice(-8).toUpperCase()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-700 flex items-center gap-2">
                                                    <Building2 size={12} className="text-slate-400" />
                                                    {t.shop?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600 font-medium">{new Date(t.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`font-black ${t.type === 'FROM_ADMIN' ? 'text-amber-500' : 'text-slate-900'}`}>
                                                    {t.type === 'FROM_ADMIN' ? '-' : ''}{t.shop?.currency?.symbol || baseCurrencySymbol}{Number(t.amount).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                                                        t.status === 'COMPLETED' 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                            : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                        {t.status}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {closedTransfers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                                No historical transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* SEND FUNDS MODAL */}
            <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
                <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Send size={100} />
                        </div>
                        <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
                            <Send className="text-indigo-400" />
                            Provision Funds
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            Transfer starting floats to business branches
                        </DialogDescription>
                    </div>
                    
                    <form onSubmit={handleSendFunds} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Destination Branch</label>
                                <select 
                                    value={sendShopId} 
                                    onChange={e => setSendShopId(e.target.value)}
                                    required
                                    className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="" disabled>Select a branch...</option>
                                    {shops.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Amount to Transfer</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{baseCurrencySymbol}</span>
                                    <input 
                                        type="number" 
                                        value={sendAmount}
                                        onChange={e => setSendAmount(e.target.value)}
                                        required
                                        placeholder="0.00"
                                        className="w-full h-14 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Reference Code / Memo</label>
                                <input 
                                    type="text" 
                                    value={sendReference}
                                    onChange={e => setSendReference(e.target.value)}
                                    placeholder="e.g. Morning Float Provision"
                                    className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsSendModalOpen(false)}
                                className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSending || !sendShopId || !sendAmount}
                                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider rounded-2xl transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {isSending ? 'Sending...' : 'Authorize'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
