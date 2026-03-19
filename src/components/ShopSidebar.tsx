'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, History, LogOut, Store, Package, X, ArrowLeftRight, Terminal, Activity, Zap, Sparkles } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

const menuItems = [
    { href: '/shop', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shop/pos', label: 'Sales Terminal', icon: ShoppingCart },
    { href: '/shop/inventory', label: 'Inventory', icon: Package },
    { href: '/shop/transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
    { href: '/shop/history', label: 'Sales Reports', icon: History },
];

interface ShopSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function ShopSidebar({ isOpen, setIsOpen }: ShopSidebarProps) {
    const pathname = usePathname();

    useEffect(() => {
        setIsOpen(false);
    }, [pathname, setIsOpen]);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed left-0 top-0 h-full w-[340px] bg-white border-r border-slate-200 p-10 flex flex-col z-50 transition-all duration-700 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0 outline outline-[1000px] outline-black/20' : '-translate-x-full'
                }`}>

                {/* Brand Header */}
                <div className="mb-14 relative z-10 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-2xl shadow-slate-900/20 group-hover:scale-105 transition-transform duration-500">
                                <Store size={32} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase leading-none">
                                Nexus <span className="text-indigo-600">Retail</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/20"></div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Office Online</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 space-y-2 relative z-10 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 px-4 border-l-2 border-slate-100 ml-4">Management</div>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-5 px-6 h-14 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
                                    <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-all`} />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>

                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Business Status */}
                <div className="mt-10 pt-10 border-t border-slate-100 relative z-10 shrink-0">
                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200 group/status">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Activity size={16} className="text-indigo-600 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Store Sync</span>
                            </div>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">Updated</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full"></div>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-5 px-6 h-16 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all duration-300 group text-left border border-transparent"
                    >
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                            <LogOut size={20} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tight">Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
