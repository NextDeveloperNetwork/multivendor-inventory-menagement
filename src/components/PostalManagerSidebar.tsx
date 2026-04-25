'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, Package, Truck, Navigation, X, ChevronLeft, Building2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const menuGroups = [
    {
        label: 'Hub Management',
        items: [
            { href: '/postal-manager', label: 'Command Center', icon: LayoutDashboard },
            { href: '/postal-manager/tracking', label: 'Network Logistics', icon: Truck },
        ],
    }
];

interface PostalManagerSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function PostalManagerSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: PostalManagerSidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    useEffect(() => {
        setIsOpen(false);
    }, [pathname, setIsOpen]);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-80'}`}>
                <div className={`p-6 pb-2 relative transition-all duration-300 ${isCollapsed ? 'px-3' : ''}`}>
                    <div className={`flex items-center justify-between mb-6 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                                <Building2 size={20} strokeWidth={2.5} />
                            </div>
                            {!isCollapsed && (
                                <div className="animate-in fade-in duration-300">
                                    <h1 className="text-lg font-bold text-slate-900 leading-tight">POSTAL HUB</h1>
                                    <p className="text-[10px] text-slate-500 font-medium">Regional Command</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 shrink-0">
                            <X size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden lg:flex absolute top-6 -right-3.5 z-10 w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm transition-all ${isCollapsed ? 'rotate-180' : ''}`}
                    >
                        <ChevronLeft size={14} />
                    </button>
                </div>

                <nav className={`flex-1 overflow-y-auto pb-4 custom-scrollbar mt-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {menuGroups.map((group, groupIndex) => (
                        <div key={group.label} className="animate-in fade-in duration-300">
                            <div className={`flex items-center gap-3 ${groupIndex === 0 ? 'mb-3' : 'mt-6 mb-3'} ${isCollapsed ? 'justify-center mx-2' : ''}`}>
                                {!isCollapsed && (
                                    <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                        {group.label}
                                    </span>
                                )}
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition-all group ${isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'} ${isActive
                                                ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                                }`}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            <Icon
                                                size={18}
                                                strokeWidth={isActive ? 2.5 : 2}
                                                className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600 shrink-0'}
                                            />
                                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className={`p-4 mt-auto transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
                    <div className={`flex items-center gap-3 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 ${isCollapsed ? 'px-0 justify-center flex-col' : 'px-3'}`}>
                        <div className="w-10 h-10 bg-slate-200 rounded-xl overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center bg-white text-slate-700 text-sm font-bold shadow-sm">
                            {(session?.user?.name || session?.user?.email || 'M')[0].toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.name || 'Local Manager'}</p>
                                <p className="text-[11px] text-slate-500 truncate font-medium">{session?.user?.email || 'manager@mail.com'}</p>
                            </div>
                        )}
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 cursor-pointer relative z-50"
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
