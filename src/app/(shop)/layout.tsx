'use client';

import { useState } from 'react';
import { ShopSidebar } from '@/components/ShopSidebar';
import { Menu, Store } from 'lucide-react';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#f8fafc] selection:bg-blue-600 selection:text-white">
            <ShopSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <main className="flex-1 lg:ml-[340px] min-h-screen transition-all duration-500 ease-in-out">
                {/* Tactical Header for Mobile Interface */}
                <div className="lg:hidden sticky top-0 z-40 w-full bg-black px-8 py-6 flex items-center justify-between border-b border-white/5 shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl">
                            <Store size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white tracking-tighter leading-none uppercase italic">Nexus <span className="text-blue-600">OS</span></span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em]">CONNECTED</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
                    >
                        <Menu size={28} />
                    </button>
                </div>

                <div className="p-4 md:p-8 lg:p-14 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {children}
                </div>

                {/* Ambient Grid Overlay (Optional visual touch) */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0 hidden lg:block"
                    style={{ backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>
            </main>
        </div>
    );
}
