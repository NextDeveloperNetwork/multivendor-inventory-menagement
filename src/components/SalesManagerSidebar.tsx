'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    ShoppingCart, ClipboardList, UserMinus, LogOut,
    TrendingUp, ChevronRight, X, Menu, ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useSidebarManager } from '@/hooks/useSidebarManager';
import { SidebarPageManager } from './SidebarPageManager';

const menuItems = [
    { title: 'Sales Terminal',  href: '/sales',          icon: ShoppingCart,  description: 'Direct warehouse dispatches' },
    { title: 'Request Items',   href: '/sales/requests', icon: ClipboardList, description: 'Inventory restock requests' },
    { title: 'Free Sales',      href: '/sales/free-sales',icon: ShoppingBag,   description: 'Manual external sales' },
    { title: 'Debtors Ledger',  href: '/sales/debtors',  icon: UserMinus,     description: 'Outstanding payments' },
];

export default function SalesManagerSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { hiddenPages, togglePageVisibility, isHidden, isMounted } = useSidebarManager();

    const pageManagerGroups = [
        {
            label: 'Sales Menu',
            items: menuItems.map(item => ({
                href: item.href,
                label: item.title,
                icon: item.icon
            }))
        }
    ];

    return (
        <>
            {/* ────────────────────────────────── DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-72 h-screen bg-slate-900 flex-col shrink-0 sticky top-0 border-r border-slate-800 shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 ring-2 ring-slate-800">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white leading-none uppercase tracking-tighter italic">
                                SALES <span className="text-indigo-400">EDGE</span>
                            </h1>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">Manager Terminal 4.0</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    <div className="px-4 py-3">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">OPERATIONAL NODES</p>
                    </div>
                    
                    <div className="px-1 mb-2 mt-2">
                        <SidebarPageManager
                            menuGroups={pageManagerGroups}
                            hiddenPages={hiddenPages}
                            togglePageVisibility={togglePageVisibility}
                        />
                    </div>
                    
                    {menuItems.filter(item => isMounted ? !isHidden(item.href) : true).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className={cn(
                                "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative overflow-hidden",
                                isActive ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                            )}>
                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0", 
                                    isActive ? "bg-white/20" : "bg-slate-800 group-hover:scale-105"
                                )}>
                                    <item.icon size={16} strokeWidth={ isActive ? 3 : 2 } />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none truncate">{item.title}</p>
                                    <p className={cn("text-[8px] font-bold mt-1.5 leading-none truncate uppercase tracking-tight", 
                                        isActive ? "text-indigo-100" : "text-slate-600 group-hover:text-slate-400"
                                    )}>
                                        {item.description}
                                    </p>
                                </div>
                                {isActive && <div className="w-1 h-6 bg-white/40 rounded-full" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all group">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-rose-500/20">
                            <LogOut size={16} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">TERMINATE</p>
                            <p className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tight">Close Registry Access</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* ────────────────────────────────── MOBILE: hamburger trigger button (exposed to layout) */}
            <button
                id="mobile-menu-trigger"
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all shadow-xl shadow-indigo-600/40 ring-2 ring-white/10"
                aria-label="Open menu"
            >
                <Menu size={20} strokeWidth={3} />
            </button>

            {/* ────────────────────────────────── MOBILE: full-screen drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-[600] flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Drawer panel */}
                    <div className="relative w-72 max-w-[85vw] bg-slate-950 h-full flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-300">
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-6 pt-16 pb-8 border-b border-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                    <TrendingUp size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tighter italic leading-none">SALES <span className="text-indigo-400">EDGE</span></p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Management Mesh 4.0</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 active:scale-95"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Nav items */}
                        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] px-4 mb-4">SYSTEM NODES</p>
                            
                            <div className="px-2 mb-4">
                                <SidebarPageManager
                                    menuGroups={pageManagerGroups}
                                    hiddenPages={hiddenPages}
                                    togglePageVisibility={togglePageVisibility}
                                />
                            </div>

                            {menuItems.filter(item => isMounted ? !isHidden(item.href) : true).map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-4 rounded-xl transition-all",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-1 ring-white/10"
                                                : "text-slate-500 hover:bg-slate-900 hover:text-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                            isActive ? "bg-white/20" : "bg-slate-900 border border-slate-800"
                                        )}>
                                            <item.icon size={18} strokeWidth={ isActive ? 3 : 2 } />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black uppercase tracking-widest leading-none">{item.title}</p>
                                            <p className={cn("text-[9px] font-bold mt-1.5 leading-none uppercase tracking-tight", 
                                                isActive ? "text-indigo-100" : "text-slate-600"
                                            )}>
                                                {item.description}
                                            </p>
                                        </div>
                                        {isActive && <ChevronRight size={14} className="opacity-40" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="px-4 pb-12 pt-4 border-t border-slate-900 bg-slate-950/50">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-slate-600 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                                    <LogOut size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-widest leading-none">SIGN OUT</p>
                                    <p className="text-[9px] text-slate-700 font-bold mt-1.5 uppercase tracking-tight">Safeguard Endpoint</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
