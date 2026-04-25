'use client';

import { registerUser } from '@/app/actions/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Target, Building2, UserCircle2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [tab, setTab] = useState<'USER' | 'POSTAL_MANAGER'>('USER');
    
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('requestedRole', tab); // Standard or Postal Manager
        
        const res = await registerUser(formData);
        setIsLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            if (tab === 'POSTAL_MANAGER') {
                toast.success('Registration sent for approval. Contact an Admin.', { duration: 5000 });
            } else {
                toast.success('Clearance Granted');
            }
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] relative overflow-hidden font-sans py-12">
            {/* Dark Mode Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[460px] relative z-10 px-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-8 text-center relative border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-indigo-500/20">
                            <Target size={28} className="text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">System Enlistment</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-6">
                            Join the Nexus Global Operations Network
                        </p>
                    </div>

                    <div className="px-8 pt-6">
                        <div className="flex bg-black/40 p-1 rounded-xl mb-6 border border-white/5">
                            <button 
                                type="button" 
                                onClick={() => setTab('USER')}
                                className={cn(
                                    "flex-1 flex items-center justify-center py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    tab === 'USER' ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <UserCircle2 size={13} className="mr-2" /> Internal Node
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setTab('POSTAL_MANAGER')}
                                className={cn(
                                    "flex-1 flex items-center justify-center py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    tab === 'POSTAL_MANAGER' ? "bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <Building2 size={13} className="mr-2" /> Postal Manager
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <UserCircle2 size={10} /> Designated Name
                                </label>
                                <input
                                    name="name"
                                    type="text"
                                    className="w-full px-4 h-11 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:bg-white/10 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Mail size={10} /> Email Identity
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full px-4 h-11 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:bg-white/10 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="operative@nexus.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Lock size={10} /> Passcode Formatter
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    className="w-full px-4 h-11 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:bg-white/10 focus:border-indigo-500/50 transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black tracking-widest text-[11px] uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? 'Processing Entry...' : tab === 'POSTAL_MANAGER' ? 'Submit Application' : 'Initialize Account'}
                                </button>
                                {tab === 'POSTAL_MANAGER' && (
                                    <p className="text-[9px] text-center text-amber-500/80 font-bold uppercase tracking-wider mt-3">
                                        * Requires Headquarters Approval Post-Creation
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 p-6 border-t border-white/5 text-center bg-black/20 relative z-10">
                        <p className="text-xs font-medium text-slate-400">
                            Already localized? <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300 ml-1">Return to Grid</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
