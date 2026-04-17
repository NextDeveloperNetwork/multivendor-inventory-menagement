'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, ArrowLeftRight, History, LogOut, Store, X, Wallet } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useSidebarManager } from '@/hooks/useSidebarManager';
import { SidebarPageManager } from './SidebarPageManager';

const menuGroups = [
    {
        label: 'Overview',
        items: [
            { href: '/shop', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: 'Operations',
        items: [
            { href: '/shop/pos', label: 'Sales Terminal', icon: ShoppingCart },
            { href: '/shop/inventory', label: 'Inventory', icon: Package },
            { href: '/shop/transfers', label: 'Transfers', icon: ArrowLeftRight },
            { href: '/shop/money', label: 'Cash & Shift', icon: Wallet },
        ]
    },
    {
        label: 'Reports',
        items: [
            { href: '/shop/history', label: 'Sales History', icon: History },
        ]
    },
];

interface ShopSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function ShopSidebar({ isOpen, setIsOpen }: ShopSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { hiddenPages, togglePageVisibility, isHidden, isMounted } = useSidebarManager();

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

            <aside className={`h-screen w-72 bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 ease-in-out lg:translate-x-0 ${
                isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            }`}>

                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Store size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-slate-900 leading-tight">Shop Portal</h1>
                                <p className="text-[10px] text-slate-400 font-medium">Store Management</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                    <div className="mb-2 mt-4">
                        <SidebarPageManager
                            menuGroups={menuGroups}
                            hiddenPages={hiddenPages}
                            togglePageVisibility={togglePageVisibility}
                        />
                    </div>

                    {menuGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => isMounted ? !isHidden(item.href) : true);
                        if (visibleItems.length === 0 && isMounted) return null;

                        return (
                            <div key={group.label}>
                                <div className={`flex items-center gap-2 ${idx === 0 ? 'mt-4 mb-2' : 'mt-5 mb-2'}`}>
                                    {idx > 0 && <div className="h-px flex-1 bg-slate-100" />}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 whitespace-nowrap">
                                        {group.label}
                                    </span>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>
                                <div className="space-y-0.5">
                                    {visibleItems.map(({ href, label, icon: Icon }) => {
                                        const active = pathname === href;
                                        return (
                                            <Link
                                                key={href}
                                                href={href}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                                                    active
                                                        ? 'bg-slate-100 text-slate-900'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={active ? 2.5 : 2}
                                                    className={active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}
                                                />
                                                {label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold border-2 border-indigo-200 shrink-0">
                            {session?.user?.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.name || 'Staff'}</p>
                            <p className="text-[10px] text-slate-400 truncate font-medium">{session?.user?.email || ''}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
