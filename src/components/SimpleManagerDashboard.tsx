'use client';

import React, { useState, useEffect } from 'react';
import { Package, Hash, Plus, Cpu, Activity, UserCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { logDailyProduction, getDailyProductionLogs, getArticleCumulativeYield } from '@/app/actions/production';
import { getProductionArticles } from '@/app/actions/productionArticles';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface AccessoryUsage { id: string; accessoryId: string; usageQuantity: number; }
interface ProcessRequirement { id: string; processName: string; unitsPerHour: number; sequence: number; }
interface ProductionItem { id: string; name: string; sku: string; type: 'MAIN' | 'ACCESSORY'; unit: string; stockQuantity: number; processes: ProcessRequirement[]; bom: AccessoryUsage[]; description?: string; supplierName?: string; businessId?: string; }

interface SimpleManagerDashboardProps {
    user: { id: string, name: string, role: string };
    todaysLogsData: any[];
    businessId?: string;
}

export default function SimpleManagerDashboard({ user, todaysLogsData, businessId }: SimpleManagerDashboardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState<ProductionItem[]>([]);
    const [todaysLogs, setTodaysLogs] = useState<any[]>(todaysLogsData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticleId, setSelectedArticleId] = useState<string>('');
    const [prevTotalYield, setPrevTotalYield] = useState<number>(0);
    const [counterValue, setCounterValue] = useState<string>('');
    const [calculatedYield, setCalculatedYield] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (selectedArticleId && isDialogOpen) {
            const article = items.find(i => i.id === selectedArticleId);
            if (article) {
                getArticleCumulativeYield(article.name, businessId || undefined).then(val => {
                    setPrevTotalYield(val);
                });
            }
        } else if (!isDialogOpen) {
            setPrevTotalYield(0);
        }
    }, [selectedArticleId, isDialogOpen, items, businessId]);

    useEffect(() => {
        if (!isDialogOpen) {
            setSelectedArticleId('');
            setCounterValue('');
            setCalculatedYield(0);
        }
    }, [isDialogOpen]);

    useEffect(() => {
        const val = parseInt(counterValue) || 0;
        if (val > 0) {
            setCalculatedYield(Math.max(0, val - prevTotalYield));
        } else {
            setCalculatedYield(0);
        }
    }, [counterValue, prevTotalYield]);

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const dbArticles = await getProductionArticles(businessId);
                if (dbArticles) {
                    const formatted = dbArticles.map((a: any) => ({
                        ...a,
                        entryDate: a.entryDate ? new Date(a.entryDate).toISOString().split('T')[0] : ''
                    }));
                    setItems(formatted);
                    console.log('Production catalog synchronized from Prisma:', dbArticles.length);
                }
            } catch (err) {
                console.error("Cloud Error: Database unreachable.");
            }
        };

        loadCatalog();
        setIsLoaded(true);
    }, [businessId]);

    // Filter to only show articles that have stock available (Active) AND match search
    // Filter logic: Only show filtered articles if user is searching
    // This handles the "too many articles" issue by requiring a search query for large catalogs
    const filteredArticles = items.filter(i => {
        const matchesStock = i.stockQuantity > 0;
        const q = searchQuery.toLowerCase().trim();

        // Always filter by stock
        if (!matchesStock) return false;

        // If search is empty and we have a lot of items, don't show any to prevent UI lag
        if (q === '' && items.length > 50) return false;

        const matchesSearch = q === '' ||
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.supplierName?.toLowerCase().includes(q);

        return matchesSearch;
    });

    // Fetch logs when date changes
    useEffect(() => {
        const fetchLogs = async () => {
            const logs = await getDailyProductionLogs(user.id, selectedDate);
            setTodaysLogs(logs);
        };
        fetchLogs();
    }, [selectedDate, user.id]);

    // Debug log to verify catalog loading in browser console
    useEffect(() => {
        if (isLoaded) {
            console.log('Manager Dashboard Catalog Loaded:', items.length, 'items found.');
        }
    }, [items, isLoaded]);

    const totalYield = todaysLogs.reduce((sum: number, l: any) => sum + l.quantity, 0);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const quantity = calculatedYield;
        const boxes = parseInt(formData.get('boxes') as string);
        const articleId = selectedArticleId;
        const article = items.find((i: any) => i.id === articleId);

        if (!article || quantity <= 0) {
            toast.error("Please enter a value higher than previous total (" + prevTotalYield + ")");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await logDailyProduction({
                workerId: user.id || '',
                articleName: article.name,
                quantity: quantity,
                boxes: boxes,
                date: selectedDate
            });

            toast.success(`Success: +${quantity} ${article.unit} logged!`);
            setCounterValue('');
            setCalculatedYield(0);
            setIsDialogOpen(false);

            const freshLogs = await getDailyProductionLogs(user.id, selectedDate);
            setTodaysLogs(freshLogs);
        } catch (err) {
            toast.error("Sync Error");
        }
        setIsSubmitting(false);
    };

    if (!isLoaded) return <div className="p-12 text-center font-bold text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="max-w-xl mx-auto space-y-3 pb-12 px-3 md:px-0">
            {/* Mobile-First Header & Date Control */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4 sm:mb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                            <UserCircle size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base font-black text-slate-900 leading-none truncate">Përshëndetje, {user.name}</h1>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-70">Kalendari i prodhimit</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner w-full justify-between mt-2 sm:mt-4">
                    <button
                        onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-3 sm:p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600 active:scale-90"
                    >
                        <ChevronLeft size={20} className="sm:w-3.5 sm:h-3.5" />
                    </button>

                    <div className="flex-1 px-2 flex items-center justify-center gap-2 border-x border-slate-200 mx-1 min-w-0">
                        <CalendarIcon size={14} className="text-indigo-600 shrink-0" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-[13px] sm:text-[11px] font-black text-slate-900 border-none outline-none cursor-pointer focus:ring-0 uppercase tracking-tight w-full max-w-[120px] text-center"
                        />
                    </div>

                    <button
                        onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-3 sm:p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600 active:scale-90"
                    >
                        <ChevronRight size={20} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Gjithsej</div>
                        <div className="text-2xl font-black text-indigo-600 leading-none mt-1.5 tabular-nums">
                            {totalYield.toLocaleString()} <span className="text-[10px] font-bold opacity-60">pcs</span>
                        </div>
                    </div>
                    <Activity className="absolute -right-4 -bottom-4 text-slate-50/50 w-20 h-20 rotate-12" />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl border border-indigo-700/10 p-4 shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex flex-col justify-center gap-0.5 group">
                            <Plus size={20} className="mb-1 group-hover:rotate-90 transition-transform duration-300" />
                            <div className="text-[9px] font-black uppercase tracking-widest leading-none opacity-80">Artikuj te Rinj</div>
                            <div className="text-lg font-black uppercase tracking-tight">Shto</div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[1.5rem] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="p-6 pb-3 bg-indigo-600 text-white">
                            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <Plus size={20} />
                                Regjistro Prodhimin
                            </DialogTitle>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5">Shift: {format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
                        </DialogHeader>

                        <div className="p-6 pt-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Select Catalog Item</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="SEARCH NAME/SKU..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="grow px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:border-indigo-600 transition-all uppercase outline-none shadow-inner"
                                        />
                                    </div>
                                    <select
                                        name="articleId"
                                        required
                                        value={selectedArticleId}
                                        onChange={e => setSelectedArticleId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            {searchQuery.trim() === '' && items.filter(i => i.stockQuantity > 0).length > 50
                                                ? "🔍 TYPE TO FILTER..."
                                                : `SELECT (${filteredArticles.length} ITEMS)`}
                                        </option>
                                        {filteredArticles.map((a: any) => (
                                            <option
                                                key={a.id}
                                                value={a.id}
                                            >
                                                {a.entryDate ? `${format(new Date(a.entryDate), 'MMM dd')} | ` : ''}
                                                {a.name}
                                                {a.description ? ` | ${a.description}` : ''}
                                                {a.sku ? ` | [${a.sku}]` : ''}
                                                {` | (${a.stockQuantity} ${a.unit})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedArticleId && (
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Gjithsej</div>
                                            <div className="text-xl font-black text-indigo-700 leading-none mt-1 tabular-nums">{prevTotalYield.toLocaleString()} <span className="text-[8px] opacity-60">pcs</span></div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Net Produced</div>
                                            <div className="text-xl font-black text-emerald-700 leading-none mt-1 tabular-nums">+{calculatedYield.toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Kutija</label>
                                        <input
                                            type="number"
                                            name="boxes"
                                            required
                                            min="1"
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:bg-white focus:border-indigo-600 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">vlera e re</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            required
                                            value={counterValue}
                                            onChange={e => setCounterValue(e.target.value)}
                                            min={prevTotalYield}
                                            placeholder={prevTotalYield.toString()}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:bg-white focus:border-indigo-600 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || calculatedYield <= 0}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {isSubmitting ? 'WORKING...' : `LOG +${calculatedYield} UNITS`}
                                </button>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick History List - More Compact Rows */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex align-center justify-between">
                    <div>
                        <h2 className="text-[9px] font-black tracking-widest uppercase text-slate-500">Rregjistri i prodhimit</h2>
                        <div className="text-[8px] text-indigo-600 font-bold uppercase tracking-tight mt-0.5">{todaysLogs.length} Regjistrime</div>
                    </div>
                    <FileText size={14} className="text-slate-300" />
                </div>
                <div className="divide-y divide-slate-50">
                    {todaysLogs.length === 0 ? (
                        <div className="py-12 text-center">
                            <Activity className="text-slate-100 mx-auto mb-2" size={24} />
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-loose">Nuk ka regjistrime per daten e zgjedhur.</div>
                        </div>
                    ) : (
                        todaysLogs.map((log: any) => (
                            <div key={log.id} className="px-5 py-3 hover:bg-slate-50/80 flex items-center justify-between transition-colors border-l-4 border-l-transparent hover:border-l-indigo-600">
                                <div>
                                    <div className="font-bold text-xs text-slate-900 leading-tight">{log.articleName}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight opacity-70">{format(new Date(log.createdAt), 'HH:mm')}</div>
                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight opacity-70">{log.boxes} Kutija</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-black tabular-nums shadow-sm">
                                        {log.quantity} <span className="text-[8px] font-bold opacity-70 italic">cope</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
