'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, PackagePlus, Box, Factory, Trash2, X, AlertCircle, Wrench, Scale, ChevronDown, ChevronUp, Calendar, Hash, Edit2 } from 'lucide-react';

import { getProductionArticles, syncProductionArticle, deleteProductionArticle, getProductionProcesses } from '@/app/actions/productionArticles';

interface AccessoryUsage {
    id: string;
    accessoryId: string;
    usageQuantity: number;
    processName?: string;
}

interface ProcessRequirement {
    id: string;
    processName: string;
    unitsPerHour: number;
    sequence: number;
}

interface ProductionItem {
    id: string;
    name: string;
    sku: string;
    type: 'MAIN' | 'ACCESSORY';
    unit: string;
    stockQuantity: number;
    description?: string;
    entryDate?: Date | string;
    processes: ProcessRequirement[];
    bom: AccessoryUsage[];
    businessId?: string;
}

interface GlobalProcess {
    id: string;
    name: string;
    requiresMachine: boolean;
}

interface BatchRow {
    id: string;
    name: string;
    sku: string;
    type: 'MAIN' | 'ACCESSORY';
    description: string;
    quantity: string;
    unit: string;
    bom: AccessoryUsage[];
    processes: ProcessRequirement[];
    isExpanded: boolean;
}

