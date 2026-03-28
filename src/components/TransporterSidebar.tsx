'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, MapPin, Truck, X, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const navItems = [
    { href: '/transporter', label: 'Deliveries', icon: Truck },
    { href: '/transporter/map', label: 'Map View', icon: MapPin },
];

interface TransporterSidebarProps {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
}

export function TransporterSidebar({ isOpen, setIsOpen }: TransporterSidebarProps) {
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

            <aside className={`h-screen w-72 bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-50 transition-all duration-500 ease-in-out lg:translate-x-0 ${
                isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            }`}>

                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Truck size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-slate-900 leading-tight">Fleet Terminal</h1>
                                <p className="text-[10px] text-slate-400 font-medium">Driver Console</p>
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

                {/* Live Status Indicator */}
                <div className="mx-4 mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                    <div>
                        <p className="text-xs font-bold text-blue-700">Live Sync Active</p>
                        <p className="text-[10px] text-blue-400 font-medium">Real-time logistics feed</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-4 pb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Navigation</p>
                    <div className="space-y-0.5">
                        {navItems.map(({ href, label, icon: Icon }) => {
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
                                        className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}
                                    />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold border-2 border-blue-200 shrink-0">
                            {session?.user?.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.name || 'Driver'}</p>
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
