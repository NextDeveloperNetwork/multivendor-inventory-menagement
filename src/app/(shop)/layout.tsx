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
        <div className="flex min-h-screen bg-slate-50">
            <ShopSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <main className="flex-1 lg:ml-80 min-h-screen transition-all duration-300">
                {/* Responsive Header for Mobile */}
                <div className="lg:hidden sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b-2 border-blue-50 px-6 py-4 flex items-center justify-between shadow-lg shadow-blue-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Store size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-black tracking-tight leading-none uppercase">Nexus Shop</span>
                            <span className="text-[8px] text-blue-300 font-bold uppercase tracking-widest mt-1">Terminal</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <div className="p-4 lg:p-12 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
