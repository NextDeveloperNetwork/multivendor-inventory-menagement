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
    ArrowRight
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
        <div className="space-y-12 fade-in pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20">
                            System Intelligence
                        </div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic">
                        The <span className="text-blue-600 underline underline-offset-8 decoration-blue-100 decoration-8">Nexus</span> Core
                    </h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mt-6 flex items-center gap-3 italic">
                        <Activity size={18} className="text-blue-500" /> Real-time telemetry & predictive logistics analysis
                    </p>
                </div>
            </div>

            {/* Financial Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Revenue Card */}
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl shadow-blue-500/5 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Gross Revenue</span>
                        <div className="text-5xl font-black text-slate-900 font-mono tracking-tighter italic">${analytics.revenue.toLocaleString()}</div>
                        <div className="mt-8 flex items-center gap-3 text-emerald-500 font-bold text-xs">
                            <ArrowUpRight size={16} /> +12.5% from last period
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-800 shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-blue-500/20 group-hover:scale-110 transition-transform">
                        <Target size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest block mb-4 italic">Net Operating Profit</span>
                        <div className="text-5xl font-black text-white font-mono tracking-tighter italic">${analytics.profit.toLocaleString()}</div>
                        <div className="mt-8">
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full shadow-lg shadow-blue-500/50"
                                    style={{ width: `${analytics.margin}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                <span>Profit Margin</span>
                                <span>{analytics.margin}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Efficiency Orbs */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mb-4">Operations Status</span>
                            <div className="text-3xl font-black uppercase tracking-tighter italic">Optimized</div>
                        </div>
                        <div className="flex items-center gap-4 mt-8">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Zap size={24} className="text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Uptime</div>
                                <div className="text-xl font-black font-mono">99.9%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Logistics Radar (Predictive Stock) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl shadow-blue-500/5 relative min-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Logistics <span className="text-blue-600">Radar</span></h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Predictive stock depletion analysis</p>
                            </div>
                            <select
                                onChange={(e) => handleShopChange(e.target.value)}
                                className="h-14 px-8 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-400 transition-all text-slate-600 cursor-pointer"
                            >
                                {shops.map((shop: any) => (
                                    <option key={shop.id} value={shop.id}>{shop.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 space-y-6">
                            {predictions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-200 mb-6">
                                        <Target size={40} />
                                    </div>
                                    <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Insufficient velocity data for predictions</p>
                                </div>
                            ) : (
                                predictions.map((pred, i) => (
                                    <div key={i} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center relative shadow-sm group-hover:scale-110 transition-transform">
                                                <Package className="text-blue-500" size={24} />
                                                {pred.status === 'CRITICAL' && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center animate-bounce">
                                                        <AlertCircle size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 uppercase tracking-tight italic">{pred.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Velocity: {pred.velocity} units/day</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-black font-mono tracking-tighter ${pred.daysLeft < 7 ? 'text-rose-500' : 'text-slate-900'}`}>
                                                {pred.daysLeft === Infinity ? '∞' : pred.daysLeft}
                                                <span className="text-xs uppercase tracking-widest ml-2 italic">Days</span>
                                            </div>
                                            <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${pred.status === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                Stock Lifespan
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-12 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="text-blue-500" size={24} />
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">System recommendation: Automatic reorder advised for {predictions.filter(p => p.status === 'CRITICAL').length} items</span>
                            </div>
                            <button className="h-12 px-8 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3">
                                Refill Node <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Audit Telemetry (Audit Logs) */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-slate-900 p-10 rounded-[3.5rem] border-2 border-slate-800 shadow-2xl relative h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Clock className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Audit <span className="text-blue-500">Live</span></h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">System-wide Telemetry Feed</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90 z-10 pointer-events-none"></div>

                            {activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                    <Activity size={40} className="text-white mb-4" />
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">Telemetry Stream Offline</p>
                                </div>
                            ) : (
                                activities.map((log, i) => (
                                    <div key={i} className="relative pl-10 border-l-2 border-slate-800 pb-2">
                                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-slate-900 shadow-lg shadow-blue-500/20"></div>
                                        <div>
                                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2 flex justify-between">
                                                <span>{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-slate-600 font-mono">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-300 uppercase underline decoration-blue-500/20 underline-offset-4">{log.details}</p>
                                            <div className="text-[10px] text-slate-500 font-bold mt-3 flex items-center gap-2">
                                                <Target size={12} className="text-slate-600" /> {log.entityType} ID: {log.entityId?.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="mt-12 w-full h-16 bg-slate-800 border-2 border-slate-700 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-3">
                            Registry Archive <ArrowUpRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
