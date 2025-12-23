'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, History, LogOut, Store, Package } from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
    { href: '/shop', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shop/pos', label: 'Point of Sale', icon: ShoppingCart },
    { href: '/shop/inventory', label: 'Local Stock', icon: Package },
    { href: '/shop/history', label: 'Sale History', icon: History },
];

export function ShopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-full w-80 bg-white border-r-2 border-blue-50 p-10 flex flex-col z-50 shadow-2xl shadow-blue-500/5">
            <div className="mb-16">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3">
                        <Store className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">
                            Nexus <span className="text-blue-500">Shop</span>
                        </h1>
                        <p className="text-[10px] text-blue-300 font-bold uppercase tracking-[0.2em] mt-1.5">Terminal Node</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-3">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-5 px-6 py-5 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-2'
                                : 'text-blue-300 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                        >
                            <Icon size={22} className={`${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-600'} transition-colors`} />
                            <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-10 border-t-2 border-blue-50">
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-5 px-6 py-5 text-blue-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all duration-300 group"
                >
                    <LogOut size={22} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
