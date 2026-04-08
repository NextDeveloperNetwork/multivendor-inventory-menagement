'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Box, RotateCcw, X, Hash, Trash2, Save, Layers, Upload, FileText, Info, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { bulkSyncProductionArticles, getProductionArticles, deleteProductionArticle as dbDeleteArticle, syncProductionArticle } from '@/app/actions/productionArticles';

interface ProductionItem {
    id: string;
    name: string;
    sku: string;
    type: 'MAIN' | 'ACCESSORY';
    unit: string;
    stockQuantity: number;
    totalYield?: number;
    description?: string;
    entryDate?: string;
    invoiceNo?: string;
    supplierName?: string;
    businessId?: string;
}

export default function ProductionManagerInventoryClient({ 
    businessId,
    initialItems = []
}: { 
    businessId?: string,
    initialItems?: ProductionItem[]
}) {

    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState<ProductionItem[]>(initialItems);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filters and Pagination
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WIP' | 'DEPLETED'>('ALL');
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Batch rows state
    const [batchRows, setBatchRows] = useState<{id: string, name: string, sku: string, description: string, qty: string, unit: string, invoiceNo: string, supplierName: string}[]>([]);

    useEffect(() => {
        const loadCatalog = async () => {
            if (initialItems.length > 0) {
                setIsLoaded(true);
                return;
            }
            try {
                const dbArticles = await getProductionArticles(businessId);
                if (dbArticles) {
                    const formatted = dbArticles.map((a: any) => ({
                        ...a,
                        entryDate: a.entryDate ? new Date(a.entryDate).toISOString().split('T')[0] : ''
                    }));
                    setItems(formatted);
                }
            } catch (err) {
                toast.error("Cloud Database unreachable at the moment.");
            }
            setIsLoaded(true);
        };

        loadCatalog();
    }, [businessId, initialItems]);

    const generateId = () => `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const openBatchModal = () => {
        setBatchRows([{ id: generateId(), name: '', sku: '', description: '', qty: '0', unit: 'pcs', invoiceNo: '', supplierName: '' }]);
        setIsBatchModalOpen(true);
    };

    const addBatchRow = () => {
        setBatchRows([...batchRows, { id: generateId(), name: '', sku: '', description: '', qty: '0', unit: 'pcs', invoiceNo: '', supplierName: '' }]);
    };

    const updateBatchRow = (id: string, field: string, value: string) => {
        setBatchRows(batchRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const validRows = batchRows.filter(r => r.name.trim() !== '');
        
        const newItems: ProductionItem[] = validRows.map(row => ({
            id: row.id,
            name: row.name,
            sku: row.sku,
            description: row.description,
            stockQuantity: Number(row.qty) || 0,
            unit: row.unit,
            entryDate: regDate,
            invoiceNo: row.invoiceNo,
            supplierName: row.supplierName,
            type: 'MAIN'
        }));

        try {
            console.log("Committing batch to cloud:", newItems.length, "items");
            const res = await bulkSyncProductionArticles(newItems, businessId);
            
            if (res.error) {
                toast.error(`Sync Error: ${res.error}`);
                console.error("Cloud Sync Error:", res.error);
                return;
            }

            // Reload from DB to confirm persistence
            const freshData = await getProductionArticles(businessId);
            const formatted = (freshData || []).map((a: any) => ({
                ...a,
                entryDate: a.entryDate ? new Date(a.entryDate).toISOString().split('T')[0] : ''
            }));
            setItems(formatted);
            
            setIsBatchModalOpen(false);
            toast.success(`Successfully committed ${newItems.length} articles to database`);
        } catch (err: any) {
            console.error("Batch Register Exception:", err);
            toast.error(`Fatal Error: ${err.message || 'Check connection'}`);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split('\n');
            const newRows = lines.slice(1) // Skip header
                .filter(line => line.trim() !== '')
                .map(line => {
                    const cols = line.includes('\t') ? line.split('\t') : line.split(',');
                    return {
                        id: generateId(),
                        name: cols[0]?.trim() || '',
                        sku: cols[1]?.trim() || '',
                        description: cols[2]?.trim() || '',
                        qty: cols[3]?.trim() || '0',
                        unit: cols[4]?.trim() || 'pcs',
                        invoiceNo: cols[5]?.trim() || '',
                        supplierName: cols[6]?.trim() || ''
                    };
                });
            
            if (newRows.length > 0) {
                setBatchRows([...batchRows.filter(r => r.name !== ''), ...newRows]);
                toast.success(`Imported ${newRows.length} rows from file`);
            }
        };
        reader.readAsText(file);
    };

    const downloadSampleCSV = () => {
        const headers = "Name,SKU,Description,Initial Qty,Unit,Invoice No,Supplier Name\n";
        const sampleRow = "EXAMPLE CHAIR,SKU-001,Premium Wood Finish,10,pcs,INV-2024-001,GLOBAL LUMBER LTD\n";
        const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'article_import_sample.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleAdjustment = async (id: string, amount: number) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                return { ...item, stockQuantity: Math.max(0, item.stockQuantity + amount) };
            }
            return item;
        });
        
        setItems(newItems);
        try {
            const itemToSync = newItems.find(i => i.id === id);
            if (itemToSync) await syncProductionArticle({ ...itemToSync, businessId });
        } catch (err) {
            toast.error("Sync failed.");
        }
    };

    const deleteItem = async (id: string) => {
        if (window.confirm('ARE YOU SURE YOU WANT TO DELETE THIS ARTICLE? THIS ACTION CANNOT BE UNDONE.')) {
            const updated = items.filter(i => i.id !== id);
            setItems(updated);
            
            try {
                await dbDeleteArticle(id);
                toast.success('Article removed from database');
            } catch (err) {
                toast.error("Database deletion failed.");
            }
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const dateStr = item.entryDate || '';
        const matchesStartDate = !filterStartDate || dateStr >= filterStartDate;
        const matchesEndDate = !filterEndDate || dateStr <= filterEndDate;
        
        const isDepleted = (item.stockQuantity - (item.totalYield || 0)) <= 0;
        const isWIP = (item.totalYield || 0) > 0 && !isDepleted;
        const matchesStatus = statusFilter === 'ALL' || 
            (statusFilter === 'ACTIVE' && !isDepleted && !isWIP) || 
            (statusFilter === 'WIP' && isWIP) || 
            (statusFilter === 'DEPLETED' && isDepleted);

        return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus;
    });

    const totalPages = Math.ceil(filteredItems.length / pageSize);
    const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (!isLoaded) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Initializing Hub...</div>;

    return (
        <div className="space-y-6 fade-in h-full flex flex-col pb-20">
            {/* Header Controls */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row gap-6 flex-1 max-w-2xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="SEARCH CATALOG (NAME, SKU, INV, SUP)..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900 focus:bg-white focus:border-slate-900 transition-all uppercase tracking-widest"
                        />
                    </div>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                        <Calendar size={14} className="text-slate-400 ml-2" />
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-[10px] font-black w-28 uppercase" placeholder="START" />
                        <span className="text-slate-300 text-[10px] font-black">TO</span>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-[10px] font-black w-28 uppercase" placeholder="END" />
                        {(filterStartDate || filterEndDate) && <button onClick={() => {setFilterStartDate(''); setFilterEndDate('');}} className="p-1 hover:bg-slate-200 rounded-full text-slate-400"><X size={12}/></button>}
                    </div>

                    <select value={statusFilter} onChange={e => {setStatusFilter(e.target.value as any); setCurrentPage(1);}} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] text-slate-900 focus:bg-white appearance-none uppercase tracking-widest min-w-[120px]">
                        <option value="ALL">ALL STATUS</option>
                        <option value="ACTIVE">READY / STOCK</option>
                        <option value="WIP">WORK IN PROGRESS</option>
                        <option value="DEPLETED">DEPLETED / CLOSED</option>
                    </select>

                    <select value={pageSize} onChange={e => {setPageSize(Number(e.target.value)); setCurrentPage(1);}} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] text-slate-900 focus:bg-white appearance-none uppercase tracking-widest">
                        <option value={20}>20 PER PAGE</option>
                        <option value={100}>100 PER PAGE</option>
                        <option value={1000}>1000 PER PAGE</option>
                    </select>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <button 
                        onClick={openBatchModal}
                        className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center gap-3"
                    >
                        <Layers size={18} /> Batch Register
                    </button>
                    <button onClick={() => window.location.reload()} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-200 rounded-2xl transition-all shadow-sm">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Inventory List View */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 backdrop-blur-md text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="px-8 py-5 text-left">Article</th>
                                <th className="px-8 py-5 text-left">Status</th>
                                <th className="px-8 py-5 text-left">Description</th>
                                <th className="px-6 py-5 text-center">Ref/SKU</th>
                                <th className="px-6 py-5 text-center">Invoice/Supplier</th>
                                <th className="px-6 py-5 text-left">Stock</th>
                                <th className="px-6 py-5 text-center">Date</th>
                                <th className="px-6 py-5 text-center">Adjust</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {(() => {
                                            const netStock = item.stockQuantity - (item.totalYield || 0);
                                            if (netStock <= 0) {
                                                return (
                                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> CLOSED
                                                    </span>
                                                );
                                            }
                                            if ((item.totalYield || 0) > 0) {
                                                return (
                                                    <span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> IN PRODUCTION (WIP)
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> READY
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic truncate max-w-[250px]" title={item.description}>{item.description || '-'}</span>
                                    </td>
                                    <td className="px-6 py-6 text-center font-mono text-[10px] text-indigo-600 font-black tracking-widest whitespace-nowrap">
                                        {item.sku || '-'}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col items-center gap-1">
                                            {item.invoiceNo ? (
                                                <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-tight">#{item.invoiceNo}</span>
                                            ) : (
                                                <span className="text-[9px] text-slate-300 italic">No Invoice</span>
                                            )}
                                            {item.supplierName && (
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px]">{item.supplierName}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">
                                                    {item.stockQuantity - (item.totalYield || 0)}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.unit}</span>
                                            </div>
                                            {(item.totalYield || 0) > 0 && (
                                                <div className="text-[9px] font-black text-indigo-400 uppercase tracking-tight">
                                                    Produced: {item.totalYield} {item.unit}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center font-black text-[10px] text-slate-400 tabular-nums">
                                        {item.entryDate || '-'}
                                    </td>
                                    <td className="px-6 py-6 border-l border-slate-50">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleAdjustment(item.id, -1)}
                                                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-100 hover:border-rose-100 shadow-sm"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleAdjustment(item.id, 1)}
                                                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all border border-slate-100 hover:border-emerald-100 shadow-sm"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <div className="w-px h-6 bg-slate-100 mx-1" />
                                            <button 
                                                onClick={() => deleteItem(item.id)}
                                                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-100 hover:border-rose-600 shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {(currentPage-1)*pageSize + 1} - {Math.min(currentPage*pageSize, filteredItems.length)} of {filteredItems.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
                                disabled={currentPage === 1}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 px-4">PAGE {currentPage} OF {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
                                disabled={currentPage === totalPages}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {filteredItems.length === 0 && (
                    <div className="py-32 text-center">
                        <Box size={48} className="text-slate-100 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-loose">No articles found in central catalog.<br/>Define articles in Admin Inventory or use Batch Register.</p>
                    </div>
                )}
            </div>

            {/* Batch Modal */}
            {isBatchModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-6xl border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rapid Article Registration</h2>
                                <div className="h-6 w-px bg-slate-200 mx-2" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-100 hover:border-emerald-100"
                                >
                                    <Upload size={14} /> Import CSV
                                </button>
                                <button 
                                    onClick={downloadSampleCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200"
                                >
                                    <FileText size={14} /> Sample Template
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept=".csv,.txt"
                                    className="hidden" 
                                />
                            </div>
                            <div className="flex items-center gap-4 mr-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date:</span>
                                <input 
                                    type="date"
                                    value={regDate}
                                    onChange={e => setRegDate(e.target.value)}
                                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white transition-all shadow-inner"
                                />
                            </div>
                            <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-800"><X size={24}/></button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
                                <span className="text-[10px] font-medium text-emerald-900 leading-relaxed uppercase tracking-wider">
                                    Download the template, fill it in Excel/Sheets, save as CSV, and import. Order: Name, SKU, Description, Qty, Unit, Invoice No, Supplier.
                                </span>
                            </div>

                            <form id="batch-manager-form" onSubmit={handleSaveBatch} className="space-y-4">
                                {batchRows.map((row, index) => (
                                    <div key={row.id} className="flex flex-wrap lg:flex-nowrap items-start gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-slate-400 transition-all group">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 mt-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">{index + 1}</div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Name</label>
                                                <input 
                                                    required 
                                                    placeholder="CHAIR B-12"
                                                    value={row.name} 
                                                    onChange={e => updateBatchRow(row.id, 'name', e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none uppercase transition-all" 
                                                />
                                            </div>
                                            
                                            <div className="space-y-1 col-span-1 md:col-span-2">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Description</label>
                                                <input 
                                                    placeholder="SPECIFICATIONS / NOTES..."
                                                    value={row.description} 
                                                    onChange={e => updateBatchRow(row.id, 'description', e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none uppercase transition-all italic" 
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SKU</label>
                                                <input 
                                                    placeholder="CODE"
                                                    value={row.sku} 
                                                    onChange={e => updateBatchRow(row.id, 'sku', e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-slate-900 outline-none uppercase transition-all text-center" 
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Initial Qty</label>
                                                <input 
                                                    type="number"
                                                    placeholder="0"
                                                    value={row.qty} 
                                                    onChange={e => updateBatchRow(row.id, 'qty', e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:bg-white focus:border-slate-900 outline-none tabular-nums text-center transition-all" 
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Invoice #</label>
                                                <input 
                                                    placeholder="INV-XXX"
                                                    value={row.invoiceNo} 
                                                    onChange={e => updateBatchRow(row.id, 'invoiceNo', e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black focus:bg-white focus:border-rose-400 outline-none uppercase transition-all text-center" 
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Supplier</label>
                                                <input 
                                                    placeholder="NAME"
                                                    value={row.supplierName} 
                                                    onChange={e => updateBatchRow(row.id, 'supplierName', e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold focus:bg-white focus:border-indigo-400 outline-none uppercase transition-all" 
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="button" 
                                            onClick={() => setBatchRows(batchRows.filter(r => r.id !== row.id))}
                                            className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-600 transition-colors shrink-0 mt-6"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}

                                <button 
                                    type="button" 
                                    onClick={addBatchRow}
                                    className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                                >
                                    + Add New Line Entry
                                </button>
                            </form>
                        </div>

                        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <button onClick={() => setIsBatchModalOpen(false)} className="px-8 py-3 rounded-2xl font-bold text-sm text-slate-400 hover:text-slate-800 transition uppercase tracking-widest">Discard Batch</button>
                            <button type="submit" form="batch-manager-form" className="px-16 py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-4 transition-all">
                                <Save size={20} /> Register Article Catalog
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
