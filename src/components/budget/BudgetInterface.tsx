'use client';

import { useState } from 'react';
import { 
    Coins, 
    Plus, 
    Search, 
    Calendar, 
    DollarSign, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createOrUpdateBudget, deleteBudget } from '@/app/actions/finance';
import { useSession } from 'next-auth/react';

interface Budget {
    id: string;
    amount: any; // Decimal
    period: string | null;
    description: string | null;
    updatedAt: Date;
    updatedBy: string | null;
}

interface FinanceBudgetClientProps {
    initialBudgets: Budget[];
    userRole: string;
}

export default function FinanceBudgetClient({ initialBudgets, userRole }: FinanceBudgetClientProps) {
    const { data: session } = useSession();
    const [budgets, setBudgets] = useState(initialBudgets);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Partial<Budget> | null>(null);
    const [loading, setLoading] = useState(false);

    const isEditor = userRole === 'ADMIN' || userRole === 'FINANCE_EDITOR';

    const filteredBudgets = budgets.filter(b => 
        (b.period?.toLowerCase().includes(search.toLowerCase()) || 
         b.description?.toLowerCase().includes(search.toLowerCase()))
    );

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        
        const data = {
            id: editingBudget?.id,
            amount: Number(formData.get('amount')),
            period: formData.get('period') as string,
            description: formData.get('description') as string,
        };

        const result = await createOrUpdateBudget(data);
        if (result.success) {
            // Simple refresh for now, in real app we'd update state more gracefully
            window.location.reload();
        } else {
            alert(result.error || 'Failed to save budget');
        }
        setLoading(false);
        setIsDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this budget entry?')) return;
        
        const result = await deleteBudget(id);
        if (result.success) {
            setBudgets(budgets.filter(b => b.id !== id));
        } else {
            alert(result.error);
        }
    };

    const openEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setEditingBudget(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                        <Coins size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Financial Budget Control</h1>
                        <p className="text-sm text-slate-400 font-medium">Global resources & fiscal planning</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input 
                            placeholder="Search periods..." 
                            className="pl-10 w-[240px] bg-slate-50 border-slate-200 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isEditor && (
                        <Button 
                            onClick={openCreate}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 shadow-md shadow-emerald-100"
                        >
                            <Plus size={18} /> Add Budget
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden group">
                    <div className="h-1 bg-emerald-500 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        Active Allocation
                        <TrendingUp size={16} className="text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900">${totalBudget.toLocaleString()}</div>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Consolidated across {budgets.length} periods
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-1 bg-blue-500 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        Latest Period
                        <Calendar size={16} className="text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900">{budgets[0]?.period || 'N/A'}</div>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-medium">
                            <Clock size={12} className="text-blue-500" /> Last updated {budgets[0] ? new Date(budgets[0].updatedAt).toLocaleDateString() : 'never'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-1 bg-amber-500 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                        Access Level
                        <AlertCircle size={16} className="text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                             <Badge className={isEditor ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"}>
                                {userRole.replace('_', ' ')}
                             </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 font-medium">
                            {isEditor ? 'You have full modification authority' : 'Read-only access to fiscal data'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Budgets Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-bold text-slate-900 h-14">Period</TableHead>
                            <TableHead className="font-bold text-slate-900 h-14">Description</TableHead>
                            <TableHead className="font-bold text-slate-900 h-14">Allocated Amount</TableHead>
                            <TableHead className="font-bold text-slate-900 h-14 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBudgets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium">
                                    No budget records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBudgets.map((budget) => (
                                <TableRow key={budget.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                    <TableCell className="font-bold text-slate-900">{budget.period}</TableCell>
                                    <TableCell className="text-slate-500 text-sm max-w-xs truncate">{budget.description || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-black text-slate-900">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <DollarSign size={14} />
                                            </div>
                                            {Number(budget.amount).toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isEditor && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="w-9 h-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-all focus:ring-0"
                                                    onClick={() => openEdit(budget)}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="w-9 h-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all focus:ring-0"
                                                    onClick={() => handleDelete(budget.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        )}
                                        {!isEditor && (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">
                                                Locked
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                                <Coins size={20} />
                            </div>
                            {editingBudget ? 'Modify Budget' : 'Establish New Budget'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Period Name</label>
                                <Input 
                                    name="period" 
                                    defaultValue={editingBudget?.period || ''} 
                                    placeholder="e.g. 2024 - Quarter 3" 
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Allocation Amount</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <DollarSign size={16} />
                                    </div>
                                    <Input 
                                        name="amount" 
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingBudget ? Number(editingBudget.amount) : ''} 
                                        placeholder="0.00" 
                                        className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Description / Notes</label>
                                <Input 
                                    name="description" 
                                    defaultValue={editingBudget?.description || ''} 
                                    placeholder="Brief explanation of this budget allocation..." 
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : editingBudget ? 'Update Budget Record' : 'Create Budget Entry'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
