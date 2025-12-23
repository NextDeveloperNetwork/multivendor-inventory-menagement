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
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/inventory', label: 'Global Inventory', icon: Package },
    { href: '/admin/invoices', label: 'Invoices (In)', icon: FileText },
    { href: '/admin/transfers', label: 'Stock Movements', icon: Send },
    { href: '/admin/warehouses', label: 'Warehouses', icon: Warehouse },
    { href: '/admin/suppliers', label: 'Suppliers', icon: Users },
    { href: '/admin/shops', label: 'Shops & Users', icon: Store },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="h-screen w-80 bg-white border-r border-slate-200 p-8 flex flex-col fixed left-0 top-0 z-50">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Store size={22} strokeWidth={3} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Nexus Core</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Systems Admin</p>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <button onClick={() => signOut()} className="mt-auto flex items-center gap-4 px-4 py-3.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-bold w-full text-left">
                <LogOut size={18} strokeWidth={2.5} />
                <span>Terminate Session</span>
            </button>
        </aside>
    );
}
