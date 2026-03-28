'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { openShift, closeShift } from '@/app/actions/shifts';
import { submitCashTransfer } from '@/app/actions/money';
import { 
    Coins, 
    ArrowRightLeft, 
    Clock, 
    ShieldCheck, 
    XCircle,
    CheckCircle2,
    Calendar,
    Send,
    LogOut,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ShopMoneyClient({ 
    shopId, 
    userId, 
    activeShift, 
    pastShifts, 
    cashTransfers,
    todaySalesTotal,
    currencySymbol = '$' 
}: any) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Shift State
    const [openingCash, setOpeningCash] = useState<string>('');
    const [closingCash, setClosingCash] = useState<string>('');
    
    // Transfer State
    const [transferAmount, setTransferAmount] = useState<string>('');
    const [transferRef, setTransferRef] = useState<string>('');

    const mostRecentClosedShift = pastShifts?.find((s: any) => s.status === 'CLOSED');

    const handleOpenShift = async () => {
        if (!openingCash) return toast.error('Enter opening till amount');
        setIsSubmitting(true);
        try {
            const res = await openShift(shopId, Number(openingCash), userId);
            if (res.error) throw new Error(res.error);
            toast.success('Shift opened successfully');
            setOpeningCash('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseShift = async () => {
        if (!closingCash) return toast.error('Enter closing till amount');
        setIsSubmitting(true);
        try {
            const res = await closeShift(activeShift.id, Number(closingCash));
            if (res.error) throw new Error(res.error);
            toast.success('Shift closed successfully');
            setClosingCash('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransfer = async () => {
        if (!transferAmount || Number(transferAmount) <= 0) return toast.error('Enter valid amount');
        setIsSubmitting(true);
        try {
            await submitCashTransfer({
                shopId,
                amount: Number(transferAmount),
                type: 'TO_ADMIN',
                reference: transferRef || `Deposit ${new Date().toLocaleDateString()}`
            });
            toast.success('Transfer claim submitted to Admin');
            setTransferAmount('');
            setTransferRef('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const expectedCash = activeShift ? Number(activeShift.openingCash) + todaySalesTotal : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: ACTIVE SHIFT & ACTIONS */}
            <div className="lg:col-span-1 space-y-6">
                {/* Active Shift Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${activeShift ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-300'} shadow-lg`}>
                                {activeShift ? <CheckCircle2 size={20} /> : <Lock size={20} />}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">
                                    {activeShift ? 'Till Unlocked' : 'Till Locked'}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                    {activeShift ? 'Active Session' : 'No active shift'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!activeShift ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Opening Cash (in Drawer)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                                    <input 
                                        type="number" 
                                        value={openingCash}
                                        onChange={(e) => setOpeningCash(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 pl-8 pr-4 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleOpenShift}
                                disabled={isSubmitting}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                Open Shift Register
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                                <div>
                                    <div className="text-xs font-semibold text-slate-500">Opening Till</div>
                                    <div className="text-lg font-bold text-slate-900 mt-1">{currencySymbol}{Number(activeShift.openingCash).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500">Recorded Sales</div>
                                    <div className="text-lg font-bold text-emerald-600 mt-1">+ {currencySymbol}{todaySalesTotal.toFixed(2)}</div>
                                </div>
                                <div className="col-span-2 pt-2">
                                    <div className="text-xs font-semibold text-slate-500">System Expected Total</div>
                                    <div className="text-2xl font-black text-blue-600 mt-1">{currencySymbol}{expectedCash.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-2">Actual Cash (Counted)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            value={closingCash}
                                            onChange={(e) => setClosingCash(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 pl-8 pr-4 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    {closingCash && (
                                        <div className={`text-xs font-semibold mt-2 ${(Number(closingCash) - expectedCash) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            Variance: {currencySymbol}{(Number(closingCash) - expectedCash).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleCloseShift}
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <LogOut size={18} /> Close Register
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transfer Money Request */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Send size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Admin Transfer</div>
                            <div className="text-xs text-slate-500 font-medium">Deposit funds to headquarters</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 flex items-center justify-between mb-2">
                                <span>Deposit Amount</span>
                                {mostRecentClosedShift && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setTransferAmount(Number(mostRecentClosedShift.closingCash).toString());
                                            setTransferRef(`Shift End Deposit`);
                                            toast.info('Auto-filled from last shift');
                                        }}
                                        className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded transition-colors uppercase tracking-wider text-[10px]"
                                    >
                                        Auto-fill: {currencySymbol}{Number(mostRecentClosedShift.closingCash).toFixed(2)}
                                    </button>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-white border border-slate-200 rounded-xl h-12 pl-8 pr-4 text-slate-900 font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-2">Memo / Reference (Optional)</label>
                            <input 
                                type="text" 
                                value={transferRef}
                                onChange={(e) => setTransferRef(e.target.value)}
                                placeholder="Bank deposit #1234"
                                className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-slate-900 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={handleTransfer}
                            disabled={isSubmitting || !transferAmount}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={18} /> Send Request
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: HISTORY */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <div className="text-sm font-bold text-slate-900">Transfer History</div>
                            <div className="text-xs text-slate-500 font-medium">Recent headquarters deposits</div>
                        </div>
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                            <ArrowRightLeft size={14} className="text-slate-400" />
                            {cashTransfers.length} Transfers
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-6">
                        {cashTransfers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Coins size={32} className="mb-3 opacity-50" />
                                <div className="text-sm font-bold text-slate-900">No transfers yet</div>
                                <div className="text-xs">Submit a deposit to headquarters to see it here.</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cashTransfers.map((t: any) => (
                                    <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                {t.status === 'COMPLETED' ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                ) : t.status === 'REJECTED' ? (
                                                    <XCircle size={18} className="text-rose-500" />
                                                ) : (
                                                    <Clock size={18} className="text-amber-500" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">
                                                    {t.type === 'FROM_ADMIN' ? 'Incoming Float:' : 'Deposit:'} {t.reference || 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {new Date(t.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-black ${t.type === 'FROM_ADMIN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {t.type === 'FROM_ADMIN' ? '+' : ''}{currencySymbol}{Number(t.amount).toFixed(2)}
                                            </div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded inline-block ${
                                                t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                t.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>
                                                {t.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <div className="text-sm font-bold text-slate-900">Past Shifts</div>
                            <div className="text-xs text-slate-500 font-medium">Recent register closures</div>
                        </div>
                        <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            Log Size: 10
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-6">
                        {pastShifts.length === 0 ? (
                            <div className="text-center text-slate-400 py-10">No past shifts recorded.</div>
                        ) : (
                            <div className="space-y-4">
                                {pastShifts.map((shift: any) => (
                                    <div key={shift.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {new Date(shift.openedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                                                <span>Opened: {new Date(shift.openedAt).toLocaleTimeString()}</span>
                                                {shift.closedAt && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span>Closed: {new Date(shift.closedAt).toLocaleTimeString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {shift.status === 'CLOSED' ? (
                                                <>
                                                    <div className="text-sm font-black text-slate-900 flex items-center gap-2 justify-end">
                                                        <span className="text-xs font-semibold text-slate-500">End Cash:</span>
                                                        {currencySymbol}{Number(shift.closingCash || 0).toFixed(2)}
                                                    </div>
                                                    <div className={`text-xs font-bold mt-1 ${Number(shift.difference) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {Number(shift.difference) >= 0 ? '+' : ''}{currencySymbol}{Number(Math.abs(Number(shift.difference || 0))).toFixed(2)} Var.
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                                    ACTIVE
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
