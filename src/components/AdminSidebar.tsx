'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    FileText,
    Send,
    Store,
    LogOut,
    Users,
    Warehouse,
    X,
    Coins,
    Map,
    Activity,
    Heart,
    Briefcase,
    Search,
    ChevronDown,
    Plus,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { BusinessSelector } from './BusinessSelector';

const menuItems = [
    { href: '/admin', label: 'Management Console', icon: LayoutDashboard },
    { href: '/admin/intelligence', label: 'Financial Intelligence', icon: Activity },
    { href: '/admin/businesses', label: 'Business Entities', icon: Briefcase },
    { href: '/admin/inventory', label: 'Inventory Assets', icon: Package, hasBadge: 'N' },
    { href: '/admin/customers', label: 'Customer Directory', icon: Heart },
    { href: '/admin/invoices', label: 'Invoices & Receipts', icon: FileText },
    { href: '/admin/users', label: 'System Users', icon: Users },
    { href: '/admin/transfers', label: 'Inventory Transfers', icon: Send },
    { href: '/admin/warehouses', label: 'Warehouse Assets', icon: Warehouse },
    { href: '/admin/suppliers', label: 'Supplier Directory', icon: Users },
    { href: '/admin/shops', label: 'Retail Shop Registry', icon: Store },
    { href: '/admin/currencies', label: 'Currencies Registry', icon: Coins },
    { href: '/admin/map', label: 'Geospatial Map', icon: Map },
];

interface AdminSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

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

            <aside className={`h-screen w-80 bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                }`}>
                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Store size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 leading-tight">Business Management</h1>
                                <p className="text-[10px] text-slate-400 font-medium">Professional Plan</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <BusinessSelector />
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">CORE ARCHITECTURE</div>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${isActive
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} />
                                <span>{item.label}</span>
                                {item.hasBadge && (
                                    <span className="ml-auto text-[10px] font-bold text-slate-400">NEW</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-4 mt-auto space-y-6">
                    {/* Upgrade Card */}


                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2 py-2 border-t border-slate-100 pt-6">
                        <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0 border-2 border-primary/10">
                            {/* Placeholder for user image */}
                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary text-xs font-bold">
                                {session?.user?.name?.[0] || 'S'}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.name || 'Sarah Smither'}</p>
                            <p className="text-[10px] text-slate-400 truncate font-medium">{session?.user?.email || 'sarah@mail.com'}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
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
