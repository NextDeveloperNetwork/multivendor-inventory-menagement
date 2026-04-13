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
    Truck,
    Landmark,
    Factory,
    PackagePlus,
    Cpu,
    ChevronLeft,
    ChevronRight,
    ClipboardList
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { BusinessSelector } from './BusinessSelector';

const menuGroups = [
    {
        label: 'Overview',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/intelligence', label: 'Intelligence', icon: Activity },
            { href: '/admin/map', label: 'System Map', icon: Map },
        ],
    },
    {
        label: 'Operations',
        items: [
            { href: '/admin/inventory', label: 'Inventory', icon: Package },
            { href: '/admin/invoices', label: 'Supplier Invoices', icon: FileText },
            { href: '/admin/reports/cost', label: 'Cost Analysis', icon: Activity },
            { href: '/admin/finance', label: 'Treasury & Cash', icon: Landmark },
        ],
    },
    {
        label: 'Production',
        items: [
            { href: '/admin/production/inventory', label: 'Production Inventory', icon: PackagePlus },
            { href: '/admin/production/workforce', label: 'Production Workforce', icon: Users },
            { href: '/admin/production/machinery', label: 'Production Machinery', icon: Cpu },
            { href: '/admin/production/planning', label: 'Production Planning', icon: Factory },
            { href: '/admin/production/roster', label: 'Production Roster', icon: ClipboardList },
            { href: '/admin/production/ready-to-ship', label: 'Ready to Ship', icon: Package },
        ],
    },
    {
        label: 'Production Manager',
        items: [
            { href: '/admin/production/manager-inventory', label: 'Manager Inventory', icon: Package },
            { href: '/admin/production/tracking', label: 'Managers Output', icon: Activity },
        ],
    },
    {
        label: 'Logistics',
        items: [
            { href: '/admin/transfers', label: 'Transfers', icon: Send },
            { href: '/admin/transportation', label: 'Transportation', icon: Truck },
            { href: '/admin/transporters', label: 'Fleet Status', icon: Truck },
        ],
    },
    {
        label: 'Entities',
        items: [
            { href: '/admin/businesses', label: 'Root Businesses', icon: Briefcase },
            { href: '/admin/shops', label: 'Retail Shops', icon: Store },
            { href: '/admin/warehouses', label: 'Warehouses', icon: Warehouse },
        ],
    },
    {
        label: 'Directory',
        items: [
            { href: '/admin/users', label: 'Personnel', icon: Users },
            { href: '/admin/suppliers', label: 'Suppliers', icon: Users },
            { href: '/admin/customers', label: 'Customers', icon: Heart },
            { href: '/admin/currencies', label: 'Currencies', icon: Coins },
        ]
    }
];

interface AdminSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: AdminSidebarProps) {
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
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                } ${isCollapsed ? 'w-20' : 'w-80'}`}>
                {/* Header */}
                <div className={`p-6 pb-2 relative transition-all duration-300 ${isCollapsed ? 'px-3' : ''}`}>
                    <div className={`flex items-center justify-between mb-6 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                                <Store size={20} strokeWidth={2.5} />
                            </div>
                            {!isCollapsed && (
                                <div className="animate-in fade-in duration-300">
                                    <h1 className="text-lg font-bold text-slate-900 leading-tight">ADMINISTRATION</h1>
                                    <p className="text-[10px] text-slate-500 font-medium">Headquarters Console</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className={isCollapsed ? 'hidden' : 'block animate-in fade-in duration-300 transition-all'}>
                        <BusinessSelector />
                    </div>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden lg:flex absolute top-6 -right-3.5 z-10 w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all ${isCollapsed ? 'rotate-180' : ''}`}
                    >
                        <ChevronLeft size={14} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 overflow-y-auto pb-4 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {menuGroups.map((group, groupIndex) => {
                        const isFirstGroup = groupIndex === 0;
                        return (
                            <div key={group.label}>
                                {/* Divider + Section Label */}
                                <div className={`flex items-center gap-3 ${isFirstGroup ? 'mt-4 mb-3' : 'mt-6 mb-3'} ${isCollapsed ? 'justify-center mx-2' : ''}`}>
                                    {!isCollapsed && (
                                        <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                            {group.label}
                                        </span>
                                    )}
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                {/* Group Items */}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition-all group ${isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'} ${isActive
                                                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                                    }`}
                                                title={isCollapsed ? item.label : undefined}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600 shrink-0'}
                                                />
                                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className={`p-4 mt-auto transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
                    {/* User Profile */}
                    <div className={`flex items-center gap-3 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 ${isCollapsed ? 'px-0 justify-center flex-col' : 'px-3'}`}>
                        <div className="w-10 h-10 bg-slate-200 rounded-xl overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center bg-white text-slate-700 text-sm font-bold shadow-sm">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.name || 'Admin User'}</p>
                                <p className="text-[11px] text-slate-500 truncate font-medium">{session?.user?.email || 'admin@system.com'}</p>
                            </div>
                        )}
                        <button
                            onClick={() => signOut()}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
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