export default function ProductionInventoryClient({ 
    businessId,
    initialItems = [] 
}: { 
    businessId?: string,
    initialItems?: ProductionItem[]
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState<ProductionItem[]>(initialItems);
    const [processes, setProcesses] = useState<GlobalProcess[]>([]);
    
    useEffect(() => {
        const loadInitial = async () => {
            const procs = await getProductionProcesses(businessId);
            setProcesses(procs as any);
            
            if (!initialItems.length) {
                const fetched = await getProductionArticles(businessId);
                setItems(fetched as any);
            }
            setIsLoaded(true);
        };
        loadInitial();
    }, [businessId, initialItems]);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    /* ---- Filters & Search ---- */
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'MAIN' | 'ACCESSORY'>('ALL');
    const [filterDate, setFilterDate] = useState('');

    /* ---- Batch Dialog State ---- */
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [batchRows, setBatchRows] = useState<BatchRow[]>([]);

    /* ---- Edit Dialog State ---- */
    const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);

    const openDialog = () => {
        setBatchDate(new Date().toISOString().split('T')[0]);
        setBatchRows([{
            id: generateId(),
            name: '',
            sku: '',
            type: 'ACCESSORY',
            description: '',
            quantity: '0',
            unit: 'pcs',
            bom: [],
            processes: [],
            isExpanded: false
        }]);
        setIsDialogOpen(true);
    };

    const handleAddRow = () => {
        setBatchRows([...batchRows, {
            id: generateId(), name: '', sku: '', description: '', type: 'ACCESSORY', quantity: '0', unit: 'pcs', bom: [], processes: [], isExpanded: false
        }]);
    };

    const updateRow = (id: string, field: keyof BatchRow, value: any) => {
        setBatchRows(batchRows.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            return updated;
        }));
    };

    const removeRow = (id: string) => {
        setBatchRows(batchRows.filter(r => r.id !== id));
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validRows = batchRows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) return alert('No valid items (missing names).');

        const newItems = [...items];
        let hasError = false;

        for (const row of validRows) {
            const itemToSync = {
                id: row.id.length < 10 ? undefined : row.id, // Only use if it's a real cuid
                name: row.name,
                sku: row.sku || '',
                description: row.description,
                type: row.type,
                unit: row.unit,
                stockQuantity: Number(row.quantity) || 0,
                entryDate: new Date(batchDate),
                bom: row.type === 'MAIN' ? row.bom : [],
                processes: row.type === 'MAIN' ? row.processes : [],
                businessId
            };

            const result = await syncProductionArticle(itemToSync as any);
            if (result.error) {
                alert(`Error saving ${row.name}: ${result.error}`);
                hasError = true;
            }
        }

        if (!hasError) {
            const refreshed = await getProductionArticles(businessId);
            setItems(refreshed as any);
            setIsDialogOpen(false);
        }
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        
        const result = await syncProductionArticle({ ...editingItem, businessId });
        if (result.error) {
            alert(`Update failed: ${result.error}`);
        } else {
            const refreshed = await getProductionArticles(businessId);
            setItems(refreshed as any);
            setEditingItem(null);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if(confirm('Delete this item? Dependencies in other BOMs might be affected.')) {
            const result = await deleteProductionArticle(id);
            if (result.error) {
                alert(result.error);
            } else {
                const refreshed = await getProductionArticles(businessId);
                setItems(refreshed as any);
            }
        }
    };

    /* ---- Derived Data ---- */
    const accessoriesList = items.filter(i => i.type === 'ACCESSORY');
    
    const filteredItems = items.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (i.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'ALL' || i.type === filterType;
        const matchesDate = !filterDate || i.entryDate === filterDate;
        return matchesSearch && matchesFilter && matchesDate;
    });

    if (!isLoaded) return <div className="p-8 text-center text-slate-500">Loading Production Inventory...</div>;

    return (
        <div className="space-y-6 fade-in h-full flex flex-col pb-20 relative">
            
            {/* Header & Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <PackagePlus size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Production Inventory</h1>
                        <p className="text-sm text-slate-400 font-medium">Manage Materials, Accessories, and Main Product Definitions</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search inventory..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-emerald-500 text-sm font-semibold w-64 shadow-sm"
                        />
                    </div>
                    
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="pl-8 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-emerald-500 text-sm font-semibold text-slate-700 bg-white shadow-sm appearance-none"
                        >
                            <option value="ALL">All Items</option>
                            <option value="MAIN">Main Products</option>
                            <option value="ACCESSORY">Accessories</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-emerald-500 text-sm font-semibold text-slate-700 bg-white shadow-sm"
                        />
                        {filterDate && (
                            <button onClick={() => setFilterDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500"><X size={12}/></button>
                        )}
                    </div>

                    <button onClick={openDialog} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm shadow-emerald-200 transition">
                        <Plus size={16} /> Batch Insert Items
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black tracking-widest text-slate-500 sticky top-0">
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-center">Ref/SKU</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-center">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <Box size={32} className="mx-auto mb-3 text-slate-300" />
                                        <p className="font-bold">No inventory items found</p>
                                        <p className="text-xs mt-1">Adjust your search filters or add a new material.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={`${item.id}-${item.businessId || 'root'}`} className="hover:bg-slate-50/50 transition group">
                                        <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4 text-slate-500 font-semibold text-[11px] italic max-w-[200px] truncate" title={item.description}>{item.description || '-'}</td>
                                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400 text-center">{item.sku || '-'}</td>
                                        <td className="px-6 py-4">
                                            {item.type === 'MAIN' ? (
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black tracking-wider uppercase border border-indigo-100 flex items-center gap-1 w-max"><Factory size={10}/> MAIN</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black tracking-wider uppercase border border-emerald-100 flex items-center gap-1 w-max"><Box size={10}/> ACC</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-black text-base">{item.stockQuantity}</span>
                                            <span className="text-[10px] font-bold text-slate-400 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-black text-slate-400 text-center tabular-nums whitespace-nowrap">
                                            {item.entryDate instanceof Date ? item.entryDate.toLocaleDateString() : (item.entryDate || '-')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.type === 'MAIN' ? (
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 tracking-wide">{item.bom.length} BOM</span>
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 tracking-wide">{item.processes.length} Processes</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingItem({ ...item })} className="text-slate-400 hover:text-indigo-600 transition p-1.5 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-rose-500 transition p-1.5 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ---- Batch Insert Dialog Modal ---- */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <PackagePlus size={18} className="text-emerald-600" /> Batch Insert Items
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Add multiple materials or products at once.</p>
                            </div>
                            <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                             <form id="batch-add-form" onSubmit={handleSaveBatch} className="space-y-4 shadow-inner p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><Calendar size={20}/></div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Registration Date</label>
                                        <input type="date" required value={batchDate} onChange={e=>setBatchDate(e.target.value)} className="w-48 bg-white px-4 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500 font-bold text-sm shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {batchRows.map((row, index) => (
                                        <div key={row.id} className={`border rounded-xl transition-all ${row.type === 'MAIN' ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                                            
                                            {/* Grid Row */}
                                            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 p-3">
                                                <div className="w-6 shrink-0 text-center font-black text-slate-300 text-xs">{index + 1}</div>
                                                
                                                <div className="w-64 shrink-0">
                                                    <input 
                                                        required value={row.name || ''} onChange={e => updateRow(row.id, 'name', e.target.value)} 
                                                        placeholder="Material / Product Name" 
                                                        className="w-full text-sm font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white" 
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-[200px]">
                                                    <input 
                                                        value={row.description || ''} onChange={e => updateRow(row.id, 'description', e.target.value)} 
                                                        placeholder="Add specifications / description..." 
                                                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-indigo-500 bg-white italic" 
                                                    />
                                                </div>

                                                <div className="w-32 shrink-0 relative">
                                                    <Hash size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        value={row.sku || ''} onChange={e => updateRow(row.id, 'sku', e.target.value)} 
                                                        placeholder="UNQ SKU" 
                                                        className="w-full text-[10px] font-black pl-6 pr-2 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white uppercase tracking-tighter" 
                                                    />
                                                </div>
                                                
                                                <div className="w-40 shrink-0">
                                                    <select 
                                                        value={row.type || 'ACCESSORY'} onChange={e => updateRow(row.id, 'type', e.target.value)} 
                                                        className="w-full text-sm font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white"
                                                    >
                                                        <option value="ACCESSORY">Accessory / Material</option>
                                                        <option value="MAIN">Main Part (Base)</option>
                                                    </select>
                                                </div>

                                                <div className="w-24 shrink-0">
                                                    <input 
                                                        type="number" step="any" min="0" required
                                                        value={row.quantity || '0'} onChange={e => updateRow(row.id, 'quantity', e.target.value)} 
                                                        placeholder="Qty" 
                                                        className="w-full text-sm font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white" 
                                                    />
                                                </div>

                                                <div className="w-24 shrink-0">
                                                    <input 
                                                        required value={row.unit || ''} onChange={e => updateRow(row.id, 'unit', e.target.value)} 
                                                        placeholder="Unit" 
                                                        className="w-full text-sm font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white" 
                                                    />
                                                </div>

                                                <div className="w-32 shrink-0">
                                                    {row.type === 'MAIN' ? (
                                                        <button 
                                                            type="button" onClick={() => updateRow(row.id, 'isExpanded', !row.isExpanded)} 
                                                            className={`w-full text-xs font-bold px-3 py-2 border rounded-lg flex items-center justify-between transition ${row.isExpanded ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
                                                        >
                                                            Configure Specs {row.isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                                        </button>
                                                    ) : (
                                                        <span className="block text-center text-xs text-slate-400 italic font-medium w-full">No specs needed</span>
                                                    )}
                                                </div>

                                                <button type="button" onClick={() => removeRow(row.id)} className="w-8 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded p-1 transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Sub-Panel for MAIN Product Configuration */}
                                            {row.type === 'MAIN' && row.isExpanded && (
                                                <div className="p-4 border-t border-indigo-100 bg-white m-2 rounded-xl shadow-sm">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        
                                                        {/* Specs: Processes */}
                                                        <div>
                                                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Wrench size={12}/> Required Processes</h5>
                                                            <div className="space-y-2 mb-3">
                                                                {row.processes.map(proc => (
                                                                    <div key={proc.id} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-500">{proc.sequence}</span>
                                                                            <span>{proc.processName}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{proc.unitsPerHour} u/h</span>
                                                                            <button type="button" onClick={() => updateRow(row.id, 'processes', row.processes.filter(p => p.id !== proc.id))} className="text-rose-400 hover:text-rose-600 focus:outline-none"><Trash2 size={12}/></button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {row.processes.length === 0 && <p className="text-[10px] text-slate-400 italic">No processes added</p>}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <select id={`procName-${row.id}`} className="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-indigo-500 font-semibold bg-slate-50">
                                                                    <option value="">Select Process...</option>
                                                                    {processes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                                </select>
                                                                <input id={`procSeq-${row.id}`} type="number" placeholder="Seq" defaultValue={row.processes.length + 1} className="w-12 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-indigo-500 font-bold text-center" />
                                                                <input id={`procUph-${row.id}`} type="number" step="any" placeholder="u/hr target" className="w-24 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-indigo-500" />
                                                                <button type="button" onClick={() => {
                                                                    const nameEl = document.getElementById(`procName-${row.id}`) as HTMLSelectElement;
                                                                    const seqEl = document.getElementById(`procSeq-${row.id}`) as HTMLInputElement;
                                                                    const uphEl = document.getElementById(`procUph-${row.id}`) as HTMLInputElement;
                                                                    if (nameEl.value && Number(uphEl.value)>0) {
                                                                        const newProc = { id: generateId(), processName: nameEl.value, unitsPerHour: Number(uphEl.value), sequence: Number(seqEl.value) || (row.processes.length + 1) };
                                                                        const updated = [...row.processes, newProc].sort((a,b) => a.sequence - b.sequence);
                                                                        updateRow(row.id, 'processes', updated);
                                                                        nameEl.value = ''; uphEl.value = ''; seqEl.value = (updated.length + 1).toString();
                                                                    }
                                                                }} className="px-3 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition">+</button>
                                                            </div>
                                                        </div>

                                                        {/* Specs: BOM */}
                                                        <div>
                                                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Scale size={12}/> Bill of Materials (Accessories)</h5>
                                                            <div className="space-y-2 mb-3">
                                                                {row.bom.map(bomItem => {
                                                                    const accRef = accessoriesList.find(a => a.id === bomItem.accessoryId);
                                                                    return (
                                                                        <div key={bomItem.id} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                                            <div className="flex flex-col">
                                                                                <span>{accRef?.name || 'Unknown'}</span>
                                                                                {bomItem.processName && <span className="text-[8px] text-indigo-500 font-bold uppercase italic">Used at: {bomItem.processName}</span>}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">× {bomItem.usageQuantity} {accRef?.unit}</span>
                                                                                <button type="button" onClick={() => updateRow(row.id, 'bom', row.bom.filter(p => p.id !== bomItem.id))} className="text-rose-400 hover:text-rose-600 focus:outline-none"><Trash2 size={12}/></button>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {row.bom.length === 0 && <p className="text-[10px] text-slate-400 italic">No accessories linked</p>}
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <select id={`bomAcc-${row.id}`} className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-emerald-500 font-semibold bg-slate-50">
                                                                    <option value="">Select established accessory...</option>
                                                                    {accessoriesList.map(a => <option key={a.id} value={a.id}>{a.name} ({a.stockQuantity} {a.unit})</option>)}
                                                                </select>
                                                                <div className="flex gap-2">
                                                                    <select id={`bomProc-${row.id}`} className="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-emerald-500 font-semibold bg-slate-50">
                                                                        <option value="">Start (Raw Material)</option>
                                                                        {row.processes.map(p => <option key={p.id} value={p.processName}>{p.processName}</option>)}
                                                                    </select>
                                                                    <input id={`bomQty-${row.id}`} type="number" step="any" placeholder="Usage Qty" className="w-20 text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-emerald-500 font-bold" />
                                                                    <button type="button" onClick={() => {
                                                                        const accEl = document.getElementById(`bomAcc-${row.id}`) as HTMLSelectElement;
                                                                        const qtyEl = document.getElementById(`bomQty-${row.id}`) as HTMLInputElement;
                                                                        const procEl = document.getElementById(`bomProc-${row.id}`) as HTMLSelectElement;
                                                                        if (accEl.value && Number(qtyEl.value)>0) {
                                                                            updateRow(row.id, 'bom', [...row.bom, { id: generateId(), accessoryId: accEl.value, usageQuantity: Number(qtyEl.value), processName: procEl.value || undefined }]);
                                                                            accEl.value = ''; qtyEl.value = ''; procEl.value = '';
                                                                        }
                                                                    }} className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-bold hover:bg-black transition">Add</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button type="button" onClick={handleAddRow} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition">
                                    + Add Another Row
                                </button>
                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{batchRows.length} Items in Batch</span>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDialogOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" form="batch-add-form" className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition">Commit Batch to Inventory</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ---- Edit Item Dialog Modal ---- */}
            {editingItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                    <Edit2 size={18} className="text-indigo-600" /> Edit Entry: {editingItem.name}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Adjust Master Definitions and Reference Units</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-8">
                             <form id="edit-item-form" onSubmit={handleUpdateItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Universal Item Name</label>
                                     <input 
                                         required value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                                         className="w-full text-sm font-bold px-4 py-3 border border-slate-300 rounded-2xl focus:outline-indigo-500 bg-white" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference SKU / Unique Number</label>
                                     <div className="relative">
                                         <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                         <input 
                                             value={editingItem.sku || ''} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} 
                                             className="w-full text-sm font-black pl-10 pr-4 py-3 border border-slate-300 rounded-2xl focus:outline-indigo-500 bg-white uppercase tracking-tight" 
                                         />
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stock Quantity (Current)</label>
                                     <input 
                                         type="number" step="any" required
                                         value={editingItem.stockQuantity || 0} onChange={e => setEditingItem({...editingItem, stockQuantity: Number(e.target.value)})} 
                                         className="w-full text-base font-black px-4 py-3 border border-slate-300 rounded-2xl focus:outline-emerald-500 bg-emerald-50/30 text-emerald-700" 
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Measurement Unit</label>
                                     <input 
                                         required value={editingItem.unit || ''} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} 
                                         className="w-full text-sm font-bold px-4 py-3 border border-slate-300 rounded-2xl focus:outline-indigo-500 bg-white shadow-sm" 
                                     />
                                 </div>
                                 <div className="md:col-span-2">
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Article Description / Specifications</label>
                                     <textarea 
                                         value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                                         className="w-full text-sm font-bold px-4 py-3 border border-slate-300 rounded-2xl focus:outline-indigo-500 bg-white shadow-sm min-h-[80px]" 
                                         placeholder="Enter additional details or quality specs..."
                                     />
                                 </div>
                             </form>

                             {editingItem.type === 'MAIN' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                                     {/* Edit Processes */}
                                     <div>
                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Wrench size={12}/> ASSEMBLY PROCESS MAP</h5>
                                        <div className="space-y-2 mb-4">
                                            {editingItem.processes.map(proc => (
                                                <div key={proc.id} className="flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-500">{proc.sequence}</span>
                                                        <span>{proc.processName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{proc.unitsPerHour} u/h</span>
                                                        <button onClick={() => setEditingItem({...editingItem, processes: editingItem.processes.filter(p => p.id !== proc.id)})} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                                            <select id="editProcName" className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-indigo-500 font-bold">
                                                <option value="">Select...</option>
                                                {processes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                            </select>
                                            <input id="editProcSeq" type="number" placeholder="Seq" defaultValue={editingItem.processes.length + 1} className="w-12 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-indigo-500 font-bold" />
                                            <input id="editProcUph" type="number" placeholder="u/h" className="w-20 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-indigo-500 font-bold" />
                                            <button onClick={() => {
                                                const n = document.getElementById('editProcName') as HTMLSelectElement;
                                                const s = document.getElementById('editProcSeq') as HTMLInputElement;
                                                const u = document.getElementById('editProcUph') as HTMLInputElement;
                                                if(n.value && u.value) {
                                                    const updated = [...editingItem.processes, {id: generateId(), processName: n.value, unitsPerHour: Number(u.value), sequence: Number(s.value) || (editingItem.processes.length + 1)}].sort((a,b) => a.sequence - b.sequence);
                                                    setEditingItem({...editingItem, processes: updated});
                                                    n.value = ''; u.value = ''; s.value = (updated.length + 1).toString();
                                                }
                                            }} className="px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">+</button>
                                        </div>
                                     </div>

                                     {/* Edit BOM */}
                                     <div>
                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Scale size={12}/> BILL OF MATERIALS</h5>
                                        <div className="space-y-2 mb-4">
                                            {editingItem.bom.map(bomItem => {
                                                const acc = accessoriesList.find(a => a.id === bomItem.accessoryId);
                                                return (
                                                    <div key={bomItem.id} className="flex justify-between items-center text-xs font-bold text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                                                        <div className="flex flex-col">
                                                            <span>{acc?.name || 'Unknown'}</span>
                                                            {bomItem.processName && <span className="text-[8px] text-indigo-500 font-bold uppercase italic">Linked to: {bomItem.processName}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100">× {bomItem.usageQuantity} {acc?.unit}</span>
                                                            <button onClick={() => setEditingItem({...editingItem, bom: editingItem.bom.filter(b => b.id !== bomItem.id)})} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                                            <select id="editBomAcc" className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500 font-bold">
                                                <option value="">Link Accessory...</option>
                                                {accessoriesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                            <div className="flex gap-2">
                                                <select id="editBomProc" className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-indigo-500 font-bold">
                                                    <option value="">Start (Raw Mat)</option>
                                                    {editingItem.processes.map(p => <option key={p.id} value={p.processName}>{p.processName}</option>)}
                                                </select>
                                                <input id="editBomQty" type="number" placeholder="Qty" className="w-16 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500 font-bold text-center" />
                                                <button onClick={() => {
                                                    const a = document.getElementById('editBomAcc') as HTMLSelectElement;
                                                    const q = document.getElementById('editBomQty') as HTMLInputElement;
                                                    const p = document.getElementById('editBomProc') as HTMLSelectElement;
                                                    if(a.value && q.value) {
                                                        setEditingItem({...editingItem, bom: [...editingItem.bom, {id: generateId(), accessoryId: a.value, usageQuantity: Number(q.value), processName: p.value || undefined}]});
                                                        a.value = ''; q.value = ''; p.value = '';
                                                    }
                                                }} className="px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg shadow-slate-100">Add</button>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                             )}
                        </div>
                        
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-4">
                            <button onClick={() => setEditingItem(null)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition">Discard Changes</button>
                            <button type="submit" form="edit-item-form" className="px-12 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-200 transition active:scale-95">Update Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

