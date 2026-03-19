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
    Plus
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
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic line-through decoration-blue-500/30">
                        INTEL <span className="text-blue-600">NODE_ROOT</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Real-Time Telemetry & Predictive Logistics Analysis Protocol
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">UPLINK_STABLE</span>
                    </div>
                </div>
            </div>

            {/* Financial Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic flex items-center gap-2">
                            <TrendingUp size={10} className="text-blue-600" /> GROSS_REVENUE_LOG
                        </p>
                        <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter italic leading-none">
                            ${analytics.revenue.toLocaleString()}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest italic">
                                +{((analytics.revenue / 1000) * 1.5).toFixed(1)}% VELOCITY_INC
                            </span>
                            <span className="text-[7px] font-black text-slate-300 font-mono tracking-widest italic uppercase">U_DELTA_04</span>
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg relative group overflow-hidden border border-slate-800">
                    <div className="relative z-10">
                        <p className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest mb-1 italic flex items-center gap-2">
                            <Target size={10} className="text-blue-600" /> NET_OPERATING_PROFIT
                        </p>
                        <div className="text-3xl font-black text-white font-mono tracking-tighter italic leading-none">
                            ${analytics.profit.toLocaleString()}
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-1000"
                                    style={{ width: `${analytics.margin}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic">MARGIN_SYNC</span>
                                <span className="text-[8px] font-black font-mono text-blue-400 italic">%{analytics.margin}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Efficiency Orbs */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">OPERATIONS_STATUS</p>
                            <div className="text-xl font-black uppercase tracking-tighter italic text-slate-900 line-through decoration-blue-500/30">OPTIMIZED_SECURE</div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-black/10">
                                <Zap size={14} />
                            </div>
                            <div>
                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic">CORE_UPTIME</div>
                                <div className="text-sm font-black font-mono text-slate-900 italic leading-none">99.9%_SYNC</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Logistics Radar (Predictive Stock) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative min-h-[500px] flex flex-col group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                                    Logistics <span className="text-blue-600">Radar</span>
                                </h3>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 border-l-2 border-blue-600/20 px-3 italic leading-none">
                                    Predictive Asset Depletion Analysis
                                </p>
                            </div>
                            <select
                                onChange={(e) => handleShopChange(e.target.value)}
                                className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-600 transition-all text-slate-600 cursor-pointer appearance-none italic"
                                value={selectedShopId}
                            >
                                {shops.map((shop: any) => (
                                    <option key={shop.id} value={shop.id}>{shop.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 space-y-3 relative z-10">
                            {predictions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                                    <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                                        <Target size={30} />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[8px] italic">Insufficient velocity data for predictions</p>
                                </div>
                            ) : (
                                predictions.map((pred, i) => (
                                    <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:border-blue-600 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center relative shadow-sm">
                                                <Package className="text-slate-400 group-hover/item:text-blue-600 transition-colors" size={18} />
                                                {pred.status === 'CRITICAL' && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg">
                                                        <AlertCircle size={10} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 uppercase tracking-tight italic line-through decoration-slate-300/30">{pred.name}</div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Velocity: <span className="font-mono">{pred.velocity}</span> units/day</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-black font-mono tracking-tighter italic ${pred.daysLeft < 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {pred.daysLeft === Infinity ? '∞' : pred.daysLeft}
                                                <span className="text-[10px] uppercase tracking-widest ml-1 italic text-slate-300">Days</span>
                                            </div>
                                            <div className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1 italic ${pred.status === 'CRITICAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                EST_LIFESPAN
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 p-6 bg-slate-900 rounded-2xl relative overflow-hidden group/footer border border-slate-800">
                            <div className="relative z-10 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                        <ShieldCheck className="text-blue-500" size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">
                                        REORDER_ADVISED: <span className="text-white font-mono">[{predictions.filter(p => p.status === 'CRITICAL').length}]</span> CRITICAL_SECTORS
                                    </span>
                                </div>
                                <button className="h-10 px-6 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex items-center gap-2 italic">
                                    REFILL_NODE <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Telemetry */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col group min-h-[500px]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-black/10 group-hover:bg-blue-600 transition-colors">
                                <Clock className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Audit <span className="text-blue-600">Live</span></h3>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5 italic">AU_TELEMETRY_FEED</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 relative overflow-hidden">
                            {activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                                    <Activity size={30} className="text-slate-300 mb-2" />
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Link Offline</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activities.map((log, i) => (
                                        <div key={i} className="relative pl-4 border-l border-slate-100 pb-2 group/log">
                                            <div className="absolute left-[-3.5px] top-0 w-1.5 h-1.5 bg-slate-200 rounded-full group-hover/log:bg-blue-600 transition-all"></div>
                                            <div className="group-hover/log:translate-x-1 transition-transform">
                                                <div className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1 flex justify-between italic">
                                                    <span>{log.action.replace(/_/g, ' ')}</span>
                                                    <span className="text-slate-400 font-mono not-italic text-[7px]">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase italic line-through decoration-slate-200 decoration-1">{log.details}</p>
                                                <div className="text-[7px] text-slate-400 font-black mt-2 flex items-center gap-1.5 italic">
                                                    <Target size={10} className="text-slate-300" /> {log.entityType}_ID: {log.entityId?.slice(-8).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="mt-8 w-full h-11 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 italic">
                            ARCHIVE_REGISTRY <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
