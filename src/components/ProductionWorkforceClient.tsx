'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, Trash2, X, Briefcase, FileBadge, UserPlus } from 'lucide-react';

import { getProductionWorkforce, syncProductionWorker, deleteProductionWorker, getProductionProcesses } from '@/app/actions/productionArticles';

interface GlobalProcess {
    id: string;
    name: string;
    requiresMachine: boolean;
    businessId?: string;
}

interface Employee {
    id: string;
    name: string;
    skills: string[];
    availableHours: number;
    businessId?: string;
}

interface BatchEmployeeRow {
    id: string;
    name: string;
    availableHours: string;
    selectedSkills: string[];
}

export default function ProductionWorkforceClient({ 
    businessId,
    initialEmployees = [] 
}: { 
    businessId?: string,
    initialEmployees?: Employee[]
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [processes, setProcesses] = useState<GlobalProcess[]>([]);

    useEffect(() => {
        const loadInitial = async () => {
            const procs = await getProductionProcesses(businessId);
            setProcesses(procs as any);
            
            if (!initialEmployees.length) {
                const fetched = await getProductionWorkforce(businessId);
                setEmployees(fetched as any);
            }
            setIsLoaded(true);
        };
        loadInitial();
    }, [businessId, initialEmployees]);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    /* ---- Search & Filter ---- */
    const [searchQuery, setSearchQuery] = useState('');

    /* ---- Batch Dialog State ---- */
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [batchRows, setBatchRows] = useState<BatchEmployeeRow[]>([]);

    const openDialog = () => {
        setBatchRows([{
            id: generateId(),
            name: '',
            availableHours: '8',
            selectedSkills: []
        }]);
        setIsDialogOpen(true);
    };

    const handleAddRow = () => {
        setBatchRows([...batchRows, {
            id: generateId(), name: '', availableHours: '8', selectedSkills: []
        }]);
    };

    const updateRowField = (id: string, field: keyof BatchEmployeeRow, value: any) => {
        setBatchRows(batchRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const toggleSkillInRow = (rowId: string, skillName: string) => {
        const row = batchRows.find(r => r.id === rowId);
        if (!row) return;
        
        const newSkills = row.selectedSkills.includes(skillName)
            ? row.selectedSkills.filter(s => s !== skillName)
            : [...row.selectedSkills, skillName];
        
        updateRowField(rowId, 'selectedSkills', newSkills);
    };

    const removeRow = (id: string) => {
        setBatchRows(batchRows.filter(r => r.id !== id));
    };

    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validRows = batchRows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) return alert('No valid staff entries found.');

        for (const row of validRows) {
            await syncProductionWorker({
                name: row.name,
                availableHours: Number(row.availableHours) || 8,
                skills: row.selectedSkills,
                businessId
            });
        }

        const refreshed = await getProductionWorkforce(businessId);
        setEmployees(refreshed as any);
        setIsDialogOpen(false);
    };

    const handleDeleteEmployee = async (id: string) => {
        if(confirm('Delete this employee? They will be removed from future simulations.')) {
            const result = await deleteProductionWorker(id);
            if (result.error) {
                alert(result.error);
            } else {
                const refreshed = await getProductionWorkforce(businessId);
                setEmployees(refreshed as any);
            }
        }
    };

    const filteredEmployees = employees.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isLoaded) return <div className="p-8 text-center text-slate-500">Loading Workforce Data...</div>;

    return (
        <div className="space-y-6 fade-in h-full flex flex-col pb-20 relative">
            
            {/* Header & Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Production Workforce</h1>
                        <p className="text-sm text-slate-400 font-medium">Manage Factory Staff, Shift Hours, and Multi-Skill Matrix</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search staff or skills..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-indigo-500 text-sm font-semibold w-64 shadow-sm"
                        />
                    </div>

                    <button onClick={openDialog} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm shadow-indigo-200 transition">
                        <Plus size={16} /> Batch Insert Staff
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black tracking-widest text-slate-500 sticky top-0">
                                <th className="px-6 py-4">Employee Identity</th>
                                <th className="px-6 py-4">Shift Allocation</th>
                                <th className="px-6 py-4">Skill Matrix</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <Briefcase size={32} className="mx-auto mb-3 text-slate-300" />
                                        <p className="font-bold text-lg">Workforce Data Empty</p>
                                        <p className="text-xs mt-1">Populate your factory staffing layout to begin simulations.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={`${emp.id}-${emp.businessId || 'root'}`} className="hover:bg-slate-50/50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs border border-indigo-200">{emp.name[0]}</div>
                                                <span className="font-bold text-slate-900">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-black text-lg text-slate-700">{emp.availableHours}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hours / Day</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {emp.skills.length > 0 ? emp.skills.map((skill, i) => (
                                                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 flex items-center gap-1">
                                                        <FileBadge size={10} /> {skill}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400 italic">Unskilled Personnel</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDeleteEmployee(emp.id)} className="text-slate-400 hover:text-rose-500 transition p-1.5 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100">
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

            {/* ---- Batch Insert Dialog Modal ---- */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <UserPlus size={22} className="text-indigo-600" /> Mass Staffing Importer
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Rapid Personnel Creation and Skill Mapping</p>
                            </div>
                            <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-6">
                            <form id="batch-staff-form" onSubmit={handleSaveBatch} className="space-y-4">
                                {batchRows.map((row, index) => (
                                    <div key={row.id} className="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 space-y-4">
                                        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs shrink-0">{index + 1}</div>
                                            
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                                                <input 
                                                    required value={row.name} onChange={e => updateRowField(row.id, 'name', e.target.value)} 
                                                    placeholder="e.g. Michael Chen" 
                                                    className="w-full text-sm font-bold px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-indigo-500 bg-white" 
                                                />
                                            </div>
                                            
                                            <div className="w-32 shrink-0">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Daily Cap (h)</label>
                                                <input 
                                                    type="number" step="any" min="0" required
                                                    value={row.availableHours} onChange={e => updateRowField(row.id, 'availableHours', e.target.value)} 
                                                    className="w-full text-sm font-bold px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-indigo-500 bg-white text-center" 
                                                />
                                            </div>

                                            <button type="button" onClick={() => removeRow(row.id)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-100">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>

                                        <div className="pl-12">
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5"><FileBadge size={12}/> Skillset Assignments</label>
                                                <span className="text-[10px] text-slate-400 font-bold">{row.selectedSkills.length} Selected</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                                                {processes.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic">No global processes found. Define them in Machinery & Processes first.</p>
                                                ) : (
                                                    processes.map(proc => {
                                                        const isSel = row.selectedSkills.includes(proc.name);
                                                        return (
                                                            <button 
                                                                type="button" key={proc.id}
                                                                onClick={() => toggleSkillInRow(row.id, proc.name)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                                                                    isSel 
                                                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-105' 
                                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                                                }`}
                                                            >
                                                                {isSel && <Plus size={12} className="rotate-45" />} {proc.name}
                                                            </button>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button type="button" onClick={handleAddRow} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-black text-slate-400 hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-300 transition uppercase tracking-widest">
                                    + Recruit Another Production Worker
                                </button>
                            </form>
                        </div>
                        
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-slate-400" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">Queue Size: {batchRows.length} Personnel</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDialogOpen(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-200 transition">Discard Layout</button>
                                <button type="submit" form="batch-staff-form" className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-200 transition transform active:scale-95">Commit Batch to Registry</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
