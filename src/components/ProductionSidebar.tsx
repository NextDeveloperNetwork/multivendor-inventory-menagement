'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Activity, Settings, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils'; // Optional if they have it, or just use literal strings

export function ProductionSidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
    const pathname = usePathname();

    const items = [
        { href: '/production', icon: Activity, label: 'Daily Yield' },
    ];

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-[280px] bg-white border-r border-slate-200 
                flex flex-col transition-transform duration-300 lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-20 flex items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <Activity size={16} />
                        </div>
                        <span className="text-lg font-black text-slate-900 tracking-tight">Production</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] tracking-wide transition-all
                                ${pathname === item.href 
                                    ? 'bg-indigo-50 text-indigo-600' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <User size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-900 tracking-wide uppercase">Manager</span>
                                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Active Node</span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 text-[11px] font-black tracking-widest uppercase hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
