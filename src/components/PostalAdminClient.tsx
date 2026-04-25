'use client';
// Refresh

import React, { useState } from 'react';
import { Send, Search, Trash2, Link as LinkIcon, UserPlus, Users, Package, Wallet, Landmark, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createPostalUser, deletePostalUser, appendPostalRelation, removePostalRelation, approvePostalManager, updatePostalManagerFees } from '@/app/actions/postalAdminOps';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface PostalAdminClientProps {
    initialManagers: any[];
    initialPendingManagers: any[];
    initialClients: any[];
    initialRelations: any[];
    currencySymbol?: string;
    economics?: {
        platformRevenue: number;
        globalMerchantDebt: number;
    };
}

export default function PostalAdminClient({ 
    initialManagers, 
    initialPendingManagers, 
    initialClients, 
    initialRelations,
    currencySymbol = '$',
    economics = { platformRevenue: 0, globalMerchantDebt: 0 }
}: PostalAdminClientProps) {
    const [managers, setManagers] = useState(initialManagers);
    const [pendingManagers, setPendingManagers] = useState(initialPendingManagers);
    const [clients, setClients] = useState(initialClients);
    const [relations, setRelations] = useState(initialRelations);
    
    const [activeTab, setActiveTab] = useState<'MANAGERS' | 'PENDING' | 'CLIENTS' | 'RELATIONS'>('MANAGERS');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [createUserRole, setCreateUserRole] = useState<'POSTAL_MANAGER' | 'POSTAL_CLIENT'>('POSTAL_MANAGER');
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [isCreateRelationOpen, setIsCreateRelationOpen] = useState(false);
    const [selectedManagerForRel, setSelectedManagerForRel] = useState('');
    const [selectedClientForRel, setSelectedClientForRel] = useState('');

    const [isFeesOpen, setIsFeesOpen] = useState(false);
    const [selectedManagerForFees, setSelectedManagerForFees] = useState<any>(null);
    const [editBaseFee, setEditBaseFee] = useState(0);
    const [editManagerCut, setEditManagerCut] = useState(0);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const res = await createPostalUser({ name: newUserName, email: newUserEmail, password: newUserPassword, role: createUserRole });
        setIsProcessing(false);
        if (res.success) {
            toast.success(`${createUserRole} Created Successfully`);
            if (createUserRole === 'POSTAL_MANAGER') {
                setManagers([...managers, { ...res.user, managedClients: [] }]);
            } else {
                setClients([...clients, { ...res.user, managerRelations: [] }]);
            }
            setIsCreateUserOpen(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
        } else {
            toast.error(res.error);
        }
    };

    const handleDeleteUser = async (id: string, role: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setIsProcessing(true);
        const res = await deletePostalUser(id);
        setIsProcessing(false);
        if (res.success) {
            toast.success('User deleted');
            if (role === 'POSTAL_MANAGER') setManagers(managers.filter(m => m.id !== id));
            else if (role === 'PENDING') setPendingManagers(pendingManagers.filter(m => m.id !== id));
            else setClients(clients.filter(c => c.id !== id));
        } else {
            toast.error(res.error);
        }
    };

    const handleApproveManager = async (id: string) => {
        setIsProcessing(true);
        const res = await approvePostalManager(id);
        setIsProcessing(false);
        if (res.success) {
            toast.success('Manager Approved');
            const approved = pendingManagers.find(m => m.id === id);
            setPendingManagers(pendingManagers.filter(m => m.id !== id));
            if (approved) setManagers([...managers, approved]);
        } else {
            toast.error(res.error);
        }
    };

    const handleCreateRelation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedManagerForRel || !selectedClientForRel) return toast.error('Select both.');
        setIsProcessing(true);
        const res = await appendPostalRelation(selectedManagerForRel, selectedClientForRel);
        setIsProcessing(false);
        if (res.success) {
            toast.success('Relation established');
            const mgr = managers.find(m => m.id === selectedManagerForRel);
            const clt = clients.find(c => c.id === selectedClientForRel);
            setRelations([...relations, { ...res.relation, manager: mgr, client: clt }]);
            setIsCreateRelationOpen(false);
        } else {
            toast.error(res.error);
        }
    };

    const handleDeleteRelation = async (id: string) => {
        if (!confirm('Remove this relation?')) return;
        setIsProcessing(true);
        const res = await removePostalRelation(id);
        setIsProcessing(false);
        if (res.success) {
            toast.success('Relation removed');
            setRelations(relations.filter(r => r.id !== id));
        } else {
            toast.error(res.error);
        }
    };

    const handleUpdateFees = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedManagerForFees) return;
        setIsProcessing(true);
        const res = await updatePostalManagerFees(selectedManagerForFees.id, { postalBaseFee: editBaseFee, postalManagerCut: editManagerCut });
        setIsProcessing(false);
        if (res.success) {
            toast.success('Fees updated successfully');
            setManagers(managers.map(m => m.id === selectedManagerForFees.id ? { ...m, postalBaseFee: editBaseFee, postalManagerCut: editManagerCut } : m));
            setIsFeesOpen(false);
        } else {
            toast.error(res.error);
        }
    };

    const filteredManagers = managers.filter(m => m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredPending = pendingManagers.filter(m => m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredClients = clients.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.email?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* Identity Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 shadow-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5">
                <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center text-white shadow-2xl border border-white/10 shrink-0">
                        <Send size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase italic underline decoration-indigo-500 decoration-8 underline-offset-4">Governance</h1>
                        <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                             <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-4 border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.5)]"/>
                             Postal Network Oversight
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-center min-w-[200px] group hover:bg-emerald-500/20 transition-all shadow-xl shadow-black/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Landmark size={14} className="text-emerald-400" />
                            <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest leading-none">Global Platform Fee</p>
                        </div>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{currencySymbol}{economics.platformRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-center min-w-[200px] group hover:bg-amber-500/20 transition-all shadow-xl shadow-black/20">
                        <div className="flex items-center gap-2 mb-2">
                            <HandCoins size={14} className="text-amber-400" />
                            <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest leading-none">Global Merchant Debt</p>
                        </div>
                        <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{currencySymbol}{economics.globalMerchantDebt.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        {(['MANAGERS', 'PENDING', 'CLIENTS', 'RELATIONS'] as const).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all relative",
                                    activeTab === tab ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-indigo-600"
                                )}
                            >
                                {tab}
                                {tab === 'PENDING' && pendingManagers.length > 0 && (
                                    <span className="ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-md text-[8px] animate-pulse">{pendingManagers.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="h-5 w-px bg-slate-200 hidden sm:block mx-2" />
                    <div className="flex items-center gap-2">
                        {activeTab === 'RELATIONS' ? (
                            <button 
                                onClick={() => setIsCreateRelationOpen(true)}
                                className="h-11 px-6 bg-emerald-600 hover:bg-black text-white flex items-center gap-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 italic"
                            >
                                <LinkIcon size={14} strokeWidth={3} /> Link Network
                            </button>
                        ) : (
                            <button 
                                onClick={() => {
                                    setCreateUserRole(activeTab === 'MANAGERS' ? 'POSTAL_MANAGER' : 'POSTAL_CLIENT');
                                    setIsCreateUserOpen(true);
                                }}
                                className="h-11 px-6 bg-slate-900 hover:bg-black text-white flex items-center gap-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 italic"
                            >
                                <UserPlus size={14} strokeWidth={3} /> New {activeTab === 'MANAGERS' ? 'Manager' : 'Partner'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative group w-full lg:w-80 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input 
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold placeholder:text-slate-300 focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all outline-none text-slate-800"
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent h-14">
                            {activeTab === 'RELATIONS' ? (
                                <>
                                    <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] px-8 italic">Regional Manager</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Merchant Partner</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-right px-8 italic w-[120px]">Actions</TableHead>
                                </>
                            ) : (
                                <>
                                    <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] px-8 italic">Authorized Identity</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] italic">Network Credentials</TableHead>
                                    {activeTab === 'MANAGERS' && <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-center italic">Fee Policy</TableHead>}
                                    {activeTab === 'MANAGERS' && <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-center italic">Clients</TableHead>}
                                    {activeTab === 'CLIENTS' && <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-center italic">Hubs</TableHead>}
                                    <TableHead className="font-black text-slate-400 uppercase text-[9px] tracking-[0.3em] text-right px-8 italic w-[150px]">Actions</TableHead>
                                </>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeTab === 'RELATIONS' ? (
                            relations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-[0.5em] italic animate-pulse">
                                        Scanning Network Relations...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                relations.map((r: any) => (
                                    <TableRow key={r.id} className="group hover:bg-slate-50 border-slate-50 h-20 transition-colors">
                                        <TableCell className="px-8">
                                            <div className="font-black text-sm text-slate-900 mb-0.5">{r.manager?.name}</div>
                                            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest opacity-60 font-mono italic">{r.manager?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-black text-sm text-slate-900 mb-0.5">{r.client?.name}</div>
                                            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest opacity-60 font-mono italic">{r.client?.email}</div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <button onClick={() => handleDeleteRelation(r.id)} disabled={isProcessing} className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90">
                                                <Trash2 size={16} />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )
                        ) : (
                            (activeTab === 'MANAGERS' ? filteredManagers : activeTab === 'PENDING' ? filteredPending : filteredClients).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-[0.5em] italic animate-pulse">
                                        No Entities Found in Registry
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (activeTab === 'MANAGERS' ? filteredManagers : activeTab === 'PENDING' ? filteredPending : filteredClients).map((user: any) => (
                                    <TableRow key={user.id} className="group hover:bg-slate-50 border-slate-50 h-20 transition-colors">
                                        <TableCell className="px-8">
                                            <div className="font-black text-sm text-slate-900 mb-0.5 tracking-tight uppercase">{user.name}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">{activeTab === 'PENDING' ? 'Awaiting Hub Approval' : 'Verified Entity'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl inline-block font-mono select-all">
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        {activeTab === 'MANAGERS' && (
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-indigo-600 tabular-nums italic underline underline-offset-4 decoration-2 decoration-indigo-200">{currencySymbol}{Number(user.postalBaseFee || 0).toFixed(2)}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">{user.postalManagerCut || 0}% Partner Reward</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {(activeTab === 'MANAGERS' || activeTab === 'CLIENTS') && (
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center bg-white shadow-lg shadow-indigo-100 text-indigo-600 font-black text-[11px] w-9 h-9 rounded-2xl ring-1 ring-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all italic">
                                                    {activeTab === 'MANAGERS' ? (user.managedClients?.length || 0) : (user.managerRelations?.length || 0)}
                                                </span>
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                {activeTab === 'MANAGERS' && (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedManagerForFees(user);
                                                            setEditBaseFee(Number(user.postalBaseFee || 0));
                                                            setEditManagerCut(Number(user.postalManagerCut || 0));
                                                            setIsFeesOpen(true);
                                                        }}
                                                        className="h-10 px-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95 italic"
                                                    >
                                                        Fiscal Settings
                                                    </button>
                                                )}
                                                {activeTab === 'PENDING' && (
                                                    <button onClick={() => handleApproveManager(user.id)} disabled={isProcessing} className="h-10 px-5 inline-flex items-center justify-center rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 italic">
                                                        Authorize Node
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteUser(user.id, activeTab === 'MANAGERS' ? 'POSTAL_MANAGER' : activeTab === 'PENDING' ? 'PENDING' : 'POSTAL_CLIENT')} disabled={isProcessing} className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )
                        )}</TableBody>
                    </Table>
                </div>

            {/* Create Dialog */}
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogContent className="bg-white rounded-[3rem] border-slate-100 shadow-3xl p-8 max-w-md overflow-hidden">
                    <div className="bg-slate-900 p-10 -m-8 mb-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Users size={100} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-2 underline decoration-indigo-500 decoration-8 underline-offset-4">Entity Registration</DialogTitle>
                            <DialogDescription className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] font-mono">Formalizing Network Partnership</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Formal Identity</label>
                            <input required type="text" value={newUserName} onChange={e=>setNewUserName(e.target.value)} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none" placeholder="Company or Individual Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Login Credentials</label>
                            <input required type="email" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none font-mono" placeholder="auth@network.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Security Pin</label>
                            <input required type="password" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none font-mono" placeholder="••••••••" />
                        </div>
                        <button disabled={isProcessing} className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 italic">
                            {isProcessing ? 'AUTHORIZING...' : 'Verify & Inject into Registry'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Link Dialog */}
            <Dialog open={isCreateRelationOpen} onOpenChange={setIsCreateRelationOpen}>
                <DialogContent className="bg-white rounded-[3rem] border-slate-100 shadow-3xl p-8 max-w-md overflow-hidden text-center">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-4xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">Network Link</DialogTitle>
                        <DialogDescription className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 italic">Bridging Nodes & Merchants</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateRelation} className="space-y-6">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Regional Manager</label>
                            <select required value={selectedManagerForRel} onChange={e=>setSelectedManagerForRel(e.target.value)} className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:ring-8 focus:ring-indigo-600/5 transition-all">
                                <option value="">-- AUTHORIZE HUB --</option>
                                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Merchant Partner</label>
                            <select required value={selectedClientForRel} onChange={e=>setSelectedClientForRel(e.target.value)} className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-black text-slate-900 outline-none focus:ring-8 focus:ring-indigo-600/5 transition-all">
                                <option value="">-- AUTHORIZE CLIENT --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button disabled={isProcessing} className="w-full h-16 bg-emerald-600 hover:bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 italic">
                            {isProcessing ? 'ESTABLISHING...' : 'Authorize Relationship Chain'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Fees Dialog */}
            <Dialog open={isFeesOpen} onOpenChange={setIsFeesOpen}>
                <DialogContent className="bg-white rounded-[3rem] border-slate-100 shadow-3xl p-10 max-w-md overflow-hidden">
                    <DialogHeader className="mb-8 border-b border-slate-100 pb-6">
                        <DialogTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">Fiscal Policy</DialogTitle>
                        <DialogDescription className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 italic">Adjusting Commercial Rates for {selectedManagerForFees?.name}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateFees} className="space-y-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Platform Base Rate ({currencySymbol})</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-500 text-xl italic">{currencySymbol}</span>
                                    <input required type="number" step="0.01" value={editBaseFee} onChange={e=>setEditBaseFee(Number(e.target.value))} className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-2xl font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-indigo-600/5 transition-all outline-none tabular-nums italic" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 italic">Node Operator Commission (%)</label>
                                <div className="relative">
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-emerald-500 text-xl italic">%</span>
                                    <input required type="number" step="0.1" value={editManagerCut} onChange={e=>setEditManagerCut(Number(e.target.value))} className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-2xl font-black text-slate-900 focus:bg-white focus:ring-8 focus:ring-emerald-600/5 transition-all outline-none tabular-nums italic" />
                                </div>
                            </div>
                        </div>
                        <button disabled={isProcessing} className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 italic">
                            {isProcessing ? 'SYNCHRONIZING...' : 'Authorize New Fiscal Policy'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
