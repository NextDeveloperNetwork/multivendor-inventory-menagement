import { prisma } from '@/lib/prisma';
import { UserMinus, Wallet, AlertTriangle, Phone, Clock, CheckCircle2, TrendingDown, Package } from 'lucide-react';
import CreateDebtorForm from '@/components/CreateDebtorForm';
import { getDebtors } from '@/app/actions/salesOps';
import { cn, sanitizeData } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SalesDebtorsPage() {
    const [rawDebtors, baseCurrency] = await Promise.all([
        getDebtors(),
        prisma.currency.findFirst({ where: { isBase: true } })
    ]);

    const debtors = sanitizeData(rawDebtors) as any[];
    const currency = sanitizeData(baseCurrency) || { symbol: '$' };
    const currencySymbol = (currency as any).symbol || '$';

    const totalOutstanding = debtors.reduce((s, d) => s + Number(d.amount), 0);
    const totalPaid = debtors.reduce((s, d) => s + Number(d.paidAmount), 0);
    const balance = totalOutstanding - totalPaid;
    const unpaidCount = debtors.filter(d => d.status === 'UNPAID').length;
    const partialCount = debtors.filter(d => d.status === 'PARTIAL').length;
    const paidCount = debtors.filter(d => d.status === 'PAID').length;

    return (
        <div className="flex flex-col min-h-full bg-slate-50">

            {/* ── Hero Header ── */}
            <div className="bg-slate-900 px-4 pt-5 pb-16 relative overflow-hidden">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-[70px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-[50px] pointer-events-none" />

                <div className="relative flex items-start justify-between">
                    <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Credit Management</p>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                            Debtors <span className="text-emerald-400">Ledger</span>
                        </h1>
                    </div>
                    <CreateDebtorForm currencySymbol={currencySymbol} />
                </div>

                {/* Outstanding amount */}
                <div className="mt-5">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Net Outstanding Balance</p>
                    <p className="text-5xl font-black font-mono text-white tracking-tighter tabular-nums mt-1">
                        {currencySymbol}<span className="text-emerald-400">{balance.toFixed(2)}</span>
                    </p>
                    {totalPaid > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            <span className="text-[9px] text-emerald-500 font-bold">{currencySymbol}{totalPaid.toFixed(2)} recovered</span>
                            <span className="text-[9px] text-slate-600 mx-1">·</span>
                            <span className="text-[9px] text-slate-500 font-bold">{currencySymbol}{totalOutstanding.toFixed(2)} issued</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Stat Cards (float over header) ── */}
            <div className="px-4 -mt-8 mb-4">
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Unpaid', value: unpaidCount, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: AlertTriangle },
                        { label: 'Partial', value: partialCount, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: TrendingDown },
                        { label: 'Settled', value: paidCount, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
                    ].map((s, i) => (
                        <div key={i} className={cn('rounded-2xl p-3 shadow-sm border', s.bg, s.border)}>
                            <s.icon size={14} className={cn('mb-1', s.color)} />
                            <p className={cn('text-xl font-black tabular-nums', s.color)}>{s.value}</p>
                            <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', s.color, 'opacity-70')}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Section label ── */}
            <div className="px-4 mb-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {debtors.length} Account{debtors.length !== 1 ? 's' : ''} Registered
                </p>
            </div>

            {/* ── Debtor List ── */}
            <div className="flex-1 px-4 pb-32 space-y-3">
                {debtors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4 border border-emerald-100">
                            <UserMinus size={26} className="text-emerald-400" />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">All Accounts Clear</p>
                        <p className="text-[9px] text-slate-300 mt-1.5 max-w-[200px] leading-relaxed">
                            No outstanding credit dispatches. All balances settled.
                        </p>
                    </div>
                ) : debtors.map((debtor: any) => {
                    const total = Number(debtor.amount);
                    const paid = Number(debtor.paidAmount);
                    const owed = total - paid;
                    const pctPaid = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

                    const statusConfig = {
                        UNPAID: { bg: 'bg-rose-500', border: 'border-rose-100', badge: 'bg-rose-100 text-rose-700', label: 'Unpaid' },
                        PARTIAL: { bg: 'bg-amber-500', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700', label: 'Partial' },
                        PAID: { bg: 'bg-emerald-500', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700', label: 'Paid' },
                    }[debtor.status as string] || { bg: 'bg-slate-400', border: 'border-slate-100', badge: 'bg-slate-100 text-slate-600', label: debtor.status };

                    return (
                        <div key={debtor.id} className={cn('bg-white border rounded-2xl overflow-hidden shadow-sm', statusConfig.border)}>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0', statusConfig.bg)}>
                                        {debtor.name?.[0]?.toUpperCase() || '?'}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={cn('text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest', statusConfig.badge)}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="text-[8px] text-slate-300">#{debtor.id.slice(-6)}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{debtor.name}</p>
                                        {debtor.phone && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Phone size={10} className="text-slate-400" />
                                                <a href={`tel:${debtor.phone}`} className="text-[10px] text-slate-500 font-medium">{debtor.phone}</a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Balance */}
                                    <div className="text-right shrink-0">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Owes</p>
                                        <p className={cn('text-xl font-black font-mono tabular-nums leading-tight', owed > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                                            {currencySymbol}{owed.toFixed(2)}
                                        </p>
                                        {paid > 0 && (
                                            <p className="text-[8px] text-emerald-500 font-bold">+{currencySymbol}{paid.toFixed(2)} paid</p>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {total > 0 && (
                                    <div className="mt-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Recovery</span>
                                            <span className="text-[7px] font-black text-slate-500">{pctPaid.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all', pctPaid === 100 ? 'bg-emerald-500' : pctPaid > 0 ? 'bg-amber-400' : 'bg-rose-400')}
                                                style={{ width: `${pctPaid}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Articles on Credit */}
                                {debtor.items?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 italic">
                                            <Package size={10} className="text-emerald-500" /> Articles on Credit
                                        </p>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {debtor.items.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-tight text-slate-600 bg-slate-50/50 px-3 py-2 rounded-xl">
                                                    <span className="truncate">{item.productName} <span className="text-emerald-500 not-italic">×{item.quantity}</span></span>
                                                    <span className="tabular-nums text-slate-400 font-bold ml-2">{currencySymbol}{Number(item.total).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes + date */}
                                {debtor.notes && (
                                    <p className="text-[9px] text-slate-400 italic mt-3 bg-slate-50/30 px-3 py-2 rounded-xl border border-slate-100/50 line-clamp-2 leading-relaxed">
                                        "{debtor.notes}"
                                    </p>
                                )}
                                <div className="flex items-center gap-1.5 mt-3">
                                    <Clock size={9} className="text-slate-300" />
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest" suppressHydrationWarning>
                                        {new Date(debtor.createdAt).toLocaleDateString()} @ {new Date(debtor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
