'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError('Invalid email or password');
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50"></div>
                <div className="absolute top-1/2 -right-40 w-80 h-80 bg-emerald-50 rounded-full blur-[80px] opacity-50"></div>
            </div>

            <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-500">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 backdrop-blur-sm">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
                            <span className="text-white text-2xl font-black">N</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 font-medium mt-2">Enter your credentials to access Nexus</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-5 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Password</label>
                            <input
                                type="password"
                                className="w-full px-5 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest text-sm">
                            Authorize Login
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-sm font-medium text-slate-500">
                            System restricted? <Link href="/register" className="text-blue-600 font-bold hover:underline">Apply for Access</Link>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Nexus Operations Management v2.0</p>
                </div>
            </div>
        </div>
    );
}
