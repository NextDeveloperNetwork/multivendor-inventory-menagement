'use client';

import { useState } from 'react';
import {
    User,
    Mail,
    Shield,
    Store,
    Edit2,
    Trash2,
    Search,
    ChevronRight,
    Loader2,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { updateUser, deleteUser } from '@/app/actions/users';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface UsersClientProps {
    initialUsers: any[];
    shops: any[];
}

export default function UsersClient({ initialUsers, shops }: UsersClientProps) {
    const [users, setUsers] = useState(initialUsers);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleUpdate = async (formData: FormData) => {
        setLoading(true);
        const res = await updateUser(editingUser.id, formData);
        if (res.success) {
            toast.success("User identity updated!");
            setEditingUser(null);
            // Refresh logic - simplified for demo
            window.location.reload();
        } else {
            toast.error(res.error || "Update failure");
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setLoading(true);
        const res = await deleteUser(userToDelete.id);
        if (res.success) {
            toast.success("User profile purged");
            setIsDeleteDialogOpen(false);
            setUsers(users.filter(u => u.id !== userToDelete.id));
        } else {
            toast.error(res.error || "Deactivation failure");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-6xl font-black uppercase tracking-tighter italic text-black">
                        Personnel <span className="text-blue-600">Registry</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest pl-2 border-l-4 border-blue-500">
                        Managing {users.length} Active Node Operators
                    </p>
                </div>

                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="SEARCH OPERATORS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-black uppercase tracking-widest outline-none focus:border-blue-500 shadow-xl shadow-slate-200/50 transition-all"
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="group bg-white rounded-[2.5rem] p-8 border-2 border-slate-50 hover:border-blue-100 transition-all shadow-xl shadow-slate-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <User size={120} />
                        </div>

                        <div className="flex items-start justify-between relative">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                {user.role === 'ADMIN' ? <ShieldCheck size={32} /> : <User size={32} />}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingUser(user)}
                                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        setUserToDelete(user);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 relative">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-black italic leading-none">{user.name || 'Anonymous Operator'}</h3>
                                <div className="flex items-center gap-2 mt-2 text-slate-400">
                                    <Mail size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{user.email}</span>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-wrap gap-2">
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                    <Shield size={10} />
                                    {user.role}
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                                    <Store size={10} />
                                    {user.shop?.name || 'UNASSIGNED NODE'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* EDIT MODAL */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldAlert size={120} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">Identity Management</DialogTitle>
                            <DialogDescription className="text-blue-100 font-bold uppercase text-[10px] tracking-widest mt-2 px-1 border-l-4 border-white/30">
                                Updating Node Permissions
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form action={handleUpdate} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Display Name</label>
                                <input
                                    name="name"
                                    defaultValue={editingUser?.name}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-black focus:border-blue-500 focus:bg-white transition-all outline-none uppercase"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Email Node</label>
                                <input
                                    name="email"
                                    defaultValue={editingUser?.email}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-black focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Access Tier</label>
                                    <select
                                        name="role"
                                        defaultValue={editingUser?.role}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-black focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    >
                                        <option value="USER">OPERATOR</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Node Assignment</label>
                                    <select
                                        name="shopId"
                                        defaultValue={editingUser?.shopId || ''}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-black focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    >
                                        <option value="">DE-ASSIGNED</option>
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-black hover:bg-slate-900 text-white font-black py-5 rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs italic disabled:opacity-50"
                            >
                                {loading ? 'UPDATING...' : 'COMMIT CHANGES'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] p-12 text-center border-none shadow-2xl">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Trash2 size={40} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-tight">
                            Purge Profile?
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold mt-4 leading-relaxed">
                            This action will permanently revoke all network access for <span className="text-rose-500 underline decoration-rose-200 underline-offset-4 font-black">{userToDelete?.email}</span>. Data history will be preserved as orphans.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-12">
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl shadow-rose-200"
                        >
                            {loading ? 'PURGING...' : 'EXECUTE PURGE'}
                        </button>
                        <button
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            ABORT MISSION
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
