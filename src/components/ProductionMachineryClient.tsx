'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Cpu, Trash2, X, Settings2, Hammer, Activity, Wrench, Factory, ListPlus } from 'lucide-react';

interface GlobalProcess {
    id: string;
    name: string;
    requiresMachine: boolean;
    businessId?: string;
}

import { getProductionMachinery, syncProductionMachine, deleteProductionMachine, getProductionProcesses, syncProductionProcess, deleteProductionProcess } from '@/app/actions/productionArticles';

interface GlobalProcess {
    id: string;
    name: string;
    requiresMachine: boolean;
    businessId?: string;
}

interface Machine {
    id: string;
    name: string;
    capableProcesses: string[];
    online: boolean;
    businessId?: string;
}

interface BatchMachineRow {
    id: string;
    name: string;
    selectedProcesses: string[];
}

export default function ProductionMachineryClient({ 
    businessId,
    initialMachines = [] 
}: { 
    businessId?: string,
    initialMachines?: Machine[]
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [machines, setMachines] = useState<Machine[]>(initialMachines);
    const [processes, setProcesses] = useState<GlobalProcess[]>([]);

    useEffect(() => {
        const loadInitial = async () => {
            const procs = await getProductionProcesses(businessId);
            setProcesses(procs as any);
            
            if (!initialMachines.length) {
                const fetched = await getProductionMachinery(businessId);
                setMachines(fetched as any);
            }
            setIsLoaded(true);
        };
        loadInitial();
    }, [businessId, initialMachines]);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    /* ---- Search & Filter ---- */
    const [searchQuery, setSearchQuery] = useState('');

    /* ---- Process Management ---- */
    const [tmpProcName, setTmpProcName] = useState('');
    const [tmpProcMac, setTmpProcMac] = useState(true);

    const handleAddProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tmpProcName.trim()) return;
        if (processes.some(p => p.name.toLowerCase() === tmpProcName.toLowerCase())) {
            return alert('Process already exists in Master Dictionary');
        }
        
        const result = await syncProductionProcess({ 
            name: tmpProcName.trim(), 
            requiresMachine: tmpProcMac,
            businessId 
        });
        
        if (result.error) {
            alert(result.error);
        } else {
            const procs = await getProductionProcesses(businessId);
            setProcesses(procs as any);
            setTmpProcName('');
        }
    };

    const handleDeleteProcess = async (id: string) => {
        if(confirm('Delete this process from the global dictionary? Machine mappings will be lost.')) {
            const result = await deleteProductionProcess(id);
            if (result.error) {
                alert(result.error);
            } else {
                const procs = await getProductionProcesses(businessId);
                setProcesses(procs as any);
            }
        }
    };

    /* ---- Batch Machinery Dialog State ---- */
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [batchRows, setBatchRows] = useState<BatchMachineRow[]>([]);

    const openDialog = () => {
        setBatchRows([{ id: generateId(), name: '', selectedProcesses: [] }]);
        setIsDialogOpen(true);
    };

    const handleAddRow = () => {
        setBatchRows([...batchRows, { id: generateId(), name: '', selectedProcesses: [] }]);
    };

    const updateRowField = (id: string, field: keyof BatchMachineRow, value: any) => {
        setBatchRows(batchRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const toggleProcInRow = (rowId: string, procName: string) => {
        const row = batchRows.find(r => r.id === rowId);
        if (!row) return;
        const newProcs = row.selectedProcesses.includes(procName)
            ? row.selectedProcesses.filter(p => p !== procName)
            : [...row.selectedProcesses, procName];
        updateRowField(rowId, 'selectedProcesses', newProcs);
    };

    const removeRow = (id: string) => {
        setBatchRows(batchRows.filter(r => r.id !== id));
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const validRows = batchRows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) return alert('No valid machinery entries found.');

        for (const row of validRows) {
            await syncProductionMachine({
                name: row.name,
                capableProcesses: row.selectedProcesses,
                online: true,
                businessId
            });
        }

        const refreshed = await getProductionMachinery(businessId);
        setMachines(refreshed as any);
        setIsDialogOpen(false);
    };

    const handleDeleteMachine = async (id: string) => {
        if(confirm('Dismantle this machine from floor inventory?')) {
            const result = await deleteProductionMachine(id);
            if (result.error) {
                alert(result.error);
            } else {
                const refreshed = await getProductionMachinery(businessId);
                setMachines(refreshed as any);
            }
        }
    };

    const machineDependentProcs = processes.filter(p => p.requiresMachine);

    return (
        <div className="space-y-6 fade-in h-full flex flex-col pb-20 relative">
            
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Machinery Fleet & Processes</h1>
                        <p className="text-sm text-slate-400 font-medium">Configure Physical Assets and Mapping Global Capabilities</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search assets or processes..." 
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-orange-500 text-sm font-semibold w-64 shadow-sm"
                        />
                    </div>
                    <button onClick={openDialog} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-100 transition">
                        <Plus size={16} /> Batch Add Machinery
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
                
                {/* --- LEFT: Global Dictionary --- */}
                <div className="lg:col-span-4 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
                        <h3 className="text-slate-900 font-black text-sm flex items-center gap-2 tracking-tight"><Settings2 size={16} className="text-indigo-500"/> MASTER PROCESS LIST</h3>
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <form onSubmit={handleAddProcess} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                            <input value={tmpProcName} onChange={e=>setTmpProcName(e.target.value)} required placeholder="New Process Name" className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-indigo-500 font-bold text-xs" />
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={tmpProcMac} onChange={e=>setTmpProcMac(e.target.checked)} className="w-3.5 h-3.5 rounded text-indigo-600" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Machine Required</span>
                                </label>
                                <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md">Add</button>
                            </div>
                        </form>
                        
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                           {processes.map(p => (
                               <div key={`${p.id}-${p.businessId || 'root'}`} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-xl group hover:border-slate-300 transition shadow-sm">
                                   <div className="flex items-center gap-2.5">
                                       {p.requiresMachine ? <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Cpu size={12}/></div> : <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Hammer size={12}/></div>}
                                       <span className="text-xs font-bold text-slate-800">{p.name}</span>
                                   </div>
                                   <button onClick={()=>handleDeleteProcess(p.id)} className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: Machinery Fleet Table --- */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black tracking-widest text-slate-500">
                                    <th className="px-6 py-4">Machine Asset</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Loaded Capabilities</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {machines.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                                            <Factory size={48} className="mx-auto mb-4 text-slate-200" />
                                            <p className="font-bold text-lg">No physical machinery registered</p>
                                            <p className="text-xs">Mount massive assets to automate your production line.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    machines.map(m => (
                                        <tr key={`${m.id}-${m.businessId || 'root'}`} className="hover:bg-slate-50 group transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl flex items-center justify-center"><Cpu size={18}/></div>
                                                    <span className="font-black text-slate-900 uppercase tracking-tight">{m.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                               <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black tracking-widest uppercase border border-emerald-100 inline-flex items-center gap-1"><Activity size={10}/> Online</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.capableProcesses.map(p => (
                                                        <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200 uppercase tracking-tighter">{p}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteMachine(m.id)} className="text-slate-300 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition rounded-lg hover:bg-rose-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ---- Batch Insert Machinery Modal ---- */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                    <ListPlus size={24} className="text-orange-600" /> Massive Asset Procurement
                                </h2>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Register Fleet and slot Process Capabilities</p>
                            </div>
                            <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-8">
                           {batchRows.map((row, index) => (
                               <div key={row.id} className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 relative group border-l-4 border-l-orange-500">
                                   <button onClick={()=>removeRow(row.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition"><Trash2 size={18}/></button>
                                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                       <div className="lg:col-span-4">
                                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Identity (Row {index + 1})</label>
                                           <input 
                                                required value={row.name} onChange={e => updateRowField(row.id, 'name', e.target.value)} 
                                                placeholder="e.g. Hydraulic Press 50T" 
                                                className="w-full text-base font-black px-4 py-3 border border-slate-300 rounded-2xl focus:outline-orange-500 bg-white shadow-sm"
                                           />
                                       </div>
                                       <div className="lg:col-span-8">
                                           <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Wrench size={12}/> Load Capability Modules</label>
                                           <div className="flex flex-wrap gap-2 p-4 bg-white border border-slate-200 rounded-2xl min-h-[100px]">
                                                {machineDependentProcs.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic">No machine-dependent processes available. Define them in the Master List first.</p>
                                                ) : machineDependentProcs.map(proc => {
                                                    const isSel = row.selectedProcesses.includes(proc.name);
                                                    return (
                                                        <button 
                                                            type="button" key={proc.id} onClick={() => toggleProcInRow(row.id, proc.name)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-black transition border-2 ${
                                                                isSel 
                                                                ? 'bg-orange-600 text-white border-orange-700 shadow-xl transform -translate-y-0.5' 
                                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                                                            }`}
                                                        >
                                                            {proc.name} {isSel && '✓'}
                                                        </button>
                                                    )
                                                })}
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           ))}
                           <button onClick={handleAddRow} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl text-sm font-black text-slate-400 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition uppercase tracking-widest">+ Mount Additional Fleet Asset</button>
                        </div>
                        
                        <div className="px-10 py-6 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Procurement Queue: {batchRows.length} Assets</span>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDialogOpen(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition">Halt Procurement</button>
                                <button onClick={handleSaveBatch} className="px-10 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-sm shadow-2xl shadow-orange-200 transition active:scale-95">Commit Assets to Factory Floor</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
