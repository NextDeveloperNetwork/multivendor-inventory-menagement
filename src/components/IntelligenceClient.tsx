'use client';

import { useState } from 'react';
import {
    Activity,
    TrendingUp,
    AlertCircle,
    Clock,
    DollarSign,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    ShieldCheck,
    Package,
    ArrowRight,
    Plus,
    LayoutDashboard,
    Wallet,
    BarChart3,
    PieChart,
    Search,
    Download
} from 'lucide-react';
import { getStockPredictions } from '@/app/actions/intelligence';

interface IntelligenceClientProps {
    initialAnalytics: any;
    initialActivities: any[];
    shops: any[];
    initialPredictions: any[];
}

export default function IntelligenceClient({
    initialAnalytics,
    initialActivities,
    shops,
    initialPredictions
}: IntelligenceClientProps) {
    const [analytics] = useState(initialAnalytics);
    const [activities] = useState(initialActivities);
    const [predictions, setPredictions] = useState(initialPredictions);
    const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');

    const handleShopChange = async (id: string) => {
        setSelectedShopId(id);
        const newPredictions = await getStockPredictions(id);
        setPredictions(newPredictions);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-2 md:p-6 text-slate-900">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Strategic <span className="text-blue-600">Intelligence</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Financial Performance Analytics & Predictive Growth Management
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">ANALYTICS_LIVE</span>
                    </div>
                </div>
            </div>

            {/* Financial Performance KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative group overflow-hidden hover:border-blue-600/50 transition-all">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <TrendingUp size={12} className="text-blue-600" /> TOTAL_REVENUE_FLOW
                            </p>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Wallet size={16} className="text-blue-600" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter italic leading-none">
                            ${analytics.revenue.toLocaleString()}
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic flex items-center gap-1">
                                <ArrowUpRight size={10} /> +{((analytics.revenue / 1000) * 1.5).toFixed(1)}% PERFORMANCE_VELOCITY
                            </span>
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative group overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <BarChart3 size={12} className="text-blue-500" /> NET_OPERATING_SURPLUS
                            </p>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
                                <DollarSign size={16} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-white font-mono tracking-tighter italic leading-none">
                            ${analytics.profit.toLocaleString()}
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                                <span className="text-slate-500">PROFIT_MARGIN_SYNC</span>
                                <span className="text-blue-400">%{analytics.margin}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${analytics.margin}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Efficiency Status */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative group overflow-hidden hover:border-blue-600/50 transition-all">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">OPERATIONAL_SCORE</p>
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                <Zap size={16} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 mb-auto">HEALTHY_STABLE</div>
                        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-50">
                            <div>
                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic">SYSTEM_UPTIME</div>
                                <div className="text-lg font-black font-mono text-slate-900 italic leading-none mt-1">99.9%</div>
                            </div>
                            <div>
                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic">SYNC_LATENCY</div>
                                <div className="text-lg font-black font-mono text-blue-600 italic leading-none mt-1">24ms</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inventory Forecast (Radar Replacement) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative min-h-[600px] flex flex-col group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-50 pb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-3">
                                    Strategic <span className="text-blue-600">Inventory Forecast</span>
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 italic leading-relaxed">
                                    Predictive Stock Longevity & Depletion Modeling
                                </p>
                            </div>
                            <div className="relative">
                                <select
                                    onChange={(e) => handleShopChange(e.target.value)}
                                    className="h-11 pl-6 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900 cursor-pointer appearance-none italic shadow-sm"
                                    value={selectedShopId}
                                >
                                    {shops.map((shop: any) => (
                                        <option key={shop.id} value={shop.id}>{shop.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <PieChart size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {predictions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 mb-6 shadow-inner">
                                        <Search size={40} strokeWidth={1.5} />
                                    </div>
                                    <h4 className="text-slate-900 font-black uppercase tracking-tighter italic text-xl mb-2">Insufficient Velocity Data</h4>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] italic max-w-xs leading-loose">Awaiting transaction records to generate predictive inventory models.</p>
                                </div>
                            ) : (
                                predictions.map((pred, i) => (
                                    <div key={i} className="bg-slate-50/30 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:border-blue-600/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center relative shadow-sm group-hover/item:border-blue-100 transition-colors">
                                                <Package className="text-slate-400 group-hover/item:text-blue-600 transition-colors" size={24} />
                                                {pred.status === 'CRITICAL' && (
                                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                        <AlertCircle size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 uppercase tracking-tight italic group-hover/item:text-blue-600 transition-colors">{pred.name}</div>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5">
                                                        <Activity size={10} className="text-blue-400" /> Velocity: <span className="font-mono text-slate-900">{pred.velocity}</span> units/day
                                                    </div>
                                                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">In Stock: <span className="font-mono text-slate-900">{pred.currentStock}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-black font-mono tracking-tighter italic ${pred.daysLeft < 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {pred.daysLeft === Infinity ? '∞' : pred.daysLeft}
                                                <span className="text-[12px] uppercase tracking-widest ml-1.5 italic text-slate-300">Days Cover</span>
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-[0.25em] mt-1.5 italic px-2 py-0.5 rounded border inline-block ${pred.status === 'CRITICAL' ? 'text-rose-600 border-rose-100 bg-rose-50' : 'text-emerald-600 border-emerald-100 bg-emerald-50'}`}>
                                                {pred.status === 'CRITICAL' ? 'CRITICAL_DEPLETION' : 'FLOW_STABLE'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-10 p-8 bg-slate-900 rounded-[2rem] relative overflow-hidden group/footer border border-slate-800 shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/10 to-transparent"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                        <ShieldCheck className="text-blue-400" size={28} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">STRATEGIC_ADVISORY</div>
                                        <div className="text-sm font-black text-white uppercase tracking-widest italic">
                                            <span className="text-blue-400 font-mono">[{predictions.filter(p => p.status === 'CRITICAL').length}]</span> Sectors Requiring Immediate Replenishment
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full md:w-auto h-12 px-10 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-3 italic">
                                    Replenish Stock Assets <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Registry (Telemetry replacement) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col group min-h-[600px] hover:border-blue-600/30 transition-all">
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 group-hover:bg-blue-600 transition-all duration-500">
                                <Clock className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">Audit <span className="text-blue-600">Ledger</span></h3>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 italic tracking-[0.2em]">Transaction Registry Feed</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 relative">
                            {activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                                    <Activity size={40} className="text-slate-400 mb-4" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Awaiting Records</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activities.map((log, i) => (
                                        <div key={i} className="relative pl-6 border-l-2 border-slate-100 pb-2 group/log">
                                            <div className="absolute left-[-5px] top-0 w-2 h-2 bg-slate-200 rounded-full group-hover/log:bg-blue-600 group-hover/log:scale-125 transition-all duration-300"></div>
                                            <div className="group-hover/log:translate-x-2 transition-transform duration-300">
                                                <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 flex justify-between italic">
                                                    <span>{log.action.replace(/_/g, ' ')}</span>
                                                    <span className="text-slate-400 font-mono not-italic text-[8px] flex items-center gap-1.5">
                                                        <Clock size={10} /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 uppercase italic leading-tight">{log.details}</p>
                                                <div className="text-[8px] text-slate-400 font-black mt-3 flex items-center gap-2 italic uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-100 border border-slate-200"></div>
                                                    {log.entityType}_REF: <span className="font-mono text-slate-600">{log.entityId?.slice(-8).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-10 space-y-3">
                            <button className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 italic mb-3">
                                <Download size={16} /> Export Audit Dataset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
