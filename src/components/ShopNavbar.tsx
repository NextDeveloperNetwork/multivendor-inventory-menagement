'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, History, LogOut, Store, User, Package, TruckIcon } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const menuItems = [
    { href: '/shop', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shop/pos', label: 'New Sale', icon: ShoppingCart },
    { href: '/shop/inventory', label: 'Inventory', icon: Package },
    { href: '/shop/transfers', label: 'Transfers', icon: TruckIcon },
    { href: '/shop/history', label: 'History', icon: History },
];

export function ShopNavbar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <nav className="bg-white border-b-2 border-slate-950 px-8 py-5 sticky top-0 z-50 shadow-2xl">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/shop" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform rotate-3 group-hover:rotate-0">
                            <Store className="text-white" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-slate-950 uppercase tracking-tighter italic">
                                Nexus <span className="text-slate-400">Shop</span>
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Local Node Terminal</span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border-2 border-slate-100">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all uppercase tracking-widest text-[10px] font-black ${isActive
                                        ? 'bg-slate-950 text-white shadow-xl scale-105'
                                        : 'text-slate-400 hover:text-slate-950 hover:bg-white'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {session?.user && (
                        <div className="hidden md:flex items-center gap-4 px-6 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-100">
                            <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center font-black text-slate-500 uppercase">
                                {session.user.name?.[0]}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-950 uppercase tracking-tighter">{session.user.name}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AUTHORIZED OPERATOR</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => signOut()}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600 hover:shadow-xl transition-all"
                        title="SIGN OUT"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
}

