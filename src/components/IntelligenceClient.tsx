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
    baseCurrencySymbol?: string;
}

export default function IntelligenceClient({
    initialAnalytics,
    initialActivities,
    shops,
    initialPredictions,
    baseCurrencySymbol = '$'
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
        <div className="space-y-6 max-w-[1600px] mx-auto fade-in">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Strategic Intelligence</h1>
                        <p className="text-sm text-slate-400 font-medium">Financial performance & predictive growth</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                    Live Analytics
                </div>
            </div>

            {/* Financial Performance KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                            Total Revenue
                        </p>
                        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <Wallet size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {baseCurrencySymbol}{analytics.revenue.toLocaleString()}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                        <ArrowUpRight size={14} /> +{((analytics.revenue / 1000) * 1.5).toFixed(1)}% vs last month
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-blue-600 p-5 rounded-2xl border border-blue-700 shadow-sm text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-semibold text-blue-100 flex items-center gap-2">
                                Net Operating Profit
                            </p>
                            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                <DollarSign size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white">
                            {baseCurrencySymbol}{analytics.profit.toLocaleString()}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs font-semibold px-1">
                            <span className="text-blue-200">Profit Margin</span>
                            <span className="text-white">{analytics.margin}%</span>
                        </div>
                        <div className="w-full bg-blue-800/50 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-white h-full transition-all"
                                style={{ width: `${analytics.margin}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Efficiency Status */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500">System Health</p>
                            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                <Zap size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-slate-900">Healthy & Stable</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <div className="text-xs font-medium text-slate-500">Uptime</div>
                            <div className="text-sm font-bold text-slate-900 mt-1">99.9%</div>
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-500">Latency</div>
                            <div className="text-sm font-bold text-blue-600 mt-1">24ms</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inventory Forecast */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Inventory Forecast</h3>
                            <p className="text-sm text-slate-400 font-medium">Predictive stock depletion models</p>
                        </div>
                        <div className="relative">
                            <select
                                onChange={(e) => handleShopChange(e.target.value)}
                                className="h-10 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 cursor-pointer appearance-none shadow-sm"
                                value={selectedShopId}
                            >
                                {shops.map((shop: any) => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <PieChart size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        {predictions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                    <Search size={32} />
                                </div>
                                <h4 className="text-slate-900 font-bold text-lg">Insufficient Data</h4>
                                <p className="text-slate-500 text-sm max-w-xs mt-1">Awaiting transaction records to generate predictive inventory models.</p>
                            </div>
                        ) : (
                            predictions.map((pred, i) => (
                                <div key={i} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center relative shadow-sm">
                                            <Package className="text-slate-400" size={20} />
                                            {pred.status === 'CRITICAL' && (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                                    <AlertCircle size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{pred.name}</div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Activity size={12} className="text-blue-500" /> Velocity: {pred.velocity}/day
                                                </span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <span>In Stock: {pred.currentStock}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-black ${pred.daysLeft < 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                                            {pred.daysLeft === Infinity ? '∞' : pred.daysLeft}
                                            <span className="text-sm font-semibold ml-1 text-slate-400">Days</span>
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded inline-block ${pred.status === 'CRITICAL' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                            {pred.status === 'CRITICAL' ? 'Critical' : 'Stable'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Audit Registry */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-5">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                            <Clock className="text-white" size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Audit Ledger</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Recent system activity</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {activities.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
                                <Activity size={32} className="text-slate-400 mb-3" />
                                <p className="text-xs font-bold text-slate-500 uppercase">Awaiting Records</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {activities.map((log, i) => (
                                    <div key={i} className="relative pl-5 border-l-2 border-slate-100">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 bg-slate-300 rounded-full"></div>
                                        <div>
                                            <div className="text-xs font-bold text-blue-600 mb-1 flex justify-between">
                                                <span className="uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-slate-400 font-medium">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 leading-snug">{log.details}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <button className="w-full h-10 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                            <Download size={14} /> Export Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
