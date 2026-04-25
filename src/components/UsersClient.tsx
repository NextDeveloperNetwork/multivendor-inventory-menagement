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
import { updateUser, deleteUser, forceLogoutUser } from '@/app/actions/users';
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
    transporters: any[];
}

export default function UsersClient({ initialUsers, shops, transporters }: UsersClientProps) {
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

    const handleForceLogout = async (userId: string) => {
        if (!confirm("Force terminate this user's session globally?")) return;
        setLoading(true);
        const res = await forceLogoutUser(userId);
        if (res.success) {
            toast.success("User abruptly disconnected & session cleared!");
        } else {
            toast.error(res.error || "Force logout failed");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 bg-white p-2 md:p-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">
                        Staff <span className="text-blue-600">Directory</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 italic">
                        Managing {users.length} Active System Users & Account Profiles
                    </p>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="SEARCH_STAFF_MEMBERS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-blue-600 transition-all font-mono italic text-slate-900"
                    />
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-900 transition-all shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <User size={80} />
                        </div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10 group-hover:bg-blue-600 transition-all">
                                {user.role === 'ADMIN' ? <ShieldCheck size={20} /> : <User size={20} />}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingUser(user)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        setUserToDelete(user);
                                        setIsDeleteDialogOpen(true);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-rose-600 hover:border-rose-600 transition-all shadow-sm"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 italic leading-none">{user.name || 'Anonymous User'}</h3>
                                <div className="flex items-center gap-2 mt-1 text-slate-400 italic">
                                    <Mail size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-500">{user.email}</span>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono italic ${
                                    user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                    user.role === 'POSTAL_MANAGER' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 
                                    user.role === 'POSTAL_TRANSPORTER' ? 'bg-violet-50 text-violet-600 border-violet-200' :
                                    user.role === 'POSTAL_CLIENT' ? 'bg-sky-50 text-sky-600 border-sky-200' :
                                    user.role === 'TRANSPORTER' ? 'bg-slate-50 text-slate-600 border-slate-200' : 
                                    user.role === 'PRODUCTION_MANAGER' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                    user.role === 'SALES_MANAGER' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                    'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>
                                    <Shield size={10} />
                                    {user.role?.replace(/_/g, ' ')}
                                </div>

                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white border border-slate-900 text-[8px] font-black uppercase tracking-widest font-mono italic">
                                    <Store size={10} className="text-slate-400" />
                                    {user.shop?.name || 'UNASSIGNED_BRANCH'}
                                </div>
                            </div>
                            
                            {/* FORCE LOGOUT BUTTON */}
                            <div className="pt-2">
                                <button 
                                    onClick={() => handleForceLogout(user.id)}
                                    className="w-full text-center text-[9px] font-black uppercase tracking-widest border border-rose-200 text-rose-500 bg-rose-50 py-2 rounded-xl transition-all hover:bg-rose-600 hover:text-white"
                                >
                                    Force Master Logout
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* EDIT MODAL */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldAlert size={80} />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">System Profile Settings</DialogTitle>
                            <DialogDescription className="text-blue-400 font-black uppercase text-[9px] tracking-[0.2em] mt-2 italic flex items-center gap-2">
                                <span className="inline-block w-1 h-1 bg-blue-500" /> Updating User Permissions & Security Credentials
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form action={handleUpdate} className="p-8 space-y-6 bg-white">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Full Legal Name</label>
                                <input
                                    name="name"
                                    defaultValue={editingUser?.name}
                                    className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none uppercase text-xs italic"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Official Email Address</label>
                                <input
                                    name="email"
                                    defaultValue={editingUser?.email}
                                    className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">New Password (Optional)</label>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Leave blank to keep current password"
                                    className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none text-xs font-mono placeholder:text-slate-300 placeholder:normal-case placeholder:font-medium placeholder:not-italic"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Path Strict Enforcements (Comma Separated)</label>
                                <input
                                    name="allowedPaths"
                                    defaultValue={editingUser?.allowedPaths?.join(', ') || ''}
                                    placeholder="e.g. /production, /admin/inventory"
                                    className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none text-[10px] font-mono uppercase placeholder:normal-case"
                                />
                                <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest px-2 italic font-black">Leave empty to grant unlimited access to base role</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Access Tier</label>
                                    <select
                                        name="role"
                                        defaultValue={editingUser?.role}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none text-[10px] uppercase italic"
                                    >
                                        <option value="USER">Standard Staff</option>
                                        <option value="ADMIN">System Administrator</option>
                                        <option value="POSTAL_MANAGER">Postal Hub Manager</option>
                                        <option value="POSTAL_TRANSPORTER">Postal Transporter (Fleet)</option>
                                        <option value="POSTAL_CLIENT">Postal Client (Merchant)</option>
                                        <option value="TRANSPORTER">Standard Logistics</option>
                                        <option value="PRODUCTION_MANAGER">Production Manager</option>
                                        <option value="SALES_MANAGER">Sales Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Branch Assignment</label>
                                    <select
                                        name="shopId"
                                        defaultValue={editingUser?.shopId || ''}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none text-[10px] uppercase italic"
                                    >
                                        <option value="">DE-ASSIGNED / FLOATING</option>
                                        {shops.map(shop => (
                                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block px-1 italic">Logistic Unit</label>
                                    <select
                                        name="transporterId"
                                        defaultValue={editingUser?.transporterId || ''}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:border-blue-600 focus:bg-white transition-all outline-none text-[10px] uppercase italic"
                                    >
                                        <option value="">NO_UNIT / INDEPENDENT</option>
                                        {transporters.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-black h-14 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-[0.2em] text-[10px] italic disabled:opacity-50"
                            >
                                {loading ? 'SAVING...' : 'SAVE_PROFILE_CHANGES'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2rem] p-0 overflow-hidden border border-slate-200 shadow-2xl">
                    <div className="bg-rose-600 p-8 text-white flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Purge Profile?</h2>
                        <p className="text-rose-100 font-black uppercase text-[9px] tracking-widest mt-2 italic">Deactivating User Access Level</p>
                    </div>

                    <div className="p-8 space-y-8 text-center bg-white">
                        <p className="text-slate-500 font-bold text-xs leading-relaxed uppercase tracking-wide">
                            This action will permanently revoke all network access for <span className="text-rose-600 underline decoration-rose-200 underline-offset-4 font-black font-mono">{userToDelete?.email}</span>. Data history will be preserved as orphans.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase italic tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-rose-200"
                            >
                                {loading ? 'DELETING...' : 'CONFIRM_USER_DELETION'}
                            </button>
                            <button
                                onClick={() => setIsDeleteDialogOpen(false)}
                                className="w-full h-14 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 transition-all italic border border-slate-200"
                            >
                                Cancel Action
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
