'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, History, LogOut, Store, Package, X, ArrowLeftRight, Terminal, Activity, Zap, Sparkles } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

const menuItems = [
    { href: '/shop', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shop/pos', label: 'Point of Sale', icon: ShoppingCart },
    { href: '/shop/inventory', label: 'Inventory', icon: Package },
    { href: '/shop/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { href: '/shop/history', label: 'Sales History', icon: History },
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

            <aside className={`fixed left-0 top-0 h-full w-80 bg-white border-r-2 border-blue-100 p-8 flex flex-col z-50 shadow-2xl shadow-blue-500/10 transition-all duration-500 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>

                {/* Gradient Glow */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-blue-100 via-purple-50 to-transparent opacity-50 blur-3xl"></div>

                {/* Brand Header */}
                <div className="mb-12 relative z-10 shrink-0">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                                <Store size={28} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight uppercase leading-none">
                                Shop Hub
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Online</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 px-4">Navigation</div>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-6 h-16 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/30 scale-105'
                                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-full my-4"></div>
                                )}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-white/20' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
                                    <Icon size={20} className={`${isActive ? 'text-white' : 'text-blue-600'} transition-all group-hover:scale-110`} />
                                </div>
                                <span className="text-sm font-bold tracking-tight">{item.label}</span>

                                {isActive && (
                                    <Sparkles size={14} className="ml-auto text-white/70 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="mt-8 pt-8 border-t-2 border-blue-100 relative z-10 shrink-0">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-6 border-2 border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-blue-600" />
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">System Status</span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Active</span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                            <div className="w-4/5 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-4 px-6 h-16 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all duration-300 group text-left border-2 border-transparent hover:border-rose-200"
                    >
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
