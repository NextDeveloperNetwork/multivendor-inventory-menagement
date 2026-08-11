'use client';

import React, { useState, useMemo } from 'react';
import {
    ShieldCheck,
    ClipboardList,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    Eye,
    Search,
    Grid,
    AlertCircle,
    PackageCheck,
    Printer,
    FileSpreadsheet,
    Layers,
    SlidersHorizontal
} from 'lucide-react';
import {
    updateRequestStatus,
    deleteRequest
} from '@/app/actions/salesOps';

interface Article {
    id: string;
    name: string;
    code?: string | null;
    colors: string[];
    sizes: string[];
}

interface InventoryRequest {
    id: string;
    articleId?: string | null;
    productName?: string | null;
    quantity: number;
    status: string;
    requestedBy: string;
    notes?: string | null;
    matrixDetails?: string | null;
    createdAt: string;
}

interface AdminSalesRequestsUIProps {
    requests: InventoryRequest[];
    articles: Article[];
}

export default function AdminSalesRequestsUI({
    requests = [],
    articles = []
}: AdminSalesRequestsUIProps) {
    const [activeTab, setActiveTab] = useState<'operations' | 'printablePlan'>('operations');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Matrix Inspection Modal State
    const [inspectingRequest, setInspectingRequest] = useState<InventoryRequest | null>(null);

    // Parse Matrix Details JSON safely for inspection
    const parsedMatrix = useMemo(() => {
        if (!inspectingRequest?.matrixDetails) return null;
        try {
            return JSON.parse(inspectingRequest.matrixDetails);
        } catch (e) {
            return null;
        }
    }, [inspectingRequest]);

    // Matching article definition for matrix inspection
    const matchingArticle = useMemo(() => {
        if (!inspectingRequest) return null;
        return articles.find(a => a.id === inspectingRequest.articleId || a.name === inspectingRequest.productName);
    }, [inspectingRequest, articles]);

    // KPI Metrics
    const kpis = useMemo(() => {
        const totalReqs = requests.length;
        const totalPieces = requests.reduce((sum, r) => sum + r.quantity, 0);
        const pendingCount = requests.filter(r => r.status === 'PENDING').length;
        const fulfilledCount = requests.filter(r => r.status === 'FULFILLED' || r.status === 'APPROVED').length;
        return { totalReqs, totalPieces, pendingCount, fulfilledCount };
    }, [requests]);

    // Filtered Requests
    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            const matchesSearch =
                !searchQuery ||
                (r.productName && r.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [requests, statusFilter, searchQuery]);

    // Status Action Handler
    const handleStatusChange = async (id: string, newStatus: string) => {
        setLoadingId(id);
        const res = await updateRequestStatus(id, newStatus);
        if (res.success) {
            setMessage({ type: 'success', text: `Request #${id.slice(-6).toUpperCase()} status updated to ${newStatus}.` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to update status.' });
        }
        setLoadingId(null);
    };

    // Delete Action Handler
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request record?')) return;
        setLoadingId(id);
        const res = await deleteRequest(id);
        if (res.success) {
            setMessage({ type: 'success', text: 'Request record deleted.' });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to delete request.' });
        }
        setLoadingId(null);
    };

    // Helper to parse matrix details for printable list
    const getParsedMatrix = (req: InventoryRequest) => {
        if (!req.matrixDetails) return null;
        try {
            return JSON.parse(req.matrixDetails);
        } catch (e) {
            return null;
        }
    };

    // Helper to get article specs for printable list
    const getArticleSpecs = (req: InventoryRequest) => {
        return articles.find(a => a.id === req.articleId || a.name === req.productName);
    };

    return (
        <div className="space-y-6 fade-in max-w-[1600px] mx-auto p-4 md:p-6 print:p-0 print:max-w-none">
            {/* Header (Hidden when printing) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200 shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">Admin Shortage Requests Operations</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                                Enterprise Authority
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">
                            Executive review, item-by-item Color × Size matrix inspection & printable dispatch plan
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Printer size={16} /> Print Requested List
                    </button>
                </div>
            </div>

            {/* Notification Alert (Hidden when printing) */}
            {message && (
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-all print:hidden ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
                </div>
            )}

            {/* Navigation Tabs (Hidden when printing) */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
                <button
                    onClick={() => setActiveTab('operations')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === 'operations'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <ClipboardList size={16} /> Shortage Operations & Approvals
                </button>
                <button
                    onClick={() => setActiveTab('printablePlan')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === 'printablePlan'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <FileSpreadsheet size={16} /> Itemized Color × Size Printable Manifest
                </button>
            </div>

            {/* TAB 1: OPERATIONS & APPROVALS */}
            {activeTab === 'operations' && (
                <div className="space-y-6">
                    {/* Operations KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                <ClipboardList size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-900">{kpis.totalReqs}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Requests</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Grid size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-900 font-mono">{kpis.totalPieces} pcs</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Requested Pieces</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-amber-600 font-mono">{kpis.pendingCount}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Approvals</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <PackageCheck size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-emerald-600 font-mono">{kpis.fulfilledCount}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Approved / Fulfilled</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Controls Toolbar */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Status:</span>
                            {['ALL', 'PENDING', 'APPROVED', 'FULFILLED', 'REJECTED'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        statusFilter === st
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <div className="relative min-w-[260px]">
                            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search requester, article, notes..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Master Requests List (Mobile Card View for screens < 640px) */}
                    <div className="block sm:hidden space-y-3">
                        {filteredRequests.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic text-xs">
                                No item requests found matching criteria.
                            </div>
                        ) : (
                            filteredRequests.map(req => (
                                <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-slate-900 text-xs">#{req.id.slice(-6).toUpperCase()}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{req.productName || 'Article Request'}</h3>
                                            <p className="text-[11px] text-slate-500">By: <span className="font-semibold text-slate-800">{req.requestedBy}</span></p>
                                        </div>

                                        <span className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-mono font-black text-xs">
                                            {req.quantity} pcs
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div>
                                            {req.status === 'PENDING' && (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1">
                                                    <Clock size={10} /> Pending
                                                </span>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] inline-flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Approved
                                                </span>
                                            )}
                                            {req.status === 'FULFILLED' && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                                                    <PackageCheck size={10} /> Fulfilled
                                                </span>
                                            )}
                                            {req.status === 'REJECTED' && (
                                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1">
                                                    <XCircle size={10} /> Rejected
                                                </span>
                                            )}
                                        </div>

                                        {req.matrixDetails && (
                                            <button
                                                onClick={() => setInspectingRequest(req)}
                                                className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                                            >
                                                <Eye size={12} /> Inspect Matrix
                                            </button>
                                        )}
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                        {req.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                                disabled={loadingId === req.id}
                                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs text-center"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {req.status === 'APPROVED' && (
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'FULFILLED')}
                                                disabled={loadingId === req.id}
                                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs text-center"
                                            >
                                                Fulfill / Dispatch
                                            </button>
                                        )}
                                        {req.status !== 'REJECTED' && (
                                            <button
                                                onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                                disabled={loadingId === req.id}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-bold text-center"
                                            >
                                                Reject
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(req.id)}
                                            className="px-2 py-1.5 text-slate-400 hover:text-rose-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Main Master Requests Table (Desktop view for screens >= 640px) */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Request ID / Date</th>
                                        <th className="px-6 py-4">Article / Item</th>
                                        <th className="px-6 py-4">Requested By</th>
                                        <th className="px-6 py-4 text-center">Total Quantity</th>
                                        <th className="px-6 py-4">Matrix Breakdown</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Notes</th>
                                        <th className="px-6 py-4 text-right">Admin Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                                No item requests found matching criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-slate-900">#{req.id.slice(-6).toUpperCase()}</div>
                                                    <div className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                                                    {req.productName || 'Article Request'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 font-semibold">
                                                    {req.requestedBy}
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono font-black text-slate-900 text-sm">
                                                    {req.quantity} pcs
                                                </td>
                                                <td className="px-6 py-4">
                                                    {req.matrixDetails ? (
                                                        <button
                                                            onClick={() => setInspectingRequest(req)}
                                                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                                                        >
                                                            <Eye size={14} /> Inspect Matrix
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">Standard Request</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {req.status === 'PENDING' && (
                                                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                            <Clock size={12} /> Pending Approval
                                                        </span>
                                                    )}
                                                    {req.status === 'APPROVED' && (
                                                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                            <CheckCircle2 size={12} /> Approved
                                                        </span>
                                                    )}
                                                    {req.status === 'FULFILLED' && (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                            <PackageCheck size={12} /> Fulfilled
                                                        </span>
                                                    )}
                                                    {req.status === 'REJECTED' && (
                                                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                            <XCircle size={12} /> Rejected
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                                                    {req.notes || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    {req.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'APPROVED')}
                                                            disabled={loadingId === req.id}
                                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {req.status === 'APPROVED' && (
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'FULFILLED')}
                                                            disabled={loadingId === req.id}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                        >
                                                            Fulfill / Dispatch
                                                        </button>
                                                    )}
                                                    {req.status !== 'REJECTED' && (
                                                        <button
                                                            onClick={() => handleStatusChange(req.id, 'REJECTED')}
                                                            disabled={loadingId === req.id}
                                                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-bold transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(req.id)}
                                                        className="text-slate-300 hover:text-rose-600 p-1"
                                                    >
                                                        <Trash2 size={14} />
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
            )}

            {/* TAB 2: COMPACT SINGLE-LINE PRINTABLE MANIFEST */}
            {(activeTab === 'printablePlan' || typeof window !== 'undefined') && (
                <div className={`space-y-6 ${activeTab !== 'printablePlan' ? 'hidden print:block' : ''}`}>
                    {/* Header Controls for Printable Tab (Hidden when printing) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter Manifest:</span>
                            {['ALL', 'PENDING', 'APPROVED', 'FULFILLED'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        statusFilter === st
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                        >
                            <Printer size={16} /> Print Compact List
                        </button>
                    </div>

                    {/* Print Document Container */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print:border-none print:shadow-none space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
                                    Compact Requested Articles Manifest
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Single-Line Itemized Dispatch List (Color × Size Translated)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-mono">Date: {new Date().toLocaleDateString()}</p>
                                <p className="text-xs font-bold text-purple-700 font-mono mt-0.5">Total Requests: {filteredRequests.length} | Total Pieces: {filteredRequests.reduce((sum, r) => sum + r.quantity, 0)} pcs</p>
                            </div>
                        </div>

                        {/* Compact Single-Line Master Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-slate-300">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold print:bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 border-r border-slate-800">Article / Item</th>
                                        <th className="px-4 py-3 border-r border-slate-800">Requested By</th>
                                        <th className="px-4 py-3 border-r border-slate-800">Color × Size Breakdown (Single Line)</th>
                                        <th className="px-4 py-3 text-center border-r border-slate-800">Total Qty</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium font-mono text-slate-900">
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                                No requested articles match criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map(req => {
                                            const reqMatrix = getParsedMatrix(req);
                                            const reqArticle = getArticleSpecs(req);

                                            // Convert matrix into single line string
                                            let singleLineBreakdown = '—';
                                            if (reqMatrix) {
                                                const parts: string[] = [];
                                                if (reqArticle) {
                                                    reqArticle.colors.forEach(color => {
                                                        const sizeParts: string[] = [];
                                                        reqArticle.sizes.forEach(size => {
                                                            const qty = reqMatrix[`${color}___${size}`] || 0;
                                                            if (qty > 0) {
                                                                sizeParts.push(`${size} (${qty})`);
                                                            }
                                                        });
                                                        if (sizeParts.length > 0) {
                                                            parts.push(`${color}: ${sizeParts.join(', ')}`);
                                                        }
                                                    });
                                                } else {
                                                    Object.entries(reqMatrix).forEach(([key, qty]) => {
                                                        if ((qty as number) > 0) {
                                                            const [c, s] = key.split('___');
                                                            parts.push(`${c || 'Color'} ${s || ''}: ${qty} pcs`);
                                                        }
                                                    });
                                                }
                                                singleLineBreakdown = parts.length > 0 ? parts.join('  •  ') : '—';
                                            }

                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                                                    <td className="px-4 py-3 font-bold text-slate-900 font-sans border-r border-slate-100">
                                                        {req.productName || 'Article Request'}
                                                        <div className="text-[10px] font-mono text-slate-400">#{req.id.slice(-6).toUpperCase()}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700 font-sans font-semibold border-r border-slate-100">
                                                        {req.requestedBy}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-800 font-semibold border-r border-slate-100 bg-slate-50/50">
                                                        {singleLineBreakdown}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-black text-purple-700 text-sm border-r border-slate-100">
                                                        {req.quantity} pcs
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-sans font-bold">
                                                        <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                            req.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                            req.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800' :
                                                            req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MATRIX INSPECTION MODAL FOR ADMIN */}
            {inspectingRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    Requested Color × Size Matrix Breakdown
                                </h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    Article: <span className="text-slate-800 font-bold">{inspectingRequest.productName}</span> | Requested By: <span className="text-slate-800 font-bold">{inspectingRequest.requestedBy}</span>
                                </p>
                            </div>
                            <button onClick={() => setInspectingRequest(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={22} />
                            </button>
                        </div>

                        {/* Render Matrix Breakdown Grid */}
                        {parsedMatrix && (
                            <>
                                {/* Mobile Matrix Breakdown Cards (Visible on screens < 640px) */}
                                <div className="block sm:hidden space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                                    {matchingArticle ? (
                                        matchingArticle.colors.map(color => (
                                            <div key={color} className="bg-purple-50/50 border border-purple-200 rounded-xl p-3.5 space-y-2">
                                                <div className="flex items-center justify-between border-b border-purple-200 pb-1.5 font-bold text-xs text-purple-950">
                                                    <span>{color}</span>
                                                    <span className="font-mono text-purple-700">
                                                        {matchingArticle.sizes.reduce((sum, size) => sum + (parsedMatrix[`${color}___${size}`] || 0), 0)} pcs
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {matchingArticle.sizes.map(size => {
                                                        const qty = parsedMatrix[`${color}___${size}`] || 0;
                                                        return (
                                                            <div key={size} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between font-mono shadow-2xs">
                                                                <span className="text-slate-600 font-bold">Size {size}:</span>
                                                                <span className={`font-black ${qty > 0 ? 'text-purple-700 bg-purple-100 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                                                                    {qty}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        Object.entries(parsedMatrix).map(([key, qty]) => {
                                            const [c, s] = key.split('___');
                                            return (
                                                <div key={key} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs font-mono">
                                                    <span className="font-bold text-slate-800">{c || key} ({s || 'Variant'})</span>
                                                    <span className="font-black text-purple-700">{qty as any} pcs</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Desktop Matrix Table (Visible on screens >= 640px) */}
                                <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-purple-900 text-white uppercase tracking-wider font-bold">
                                            <tr>
                                                <th className="px-6 py-4 bg-purple-950 text-purple-300 sticky left-0 z-20 shadow-xs">Color \ Size</th>
                                                {matchingArticle ? (
                                                    matchingArticle.sizes.map(size => (
                                                        <th key={size} className="px-4 py-4 text-center border-l border-purple-800">
                                                            Size {size}
                                                        </th>
                                                    ))
                                                ) : (
                                                    ['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                                        <th key={size} className="px-4 py-4 text-center border-l border-purple-800">
                                                            Size {size}
                                                        </th>
                                                    ))
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {matchingArticle ? (
                                                matchingArticle.colors.map(color => (
                                                    <tr key={color} className="hover:bg-purple-50/30">
                                                        <td className="px-6 py-3.5 font-bold text-slate-900 bg-slate-100 sticky left-0 z-10 border-r border-slate-200 shadow-xs">
                                                            {color}
                                                        </td>
                                                        {matchingArticle.sizes.map(size => {
                                                            const qty = parsedMatrix[`${color}___${size}`] || 0;
                                                            return (
                                                                <td key={size} className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 border-r border-slate-100">
                                                                    {qty > 0 ? (
                                                                        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded font-black text-sm">{qty}</span>
                                                                    ) : (
                                                                        <span className="text-slate-300">0</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))
                                            ) : (
                                                Object.entries(parsedMatrix).map(([key, qty]) => {
                                                    const [c, s] = key.split('___');
                                                    return (
                                                        <tr key={key}>
                                                            <td className="px-6 py-3 font-bold text-slate-900">{c || key}</td>
                                                            <td className="px-6 py-3 text-center font-mono font-bold">{s}</td>
                                                            <td className="px-6 py-3 font-mono font-bold text-purple-700">{qty as any} pcs</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <div className="text-xs text-slate-500 font-medium">
                                Total Requested: <span className="font-bold text-purple-700 font-mono text-sm">{inspectingRequest.quantity} pcs</span>
                            </div>

                            <button
                                onClick={() => setInspectingRequest(null)}
                                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                            >
                                Close Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
