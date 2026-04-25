'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Fingerprint, Lock, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        setIsLoading(false);

        if (res?.error) {
            toast.error(res.error === 'CredentialsSignin' ? 'Invalid credentials or awaiting approval.' : res.error);
        } else {
            toast.success('Authentication Verified');
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] relative overflow-hidden font-sans">
            {/* Dark Mode Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[420px] relative z-10 p-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-10 text-center relative border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-blue-500/20">
                            <Fingerprint size={32} className="text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Nexus Central</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                             <ShieldCheck size={12} className="text-emerald-400" /> Secure Terminal
                        </p>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Mail size={10} /> Identity Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-5 h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="operative@nexus.com"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                    <Lock size={10} /> Passcode
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-5 h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full h-12 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black tracking-widest text-[11px] uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? 'Authenticating...' : 'Authorize Login'}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 border-t border-white/5 text-center bg-black/20">
                        <p className="text-xs font-medium text-slate-400">
                            No credentials? <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300 ml-1">Apply for Clearance</Link>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6 flex justify-center opacity-50">
                    <Network size={20} className="text-slate-500" />
                </div>
            </div>
        </div>
    );
}
