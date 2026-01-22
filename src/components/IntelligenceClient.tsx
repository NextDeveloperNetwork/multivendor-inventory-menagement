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
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-primary/10 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
                            System Intelligence
                        </div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        The <span className="text-primary underline decoration-primary/10 underline-offset-8 decoration-8">Nexus</span> Core
                    </h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mt-8 flex items-center gap-3 italic">
                        <Activity size={18} className="text-primary" /> Real-time telemetry & predictive logistics analysis
                    </p>
                </div>
            </div>

            {/* Financial Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Revenue Card */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:scale-110 group-hover:text-primary/10 transition-all">
                        <TrendingUp size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 italic">Gross Revenue</span>
                        <div className="text-5xl font-black text-slate-900 font-mono tracking-tighter italic">${analytics.revenue.toLocaleString()}</div>
                        <div className="mt-8 flex items-center gap-3 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                            <Plus size={14} strokeWidth={3} /> {((analytics.revenue / 1000) * 1.5).toFixed(1)}% Velocity Increase
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:scale-110 group-hover:text-primary/20 transition-all">
                        <Target size={80} />
                    </div>
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest block mb-4 italic">Net Operating Profit</span>
                        <div className="text-5xl font-black text-white font-mono tracking-tighter italic">${analytics.profit.toLocaleString()}</div>
                        <div className="mt-8">
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full shadow-lg shadow-primary/50 transition-all duration-1000"
                                    style={{ width: `${analytics.margin}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                <span>Profit Margin</span>
                                <span className="text-primary">{analytics.margin}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Efficiency Orbs */}
                <div className="bg-primary p-10 rounded-[2.5rem] text-white shadow-xl shadow-primary/10 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-4 italic">Operations Status</span>
                            <div className="text-3xl font-black uppercase tracking-tighter italic">Optimized</div>
                        </div>
                        <div className="flex items-center gap-4 mt-8">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                <Zap size={24} className="text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Uptime</div>
                                <div className="text-xl font-black font-mono italic">99.9%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Logistics Radar (Predictive Stock) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative min-h-[600px] flex flex-col group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/2 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Logistics <span className="text-primary">Radar</span></h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 border-l-2 border-primary/20 px-3 italic">Predictive stock depletion analysis</p>
                            </div>
                            <select
                                onChange={(e) => handleShopChange(e.target.value)}
                                className="h-14 px-8 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-primary transition-all text-slate-600 cursor-pointer appearance-none hover:bg-slate-100 italic"
                            >
                                {shops.map((shop: any) => (
                                    <option key={shop.id} value={shop.id}>{shop.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 space-y-6 relative z-10">
                            {predictions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                                        <Target size={40} />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Insufficient velocity data for predictions</p>
                                </div>
                            ) : (
                                predictions.map((pred, i) => (
                                    <div key={i} className="bg-slate-50/30 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center relative shadow-sm group-hover/item:scale-110 transition-transform">
                                                <Package className="text-primary" size={24} />
                                                {pred.status === 'CRITICAL' && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                                                        <AlertCircle size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 uppercase tracking-tight italic group-hover/item:underline decoration-primary/20 decoration-4 underline-offset-4">{pred.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Velocity: {pred.velocity} units/day</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-black font-mono tracking-tighter italic ${pred.daysLeft < 7 ? 'text-primary' : 'text-slate-900'}`}>
                                                {pred.daysLeft === Infinity ? '∞' : pred.daysLeft}
                                                <span className="text-xs uppercase tracking-widest ml-2 italic text-slate-300">Days</span>
                                            </div>
                                            <div className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 italic ${pred.status === 'CRITICAL' ? 'text-primary' : 'text-emerald-500'}`}>
                                                Stock Lifespan
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-12 p-8 bg-slate-900 rounded-3xl relative overflow-hidden group/footer">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[60px]"></div>
                            <div className="relative z-10 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                        <ShieldCheck className="text-primary" size={24} />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">
                                        Automatic reorder advised for <span className="text-white">{predictions.filter(p => p.status === 'CRITICAL').length} items</span> in critical sector
                                    </span>
                                </div>
                                <button className="h-14 px-8 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-3 italic group-hover/footer:translate-x-1">
                                    Refill Node <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Telemetry (Audit Logs) */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative h-full flex flex-col group">
                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 group-hover:bg-primary transition-colors">
                                <Clock className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Audit <span className="text-primary">Live</span></h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">System-wide Telemetry Feed</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 relative overflow-hidden px-2">
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>

                            {activities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                                    <Activity size={40} className="text-slate-300 mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">Telemetry Stream Offline</p>
                                </div>
                            ) : (
                                activities.map((log, i) => (
                                    <div key={i} className="relative pl-8 border-l border-slate-100 pb-2 group/log">
                                        <div className="absolute left-[-4.5px] top-0 w-2 h-2 bg-slate-200 rounded-full group-hover/log:bg-primary group-hover/log:scale-150 transition-all"></div>
                                        <div className="group-hover/log:translate-x-1 transition-transform">
                                            <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex justify-between italic">
                                                <span>{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-slate-300 font-mono not-italic">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs font-black text-slate-900 uppercase underline decoration-primary/5 underline-offset-4 italic">{log.details}</p>
                                            <div className="text-[10px] text-slate-400 font-bold mt-3 flex items-center gap-2 italic">
                                                <Target size={12} className="text-slate-200" /> {log.entityType} ID: {log.entityId?.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="mt-12 w-full h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 italic">
                            Registry Archive <ArrowUpRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
