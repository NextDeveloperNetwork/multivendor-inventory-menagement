'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, Trash2, X, Briefcase, FileBadge, UserPlus, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

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
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadInitial = async () => {
             try {
                const procs = await getProductionProcesses(businessId);
                setProcesses(procs as any);
                
                if (!initialEmployees.length) {
                    const fetched = await getProductionWorkforce(businessId);
                    setEmployees(fetched as any);
                }
            } catch (err) {
                console.error("Failed to load workforce:", err);
            } finally {
                setIsLoaded(true);
            }
        };
        loadInitial();
    }, [businessId, initialEmployees]);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    /* ---- Dialog State ---- */
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [batchRows, setBatchRows] = useState<BatchEmployeeRow[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

    const openDialog = () => {
        setBatchRows([{
            id: generateId(),
            name: '',
            availableHours: '8',
            selectedSkills: []
        }]);
        setSelectedRowIds(new Set());
        setIsEditing(false);
        setIsDialogOpen(true);
    };

    const handleEditEmployee = (emp: Employee) => {
        setBatchRows([{
            id: emp.id,
            name: emp.name,
            availableHours: String(emp.availableHours),
            selectedSkills: emp.skills
        }]);
        setSelectedRowIds(new Set([emp.id]));
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleAddRow = () => {
        const newId = generateId();
        setBatchRows([...batchRows, {
            id: newId, name: '', availableHours: '8', selectedSkills: []
        }]);
    };

    const updateRowField = (id: string, field: keyof BatchEmployeeRow, value: any) => {
        setBatchRows(batchRows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const toggleSkillInRow = (rowId: string, skillName: string) => {
        setBatchRows(batchRows.map(r => {
            if (r.id !== rowId) return r;
            const alreadyHas = r.selectedSkills.includes(skillName);
            return {
                ...r,
                selectedSkills: alreadyHas 
                    ? r.selectedSkills.filter(s => s !== skillName)
                    : [...r.selectedSkills, skillName]
            };
        }));
    };

    const removeRow = (id: string) => {
        setBatchRows(batchRows.filter(r => r.id !== id));
        const nextSelected = new Set(selectedRowIds);
        nextSelected.delete(id);
        setSelectedRowIds(nextSelected);
    };

    /* ---- Selection Logic ---- */
    const toggleRowSelection = (id: string) => {
        const next = new Set(selectedRowIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedRowIds(next);
    };
    
    const toggleAllSelection = () => {
        if (selectedRowIds.size === batchRows.length) setSelectedRowIds(new Set());
        else setSelectedRowIds(new Set(batchRows.map(r => r.id)));
    };

    const applySkillToSelected = (skillName: string) => {
        if (selectedRowIds.size === 0) {
            toast.info('Select at least one worker to apply skills bulk.');
            return;
        }
        setBatchRows(batchRows.map(row => {
            if (!selectedRowIds.has(row.id)) return row;
            const alreadyHas = row.selectedSkills.includes(skillName);
            return {
                ...row,
                selectedSkills: alreadyHas 
                    ? row.selectedSkills.filter(s => s !== skillName)
                    : [...row.selectedSkills, skillName]
            };
        }));
    };

    /* ---- Data Actions ---- */
    const handleSaveBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const validRows = batchRows.filter(r => r.name.trim() !== '');
        if (validRows.length === 0) return toast.error('No valid staff entries found.');

        try {
            for (const row of validRows) {
                await syncProductionWorker({
                    id: row.id.includes('.') || row.id.length < 10 ? undefined : row.id,
                    name: row.name,
                    availableHours: Number(row.availableHours) || 8,
                    skills: row.selectedSkills,
                    businessId
                });
            }

            const refreshed = await getProductionWorkforce(businessId);
            setEmployees(refreshed as any);
            setIsDialogOpen(false);
            toast.success(isEditing ? 'Worker updated.' : `Successfully registered ${validRows.length} workers.`);
        } catch (err) {
            toast.error('Failed to save. Please try again.');
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if(confirm('Delete this employee? They will be removed from future simulations.')) {
            const result = await deleteProductionWorker(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                const refreshed = await getProductionWorkforce(businessId);
                setEmployees(refreshed as any);
                toast.success('Worker removed from registry.');
            }
        }
    };

    /* ---- Excel Import/Export ---- */
    const handleDownloadTemplate = () => {
        const templateData = [
            { "Full Name": "John Doe", "Daily Cap (h)": 8, "Skills": "Cutting, Sewing" },
            { "Full Name": "Jane Smith", "Daily Cap (h)": 7.5, "Skills": "Quality Check" }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Workforce");
        XLSX.writeFile(workbook, "workforce_template.xlsx");
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawData = XLSX.utils.sheet_to_json(worksheet);

                const newRows = rawData.map((item: any) => {
                    const nameKey = Object.keys(item).find(k => k.toLowerCase().includes('name')) || 'Full Name';
                    const hoursKey = Object.keys(item).find(k => k.toLowerCase().includes('hour') || k.toLowerCase().includes('cap')) || 'Daily Cap (h)';
                    const skillKey = Object.keys(item).find(k => k.toLowerCase().includes('skill') || k.toLowerCase().includes('process')) || 'Skills';
                    
                    const rawSkills = String(item[skillKey] || '');
                    const skillList = rawSkills.split(/[;,|\n]+/).map(s => s.trim()).filter(Boolean);

                    return {
                        id: generateId(),
                        name: String(item[nameKey] || 'New Worker'),
                        availableHours: String(item[hoursKey] || '8'),
                        selectedSkills: skillList
                    };
                });

                setBatchRows([...batchRows, ...newRows]);
                toast.success(`Imported ${newRows.length} workers.`);
                e.target.value = '';
            } catch (err) {
                toast.error('Error parsing Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const filteredEmployees = employees.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    /* ---- Table Selection & Bulk Logic ---- */
    const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
    const toggleTableSelection = (id: string) => {
        const next = new Set(selectedTableIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedTableIds(next);
    };
    const toggleAllTableSelection = () => {
        if (selectedTableIds.size === filteredEmployees.length) setSelectedTableIds(new Set());
        else setSelectedTableIds(new Set(filteredEmployees.map(e => e.id)));
    };

    const handleBulkSkillUpdate = async (skillName: string) => {
        if (selectedTableIds.size === 0) {
            toast.info('Select workers in the table first to bulk-assign skills.');
            return;
        }

        try {
            const workersToUpdate = employees.filter(e => selectedTableIds.has(e.id));
            toast.promise(
                Promise.all(workersToUpdate.map(worker => {
                    const hasSkill = worker.skills.includes(skillName);
                    const newSkills = hasSkill 
                        ? worker.skills.filter(s => s !== skillName)
                        : [...worker.skills, skillName];
                    
                    return syncProductionWorker({
                        id: worker.id,
                        name: worker.name,
                        availableHours: worker.availableHours,
                        skills: newSkills,
                        businessId
                    });
                })),
                {
                    loading: `Mapping ${skillName} to ${selectedTableIds.size} personnel...`,
                    success: () => {
                        const refresh = async () => {
                            const res = await getProductionWorkforce(businessId);
                            setEmployees(res as any);
                        };
                        refresh();
                        return `Skill Matrix updated for ${selectedTableIds.size} workers.`;
                    },
                    error: 'Bulk update failed.'
                }
            );
        } catch (err) {
            toast.error('Failed to sync bulk changes.');
        }
    };

    if (!isLoaded) return <div className="p-8 text-center text-slate-500">Loading Workforce Data...</div>;

    return (
        <div className="space-y-6 fade-in h-min flex flex-col pb-20 relative px-4 sm:px-0">
            
            {/* Header & Global Skill Palette */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden shrink-0">
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workforce Command Center</h1>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time Personnel Mapping & Capability Matrix</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" placeholder="Search staff or skills..." 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-indigo-500 text-sm font-bold w-72 shadow-inner bg-slate-50/50"
                            />
                        </div>
                        <button onClick={openDialog} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100 transition active:scale-95">
                            <Plus size={18} /> Mass Staff Importer
                        </button>
                    </div>
                </div>

                {/* TABLE GLOBAL SKILL PALETTE */}
                <div className="px-6 py-5 bg-indigo-950 border-t border-indigo-800 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3 pr-6 border-r border-indigo-800">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                            <FileBadge size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Bulk Skill Palette</p>
                            <p className="text-xs text-white font-bold">Pick skill to toggle for selected rows</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {processes.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => handleBulkSkillUpdate(p.name)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black text-white transition flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg"
                            >
                                <Plus size={14} className="text-indigo-400" /> {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black tracking-widest text-slate-500">
                                <th className="px-6 py-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTableIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                                        onChange={toggleAllTableSelection}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-4">Employee Identity</th>
                                <th className="px-6 py-4">Shift Allocation</th>
                                <th className="px-6 py-4">Skill Matrix</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className={`hover:bg-slate-50/50 transition group ${selectedTableIds.has(emp.id) ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedTableIds.has(emp.id)}
                                            onChange={() => toggleTableSelection(emp.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs border border-indigo-200">{emp.name[0]}</div>
                                            <span className="font-bold text-slate-900">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-lg text-slate-700">{emp.availableHours}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">h/d</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {emp.skills.map((skill, i) => (
                                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 flex items-center gap-1">
                                                    <FileBadge size={10} /> {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => handleEditEmployee(emp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                <Plus size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Batch Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <UserPlus size={26} className="text-indigo-600" /> {isEditing ? 'Modify Personnel' : 'Bulk Staff Registration'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Assign roles and skills across your workforce</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {!isEditing && (
                                    <>
                                        <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition">
                                            <FileSpreadsheet size={16} className="text-emerald-600" /> Template
                                        </button>
                                        <label className="cursor-pointer px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-xs flex items-center gap-2 text-indigo-700 hover:bg-indigo-100 transition">
                                            <Upload size={16} /> Excel Import
                                            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" />
                                        </label>
                                    </>
                                )}
                                <button onClick={() => setIsDialogOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-full transition"><X size={24} /></button>
                            </div>
                        </div>

                        {/* MASTER SKILL PALETTE */}
                        {!isEditing && (
                            <div className="bg-indigo-900 p-6 text-white shrink-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><FileBadge size={20} className="text-indigo-300" /></div>
                                        <div>
                                            <h3 className="font-black text-sm uppercase tracking-wider">Quick Skill Assign</h3>
                                            <p className="text-[10px] text-indigo-300 font-bold">Apply a skill to all checked workers</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/20 rounded-xl">
                                        <input 
                                            type="checkbox" checked={selectedRowIds.size === batchRows.length && batchRows.length > 0} 
                                            onChange={toggleAllSelection} className="w-4 h-4 rounded" 
                                        />
                                        <span className="text-xs font-black uppercase">{selectedRowIds.size} Selected</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {processes.map(p => (
                                        <button key={p.id} onClick={() => applySkillToSelected(p.name)} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black transition flex items-center gap-2">
                                            <Plus size={14} className="text-indigo-300" /> {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 space-y-4">
                            <form id="workforce-form" onSubmit={handleSaveBatch} className="space-y-4 max-w-5xl mx-auto">
                                {batchRows.map((row, idx) => (
                                    <div key={row.id} className={`p-5 rounded-3xl border transition-all ${selectedRowIds.has(row.id) ? 'bg-white border-indigo-400 shadow-lg' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex items-center gap-5">
                                            {!isEditing && (
                                                <input 
                                                    type="checkbox" checked={selectedRowIds.has(row.id)} 
                                                    onChange={() => toggleRowSelection(row.id)} className="w-5 h-5 rounded border-slate-300" 
                                                />
                                            )}
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                                                <input 
                                                    required value={row.name} onChange={e => updateRowField(row.id, 'name', e.target.value)}
                                                    className="w-full text-lg font-black px-5 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:outline-indigo-500"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Hours / Day</label>
                                                <input 
                                                    type="number" required value={row.availableHours} onChange={e => updateRowField(row.id, 'availableHours', e.target.value)}
                                                    className="w-full text-lg font-black px-5 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 text-center"
                                                />
                                            </div>
                                            {!isEditing && (
                                                <button type="button" onClick={() => removeRow(row.id)} className="p-3 text-slate-300 hover:text-rose-500 transition"><Trash2 size={22} /></button>
                                            )}
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2"><FileBadge size={14}/> Skills Portfolio</label>
                                            <div className="flex flex-wrap gap-2">
                                                {processes.map(p => {
                                                    const isSel = row.selectedSkills.includes(p.name);
                                                    return (
                                                        <button 
                                                            key={p.id} type="button" onClick={() => toggleSkillInRow(row.id, p.name)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-black border transition ${isSel ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                                        >
                                                            {p.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!isEditing && (
                                    <button type="button" onClick={handleAddRow} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-3xl text-sm font-black text-slate-400 hover:bg-white hover:text-indigo-600 transition uppercase tracking-widest">
                                        + Add Another Worker
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="px-10 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <Users size={22} className="text-slate-400" />
                                <span className="text-sm font-black text-slate-500 uppercase">{isEditing ? 'Editing Profile' : `Queue Size: ${batchRows.length}`}</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDialogOpen(false)} className="px-8 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition">Cancel</button>
                                <button type="submit" form="workforce-form" className="px-12 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100">
                                    {isEditing ? 'Update Worker' : 'Save Batch'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
