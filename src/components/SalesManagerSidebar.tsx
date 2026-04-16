'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    ShoppingCart, ClipboardList, UserMinus, LogOut,
    TrendingUp, ChevronRight, X, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

const menuItems = [
    { title: 'Sales Terminal',  href: '/sales',          icon: ShoppingCart,  description: 'Direct warehouse dispatches' },
    { title: 'Request Items',   href: '/sales/requests', icon: ClipboardList, description: 'Inventory restock requests' },
    { title: 'Debtors Ledger',  href: '/sales/debtors',  icon: UserMinus,     description: 'Outstanding payments' },
];

export default function SalesManagerSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ────────────────────────────────── DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-80 h-screen bg-slate-900 flex-col shrink-0 sticky top-0 border-r border-slate-800 shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white leading-none uppercase tracking-tighter italic">
                                Sales <span className="text-blue-400">Hub</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Management Mesh</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Operational Nodes</p>
                    </div>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className={cn(
                                "group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative overflow-hidden",
                                isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-500/10" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                            )}>
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isActive ? "bg-white/20" : "bg-slate-800 group-hover:scale-110")}>
                                    <item.icon size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black uppercase tracking-widest leading-none">{item.title}</p>
                                    <p className={cn("text-[9px] font-bold mt-1.5 leading-none", isActive ? "text-blue-100" : "text-slate-500 group-hover:text-slate-400")}>
                                        {item.description}
                                    </p>
                                </div>
                                {isActive && <ChevronRight size={14} className="opacity-40" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-slate-800/50">
                    <button onClick={() => signOut()} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20">
                            <LogOut size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-widest leading-none">Terminate</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1">Close session safely</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* ────────────────────────────────── MOBILE: hamburger trigger button (exposed to layout) */}
            {/* This button is rendered here but positioned inside the top bar via the layout */}
            <button
                id="mobile-menu-trigger"
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
                aria-label="Open menu"
            >
                <Menu size={18} />
            </button>

            {/* ────────────────────────────────── MOBILE: full-screen drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-[200] flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Drawer panel */}
                    <div className="relative w-72 max-w-[85vw] bg-slate-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-250">
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 pt-14 pb-6 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <TrendingUp size={17} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tighter italic leading-none">Sales <span className="text-blue-400">Hub</span></p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Management Mesh</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Nav items */}
                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] px-3 mb-3">Navigation</p>
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isActive ? "bg-white/20" : "bg-slate-800"
                                        )}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black uppercase tracking-wider leading-none">{item.title}</p>
                                            <p className={cn("text-[9px] font-bold mt-1 leading-none", isActive ? "text-blue-100" : "text-slate-600")}>
                                                {item.description}
                                            </p>
                                        </div>
                                        {isActive && <ChevronRight size={13} className="opacity-40" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="px-3 pb-10 pt-3 border-t border-slate-800">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                    <LogOut size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-wider leading-none">Sign Out</p>
                                    <p className="text-[9px] text-slate-600 font-bold mt-1">Close session safely</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
