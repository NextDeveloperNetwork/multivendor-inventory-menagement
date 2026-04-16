'use client';

import { useSession } from 'next-auth/react';
import SalesManagerSidebar from '@/components/SalesManagerSidebar';
import { BusinessSelector } from '@/components/BusinessSelector';

export default function SalesManagerLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
            {/* Desktop sidebar + mobile hamburger provider */}
            <SalesManagerSidebar />

            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* ── Desktop Header ── */}
                <header className="hidden md:flex bg-white border-b border-slate-200 px-8 h-16 sticky top-0 z-40 shrink-0 items-center justify-between shadow-sm">
                    <div className="flex-1 max-w-sm">
                        <BusinessSelector className="mb-0" />
                    </div>

                    <div className="flex items-center gap-3 pr-2">
                        <div className="flex flex-col items-end mr-3">
                            <p className="text-[10px] font-black text-slate-900 uppercase leading-none tracking-tight">{session?.user?.name}</p>
                            <p className="text-[7px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1 italic">SALES_AUTHORITY</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[11px] font-black text-white shadow-xl ring-2 ring-slate-100">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                {/* ── Mobile Header Strip ── */}
                <div className="md:hidden bg-slate-950 px-4 py-3 flex items-center justify-between shrink-0 relative z-[100] border-b border-slate-800 shadow-xl" style={{ paddingLeft: '60px' }}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-[12px] font-black text-white shadow-lg ring-2 ring-slate-900">
                                {session?.user?.name?.[0] || 'S'}
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1">{session?.user?.name || 'MANAGER'}</p>
                                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-none italic">OPERATOR_NODE</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0">
                        <BusinessSelector className="mb-0 max-w-[140px]" />
                    </div>
                </div>

                {/* ── Main Content ── */}
                <main className="flex-1 overflow-x-hidden md:p-8 overflow-y-auto w-full custom-scrollbar">
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
                        top: 8px;
                        left: 12px;
                        z-index: 110;
                    }
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
