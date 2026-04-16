'use client';

import { useSession } from 'next-auth/react';
import SalesManagerSidebar from '@/components/SalesManagerSidebar';
import { BusinessSelector } from '@/components/BusinessSelector';

export default function SalesManagerLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Desktop sidebar + mobile hamburger provider */}
            <SalesManagerSidebar />

            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* ── Desktop Header ── */}
                <header className="hidden md:flex bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 h-20 sticky top-0 z-40 shrink-0 items-center justify-between">
                    <div className="flex-1 max-w-sm">
                        <BusinessSelector className="mb-0" />
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{session?.user?.name}</p>
                            <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1">Sales Manager</p>
                        </div>
                    </div>
                </header>

                {/* ── Mobile Header Strip ── */}
                <div className="md:hidden bg-slate-900 px-4 py-3 flex items-center justify-between shrink-0 relative z-30" style={{ paddingLeft: '56px' }}>
                    <div className="flex items-center gap-3">
                        {/* We add a left border to distinguish from where the absolute menu button sits */}
                        <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-[11px] font-black text-white shadow-md">
                                {session?.user?.name?.[0] || 'S'}
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-[9px] font-black text-white uppercase tracking-wider leading-none mb-0.5">{session?.user?.name || 'Manager'}</p>
                                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-none">Sales Tier</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0">
                        <BusinessSelector className="mb-0" />
                    </div>
                </div>

                {/* ── Main Content ── */}
                <main className="flex-1 overflow-x-hidden md:p-8 overflow-y-auto w-full">
                    <div className="max-w-[1600px] mx-auto h-full w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Portal CSS for the hamburger */}
            <style jsx global>{`
                /* Move the button rendered in Sidebar into the layout header */
                @media (max-width: 767px) {
                    #mobile-menu-trigger {
                        position: absolute !important;
                        top: 10px;
                        left: 12px;
                        z-index: 50;
                    }
                }
            `}</style>
        </div>
    );
}
